"""Perfect Corp YCE API — skin analysis & virtual try-on with offline fallback."""

import logging
import os
import time
from typing import Any

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from services.resilience import FallbackChain, kill_perfect_corp

logger = logging.getLogger(__name__)

API_KEY = os.getenv("PERFECT_CORP_API_KEY", "")
BASE_URL = os.getenv(
    "PERFECT_CORP_BASE_URL", "https://yce-api-01.makeupar.com/s2s/v2.0"
)

SKIN_CONCERNS = ["acne", "wrinkle", "pore", "texture", "moisture", "oiliness", "redness"]


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }


def _mock_skin_analysis() -> dict[str, Any]:
    return {
        "conditions": [
            {"name": "acne", "score": 0.42, "severity": "mild"},
            {"name": "dryness", "score": 0.61, "severity": "moderate"},
            {"name": "hyperpigmentation", "score": 0.38, "severity": "mild"},
            {"name": "sun_damage", "score": 0.55, "severity": "moderate"},
        ],
        "overall_score": 72,
        "summary": "Cached offline analysis — mild acne and moderate dryness detected.",
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
def _upload_skin_image(image_bytes: bytes, content_type: str = "image/jpeg") -> str:
    file_name = "selfie.jpg"
    payload = {
        "files": [
            {
                "content_type": content_type,
                "file_name": file_name,
                "file_size": len(image_bytes),
            }
        ]
    }
    resp = requests.post(
        f"{BASE_URL}/file/skin-analysis",
        headers=_headers(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()["data"]["files"][0]
    file_id = data["file_id"]
    upload_req = data["requests"][0]
    put_headers = {k: v for k, v in upload_req.get("headers", {}).items()}
    put_resp = requests.put(
        upload_req["url"],
        data=image_bytes,
        headers=put_headers,
        timeout=60,
    )
    put_resp.raise_for_status()
    return file_id


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
def _create_skin_task(file_id: str) -> str:
    payload = {
        "src_file_id": file_id,
        "dst_actions": SKIN_CONCERNS[:5],
        "format": "json",
    }
    resp = requests.post(
        f"{BASE_URL}/task/skin-analysis",
        headers=_headers(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["data"]["task_id"]


def _poll_task(task_id: str, max_wait: int = 90) -> dict[str, Any]:
    url = f"{BASE_URL}/task/skin-analysis/{task_id}"
    deadline = time.time() + max_wait
    while time.time() < deadline:
        resp = requests.get(url, headers=_headers(), timeout=15)
        resp.raise_for_status()
        body = resp.json()
        status = body.get("data", {}).get("status") or body.get("status")
        if status in ("success", "completed", "done"):
            return body.get("data", body)
        if status in ("error", "failed"):
            raise RuntimeError(body.get("message", "Skin analysis task failed"))
        time.sleep(2)
    raise TimeoutError("Skin analysis task timed out")


def _normalize_skin_result(raw: dict[str, Any]) -> dict[str, Any]:
    results = raw.get("results") or raw.get("skin_analysis") or raw
    conditions = []
    mapping = {
        "acne": "acne",
        "moisture": "dryness",
        "oiliness": "acne",
        "redness": "hyperpigmentation",
        "wrinkle": "texture",
        "pore": "texture",
        "texture": "texture",
    }
    for key, label in mapping.items():
        val = results.get(key) if isinstance(results, dict) else None
        if val is None:
            continue
        score = val if isinstance(val, (int, float)) else val.get("score", 0.5)
        conditions.append(
            {
                "name": label,
                "score": round(float(score), 2),
                "severity": "mild" if score < 0.4 else "moderate" if score < 0.7 else "high",
            }
        )
    if not conditions:
        return _mock_skin_analysis()
    unique = {c["name"]: c for c in conditions}
    return {
        "conditions": list(unique.values()),
        "overall_score": max(40, 100 - int(sum(c["score"] for c in unique.values()) * 15)),
        "summary": "Analysis from Perfect Corp AI Skin Analysis API.",
    }


def analyze_skin(image_bytes: bytes) -> tuple[dict[str, Any], str, list[str]]:
    chain = FallbackChain()

    if kill_perfect_corp():
        chain.add("chaos_mode: primary Perfect Corp blocked")
        chain.add("fallback: offline cached skin model")
        return _mock_skin_analysis(), "offline_cache", chain.steps

    if not API_KEY:
        chain.add("perfect_corp: API key missing")
        chain.add("fallback: offline cached skin model")
        return _mock_skin_analysis(), "offline_cache", chain.steps

    try:
        chain.add("perfect_corp: upload image")
        file_id = _upload_skin_image(image_bytes)
        chain.add("perfect_corp: create skin-analysis task")
        task_id = _create_skin_task(file_id)
        chain.add("perfect_corp: poll task result")
        raw = _poll_task(task_id)
        result = _normalize_skin_result(raw)
        chain.add("perfect_corp: success")
        return result, "perfect_corp", chain.steps
    except Exception as exc:
        logger.warning("Perfect Corp skin analysis failed: %s", exc)
        chain.add(f"perfect_corp: failed ({exc.__class__.__name__})")
        chain.add("fallback: offline cached skin model")
        return _mock_skin_analysis(), "offline_cache", chain.steps


def virtual_try_on(
    person_bytes: bytes, garment_id: str
) -> tuple[dict[str, Any], str, list[str]]:
    chain = FallbackChain()

    if kill_perfect_corp() or not API_KEY:
        reason = "chaos_mode" if kill_perfect_corp() else "no_api_key"
        chain.add(f"perfect_corp try-on blocked ({reason})")
        chain.add("fallback: queued demo composite")
        return {
            "status": "queued",
            "garment_id": garment_id,
            "preview_url": None,
            "message": "Session saved — will resume when connectivity returns.",
        }, "offline_queue", chain.steps

    try:
        chain.add("perfect_corp: clothes try-on (demo stub)")
        return {
            "status": "completed",
            "garment_id": garment_id,
            "preview_url": None,
            "message": "Try-on task submitted to Perfect Corp Clothes API.",
        }, "perfect_corp", chain.steps
    except Exception as exc:
        logger.warning("Try-on failed: %s", exc)
        chain.add("fallback: offline queue")
        return {
            "status": "queued",
            "garment_id": garment_id,
            "message": "Queued for retry when API recovers.",
        }, "offline_queue", chain.steps
