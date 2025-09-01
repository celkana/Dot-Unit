from __future__ import annotations

from src.battle import BattleEngine, BattleField, create_dummy_definitions


def run_demo() -> None:
    """Run a small battle and print turn logs."""

    field = BattleField()
    players, enemies = create_dummy_definitions()
    for unit in players + enemies:
        field.add_unit(unit)

    engine = BattleEngine(field)
    # Loop for a few turns or until someone wins
    for _ in range(20):
        unit = engine.next_unit()
        if unit is None:
            break
        opponents = [u for u in field.all_units() if u.owner != unit.owner]
        if opponents:
            target = opponents[0]
            dist = abs(unit.position[0] - target.position[0]) + abs(
                unit.position[1] - target.position[1]
            )
            if dist <= unit.skills[0].range:
                engine.attack(unit, target)
            else:
                dx = 1 if target.position[0] > unit.position[0] else -1
                engine.move(unit, dx, 0)
        else:
            engine.pass_turn(unit)
        if engine.check_victory():
            break

    for log in engine.turn_logs:
        print(log)


if __name__ == "__main__":
    run_demo()
