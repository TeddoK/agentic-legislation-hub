# processing/classify_impact.py
COMPONENT_KEYWORDS = {
    "Banner": [
        "cookie banner", "cookie consent", "pop‑up", "cookie notice"
    ],
    "Preferences": [
        "preference center", "privacy settings", "opt‑out page", "preference page"
    ],
    "Email": [
        "email consent", "email opt‑in", "newsletter", "marketing email"
    ],
}

def classify_components(text: str) -> list[str]:
    low = text.lower()
    impacted = [
        comp for comp, kws in COMPONENT_KEYWORDS.items()
        if any(kw in low for kw in kws)
    ]
    return impacted
