from __future__ import annotations

from typing import Dict, List, Optional, Set, Tuple

from .entities import Unit


class BattleField:
    """7x5 grid that stores unit positions and calculates turn order."""

    WIDTH = 7
    HEIGHT = 5
    ENEMY_BASE = (0, 2)
    PLAYER_BASE = (6, 2)

    def __init__(self, obstacles: Optional[Set[Tuple[int, int]]] = None) -> None:
        self._units: Dict[Tuple[int, int], Unit] = {}
        self.obstacles: Set[Tuple[int, int]] = set(obstacles or [])

    # Grid utilities -----------------------------------------------------
    def in_bounds(self, pos: Tuple[int, int]) -> bool:
        x, y = pos
        return 0 <= x < self.WIDTH and 0 <= y < self.HEIGHT

    def unit_at(self, pos: Tuple[int, int]) -> Optional[Unit]:
        return self._units.get(pos)

    def all_units(self) -> List[Unit]:
        return list(self._units.values())

    # Unit management ---------------------------------------------------
    def add_unit(self, unit: Unit) -> None:
        if not self.in_bounds(unit.position):
            raise ValueError("Position out of bounds")
        if self.unit_at(unit.position) or unit.position in self.obstacles:
            raise ValueError("Cell already occupied")
        self._units[unit.position] = unit

    def move_unit(self, unit: Unit, new_pos: Tuple[int, int]) -> None:
        if not self.in_bounds(new_pos):
            raise ValueError("Position out of bounds")
        if self.unit_at(new_pos) or new_pos in self.obstacles:
            raise ValueError("Cell already occupied")
        del self._units[unit.position]
        unit.position = new_pos
        self._units[new_pos] = unit

    def remove_unit(self, unit: Unit) -> None:
        self._units.pop(unit.position, None)

    # Turn order --------------------------------------------------------
    def turn_order(self) -> List[Unit]:
        """Return units sorted by speed (descending)."""
        return sorted(self.all_units(), key=lambda u: u.spd, reverse=True)
