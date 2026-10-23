"""Pilotage du binaire GNU Backgammon (`gnubg -t`) par sous-processus.

Choix de conception : un process gnubg est lancé **par requête** (commandes
piped via stdin, sortie lue jusqu'à `quit`). C'est plus robuste qu'un process
persistant (pas de gestion d'état ni de détection de prompt), au prix d'un
démarrage de ~1-2 s (chargement des poids du réseau de neurones) — acceptable
pour un service d'analyse profonde, non appelé à chaque coup.
"""

import os
import shutil
import subprocess


class GnubgError(RuntimeError):
    """Erreur d'exécution du moteur gnubg."""


def find_gnubg_binary(default: str = "gnubg") -> str:
    """Localise le binaire gnubg dans le PATH ou dans les répertoires standards Debian/Ubuntu."""
    found = shutil.which(default)
    if found:
        return found
    candidates = [
        "/usr/games/gnubg",
        "/usr/local/bin/gnubg",
        "/usr/bin/gnubg",
        "C:\\Program Files\\gnubg\\gnubg-cli.exe",
        "C:\\Program Files (x86)\\gnubg\\gnubg-cli.exe",
    ]
    for candidate in candidates:
        if os.path.exists(candidate) and (os.name == "nt" or os.access(candidate, os.X_OK)):
            return candidate
    return default


class GnubgClient:
    def __init__(self, binary: str | None = None, timeout: int = 60):
        self.binary = binary or find_gnubg_binary()
        self.timeout = timeout

    def _board_commands(self, xgid: str) -> list[str]:
        """Génère la commande de positionnement appropriée (set xgid pour format XGID, set board sinon).

        IMPORTANT : gnubg exige qu'une partie soit en cours avant de positionner le
        plateau (« There must be a game in progress to set the board »). On démarre
        donc toujours par `new game` avant `set board` / `set xgid`.
        """
        if xgid.startswith("XGID=") or ":" in xgid:
            return ["new game", f"set xgid {xgid}"]
        return ["new game", f"set board {xgid}"]

    def _run(self, commands: list[str]) -> str:
        script = "\n".join(commands) + "\nquit\n"
        try:
            proc = subprocess.run(
                [self.binary, "-t"],
                input=script,
                capture_output=True,
                text=True,
                timeout=self.timeout,
            )
        except FileNotFoundError as exc:
            raise GnubgError(f"Binaire gnubg introuvable : {self.binary}") from exc
        except subprocess.TimeoutExpired as exc:
            raise GnubgError("gnubg a dépassé le délai d'exécution") from exc
        if proc.returncode != 0:
            raise GnubgError(f"gnubg a échoué (code {proc.returncode}) : {proc.stderr}")
        return proc.stdout

    def evaluate_chequer(self, xgid: str, ply: int = 2) -> str:
        """Top des coups de pions pour la position (sortie brute de `hint`)."""
        cmds = self._board_commands(xgid)
        cmds.extend([
            f"set evaluation chequerplay plies {ply}",
            "hint",
        ])
        return self._run(cmds)

    def evaluate_cube(self, xgid: str, ply: int = 2) -> str:
        """Analyse de la décision de videau (sortie brute de `hint`)."""
        import re
        # Remplace les dés par 00 dans le XGID pour que gnubg évalue la décision de videau pré-lancer
        xgid_cube = re.sub(
            r"^([^:]+:[^:]+:[^:]+:[^:]+:)[^:]+(:.*)$",
            r"\g<1>00\2",
            xgid,
        )
        cmds = self._board_commands(xgid_cube)
        cmds.extend([
            f"set evaluation cubedecision plies {ply}",
            "hint",
        ])
        return self._run(cmds)


class GnubgPersistentClient:
    """Client GNUBG à process PERSISTANT (un seul démarrage, commandes en continu).

    Élimine le coût de ~1-2s de démarrage par position (chargement des poids du
    réseau de neurones) en gardant un unique sous-processus `gnubg -t` ouvert.
    Les commandes sont envoyées via stdin, et la sortie est lue jusqu'à un
    marqueur unique pour délimiter chaque réponse.

    Usage (distillation à grande échelle) :
        client = GnubgPersistentClient()
        for xgid in positions:
            out = client.evaluate_chequer(xgid, ply=2)
        client.close()
    """

    MARKER = "__GNUBG_DONE__"

    def __init__(self, binary: str | None = None, timeout: int = 60):
        self.binary = binary or find_gnubg_binary()
        self.timeout = timeout
        self._proc = None

    def _ensure_started(self):
        if self._proc is not None and self._proc.poll() is None:
            return
        self._proc = subprocess.Popen(
            [self.binary, "-t"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

    def _send(self, commands: list[str]) -> str:
        """Envoie des commandes et lit la sortie jusqu'au marqueur."""
        self._ensure_started()
        script = "\n".join(commands) + f"\necho {self.MARKER}\n"
        try:
            self._proc.stdin.write(script)
            self._proc.stdin.flush()
        except (BrokenPipeError, OSError) as exc:
            raise GnubgError(f"gnubg persistant a échoué : {exc}") from exc

        output = []
        while True:
            line = self._proc.stdout.readline()
            if not line:
                break
            if self.MARKER in line:
                break
            output.append(line)
        return "".join(output)

    def evaluate_chequer(self, xgid: str, ply: int = 2) -> str:
        """Top des coups de pions (sortie brute de `hint`), sans redémarrer gnubg."""
        cmds = [
            "new game",
            f"set xgid {xgid}" if (xgid.startswith("XGID=") or ":" in xgid) else f"set board {xgid}",
            f"set evaluation chequerplay plies {ply}",
            "hint",
        ]
        return self._send(cmds)

    def evaluate_rollout(self, xgid: str, trials: int = 576, ply: int = 0) -> str:
        """Rollout de la position (sortie brute de `rollout`), sans redémarrer gnubg.

        Utilise `set rollout trials N` + `set rollout chequerplay plies P` pour un
        rollout 0-ply (méthode d'étiquetage de GNU Backgammon, ~10x plus rapide
        que le 2-ply tout en restant suffisant pour l'entraînement).
        """
        cmds = [
            "new game",
            f"set xgid {xgid}" if (xgid.startswith("XGID=") or ":" in xgid) else f"set board {xgid}",
            f"set rollout trials {trials}",
            f"set rollout chequerplay plies {ply}",
            f"set rollout cubedecision plies {ply}",
            "rollout",
        ]
        return self._send(cmds)

    def close(self):
        """Ferme proprement le process gnubg persistant."""
        if self._proc is not None and self._proc.poll() is None:
            try:
                self._proc.stdin.write("quit\n")
                self._proc.stdin.flush()
            except (BrokenPipeError, OSError):
                pass
            try:
                self._proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self._proc.kill()
        self._proc = None

    def __enter__(self):
        self._ensure_started()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()