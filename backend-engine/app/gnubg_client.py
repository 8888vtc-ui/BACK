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
        """Génère la commande de positionnement appropriée (set xgid pour format XGID, set board sinon)."""
        if xgid.startswith("XGID=") or ":" in xgid:
            return [f"set xgid {xgid}"]
        return [f"set board {xgid}"]

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
        cmds = self._board_commands(xgid)
        cmds.extend([
            "set dice 0 0",  # retire les dés pour forcer une décision de videau
            f"set evaluation cubedecision plies {ply}",
            "hint",
        ])
        return self._run(cmds)