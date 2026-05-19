"""ResiliAR API — resilient AI commerce for emerging markets."""

import logging
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

load_dotenv(ROOT.parent / ".env")

from data.products import FASHION_ITEMS, SKIN_PRODUCTS, recommend_for_conditions
from services import llm_gateway, perfectcorp
from services.resilience import CHAOS, set_chaos

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ResiliAR API",
    description="Resilient AI commerce & health advisory for emerging markets",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_credentials=True,
    allow_headers=["*"],
)


class ChaosRequest(BaseModel):
    enabled: bool
    kill_perfect_corp: bool = True
    kill_primary_llm: bool = True


class TriageRequest(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)
    skin_context: dict | None = None


class TryOnRequest(BaseModel):
    garment_id: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "product": "ResiliAR",
        "chaos": CHAOS,
        "integrations": {
            "perfect_corp": bool(__import__("os").getenv("PERFECT_CORP_API_KEY")),
            "truefoundry": bool(__import__("os").getenv("TRUEFOUNDRY_API_KEY")),
        },
    }


@app.get("/api/chaos")
def get_chaos():
    return CHAOS


@app.post("/api/chaos")
def post_chaos(body: ChaosRequest):
    return set_chaos(body.enabled, body.kill_perfect_corp, body.kill_primary_llm)


@app.get("/api/products/skin")
def skin_products():
    return {"products": SKIN_PRODUCTS}


@app.get("/api/products/fashion")
def fashion_products():
    return {"products": FASHION_ITEMS}


@app.post("/api/skin/analyze")
async def analyze_skin(file: UploadFile = File(...)):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(400, "Empty image")

    result, source, chain = perfectcorp.analyze_skin(image_bytes)
    condition_names = [c["name"] for c in result.get("conditions", [])]
    recommendations = recommend_for_conditions(condition_names)

    return {
        "source": source,
        "analysis": result,
        "recommendations": recommendations,
        "fallback_chain": chain,
        "confidence": 0.85 if source == "perfect_corp" else 0.65,
        "message": result.get("summary", "Skin analysis complete."),
    }


@app.post("/api/fashion/try-on")
async def fashion_try_on(
    file: UploadFile = File(...),
    garment_id: str = Query("dress-01"),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(400, "Empty image")

    result, source, chain = perfectcorp.virtual_try_on(image_bytes, garment_id)
    return {
        "source": source,
        "result": result,
        "fallback_chain": chain,
        "garment": next((g for g in FASHION_ITEMS if g["id"] == garment_id), None),
    }


@app.post("/api/triage")
def tele_pharmacy_triage(body: TriageRequest):
    if not body.message.strip():
        raise HTTPException(400, "Message required")

    reply, source, chain, meta = llm_gateway.triage_chat(
        body.message, body.history, body.skin_context
    )
    return {
        "source": source,
        "reply": reply,
        "fallback_chain": chain,
        "meta": meta,
    }
