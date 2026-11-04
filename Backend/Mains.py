from fastapi import FastAPI
from main import ask_agent, generate_image, _list_impl, PRODUCT_DATA, FinalProductResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def Get():
    return {"message": "You must call the List through AI Agent!"}


@app.post("/Listing")
async def Post(input: str, skip: int = 0):

    result = await ask_agent(input, skip=skip)

    return {
        "response": result
    }


# ============================================================
# VOICE ASSISTANT PRODUCT SEARCH API
# ------------------------------------------------------------
# ElevenLabs voice agent (cloud) calls the "list_products"
# CLIENT tool -> the browser handler executes it and calls this
# endpoint. It reuses the exact same real _list_impl() catalog
# search as the chat assistant, so Roman Urdu normalization,
# price filters and 100% real images/prices all work here too.
# No LLM is involved in the search -> fast + honest data.
# ============================================================
class VoiceSearchRequest(BaseModel):
    query: str = ""
    category: str = ""
    color: str = ""
    material: str = ""
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    limit: int = 8


def _int_or_none(value):
    if value is None:
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@app.get("/api/voice/health")
async def voice_health():
    return {"ok": True, "catalog_size": len(PRODUCT_DATA)}


@app.post("/api/voice/products")
async def voice_products(req: VoiceSearchRequest):
    limit = max(1, min(_int_or_none(req.limit) or 8, 100))
    min_price = _int_or_none(req.min_price)
    max_price = _int_or_none(req.max_price)

    products = await _list_impl(
        query=req.query or "",
        min_price=min_price,
        max_price=max_price,
        category=req.category or "",
        color=req.color or "",
        material=req.material or "",
        limit=limit,
    )

    note = (
        f"Found {len(products)} products for you."
        if products
        else "I couldn't find matching products. Please try another product name, category, or price."
    )

    if not products:
        # (a) Price filter ho to us budget ke saare products dikhao
        if min_price is not None or max_price is not None:
            products = await _list_impl(
                query="",
                min_price=min_price,
                max_price=max_price,
                limit=limit,
            )
            if products:
                note = f"Sirf budget ke andar ke {len(products)} products dikhaye ja rahe hain."

        # (b) Phir bhi kuch na mila to popular products dikhao (hamesha real data)
        if not products:
            products = await _list_impl(query="set", limit=4)
            if products:
                note = "Koi exact match nahi mila — ye popular products dekhen."

    return FinalProductResponse(
        found=bool(products),
        products=products,
        note=note,
    )


# ============================================================
# GEMINI IMAGE GENERATION ENDPOINT
# ------------------------------------------------------------
# Voice assistant ka browser client tool isi ko POST karta hai.
# Kuch bhi remove nahi kiya — ye bilkul naya AUX endpoint hai.
# ============================================================
class ImageGenRequest(BaseModel):
    prompt: str
    aspect: str = "1:1"
    user_image: str = ""
    product_image_url: str = ""


@app.post("/api/image/generate")
async def image_generate(req: ImageGenRequest):
    prompt = (req.prompt or "").strip()
    if not prompt:
        return {"ok": False, "error": "prompt required"}
    return await generate_image(
        prompt,
        image_aspect=(req.aspect or "1:1"),
        user_image=(req.user_image or ""),
        product_image_url=(req.product_image_url or ""),
    )