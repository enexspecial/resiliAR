# ResiliAR

**Resilient AI commerce for emerging markets** — skin health analysis, AR fashion try-on, and tele-pharmacy triage that keep working when APIs fail, LLMs brown out, or connectivity drops.

Built for the **DevNetwork AI+ML Hackathon 2026** (Perfect Corp + TrueFoundry sponsor tracks).

## Features

| Feature | Integration | Resilience |
|--------|-------------|------------|
| Skin Health Advisor | Perfect Corp Skin Analysis API | Offline cached model fallback |
| Fashion Try-On | Perfect Corp Virtual Try-On (stub + queue) | Queued sessions when offline |
| Tele-Pharmacy Triage | TrueFoundry AI Gateway (multi-LLM) | Claude → GPT-4o → Gemini → cache |
| **Chaos Mode** | Demo toggle for judges | Kills primary API/LLM live |

## Quick start

### 1. Environment

```bash
cp .env.example .env
# Add PERFECT_CORP_API_KEY and TrueFoundry gateway credentials
```

**Perfect Corp:** Redeem code `Pegasus1000` at [YCE API Console](https://yce.perfectcorp.com/api-console/en/redeem-code/).

**TrueFoundry:** Set up [AI Gateway](https://www.truefoundry.com/docs/ai-gateway/intro-to-llm-gateway) and point `TRUEFOUNDRY_BASE_URL` to your OpenAI-compatible endpoint.

### 2. Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — API calls proxy to `:8000`.

## Demo script (for judges)

1. **Skin scan** — capture/upload a selfie → see conditions + product recommendations + fallback chain.
2. **Fashion try-on** — pick a garment, upload photo → try-on status (queued or completed).
3. **Tele-pharmacy** — ask an OTC/skin question → watch gateway routing in the fallback chain.
4. **Chaos mode** — click **Kill primary API** → repeat steps; responses use offline cache / LLM fallbacks (visible in UI).

## Project structure

```
backend/
  main.py              # FastAPI routes
  services/
    perfectcorp.py     # Skin analysis + try-on
    llm_gateway.py     # TrueFoundry multi-LLM triage
    resilience.py      # Chaos mode state
  data/products.py     # Curated catalogue
frontend/
  src/components/      # Skin, Fashion, Triage, Chaos UI
  public/sw.js           # Service worker (offline cache)
```

## Hackathon deliverables

- [x] Working web app (React + Vite)
- [x] Perfect Corp skin analysis integration (with offline fallback)
- [x] TrueFoundry gateway routing + visible fallback chain
- [ ] Devpost page + demo video (your team)
- [x] Chaos mode toggle for live judging

## Pitch

> Every other AI beauty or health app is built for someone in San Francisco with 5G. We built for someone in Lagos with 2G — and made it work anyway.
