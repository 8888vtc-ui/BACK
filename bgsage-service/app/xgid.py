"""Conversion d'une position XGID ou d'un board gnubg vers le format bgsage.

Convention officielle du board bgsage (26 entiers, cf. STARTING_BOARD) :
  - indice 0     : barre de l'adversaire (négatif = pions adverses sur la barre),
  - indices 1..24: les 24 flèches (positif = joueur au trait qui avance de 24 -> 1,
                   négatif = adversaire qui avance de 1 -> 24),
  - indice 25    : barre du joueur au trait (positif = pions du joueur sur la barre).
"""

_XGID_CHARS = "ABCDEFGHIJKLMNOP"


def _decode_char(ch: str) -> int:
    """Décode un caractère XGID en nombre de pions (0 à 16).

    Dans le standard XGID (et backgammonEngine.ts) :
      - '-' ou '0' = 0 pion
      - 'A'/'a' = 1 pion, 'B'/'b' = 2 pions, ..., 'P'/'p' = 16 pions
      - '1'..'5' (variantes numériques) = 1..5 pions
    """
    if ch == "-" or ch == "0":
        return 0
    if ch.isdigit():
        return int(ch)
    return _XGID_CHARS.index(ch.upper()) + 1


def _decode_signed_char(ch: str) -> int:
    """Décode un caractère XGID avec son signe (+ pour majuscule, - pour minuscule)."""
    count = _decode_char(ch)
    if count == 0:
        return 0
    return count if ch.isupper() else -count


def xgid_to_board(xgid: str) -> list[int]:
    """Convertit un XGID complet en board 26 entiers (perspective du joueur au trait).

    Supporte les deux formats d'ordonnancement du corps XGID (26 caractères) :
      1. Format canonique XG (`-b----E-C---eE---c-e----B-`) :
         body[0] = barre adverse (O), body[1..24] = flèches 1..24, body[25] = barre joueur (X).
      2. Format frontend (`backgammonEngine.ts` : `B----e-c---Ee---C-E----b--`) :
         body[0..23] = flèches 24..1 (ordre décroissant), body[24] = barre, body[25] = off/barre O.
    """
    xgid = xgid.strip()
    if xgid.startswith("XGID="):
        xgid = xgid[5:]

    body, _, fields = xgid.partition(":")
    if len(body) != 26:
        raise ValueError(f"Corps XGID invalide : attendu 26 caractères, reçu {len(body)}")

    field_parts = fields.split(":")
    # Détermination du joueur au trait :
    # - Format frontend (10 champs après body) : field_parts[4] ('0'=X, '1'=O)
    # - Format canonique XG (9 champs après body) : field_parts[2] ('1'=X, '-1'=O)
    is_opponent_on_roll = False
    if len(field_parts) >= 10:
        p_val = int(field_parts[4]) if field_parts[4].lstrip("-").isdigit() else 0
        is_opponent_on_roll = p_val == 1 or p_val == -1
    elif len(field_parts) == 9:
        t_dir = int(field_parts[2]) if field_parts[2].lstrip("-").isdigit() else 1
        is_opponent_on_roll = t_dir == -1

    board = [0] * 26

    # Détection du format canonique XG vs format frontend (serializeXGID) :
    # - Format canonique XG : 9 champs après body (10 parties au total), ou body seul avec barres en [0]/[25].
    # - Format frontend serializeXGID : 10 champs après body (11 parties au total), flèches 24..1 en body[0..23].
    is_canonical_xg = (
        len(field_parts) == 9
        or (
            len(field_parts) != 10
            and body[0] == "-"
            and body[25] == "-"
            and (body[1] != "-" or body[24] != "-")
        )
    )

    if is_canonical_xg:
        bar_o = _decode_signed_char(body[0])
        board[0] = bar_o if bar_o <= 0 else -bar_o
        for p in range(1, 25):
            board[p] = _decode_signed_char(body[p])
        bar_x = _decode_signed_char(body[25])
        board[25] = bar_x if bar_x >= 0 else -bar_x
    else:
        for i, ch in enumerate(body[:24]):
            point = 24 - i  # flèche 24 -> index 24, flèche 1 -> index 1
            board[point] = _decode_signed_char(ch)

        bar24 = _decode_signed_char(body[24])
        bar25 = _decode_signed_char(body[25])
        if bar24 > 0 and bar25 < 0:
            board[25] = bar24
            board[0] = bar25
        else:
            board[25] = bar24 if bar24 > 0 else 0
            board[0] = bar24 if bar24 < 0 else 0

    # Si c'est au joueur O de jouer, on inverse ET miroite le plateau (25 - i)
    # pour que le joueur actif avance toujours de 24 -> 1 avec des valeurs positives.
    if is_opponent_on_roll:
        board = [-board[25 - i] for i in range(26)]

    return board


def gnubg_board_to_bgsage(board: list[int]) -> list[int]:
    """Convertit un board 26 entiers (frontend ou gnubg) vers le format bgsage (26 entiers).

    Convention bgsage (identique à backgammonEngine.ts pour le joueur actif) :
      - result[0]     = barre de l'adversaire (<= 0)
      - result[1..24] = flèches 1..24 (positif = joueur au trait, négatif = adversaire)
      - result[25]    = barre du joueur au trait (>= 0)

    Supporte de manière transparente les deux conventions de barres (0/25 ou 25/0)
    sans jamais décaler les flèches 1..24.
    """
    result = [0] * 26
    for p in range(1, 25):
        result[p] = board[p]

    pos_bar = max(0, board[0]) + max(0, board[25])
    neg_bar = min(0, board[0]) + min(0, board[25])
    result[0] = neg_bar
    result[25] = pos_bar
    return result
