"""TrueFoundry AI Gateway — multi-LLM triage with visible fallback chain."""

import logging
import os
from typing import Any

from openai import OpenAI

from services.resilience import FallbackChain, kill_primary_llm

logger = logging.getLogger(__name__)

TFY_API_KEY = os.getenv("TRUEFOUNDRY_API_KEY", "")
TFY_BASE_URL = os.getenv("TRUEFOUNDRY_BASE_URL", "")
PRIMARY_MODEL = os.getenv("TFY_MODEL", "claude-sonnet-4-20250514")
FALLBACK_MODELS = [
    m.strip()
    for m in os.getenv("TFY_FALLBACK_MODELS", "gpt-4o,gemini-1.5-pro").split(",")
    if m.strip()
]

TRIAGE_SYSTEM = """You are ResiliAR Tele-Pharmacy, an AI triage assistant for common skin
conditions and OTC products in emerging markets (Africa, South Asia, Latin America).
- Give practical, culturally aware advice.
- Always recommend seeing a dermatologist for severe, spreading, or painful conditions.
- Suggest affordable OTC options when appropriate.
- Keep responses concise (under 200 words).
- Never prescribe prescription-only drugs."""


def _client() -> OpenAI | None:
    if not TFY_API_KEY or not TFY_BASE_URL:
        return None
    return OpenAI(api_key=TFY_API_KEY, base_url=TFY_BASE_URL)


def _offline_triage(message: str, skin_context: dict | None) -> str:
    ctx = ""
    if skin_context and skin_context.get("conditions"):
        names = [c["name"] for c in skin_context["conditions"][:3]]
        ctx = f" Based on your recent scan ({', '.join(names)}),"
    return (
        f"{ctx} I'm operating in offline mode.{chr(10)}"
        f"For '{message[:80]}...': use gentle cleanser, SPF 30+, and moisturizer. "
        "If symptoms worsen or you see spreading rash, fever, or open wounds — "
        "visit a clinic. This is cached guidance for low-connectivity areas."
    )


def triage_chat(
    message: str, history: list[dict], skin_context: dict | None = None
) -> tuple[str, str, list[str], dict[str, Any]]:
    chain = FallbackChain()
    models = [PRIMARY_MODEL, *FALLBACK_MODELS]

    if kill_primary_llm() and models:
        chain.add("chaos_mode: primary LLM blocked")
        models = models[1:] or models

    client = _client()
    if not client:
        chain.add("truefoundry: gateway not configured")
        chain.add("fallback: offline cached triage")
        return _offline_triage(message, skin_context), "offline_cache", chain.steps, {}

    last_error = None
    for i, model in enumerate(models):
        label = "primary" if i == 0 else f"fallback_{i}"
        if kill_primary_llm() and i == 0:
            continue
        try:
            chain.add(f"truefoundry: {label} → {model}")
            messages = [{"role": "system", "content": TRIAGE_SYSTEM}]
            if skin_context:
                messages.append(
                    {
                        "role": "system",
                        "content": f"Recent skin scan: {skin_context}",
                    }
                )
            for h in history[-6:]:
                messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": message})

            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=400,
                temperature=0.4,
            )
            text = resp.choices[0].message.content or ""
            chain.add(f"truefoundry: success via {model}")
            meta = {
                "model": model,
                "usage": getattr(resp, "usage", None),
            }
            source = "truefoundry_primary" if i == 0 else f"truefoundry_{label}"
            return text, source, chain.steps, meta
        except Exception as exc:
            last_error = exc
            logger.warning("LLM %s failed: %s", model, exc)
            chain.add(f"truefoundry: {model} failed → trying next")

    chain.add("fallback: offline cached triage")
    return (
        _offline_triage(message, skin_context),
        "offline_cache",
        chain.steps,
        {"error": str(last_error)} if last_error else {},
    )
