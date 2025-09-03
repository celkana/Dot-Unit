import pytest

from src.battle.engine import BattleEngine
from src.battle.entities import Skill, Unit
from src.battle.grid import BattleField


def create_engine(attacker_pos=(0, 0), target_pos=(2, 0)):
    slash = Skill(name="Slash", power=5, range=1)
    attacker = Unit(
        name="Attacker",
        hp=20,
        spd=5,
        position=attacker_pos,
        owner="player",
        skills=[slash],
    )
    target = Unit(
        name="Target",
        hp=20,
        spd=5,
        position=target_pos,
        owner="enemy",
        skills=[slash],
    )
    field = BattleField()
    field.add_unit(attacker)
    field.add_unit(target)
    engine = BattleEngine(field)
    return engine, attacker, target, slash


def test_attack_out_of_range_single_target():
    engine, attacker, target, skill = create_engine(attacker_pos=(0, 0), target_pos=(2, 0))
    engine.attack(attacker, target, skill)
    assert target.hp == 20
    assert engine.turn_logs[-1] == f"{attacker.name} missed {target.name}"


def test_attack_mixed_range_multiple_targets():
    slash = Skill(name="Slash", power=5, range=1)
    attacker = Unit(name="Attacker", hp=20, spd=5, position=(0, 0), owner="player", skills=[slash])
    in_range = Unit(name="InRange", hp=20, spd=5, position=(1, 0), owner="enemy", skills=[slash])
    out_range = Unit(name="OutRange", hp=20, spd=5, position=(3, 0), owner="enemy", skills=[slash])
    field = BattleField()
    field.add_unit(attacker)
    field.add_unit(in_range)
    field.add_unit(out_range)
    engine = BattleEngine(field)

    engine.attack(attacker, [in_range, out_range], slash)

    # In-range target takes damage
    assert in_range.hp == 15
    # Out-of-range target untouched
    assert out_range.hp == 20
    # Logs contain miss for out-of-range
    assert any(f"missed {out_range.name}" in log for log in engine.turn_logs)
