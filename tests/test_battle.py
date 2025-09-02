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


def test_real_time_combat():
    players, enemies = create_dummy_definitions()
    # position enemies adjacent to the hero for immediate action
    enemies[0].position = (4, 2)
    enemies[1].position = (5, 3)
    # boost hero HP to survive multiple hits and reduce enemy HP for a quick battle
    players[0].hp = 50
    enemies[0].hp = 20
    enemies[1].hp = 20
    engine = BattleEngine.start_battle(players, enemies)

    # Step 1: hero attacks goblin, enemies retaliate
    engine.real_time_step({players[0]: ("attack", enemies[0])})
    assert enemies[0].hp == 10
    assert players[0].hp == 30

    # Step 2: hero finishes goblin, orc attacks
    engine.real_time_step({players[0]: ("attack", enemies[0])})
    assert enemies[0] not in engine.field.all_units()
    assert players[0].hp == 20

    # Step 3: hero attacks orc, orc counterattacks
    engine.real_time_step({players[0]: ("attack", enemies[1])})
    assert enemies[1].hp == 10
    assert players[0].hp == 10

    # Step 4: hero defeats orc and wins the battle
    engine.real_time_step({players[0]: ("attack", enemies[1])})
    status = engine.battle_status()
    assert status["winner"] == "player"
