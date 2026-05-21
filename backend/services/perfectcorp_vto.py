"""Perfect Corp AI Clothes try-on (live) — additive to perfectcorp.virtual_try_on stub."""

import base64
import logging
import time
from typing import Any

import requests
from tenacity import retry, stop_after_attempt, wait_exponential

from data.journey import get_fashion_item
from services.perfectcorp import API_KEY, BASE_URL, _headers
from services.resilience import FallbackChain, kill_perfect_corp

logger = logging.getLogger(__name__)

DEFAULT_REF = (
    "https://plugins-media.makeupar.com/strapi/assets/"
    "clothes_reference_full_body_01_5a000d999f.png"
)


def _bytes_to_data_url(image_bytes: bytes, content_type: str = "image/jpeg") -> str:
    b64 = base64.standard_b64encode(image_bytes).decode("ascii")
    return f"data:{content_type};base64,{b64}"


def _demo_preview(person_bytes: bytes, garment_id: str, message: str) -> dict[str, Any]:
    return {
        "status": "demo_preview",
        "garment_id": garment_id,
        "preview_url": _bytes_to_data_url(person_bytes),
        "message": message,
    }


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=1, max=8))
def _upload_cloth_image(image_bytes: bytes, content_type: str = "image/jpeg") -> str:
    file_name = "tryon_person.jpg"
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
        f"{BASE_URL}/file/cloth",
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
def _create_cloth_task(file_id: str, ref_url: str, garment_category: str) -> str:
    payload = {
        "src_file_id": file_id,
        "ref_file_url": ref_url,
        "garment_category": garment_category,
    }
    resp = requests.post(
        f"{BASE_URL}/task/cloth",
        headers=_headers(),
        json=payload,
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["data"]["task_id"]


def _poll_cloth_task(task_id: str, max_wait: int = 120) -> dict[str, Any]:
    url = f"{BASE_URL}/task/cloth/{task_id}"
    deadline = time.time() + max_wait
    while time.time() < deadline:
        resp = requests.get(url, headers=_headers(), timeout=15)
        resp.raise_for_status()
        body = resp.json()
        data = body.get("data", body)
        status = data.get("task_status") or data.get("status")
        if status in ("success", "completed", "done"):
            return data
        if status in ("error", "failed"):
            err = data.get("error") or data.get("message", "Cloth task failed")
            raise RuntimeError(str(err))
        time.sleep(2)
    raise TimeoutError("Cloth try-on task timed out")


def _extract_preview_url(data: dict[str, Any]) -> str | None:
    results = data.get("results") or {}
    if isinstance(results, dict):
        url = results.get("url") or results.get("download_url")
        if url:
            return str(url)
    if isinstance(results, list) and results:
        first = results[0]
        if isinstance(first, dict):
            return first.get("url") or first.get("download_url")
    return data.get("url") or data.get("download_url")


def try_on_live(
    person_bytes: bytes, garment_id: str
) -> tuple[dict[str, Any], str, list[str]]:
    chain = FallbackChain()
    garment = get_fashion_item(garment_id) or {}
    ref_url = garment.get("ref_file_url") or DEFAULT_REF
    category = garment.get("garment_category") or "full_body"

    if kill_perfect_corp():
        chain.add("chaos_mode: live try-on blocked")
        chain.add("fallback: demo preview from your photo")
        return (
            _demo_preview(
                person_bytes,
                garment_id,
                "Chaos mode — showing demo preview until API recovers.",
            ),
            "demo_preview",
            chain.steps,
        )

    if not API_KEY:
        chain.add("perfect_corp: API key missing")
        chain.add("fallback: demo preview from your photo")
        return (
            _demo_preview(
                person_bytes,
                garment_id,
                "Add PERFECT_CORP_API_KEY for live AR try-on.",
            ),
            "demo_preview",
            chain.steps,
        )

    try:
        chain.add("perfect_corp: upload person image (cloth)")
        file_id = _upload_cloth_image(person_bytes)
        chain.add(f"perfect_corp: create cloth task ({category})")
        task_id = _create_cloth_task(file_id, ref_url, category)
        chain.add("perfect_corp: poll cloth task")
        raw = _poll_cloth_task(task_id)
        preview = _extract_preview_url(raw)
        if not preview:
            chain.add("perfect_corp: no result URL — demo preview")
            return (
                _demo_preview(
                    person_bytes,
                    garment_id,
                    "Try-on completed — showing your photo until result URL is available.",
                ),
                "demo_preview",
                chain.steps,
            )
        chain.add("perfect_corp: live try-on success")
        return (
            {
                "status": "completed",
                "garment_id": garment_id,
                "preview_url": preview,
                "message": "Live AR try-on via Perfect Corp Clothes API.",
            },
            "perfect_corp_live",
            chain.steps,
        )
    except Exception as exc:
        logger.warning("Live try-on failed: %s", exc)
        chain.add(f"perfect_corp live: failed ({exc.__class__.__name__})")
        chain.add("fallback: demo preview from your photo")
        return (
            _demo_preview(
                person_bytes,
                garment_id,
                f"Live API unavailable ({exc.__class__.__name__}) — demo preview shown.",
            ),
            "demo_preview",
            chain.steps,
        )
