from __future__ import annotations

from typing import List, Optional

from .entities import Skill, Unit
from .grid import BattleField


class BattleEngine:
    """Handle unit actions and victory conditions for a battle."""

    def __init__(self, field: BattleField) -> None:
        self.field = field
        self.order: List[Unit] = self.field.turn_order()
        self.index = 0
        self.graveyard: List[Unit] = []
        self.base_control = {"player": 0, "enemy": 0}
        self.turn_logs: List[str] = []

    # Turn management ---------------------------------------------------
    def next_unit(self) -> Optional[Unit]:
        if not self.order:
            return None
        self.index %= len(self.order)
        unit = self.order[self.index]
        self.index += 1
        return unit

    # Actions ------------------------------------------------------------
    def move(self, unit: Unit, dx: int, dy: int) -> None:
        new_pos = (unit.position[0] + dx, unit.position[1] + dy)
        try:
            self.field.move_unit(unit, new_pos)
            self.turn_logs.append(f"{unit.name} moved to {new_pos}")
        except ValueError:
            self.turn_logs.append(f"{unit.name} failed to move")
        self._after_action()

    def attack(self, attacker: Unit, target: Unit, skill: Optional[Skill] = None) -> None:
        if skill is None:
            skill = attacker.skills[0]
        distance = abs(attacker.position[0] - target.position[0]) + abs(
            attacker.position[1] - target.position[1]
        )
        if distance <= skill.range:
            target.hp -= skill.power
            self.turn_logs.append(
                f"{attacker.name} used {skill.name} on {target.name} for {skill.power} damage"
            )
            if target.hp <= 0:
                self.turn_logs.append(f"{target.name} was defeated")
                self.field.remove_unit(target)
                if target in self.order:
                    self.order.remove(target)
                self.graveyard.append(target)
        else:
            self.turn_logs.append(f"{attacker.name} missed {target.name}")
        self._after_action()

    def pass_turn(self, unit: Unit) -> None:
        self.turn_logs.append(f"{unit.name} passed")
        self._after_action()

    # Internal helpers --------------------------------------------------
    def _update_base_control(self) -> None:
        player_unit = self.field.unit_at(BattleField.ENEMY_BASE)
        enemy_unit = self.field.unit_at(BattleField.PLAYER_BASE)
        self.base_control["player"] = (
            self.base_control["player"] + 1
            if player_unit and player_unit.owner == "player"
            else 0
        )
        self.base_control["enemy"] = (
            self.base_control["enemy"] + 1
            if enemy_unit and enemy_unit.owner == "enemy"
            else 0
        )

    def _after_action(self) -> None:
        self._update_base_control()
        winner = self.check_victory()
        if winner:
            self.turn_logs.append(f"{winner} wins!")
            self.order.clear()

    # Victory checks ----------------------------------------------------
    def check_victory(self) -> Optional[str]:
        units = self.field.all_units()
        if not any(u.owner == "enemy" for u in units):
            return "player"
        if not any(u.owner == "player" for u in units):
            return "enemy"
        if self.base_control["player"] >= 3:
            return "player"
        if self.base_control["enemy"] >= 3:
            return "enemy"
        return None
