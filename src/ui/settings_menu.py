from __future__ import annotations

"""Settings menu for toggling UI options."""

from dataclasses import dataclass


@dataclass
class SettingsMenu:
    animations: bool = True
    effects: bool = True
    verbose_logs: bool = True

    def toggle(self, option: str) -> None:
        if hasattr(self, option):
            current = getattr(self, option)
            if isinstance(current, bool):
                setattr(self, option, not current)
            else:
                raise TypeError(f"Option {option} is not boolean")
        else:
            raise AttributeError(f"Unknown option {option}")
