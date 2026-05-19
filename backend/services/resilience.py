"""Chaos mode and fallback state for hackathon demo."""

from dataclasses import dataclass, field

CHAOS = {"enabled": False, "kill_perfect_corp": False, "kill_primary_llm": False}


@dataclass
class FallbackChain:
    steps: list[str] = field(default_factory=list)

    def add(self, step: str) -> None:
        self.steps.append(step)


def chaos_enabled() -> bool:
    return CHAOS["enabled"]


def kill_perfect_corp() -> bool:
    return CHAOS["enabled"] and CHAOS["kill_perfect_corp"]


def kill_primary_llm() -> bool:
    return CHAOS["enabled"] and CHAOS["kill_primary_llm"]


def set_chaos(enabled: bool, kill_pc: bool = True, kill_llm: bool = True) -> dict:
    CHAOS["enabled"] = enabled
    CHAOS["kill_perfect_corp"] = kill_pc if enabled else False
    CHAOS["kill_primary_llm"] = kill_llm if enabled else False
    return dict(CHAOS)
