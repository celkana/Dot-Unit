from __future__ import annotations

"""Simple animation helpers for text-based demos."""

import time


def animate(action: str, delay: float = 0.05) -> None:
    """Simulate a small animation by printing dots."""
    print(f"{action}", end="", flush=True)
    for _ in range(3):
        time.sleep(delay)
        print(".", end="", flush=True)
    print()
