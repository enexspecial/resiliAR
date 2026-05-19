"""Curated product catalogue for emerging-market skin & fashion."""

SKIN_PRODUCTS = [
    {
        "id": "spf-01",
        "name": "SunShield SPF 50",
        "category": "sun_protection",
        "price_usd": 12,
        "for_conditions": ["sun_damage", "hyperpigmentation"],
        "region": "pan-africa",
    },
    {
        "id": "hydr-02",
        "name": "Baobab Hydrating Serum",
        "category": "moisturizer",
        "price_usd": 18,
        "for_conditions": ["dryness"],
        "region": "west-africa",
    },
    {
        "id": "acne-03",
        "name": "Neem Clear Gel",
        "category": "treatment",
        "price_usd": 15,
        "for_conditions": ["acne"],
        "region": "south-asia",
    },
    {
        "id": "pig-04",
        "name": "Vitamin C Brightening Cream",
        "category": "treatment",
        "price_usd": 22,
        "for_conditions": ["hyperpigmentation", "texture"],
        "region": "latin-america",
    },
]

FASHION_ITEMS = [
    {"id": "dress-01", "name": "Ankara Wrap Dress", "category": "dress", "price_usd": 45},
    {"id": "shirt-02", "name": "Kente Print Shirt", "category": "top", "price_usd": 32},
    {"id": "acc-03", "name": "Beaded Statement Necklace", "category": "accessory", "price_usd": 28},
]


def recommend_for_conditions(conditions: list[str], limit: int = 3) -> list[dict]:
    scored = []
    for p in SKIN_PRODUCTS:
        overlap = len(set(conditions) & set(p["for_conditions"]))
        if overlap:
            scored.append((overlap, p))
    scored.sort(key=lambda x: -x[0])
    return [p for _, p in scored[:limit]] or SKIN_PRODUCTS[:limit]
