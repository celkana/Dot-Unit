import pathlib
import sys

import pytest

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


def test_turn_order_and_take_turn():
    players, enemies = create_dummy_definitions()
    engine = BattleEngine.start_battle(players, enemies)

    # SPD order: Mage (7) > Hero (5) > Goblin (4) > Orc (3)
    assert [u.name for u in engine.order] == ["Mage", "Hero", "Goblin", "Orc"]

    # Mage acts first and passes the turn
    unit = engine.next_unit()
    assert unit.name == "Mage"
    engine.take_turn(unit, "pass")
    assert engine.turn_logs[-1] == "Mage passed"

    # Move goblin next to the hero and reduce its HP for a guaranteed kill
    engine.field.move_unit(enemies[0], (4, 2))
    enemies[0].hp = 1

    # Hero acts next and defeats the goblin
    hero = engine.next_unit()
    assert hero.name == "Hero"
    engine.take_turn(hero, "attack", enemies[0])
    assert enemies[0] in engine.graveyard


def test_obstacles_and_movement_rules():
    players, enemies = create_dummy_definitions()
    field = BattleField({(4, 2)})
    field.add_unit(players[0])

    with pytest.raises(ValueError):
        field.move_unit(players[0], (4, 2))

    engine = BattleEngine.start_battle(players, enemies, obstacles={(4, 2)})
    hero = players[0]

    assert (4, 2) in engine.field.obstacles

    # invalid vector
    engine.move(hero, 1, 1)
    assert hero.position == (5, 2)
    assert engine.turn_logs[-1] == "Hero failed to move"

    # blocked by obstacle
    engine.move(hero, -1, 0)
    assert hero.position == (5, 2)
    assert engine.turn_logs[-1] == "Hero failed to move"

    # valid move
    engine.move(hero, 1, 0)
    assert hero.position == (6, 2)
    assert engine.turn_logs[-1] == "Hero moved to (6, 2)"


def test_take_turn_actions_move_attack_pass_surrender():
    players, enemies = create_dummy_definitions()
    engine = BattleEngine.start_battle(players, enemies, obstacles={(4, 2)})
    hero = players[0]
    goblin = enemies[0]

    # move
    engine.take_turn(hero, "move", 1, 0)
    assert hero.position == (6, 2)
    assert engine.turn_logs[-1] == "Hero moved to (6, 2)"

    # moving into obstacle raises ValueError via field
    with pytest.raises(ValueError):
        engine.field.move_unit(hero, (4, 2))

    # attack
    engine.field.move_unit(goblin, (5, 2))
    engine.take_turn(hero, "attack", goblin)
    assert goblin.hp == 15
    assert engine.turn_logs[-1] == "Hero used Slash on Goblin for 10 damage"

    # pass
    engine.take_turn(hero, "pass")
    assert engine.turn_logs[-1] == "Hero passed"

    # surrender
    engine.take_turn(hero, "surrender")
    assert engine.check_victory() == "enemy"
    assert engine.turn_logs[-1] == "enemy wins!"
