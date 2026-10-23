"""Tests unitaires du pool de workers et de la file de tâches asynchrones."""

import asyncio
from app.gnubg_pool import GnubgWorker, GnubgWorkerPool, JobManager
from app.models import RolloutRequest


def test_worker_pool_acquire_and_release():
    async def _run():
        pool = GnubgWorkerPool(size=2)
        assert pool.size == 2
        assert len(pool.workers) == 2

        stats = pool.get_stats()
        assert stats.poolSize == 2
        assert stats.idleWorkers == 2
        assert stats.busyWorkers == 0

        w1 = await pool.acquire_worker()
        assert w1.is_busy is True
        stats1 = pool.get_stats()
        assert stats1.busyWorkers == 1
        assert stats1.idleWorkers == 1

        w2 = await pool.acquire_worker()
        assert w2.is_busy is True
        stats2 = pool.get_stats()
        assert stats2.busyWorkers == 2
        assert stats2.idleWorkers == 0

        # Libération
        await pool.release_worker(w1)
        stats3 = pool.get_stats()
        assert stats3.busyWorkers == 1
        assert stats3.idleWorkers == 1
        assert w1.jobs_completed == 1

        await pool.release_worker(w2)
        stats4 = pool.get_stats()
        assert stats4.busyWorkers == 0
        assert stats4.idleWorkers == 2

    asyncio.run(_run())


def test_job_manager_lifecycle():
    async def _run():
        pool = GnubgWorkerPool(size=2)
        manager = JobManager(pool=pool)
        await manager.start()

        try:
            req = RolloutRequest(
                xgid="XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
                trials=144,
                ply=2,
            )

            job_resp = await manager.submit_rollout(req)
            assert job_resp.jobId is not None
            assert job_resp.status in ("queued", "running")

            # Attendre que la tâche s'exécute et se termine
            max_wait = 5.0
            elapsed = 0.0
            while elapsed < max_wait:
                await asyncio.sleep(0.1)
                elapsed += 0.1
                current = manager.get_job(job_resp.jobId)
                if current and current.status == "completed":
                    break

            final_job = manager.get_job(job_resp.jobId)
            assert final_job is not None
            assert final_job.status == "completed"
            assert final_job.progress.progress == 100.0
            assert final_job.result is not None
            assert len(final_job.result.moves) >= 2
            assert final_job.result.trials == 144
            assert final_job.result.verdictConfirmation != ""

            stats = manager.get_stats()
            assert stats.completedJobs >= 1
        finally:
            await manager.shutdown()

    asyncio.run(_run())


def test_job_manager_cancellation():
    async def _run():
        pool = GnubgWorkerPool(size=1)
        manager = JobManager(pool=pool)
        await manager.start()

        try:
            req = RolloutRequest(
                xgid="XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
                trials=1296,
                ply=2,
            )
            job_resp = await manager.submit_rollout(req)

            # Attendre que le job commence
            await asyncio.sleep(0.1)

            # Annulation
            cancelled = await manager.cancel_job(job_resp.jobId)
            assert cancelled is not None
            assert cancelled.status == "cancelled"

            # Attendre que le worker termine l'interruption
            await asyncio.sleep(0.2)
            current = manager.get_job(job_resp.jobId)
            assert current.status == "cancelled"
        finally:
            await manager.shutdown()

    asyncio.run(_run())


def test_job_manager_sse_streaming():
    async def _run():
        pool = GnubgWorkerPool(size=2)
        manager = JobManager(pool=pool)
        await manager.start()

        try:
            req = RolloutRequest(
                xgid="XGID=-b----E-C---eE---c-e----B-:0:0:1:42:0:0:0:0:10",
                trials=144,
                ply=2,
            )
            job_resp = await manager.submit_rollout(req)

            events_received = []
            async for event in manager.subscribe_sse(job_resp.jobId):
                events_received.append(event)
                if event.get("event") in ("completed", "failed", "cancelled"):
                    break

            assert len(events_received) >= 2
            assert events_received[0]["event"] in ("progress", "completed")
            assert events_received[-1]["event"] == "completed"
            assert events_received[-1]["job"]["result"] is not None
        finally:
            await manager.shutdown()

    asyncio.run(_run())
