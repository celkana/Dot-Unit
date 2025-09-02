import pathlib
import sys

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))

from src.battle import BattleEngine, BattleField, create_dummy_definitions


def test_attack_and_victory():
    field = BattleField()
    players, enemies = create_dummy_definitions()
    for u in players + enemies:
        field.add_unit(u)

    # position enemies adjacent to the hero for guaranteed hits
    field.move_unit(enemies[0], (4, 2))
    field.move_unit(enemies[1], (5, 3))

    engine = BattleEngine(field)
    # weaken enemies for quick victory
    for enemy in enemies:
        enemy.hp = 1
        engine.attack(players[0], enemy)

    assert engine.check_victory() == "player"
