"""Génération de la notation des coups (ex: "8/5 6/5") à partir des boards.

bgsage fournit le board post-coup (26 entiers) mais pas la notation textuelle.
Ce module reconstruit une notation lisible en comparant le board avant/après.

Convention réelle du board bgsage (26 entiers, cf. STARTING_BOARD) :
  - indice 0     : barre de l'adversaire (négatif = pions adverses sur la barre),
  - indices 1..24: les 24 flèches (positif = joueur au trait qui avance de 24 -> 1,
                   négatif = adversaire),
  - indice 25    : barre du joueur au trait (positif = pions du joueur sur la barre).
  - Les pions sortis (bear-off) sont implicites : la baisse du total des pions
    positifs sur `board[1..25]` entre `before` et `after` correspond aux sorties.
"""

PLAYER_BAR = 25


def _point_label(point: int) -> str:
    """Retourne le numéro de flèche (1..24)."""
    return str(point)


def board_to_notation(before: list[int], after: list[int]) -> str:
    """Reconstruit une notation lisible en comparant le board avant/après.

    Retourne une chaîne du type "8/5 6/5" ou "bar/22" ou "6/off" ou "Pass".
    """
    if before == after:
        return "Pass"

    sources: list[int] = []
    destinations: list[int] = []

    before_bar = max(0, before[PLAYER_BAR]) if len(before) > PLAYER_BAR else 0
    after_bar = max(0, after[PLAYER_BAR]) if len(after) > PLAYER_BAR else 0
    bar_delta = before_bar - after_bar
    if bar_delta > 0:
        sources.extend([PLAYER_BAR] * bar_delta)

    total_before = before_bar
    total_after = after_bar
    for p in range(1, 25):
        b_cnt = max(0, before[p])
        a_cnt = max(0, after[p])
        total_before += b_cnt
        total_after += a_cnt
        delta = a_cnt - b_cnt
        if delta > 0:
            destinations.extend([p] * delta)
        elif delta < 0:
            sources.extend([p] * (-delta))

    off_delta = max(0, total_before - total_after)

    tokens: list[str] = []

    bar_sources = [s for s in sources if s == PLAYER_BAR]
    other_sources = [s for s in sources if s != PLAYER_BAR]

    point_dests = sorted(destinations, reverse=True)

    for _ in bar_sources:
        if point_dests:
            dst = point_dests.pop(0)
            tokens.append(f"bar/{_point_label(dst)}")

    other_sources.sort(reverse=True)
    remaining_sources: list[int] = []
    for src in other_sources:
        if point_dests:
            dst = point_dests.pop(0)
            tokens.append(f"{_point_label(src)}/{_point_label(dst)}")
        else:
            remaining_sources.append(src)

    for _ in range(off_delta):
        if remaining_sources:
            src = remaining_sources.pop(0)
            tokens.append(f"{_point_label(src)}/off")

    return " ".join(tokens) if tokens else "Pass"
