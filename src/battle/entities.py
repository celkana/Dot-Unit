from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Tuple


@dataclass
class Skill:
    """Simple skill definition used by the demo engine."""

    name: str
    power: int
    range: int  # Manhattan distance


@dataclass
class Unit:
    """Minimal unit definition for the battle system."""

    name: str
    hp: int
    spd: int
    position: Tuple[int, int]
    owner: str  # "player" or "enemy"
    skills: List[Skill] = field(default_factory=list)


def create_dummy_definitions() -> Tuple[List[Unit], List[Unit]]:
    """Return sample player and enemy units with predefined skills."""

    slash = Skill(name="Slash", power=10, range=1)
    fireball = Skill(name="Fireball", power=8, range=2)

    player_units = [
        Unit(
            name="Hero",
            hp=30,
            spd=5,
            position=(5, 2),
            owner="player",
            skills=[slash],
        ),
        Unit(
            name="Mage",
            hp=20,
            spd=7,
            position=(6, 1),
            owner="player",
            skills=[fireball],
        ),
    ]

    enemy_units = [
        Unit(
            name="Goblin",
            hp=25,
            spd=4,
            position=(1, 2),
            owner="enemy",
            skills=[slash],
        ),
        Unit(
            name="Orc",
            hp=35,
            spd=3,
            position=(0, 3),
            owner="enemy",
            skills=[slash],
        ),
    ]

    return player_units, enemy_units
