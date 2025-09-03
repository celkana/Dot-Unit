from __future__ import annotations

from typing import Dict, List, Optional, Set, Tuple

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
        self.forced_winner: Optional[str] = None

    @staticmethod
    def _distance(a: Unit, b: Unit) -> int:
        """Return the Manhattan distance between ``a`` and ``b``."""
        return abs(a.position[0] - b.position[0]) + abs(a.position[1] - b.position[1])

    @classmethod
    def start_battle(
        cls,
        players: List[Unit],
        enemies: List[Unit],
        obstacles: Optional[Set[Tuple[int, int]]] = None,
    ) -> "BattleEngine":
        """Create a battle engine with units placed on the field.

        The units are expected to already have positions assigned based on
        formation screen selections.
        """
        field = BattleField(obstacles)
        for unit in players + enemies:
            field.add_unit(unit)
        engine = cls(field)
        # Ensure the initial turn order is sorted by speed so that the caller
        # can repeatedly retrieve units via ``next_unit`` and process their
        # actions with ``take_turn``.
        engine.order = engine.field.turn_order()
        engine.index = 0
        return engine

    # Turn management ---------------------------------------------------
    def next_unit(self) -> Optional[Unit]:
        if not self.order:
            return None
        self.index %= len(self.order)
        unit = self.order[self.index]
        self.index += 1
        return unit

    # Actions ------------------------------------------------------------
    def take_turn(self, unit: Unit, action: str, *args) -> None:
        """Execute ``action`` for ``unit``.

        ``action`` is a string identifying the desired operation. Supported
        values are ``"move"``, ``"attack"`` and ``"pass"``. Additional
        parameters for the action are supplied via ``*args``:

        * ``move`` requires ``dx`` and ``dy``.
        * ``attack`` requires a ``target`` and optionally a ``skill``.
        * ``pass`` takes no additional arguments.

        After the action is processed the internal victory check happens via
        the action specific methods which call :meth:`_after_action`.
        """

        if unit not in self.field.all_units():
            return

        if action == "move" and len(args) >= 2:
            dx, dy = int(args[0]), int(args[1])
            self.move(unit, dx, dy)
        elif action == "attack" and len(args) >= 1:
            target = args[0]
            skill = args[1] if len(args) > 1 else None
            self.attack(unit, target, skill)
        elif action in {"pass", "wait", "pass_turn"}:
            self.pass_turn(unit)
        elif action == "surrender":
            self.turn_logs.append(f"{unit.name} surrendered")
            self.end_battle(False)
        else:
            # Unknown or malformed action – treat as a pass but record it.
            self.turn_logs.append(f"{unit.name} did nothing")
            self._after_action()

    def move(self, unit: Unit, dx: int, dy: int) -> None:
        try:
            if (dx, dy) not in {(-1, 0), (1, 0), (0, -1), (0, 1)}:
                raise ValueError("Invalid movement vector")
            new_pos = (unit.position[0] + dx, unit.position[1] + dy)
            self.field.move_unit(unit, new_pos)
            self.turn_logs.append(f"{unit.name} moved to {new_pos}")
        except ValueError:
            self.turn_logs.append(f"{unit.name} failed to move")
        self._after_action()

    def attack(
        self,
        attacker: Unit,
        target: Unit | List[Unit],
        skill: Optional[Skill] = None,
    ) -> None:
        if skill is None:
            skill = attacker.skills[0]

        # Support single or multiple targets.
        targets = target if isinstance(target, list) else [target]
        for tgt in targets:
            if tgt not in self.field.all_units():
                self.turn_logs.append(f"{attacker.name} missed {tgt.name}")
                continue

            distance = self._distance(attacker, tgt)
            if distance > skill.range:
                self.turn_logs.append(f"{attacker.name} missed {tgt.name}")
                continue

            tgt.hp -= skill.power
            self.turn_logs.append(
                f"{attacker.name} used {skill.name} on {tgt.name} for {skill.power} damage"
            )
            if tgt.hp <= 0:
                self.turn_logs.append(f"{tgt.name} was defeated")
                self.field.remove_unit(tgt)
                if tgt in self.order:
                    self.order.remove(tgt)
                self.graveyard.append(tgt)

        self._after_action()

    def pass_turn(self, unit: Unit) -> None:
        self.turn_logs.append(f"{unit.name} passed")
        self._after_action()

    def real_time_step(self, commands: Dict[Unit, Tuple[str, ...]]) -> None:
        """Process one step of simultaneous actions.

        ``commands`` maps player-controlled units to an action tuple. Actions
        are of the form ``("move", dx, dy)`` or ``("attack", target[, skill])``.
        Enemy units act automatically using a basic AI that moves toward the
        nearest player and attacks when in range.
        """
        # Player actions
        for unit, action in commands.items():
            if unit not in self.field.all_units():
                continue
            act = action[0]
            if act == "move" and len(action) >= 3:
                self.move(unit, action[1], action[2])
            elif act == "attack" and len(action) >= 2:
                target = action[1]
                skill = action[2] if len(action) > 2 else None
                self.attack(unit, target, skill)

        # Enemy AI actions
        enemies = [u for u in list(self.field.all_units()) if u.owner == "enemy"]
        players = [u for u in self.field.all_units() if u.owner == "player"]
        for enemy in enemies:
            if enemy not in self.field.all_units() or not players:
                continue
            target = min(players, key=lambda p: self._distance(p, enemy))
            skill = enemy.skills[0]
            distance = self._distance(target, enemy)
            if distance <= skill.range:
                self.attack(enemy, target, skill)
            else:
                dx = 1 if target.position[0] > enemy.position[0] else -1 if target.position[0] < enemy.position[0] else 0
                dy = 1 if target.position[1] > enemy.position[1] else -1 if target.position[1] < enemy.position[1] else 0
                try:
                    self.move(enemy, dx, dy)
                except ValueError:
                    self.pass_turn(enemy)

    def battle_status(self) -> Dict[str, object]:
        """Return current HP of all units and the winner if any."""
        status = {u.name: {"hp": u.hp, "owner": u.owner} for u in self.field.all_units()}
        status["winner"] = self.check_victory()
        return status

    def end_battle(self, victory: bool) -> None:
        """Forcefully end the battle with the given result.

        Clearing the turn order prevents any further actions and records the
        outcome in the turn logs so callers can display an appropriate result
        screen.
        """
        winner = "player" if victory else "enemy"
        self.forced_winner = winner
        self.turn_logs.append(f"{winner} wins!")
        self.order.clear()

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
        if self.forced_winner:
            return self.forced_winner
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
