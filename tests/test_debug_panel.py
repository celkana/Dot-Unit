import pathlib
import sys

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from src.battle import BattleEngine, BattleField, create_dummy_definitions
from src.debug import DebugPanel


def test_skip_and_force_win():
    field = BattleField()
    players, enemies = create_dummy_definitions()
    for u in players + enemies:
        field.add_unit(u)

    engine = BattleEngine(field)
    panel = DebugPanel(engine)

    panel.skip_turn()
    assert any("passed" in log for log in engine.turn_logs)

    panel.force_win("player")
    assert engine.check_victory() == "player"
