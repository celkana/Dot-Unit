from __future__ import annotations

"""Debug utilities for manipulating battles."""

from src.battle.engine import BattleEngine


class DebugPanel:
    def __init__(self, engine: BattleEngine) -> None:
        self.engine = engine

    def skip_turn(self) -> None:
        """Skip the current unit's turn."""
        unit = self.engine.next_unit()
        if unit is not None:
            self.engine.pass_turn(unit)

    def force_win(self, side: str) -> None:
        """Force a victory for the given side."""
        for unit in list(self.engine.field.all_units()):
            if unit.owner != side:
                self.engine.field.remove_unit(unit)
                if unit in self.engine.order:
                    self.engine.order.remove(unit)
        self.engine.turn_logs.append(f"{side} wins by debug command")
