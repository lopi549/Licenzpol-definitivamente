from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from catalog import PRODUCTS, CATEGORIES, NEEDS, get_product_by_slug


BUNDLE_TIERS = [
    {"min_items": 2, "discount": 0.08},
    {"min_items": 3, "discount": 0.12},
    {"min_items": 4, "discount": 0.15},
]

BUNDLE_SLOTS = [
    {"key": "os",       "required": True,  "categories": ["os"],
     "title_it": "Sistema operativo", "title_en": "Operating System",
     "hint_it": "La base per il tuo PC.", "hint_en": "The base of your PC."},
    {"key": "office",   "required": True,  "categories": ["office"],
     "title_it": "Produttività",      "title_en": "Productivity",
     "hint_it": "Documenti, fogli, presentazioni.", "hint_en": "Docs, sheets, decks."},
    {"key": "security", "required": True,  "categories": ["security"],
     "title_it": "Sicurezza",         "title_en": "Security",
     "hint_it": "Un livello di protezione essenziale.", "hint_en": "An essential layer of protection."},
    {"key": "creative", "required": False, "categories": ["creative"],
     "title_it": "Creatività (opzionale)", "title_en": "Creative (optional)",
     "hint_it": "Foto, video, illustrazione.", "hint_en": "Photo, video, illustration."},
    {"key": "utility",  "required": False, "categories": ["utility", "business"],
     "title_it": "Extra (opzionale)",     "title_en": "Extras (optional)",
     "hint_it": "Utility e strumenti aggiuntivi.", "hint_en": "Utilities and extra tools."},
]


def compute_bundle_discount(n_items: int) -> float:
    d = 0.0
    for t in BUNDLE_TIERS:
        if n_items >= t["min_items"]:
            d = t["discount"]
    return d


class BundleSelection(BaseModel):
    product_slug: str
    variant_id: str


class BundlePreviewRequest(BaseModel):
    selections: List[BundleSelection]


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="LicenzPol API")
api_router = APIRouter(prefix="/api")


class OrderLineItem(BaseModel):
    product_slug: str
    product_name: str
    variant_id: str
    variant_label: str
    quantity: int
    unit_price_eur: float


class OrderCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    country: str
    company: Optional[str] = None
    vat: Optional[str] = None
    items: List[OrderLineItem]
    subtotal_eur: float
    total_eur: float
    language: str = "it"


class OrderResponse(BaseModel):
    id: str
    reference: str
    created_at: str
    status: str
    demo: bool
    total_eur: float


class SupportMessage(BaseModel):
    email: str
    subject: str
    message: str
    language: str = "it"


@api_router.get("/")
async def root():
    return {"service": "LicenzPol", "status": "ok"}


@api_router.get("/categories")
async def list_categories():
    return CATEGORIES


@api_router.get("/needs")
async def list_needs():
    return NEEDS


@api_router.get("/products")
async def list_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    platform: Optional[str] = None,
    brand: Optional[str] = None,
    license_type: Optional[str] = None,
    max_price: Optional[float] = None,
    min_price: Optional[float] = None,
    need: Optional[str] = None,
    sort: Optional[str] = "featured",
    limit: Optional[int] = 500,
):
    items = list(PRODUCTS)
    if q:
        needle = q.lower().strip()
        items = [p for p in items if needle in p["name"].lower()
                 or needle in p["brand"].lower()
                 or needle in p["tagline_it"].lower()
                 or needle in p["tagline_en"].lower()]
    if category:
        items = [p for p in items if p["category"] == category]
    if platform:
        items = [p for p in items if platform in p["platforms"]]
    if brand:
        items = [p for p in items if p["brand"].lower() == brand.lower()]
    if license_type:
        items = [p for p in items if p["licenseType"].lower() == license_type.lower()]
    if need:
        target_cats = next((n["categories"] for n in NEEDS if n["key"] == need), [])
        if target_cats:
            items = [p for p in items if p["category"] in target_cats]

    def base_price(p):
        return min(v["price_eur"] for v in p["variants"]) if p["variants"] else 0

    if min_price is not None:
        items = [p for p in items if base_price(p) >= min_price]
    if max_price is not None:
        items = [p for p in items if base_price(p) <= max_price]

    if sort == "price_asc":
        items.sort(key=base_price)
    elif sort == "price_desc":
        items.sort(key=base_price, reverse=True)
    elif sort == "name":
        items.sort(key=lambda p: p["name"])

    return {"total": len(items), "items": items[:limit]}


@api_router.get("/products/{slug}")
async def get_product(slug: str):
    p = get_product_by_slug(slug)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    return p


@api_router.get("/related/{slug}")
async def related_products(slug: str, limit: int = 4):
    p = get_product_by_slug(slug)
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    same_cat = [x for x in PRODUCTS if x["category"] == p["category"] and x["slug"] != slug]
    same_cat.sort(key=lambda x: min(v["price_eur"] for v in x["variants"]))
    return same_cat[:limit]


@api_router.post("/orders", response_model=OrderResponse)
async def create_order(order: OrderCreate):
    ref = "LP-" + uuid.uuid4().hex[:8].upper()
    doc = {
        "id": str(uuid.uuid4()),
        "reference": ref,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "demo_confirmed",
        "demo": True,
        "email": order.email,
        "first_name": order.first_name,
        "last_name": order.last_name,
        "country": order.country,
        "company": order.company,
        "vat": order.vat,
        "language": order.language,
        "items": [i.model_dump() for i in order.items],
        "subtotal_eur": order.subtotal_eur,
        "total_eur": order.total_eur,
    }
    await db.orders.insert_one(doc)
    return OrderResponse(
        id=doc["id"], reference=ref, created_at=doc["created_at"],
        status="demo_confirmed", demo=True, total_eur=order.total_eur
    )


@api_router.get("/orders/{reference}", response_model=OrderResponse)
async def get_order(reference: str):
    doc = await db.orders.find_one({"reference": reference}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(
        id=doc["id"], reference=doc["reference"],
        created_at=doc["created_at"], status=doc["status"],
        demo=doc.get("demo", True), total_eur=doc["total_eur"],
    )


@api_router.post("/support")
async def create_support_message(msg: SupportMessage):
    doc = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now(timezone.utc).isoformat(),
        **msg.model_dump(),
    }
    await db.support_messages.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.get("/bundle/config")
async def bundle_config():
    return {"slots": BUNDLE_SLOTS, "tiers": BUNDLE_TIERS}


@api_router.get("/bundle/preset/nuovo-pc")
async def bundle_preset_nuovo_pc():
    """A curated 'Nuovo PC' preset: cheapest recent OS + Office + Security."""
    from catalog import PRODUCTS as _P

    def pick_by(pred):
        candidates = [p for p in _P if pred(p)]
        if not candidates:
            return None
        candidates.sort(key=lambda p: p["variants"][0]["price_eur"])
        return candidates[0]

    picks = []
    # Prefer Windows 11 Pro; fall back to any Windows OS
    os_pick = pick_by(lambda p: p["category"] == "os" and "windows 11" in p["name"].lower() and "pro" in p["name"].lower()) \
              or pick_by(lambda p: p["category"] == "os" and "windows 11" in p["name"].lower()) \
              or pick_by(lambda p: p["category"] == "os")
    # Prefer recent Office Pro; fall back to any Office
    office_pick = pick_by(lambda p: p["category"] == "office" and "office 2021" in p["name"].lower() and "professional" in p["name"].lower()) \
                  or pick_by(lambda p: p["category"] == "office" and "office 2021" in p["name"].lower()) \
                  or pick_by(lambda p: p["category"] == "office" and "office 2019" in p["name"].lower() and "professional" in p["name"].lower()) \
                  or pick_by(lambda p: p["category"] == "office")
    # Any security product
    sec_pick = pick_by(lambda p: p["category"] == "security")

    for prod in [os_pick, office_pick, sec_pick]:
        if prod:
            picks.append({"product_slug": prod["slug"], "variant_id": prod["variants"][0]["id"]})
    return {"selections": picks}


@api_router.post("/bundle/preview")
async def bundle_preview(req: BundlePreviewRequest):
    lines = []
    subtotal = 0.0
    for sel in req.selections:
        p = get_product_by_slug(sel.product_slug)
        if not p:
            continue
        v = next((x for x in p["variants"] if x["id"] == sel.variant_id), None)
        if not v:
            continue
        subtotal += v["price_eur"]
        lines.append({
            "product_slug": p["slug"], "product_name": p["name"],
            "brand": p["brand"], "mark": p["mark"], "colorKey": p["colorKey"],
            "category": p["category"],
            "variant_id": v["id"], "edition": v["edition"],
            "duration_months": v["duration_months"], "devices": v["devices"],
            "price_eur": v["price_eur"],
        })
    discount_pct = compute_bundle_discount(len(lines))
    discount_eur = round(subtotal * discount_pct, 2)
    total = round(subtotal - discount_eur, 2)
    return {
        "items": lines,
        "count": len(lines),
        "subtotal_eur": round(subtotal, 2),
        "discount_pct": discount_pct,
        "discount_eur": discount_eur,
        "total_eur": total,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
