"""Retail journey helpers — routine, explanations, garment hints (additive)."""

from data.products import FASHION_ITEMS, recommend_for_conditions

REGIONS = [
    {"id": "pan-africa", "label": "Pan-Africa"},
    {"id": "west-africa", "label": "West Africa"},
    {"id": "south-asia", "label": "South Asia"},
    {"id": "latin-america", "label": "Latin America"},
]

AM_CATEGORIES = {"sun_protection", "cleanser"}
PM_CATEGORIES = {"treatment", "moisturizer"}

CONDITION_GARMENT = {
    "hyperpigmentation": "dress-01",
    "sun_damage": "dress-01",
    "texture": "shirt-02",
    "acne": "shirt-02",
    "dryness": "acc-03",
}


def get_fashion_item(garment_id: str) -> dict | None:
    return next((g for g in FASHION_ITEMS if g["id"] == garment_id), None)


def suggest_garment(condition_names: list[str]) -> str:
    for name in condition_names:
        if name in CONDITION_GARMENT:
            return CONDITION_GARMENT[name]
    return "dress-01"


def explain_product(product: dict, condition_names: list[str]) -> str:
    overlap = set(product.get("for_conditions", [])) & set(condition_names)
    if not overlap:
        return "Popular pick for daily skin care in your region."
    labels = ", ".join(sorted(overlap))
    return f"Recommended because your scan detected {labels}."


def enrich_recommendations(
    products: list[dict], condition_names: list[str]
) -> list[dict]:
    out = []
    for p in products:
        item = dict(p)
        item["why"] = explain_product(p, condition_names)
        out.append(item)
    return out


def build_routine(products: list[dict]) -> dict[str, list[dict]]:
    am: list[dict] = []
    pm: list[dict] = []
    for p in products:
        cat = p.get("category", "")
        if cat in AM_CATEGORIES:
            am.append(p)
        elif cat in PM_CATEGORIES:
            pm.append(p)
        else:
            pm.append(p)
    if not am and products:
        am.append(products[0])
    if not pm and len(products) > 1:
        pm.append(products[1])
    elif not pm and products:
        pm.append(products[0])
    return {"am": am, "pm": pm}


def filter_by_region(products: list[dict], region: str) -> list[dict]:
    if region == "pan-africa":
        return products
    matched = [p for p in products if p.get("region") in (region, "pan-africa")]
    return matched or products


def build_journey_plan(
    conditions: list[dict],
    recommendations: list[dict] | None = None,
    region: str = "pan-africa",
) -> dict:
    names = [c["name"] for c in conditions if c.get("name")]
    recs = recommendations or recommend_for_conditions(names)
    recs = filter_by_region(recs, region)
    enriched = enrich_recommendations(recs, names)
    garment_id = suggest_garment(names)
    garment = get_fashion_item(garment_id)
    return {
        "region": region,
        "conditions": names,
        "products": enriched,
        "routine": build_routine(enriched),
        "suggested_garment_id": garment_id,
        "suggested_garment": garment,
        "steps": [
            {"id": "scan", "label": "Skin scan", "done": bool(names)},
            {"id": "routine", "label": "Your routine", "done": bool(enriched)},
            {"id": "tryon", "label": "Virtual try-on", "done": False},
            {"id": "save", "label": "Save & shop", "done": False},
        ],
    }
