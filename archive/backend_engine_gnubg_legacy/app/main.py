"""API FastAPI d'évaluation et de rollout profond Backgammon adossée à un pool de workers gnubg."""

from contextlib import asynccontextmanager
import json
import time
import uuid
from typing import Any
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .alerts import backend_alert_manager
from .gnubg_client import GnubgClient, GnubgError
from .gnubg_pool import default_pool, global_job_manager
from .logger import structured_logger
from .models import (
    EvaluateRequest,
    EvaluateResponse,
    JobResponse,
    PoolStats,
    RolloutRequest,
)
from .monitoring import (
    capture_backend_exception,
    capture_backend_message,
    init_sentry,
    SENTRY_DSN,
)
from .parsers import parse_cube, parse_hint

# Client par défaut pour compatibilité descendante et tests d'intégration
client = GnubgClient()
server_start_time = time.time()


class InMemoryRateLimiter:
    """Limiteur de débit en mémoire basé sur une fenêtre glissante de 60 secondes."""

    def __init__(self, max_requests: int = 60, window_seconds: float = 60.0):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.clients: dict[str, list[float]] = defaultdict(list)

    def check(self, client_ip: str) -> None:
        now = time.time()
        cutoff = now - self.window_seconds
        # Filtrage des requêtes antérieures à la fenêtre
        self.clients[client_ip] = [t for t in self.clients[client_ip] if t > cutoff]

        if len(self.clients[client_ip]) >= self.max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded: maximum {self.max_requests} requests per minute.",
                headers={
                    "Retry-After": str(int(self.window_seconds)),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )
        self.clients[client_ip].append(now)

    def reset(self) -> None:
        self.clients.clear()


evaluate_rate_limiter = InMemoryRateLimiter(max_requests=60, window_seconds=60.0)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise Sentry, le pool de workers et la file de tâches au démarrage."""
    init_sentry()
    structured_logger.info("Démarrage du service GNU Backgammon Engine avec monitoring")
    await global_job_manager.start()
    yield
    await global_job_manager.shutdown()
    structured_logger.info("Arrêt du service GNU Backgammon Engine")


app = FastAPI(
    title="Backgammon Engine API (Worker Pool & Deep Rollout)",
    version="0.2.0",
    lifespan=lifespan,
)

# Configuration CORS pour permettre les appels depuis l'UI Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def structured_logging_middleware(request: Request, call_next):
    """Journalise les requêtes HTTP au format JSON avec corrélation et mesure de latence."""
    correlation_id = (
        request.headers.get("x-correlation-id")
        or request.headers.get("x-request-id")
        or str(uuid.uuid4())
    )
    start_time = time.time()

    try:
        response = await call_next(request)
        duration_ms = round((time.time() - start_time) * 1000, 2)
        response.headers["X-Correlation-ID"] = correlation_id

        # Logging avec niveau adapté
        if request.url.path in ("/health", "/health/live"):
            structured_logger.debug(
                f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
                extra={"correlation_id": correlation_id, "extra_context": {"path": request.url.path, "status": response.status_code, "duration_ms": duration_ms}},
            )
        else:
            structured_logger.info(
                f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
                extra={"correlation_id": correlation_id, "extra_context": {"path": request.url.path, "status": response.status_code, "duration_ms": duration_ms}},
            )

        # Alerte de latence si requête très lente (> 2.5s hors rollout)
        if duration_ms > 2500 and not request.url.path.startswith("/api/jobs/"):
            await backend_alert_manager.trigger_alert(
                alert_type="HIGH_LATENCY",
                severity="warning",
                message=f"Latence élevée sur {request.url.path} : {duration_ms}ms",
                details={"path": request.url.path, "duration_ms": duration_ms, "correlation_id": correlation_id},
            )

        return response
    except Exception as exc:
        duration_ms = round((time.time() - start_time) * 1000, 2)
        structured_logger.error(
            f"Exception non interceptée sur {request.method} {request.url.path} : {exc}",
            exc_info=True,
            extra={"correlation_id": correlation_id, "extra_context": {"path": request.url.path, "duration_ms": duration_ms}},
        )
        capture_backend_exception(exc, {"path": request.url.path, "correlation_id": correlation_id})
        raise


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Applique des en-têtes de sécurité stricts sur toutes les réponses de l'API."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.get("/health")
def health() -> dict[str, str]:
    """Sonde de disponibilité standard du service (rétrocompatibilité exacte)."""
    return {"status": "ok"}


@app.get("/health/ready")
def health_ready() -> dict[str, Any]:
    """Sonde d'aptitude (Readiness probe) vérifiant le démarrage du pool de workers."""
    stats = global_job_manager.get_stats()
    is_ready = stats.poolSize > 0
    return {
        "status": "ready" if is_ready else "initializing",
        "gnubg_pool_ready": is_ready,
        "pool_stats": stats.model_dump(),
        "uptime_seconds": round(time.time() - server_start_time, 1),
    }


@app.get("/health/live")
def health_live() -> dict[str, str]:
    """Sonde de vivacité (Liveness probe) rapide."""
    return {"status": "alive"}


@app.get("/api/health")
def api_health() -> dict[str, Any]:
    """Diagnostic étendu pour dashboards de surveillance et monitoring."""
    stats = global_job_manager.get_stats()
    return {
        "status": "ok",
        "service": "backgammon-backend-engine",
        "version": app.version,
        "uptime_seconds": round(time.time() - server_start_time, 1),
        "sentry_enabled": SENTRY_DSN is not None,
        "pool": stats.model_dump(),
    }


@app.get("/api/pool/stats", response_model=PoolStats)
def get_pool_stats() -> PoolStats:
    """Renvoie les statistiques en temps réel du pool de workers et de la file d'attente."""
    return global_job_manager.get_stats()


@app.post("/api/evaluate", response_model=EvaluateResponse)
def evaluate(req: EvaluateRequest, request: Request) -> EvaluateResponse:
    """Évalue une position XGID : top des coups de pions + décision de videau."""
    client_ip = request.client.host if request.client else "127.0.0.1"
    evaluate_rate_limiter.check(client_ip)

    try:
        raw_chequer = client.evaluate_chequer(req.xgid, req.ply)
        raw_cube = client.evaluate_cube(req.xgid, req.ply)
    except GnubgError:
        # Repli gracieux via le pool de workers si le binaire n'est pas installé localement
        worker = default_pool.acquire_worker_sync()
        try:
            raw_chequer, raw_cube = worker.evaluate_sync(req.xgid, req.ply)
        finally:
            default_pool.release_worker_sync(worker)

    chequer = parse_hint(raw_chequer)
    cube = parse_cube(raw_cube)
    return EvaluateResponse(chequerPlay=chequer, cubeDecision=cube)


@app.post("/api/rollout", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def submit_rollout(req: RolloutRequest) -> JobResponse:
    """Soumet un job de rollout profond asynchrone dans la file de tâches du pool."""
    job = await global_job_manager.submit_rollout(req)
    return job


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job_status(job_id: str) -> JobResponse:
    """Interroge l'état et la progression d'un job de rollout."""
    job = global_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} introuvable")
    return job


@app.get("/api/jobs/{job_id}/stream")
async def stream_job_progress(job_id: str):
    """Flux Server-Sent Events (SSE) diffusant en temps réel la progression du rollout."""
    job = global_job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} introuvable")

    async def sse_generator():
        async for msg in global_job_manager.subscribe_sse(job_id):
            event_type = msg.get("event", "progress")
            payload = json.dumps(msg)
            yield f"event: {event_type}\ndata: {payload}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/jobs/{job_id}/cancel")
async def cancel_job(job_id: str) -> dict[str, Any]:
    """Interrompt une tâche de rollout en cours ou en file d'attente."""
    job = await global_job_manager.cancel_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} introuvable")
    data = job.model_dump()
    data["cancelled"] = True
    return data