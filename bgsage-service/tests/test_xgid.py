"""Tests du convertisseur XGID -> board 26 entiers."""

import pytest

from app.xgid import _decode_char, gnubg_board_to_bgsage, xgid_to_board


def test_decode_char_digits():
    assert _decode_char("0") == 0
    assert _decode_char("5") == 5


def test_decode_char_dash_is_zero():
    assert _decode_char("-") == 0


def test_decode_char_letters():
    assert _decode_char("A") == 1
    assert _decode_char("B") == 2
    assert _decode_char("E") == 5
    assert _decode_char("P") == 16
    assert _decode_char("a") == 1


def test_starting_position_roundtrip():
    """La position de départ XGID (canonique ou frontend) doit produire le STARTING_BOARD de bgsage.

    STARTING_BOARD (référence officielle bgsage) :
        [0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5,
         5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0]
    """
    expected = [
        0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5,
        5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
    ]
    xgid_canonical = "XGID=-b----E-C---eE---c-e----B-:0:0:1:0:0:0:0:0:0"
    assert xgid_to_board(xgid_canonical) == expected

    xgid_frontend = "XGID=B----e-c---Ee---C-E----b--:1:0:0:31:0:1:0:0:0:7"
    assert xgid_to_board(xgid_frontend) == expected


def test_gnubg_board_to_bgsage_preserves_points():
    starting = [
        0, -2, 0, 0, 0, 0, 5, 0, 3, 0, 0, 0, -5,
        5, 0, 0, 0, -3, 0, -5, 0, 0, 0, 0, 2, 0,
    ]
    assert gnubg_board_to_bgsage(starting) == starting


def test_invalid_body_length():
    with pytest.raises(ValueError):
        xgid_to_board("XGID=short:0:0:1:0:0:0:0:0:0")


def test_strips_xgid_prefix():
    xgid = "-b----E-C---eE---c-e----B-:0:0:1:0:0:0:0:0:0"
    board = xgid_to_board(xgid)
    assert len(board) == 26


def test_frontend_xgid_with_empty_point_24_not_misclassified_as_canonical():
    """Quand X a quitté la flèche 24 (body[0] == '-') et aucun pion n'est sorti (body[25] == '-'),
    un XGID frontend à 11 champs ne doit JAMAIS être interprété comme un XGID canonique inversé."""
    # Flèche 24 vide ('-'), flèche 23 avec 2 pions X ('B'), reste identique au départ
    xgid_frontend_vacated_24 = "XGID=-B---e-c---Ee---C-E----b--:1:0:0:42:0:1:0:0:0:7"
    board = xgid_to_board(xgid_frontend_vacated_24)
    assert board[24] == 0
    assert board[23] == 2
    assert board[6] == 5
    assert board[1] == -2

