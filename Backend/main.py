from agents import Agent, Runner, OpenAIChatCompletionsModel, set_tracing_disabled, function_tool, ModelSettings
from openai import AsyncOpenAI
from dotenv import load_dotenv
import os, asyncio, base64, mimetypes, json, re
from pydantic import BaseModel, Field
from typing import Optional, List as TList


load_dotenv(override=True)
set_tracing_disabled(disabled=True)


gemini_api = os.getenv("OPENROUTER_API_KEY")
if not gemini_api:
    raise ValueError("OPENROUTER_API_KEY is not found")

client = AsyncOpenAI(api_key=gemini_api, base_url="https://openrouter.ai/api/v1")

Model = OpenAIChatCompletionsModel(model="nex-agi/nex-n2.5-mini:free", openai_client=client)


# ============================================================
# GEMINI IMAGE GENERATION (AI tasveer banao)
# ------------------------------------------------------------
# User ki Gemini image-generation API key yahan use hoti hai:
# key pehle environment se (GEMINI_IMAGE_API_KEY), warna neeche
# wali default se. Model "gemini-2.5-flash-image" tested hai — ye
# asli base64 image deta hai. Kisi bhi failure par {ok: False}
# return hota hai, kabhi crash nahi karta. (Sirf add-on, kuch
# nahi hataya gaya.) HTTP ke liye sirf Python stdlib (urllib)
# use hota hai — koi nayi dependency nahi.
# ============================================================

GEMINI_IMAGE_API_KEY = os.getenv("GEMINI_IMAGE_API_KEY", "")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-3.1-flash-lite-image")


def _call_gemini_sync(prompt: str, image_aspect: str, user_image: str = "", product_image_url: str = "") -> dict:
    """Gemini REST call (blocking). asyncio.to_thread ke andar chalta hai.

    Agar `user_image` (base64 data-url) diya jaye to woh Gemini ko inline
    reference image ke tor par bheja jata hai — taake try-on jaisi image
    banai ja sake (user ki apni photo pe kapra dikhane ke liye).
    Agar `product_image_url` diya jaye to backend us URL se asli
    product ki tasveer download karke bhi inline reference deta hai —
    taake AI image me WOHI suit ban sake jo popup me dikh raha hai
    (naam/price se nahi, asli tasveer se). Text-only request pehle
    jaisa hi kaam karta hai."""
    import urllib.request as _urlreq
    import base64 as _b64

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_IMAGE_MODEL}:generateContent"
    )

    parts = []
    if user_image and "base64," in user_image:
        try:
            mime = user_image.split(";")[0].split(":")[1]
            data = user_image.split("base64,", 1)[1]
            parts.append({"inlineData": {"mimeType": mime, "data": data}})
        except Exception:
            pass

    if product_image_url:
        try:
            with _urlreq.urlopen(product_image_url, timeout=40) as presp:
                pdata = presp.read()
            pct = presp.headers.get("Content-Type", "") or "image/png"
            ptype = pct.split(";")[0].strip().lower()
            if not ptype.startswith("image/"):
                low = product_image_url.lower()
                if low.endswith(".png"):
                    ptype = "image/png"
                elif low.endswith(".webp"):
                    ptype = "image/webp"
                elif low.endswith(".jpg") or low.endswith(".jpeg"):
                    ptype = "image/jpeg"
                else:
                    ptype = "image/jpeg"
            pb64 = _b64.b64encode(pdata).decode("ascii")
            if pb64:
                parts.append(
                    {
                        "inlineData": {
                            "mimeType": ptype,
                            "data": pb64,
                        }
                    }
                )
        except Exception:
            # Product image download fail — text reference se hi kaam chalega
            pass

    parts.append({"text": prompt})

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    if image_aspect in ("16:9", "9:16", "4:3", "3:4", "1:1"):
        payload["generationConfig"]["imageConfig"] = {"aspectRatio": image_aspect}

    body = json.dumps(payload).encode("utf-8")
    req = _urlreq.Request(
        url,
        data=body,
        headers={
            "x-goog-api-key": GEMINI_IMAGE_API_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with _urlreq.urlopen(req, timeout=120) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    parts = (data.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    caption = next((p.get("text") for p in parts if p.get("text")), "")
    mime = next(
        (p.get("inlineData", {}).get("mimeType") for p in parts if p.get("inlineData", {}).get("mimeType")),
        "image/png",
    )
    b64 = next(
        (p.get("inlineData", {}).get("data") for p in parts if p.get("inlineData", {}).get("data")),
        None,
    )
    if not b64:
        return {
            "ok": False,
            "error": "Gemini ne image wapis nahi di (koi inlineData nahi millta).",
            "prompt": prompt,
        }
    return {
        "ok": True,
        "caption": caption,
        "data_url": f"data:{mime};base64,{b64}",
        "prompt": prompt,
    }


async def generate_image(prompt: str, image_aspect: str = "1:1", user_image: str = "", product_image_url: str = "") -> dict:
    """Gemini se tasveer banata hai aur base64 data-url return karta hai.

    FastAPI endpoint (/api/image/generate) isi ko call karta hai aur
    voice assistant ka client tool bhi isi endpoint se image leta hai.
    `user_image` (data-url) optional hai — jab user apni photo ke sath
    try-on image banwana chahe tab agent ke generate_image tool se
    aata hai. `product_image_url` optional hai — wohi suit/garment ki
    asli tasveer backend copy karke Gemini ko reference deta hai taake
    bani image me popup wala hi kapra dikhe.

    Returns dict:
      {ok: True, caption, data_url, prompt}   -> success
      {ok: False, error, prompt}              -> failure (never raises)
    """
    try:
        return await asyncio.to_thread(
            _call_gemini_sync, prompt, image_aspect, user_image, product_image_url
        )
    except Exception as exc:
        return {
            "ok": False,
            "error": f"Image generation failed: {type(exc).__name__}: {exc}",
            "prompt": prompt,
        }


PRODUCT_DATA = [

    {
        "id": 1,
        "image": "/images/r1.png",
        "name": "Embroidered Cotton Satin Shirt",
        "price": 4995,
    },
    {
        "id": 2,
        "image": "/images/r2.png",
        "name": "Embroidered Jacquard Shirt",
        "price": 2995,
        "oldPrice": 4490,
    },
    {
        "id": 3,
        "image": "/images/r3.png",
        "name": "Embroidered Zari Cotton Shirt",
        "price": 4495,
        "oldPrice": 4490,
    },
    {
        "id": 4,
        "image": "/images/r4.png",
        "name": "Embroidered Jacquard Shirt",
        "price": 4495,
        "oldPrice": 4490,
    },

    {
        "id": 5,
        "name": "Denim Top With Kimono Sleeves",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwa719adf5/images/June26/29thJune26/WTOP26V60002_999_1.jpg?sw=1000&sh=1200",
        "price": 3143,
        "oldPrice": 4490
    },
    {
        "id": 6,
        "name": "Embroidered Blouse",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwad67ed7f/images/April26/6thApril26/WTOP26V30033_999_2.JPG?sw=1000&sh=1200",
        "price": 3294,
        "oldPrice": 5490
    },
    {
        "id": 7,
        "name": "Cotton Muslin Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw0b01f35b/images/April26/6thApril26/WTOP26V30006_999_2.JPG?sw=1000&sh=1200",
        "price": 2495,
        "oldPrice": 4990
    },
    {
        "id": 8,
        "name": "Slash Neck Top",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw87fd3f59/images/feb26/11thFeb26/WTOP26V20014_999_2.JPG?sw=1000&sh=1200",
        "price": 2495,
        "oldPrice": 4990
    },
    {
        "id": 9,
        "name": "V-Neck Denim Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwce3b42d7/images/June26/10thJune26/WTOP26V60026_999_2.jpg?sw=1000&sh=1200",
        "price": 3143,
        "oldPrice": 4490
    },
    {
        "id": 10,
        "name": "Textured V-Neck Top",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwba7ea1a4/images/June26/10thJune26/WTOP26V20018_999_2.jpg?sw=1000&sh=1200",
        "price": 3594,
        "oldPrice": 5990
    },
    {
        "id": 11,
        "name": "Printed Blouse",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw46cf6936/images/May26/7thMay26/WTOP26V40054_999_2.JPG?sw=1000&sh=1200",
        "price": 3143,
        "oldPrice": 4490
    },
    {
        "id": 12,
        "name": "Button Through Oxford Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw1332ab71/images/June26/10thJune26/WTOP26V60027_999_2.jpg?sw=1000&sh=1200",
        "price": 3294,
        "oldPrice": 5490
    },
    {
        "id": 13,
        "name": "Softlux Slash Neck T-Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw6a0a6265/images/May26/7thMay26/WTOP26V40008_999_2.JPG?sw=1000&sh=1200",
        "price": 2793,
        "oldPrice": 3990
    },
    {
        "id": 14,
        "name": "Softlux Kimono T-Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwb317005c/images/May26/7thMay26/WTOP26V40004_999_2.JPG?sw=1000&sh=1200",
        "price": 3493,
        "oldPrice": 4990
    },
    {
        "id": 15,
        "name": "Denim Top With Kimono Sleeves",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwd5f7523e/images/June26/10thJune26/WTOP26V60003_999_2.jpg?sw=1000&sh=1200",
        "price": 3143,
        "oldPrice": 4490
    },
    {
        "id": 16,
        "name": "Textured V-Neck Top",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwbb7a13a3/images/June26/10thJune26/WTOP26V20017_999_2.jpg?sw=1000&sh=1200",
        "price": 3594,
        "oldPrice": 5990
    },
    {
        "id": 17,
        "name": "Cotton Muslin Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw1b88b2f0/images/April26/6thApril26/WTOP26V30027_999_2.JPG?sw=1000&sh=1200",
        "price": 2495,
        "oldPrice": 4990
    },
    {
        "id": 18,
        "name": "Button Through Oxford Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwcbefe37f/images/June26/10thJune26/WTOP26V60014_999_2.jpg?sw=1000&sh=1200",
        "price": 3294,
        "oldPrice": 5490
    },
    {
        "id": 19,
        "name": "Printed Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dw4821830d/images/May26/7thMay26/WTOP26V50020_999_2.JPG?sw=1000&sh=1200",
        "price": 3493,
        "oldPrice": 4990
    },
    {
        "id": 20,
        "name": "Button Through Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwd9a8fe15/images/June26/10thJune26/WTOP26V50026_999_2.jpg?sw=1000&sh=1200",
        "price": 3493,
        "oldPrice": 4990
    },
    {
        "id": 21,
        "name": "Button Shirt",
        "image": "https://pk.sapphireonline.pk/dw/image/v2/BKSB_PRD/on/demandware.static/-/Sites-sapphire-master-catalog/default/dwf28451cb/images/June26/10thJune26/WTOP26V60013_999_2.jpg?sw=1000&sh=1200",
        "price": 3493,
        "oldPrice": 4990
    },
    {
        "id": 22,
        "name": "sea green embroidered liminal stitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-779_2.jpg?v=1786959329&width=1426",
        "price": 10990,
        "oldPrice": 11000
    },

    {
        "id": 23,
        "name": "teal embroidered cambric unstitched 2pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2487_1.jpg?v=1786355646&width=2000",
        "price": 4990,
        "oldPrice": 5550
    },
    {
        "id": 24,
        "name": "red embroidered cambric unstitched 2pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2486_1.jpg?v=1786355638&width=1426",
        "price": 4900,
        "oldPrice": 5580
    },
    {
        "id": 25,
        "name": "blue embroidered cambric unstitched 2pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2485_1.jpg?v=1786355633&width=2000",
        "price": 4500,
        "oldPrice": 5580
    },
    {
        "id": 26,
        "name": "off white embroidered cambric unstitched 2pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2484_1.jpg?v=1786355626&width=2000",
        "price": 4300,
        "oldPrice": 5000
    },
    {
        "id": 27,
        "name": "black embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4617_3.jpg?v=1786353696&width=2000",
        "price": 4200,
        "oldPrice": 8000
    },
    {
        "id": 28,
        "name": "brown embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4616_1.jpg?v=1786353693&width=1426",
        "price": 4800,
        "oldPrice": 8000
    },
    {
        "id": 29,
        "name": "Beigi embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4615_1.jpg?v=1786353674&width=1426",
        "price": 4800,
        "oldPrice": 8000
    },
    {
        "id": 30,
        "name": "White embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4614_2.jpg?v=1786353593&width=2000",
        "price": 4200,
        "oldPrice": 8500
    },
    {
        "id": 31,
        "name": "Blue embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4613_4.jpg?v=1786354189&width=1426",
        "price": 4300,
        "oldPrice": 8500
    },
    {
        "id": 32,
        "name": " Purple embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4612_2.jpg?v=1786354184&width=1426",
        "price": 4300,
        "oldPrice": 8500
    },
    {
        "id": 33,
        "name": " Purple embroidered dobby unstitched 3pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4612_2.jpg?v=1786354184&width=1426",
        "price": 4300,
        "oldPrice": 8500
    },
    {
        "id": 34,
        "name": "Orange Cambric Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2462_4.jpg?v=1786950083&width=1426",
        "price": 9990,
        "oldPrice": 9990
    },
    {
        "id": 35,
        "name": "Blue Cambric Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-788_1.jpg?v=1787125631&width=2000",
        "price": 8990,
        "oldPrice": 8990
    },
    {
        "id": 36,
        "name": "Aqua Blue Cambric Digital Printed Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-787_1_b6a5f6b9-dfdb-44ca-8ee9-20ed67a6e824.jpg?v=1787125603&width=2000",
        "price": 7990,
        "oldPrice": 7990
    },
    {
        "id": 37,
        "name": "Green Cambric Digital Printed Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-786_1.jpg?v=1787125579&width=1426",
        "price": 7990,
        "oldPrice": 7990
    },
    {
        "id": 38,
        "name": "Pink Cambric Digital Printed Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-785_1.jpg?v=1787125547&width=1426",
        "price": 7990,
        "oldPrice": 7990
    },
    {
        "id": 39,
        "name": "Light Green Cambric Digital Printed Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-784_1.jpg?v=1786959393&width=1426",
        "price": 7990,
        "oldPrice": 7990
    },
    {
        "id": 40,
        "name": "Black Lawn Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-781_1.jpg?v=1786959355&width=2000",
        "price": 12990,
        "oldPrice": 12990
    },
    {
        "id": 41,
        "name": "Pink Lawn Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-780_1.jpg?v=1786959337&width=2000",
        "price": 14990,
        "oldPrice": 14990
    },
    {
        "id": 42,
        "name": "Green Lawn Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-763_1.jpg?v=1787125384&width=2000",
        "price": 12990,
        "oldPrice": 12990
    },
    {
        "id": 43,
        "name": "Blue Lawn Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-672_1.jpg?v=1786958872&width=2000",
        "price": 12990,
        "oldPrice": 12990
    },
    {
        "id": 44,
        "name": "Maroon Dobby Printed Stitched 2Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-671_1.jpg?v=1786958803&width=2000",
        "price": 7490,
        "oldPrice": 7490
    },
    {
        "id": 45,
        "name": "PINK LAWN EMBROIDERED KURTA",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-761_1_50f1eca0-51eb-465d-aba5-c81ca9ace034.jpg?v=1787125292&width=1426",
        "price": 4490,
        "oldPrice": 4490
    },
    {
        "id": 46,
        "name": "Blue Lawn Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2464_1.jpg?v=1786949997&width=2000",
        "price": 9990,
        "oldPrice": 9990
    },
    {
        "id": 47,
        "name": "Blue Lawn Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-764_1.jpg?v=1787125462&width=1426",
        "price": 6990,
        "oldPrice": 6990
    },
    {
        "id": 48,
        "name": "Brown Dobby Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2467_3.jpg?v=1786950024&width=1426",
        "price": 9990,
        "oldPrice": 9990
    },
    {
        "id": 49,
        "name": "White Dobby Embroidered Stitched 3Pc",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-712_1.jpg?v=1787125742&width=1426",
        "price": 9990,
        "oldPrice": 9990
    },
    {
        "id": 50,
        "name": "Sans Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2466_3_-Copy.jpg?v=1786967789&width=2000",
        "price": 6990,
        "oldPrice": 6990
    },
    {
        "id": 51,
        "name": "Multicolor Lawn Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JDS-26-1172_5.jpg?v=1786949909&width=1426",
        "price": 6990,
        "oldPrice": 6990
    },
    {
        "id": 52,
        "name": "Multi Lawn Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2461_5.jpg?v=1786950077&width=2000",
        "price": 6990,
        "oldPrice": 6990
    },
    {
        "id": 53,
        "name": "Black Lawn Embroidered Co-Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-26-2460_2.jpg?v=1786950069&width=1426",
        "price": 7490,
        "oldPrice": 7490
    },
    {
        "id": 54,
        "name": "Red Lawn Embroidered Co-Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-4083_1.jpg?v=1786959999&width=1426",
        "price": 7990,
        "oldPrice": 7990
    },
    {
        "id": 55,
        "name": "Blue Jacquard Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-4077_1.jpg?v=1786959956&width=2000",
        "price": 7490,
        "oldPrice": 7490
    },
    {
        "id": 56,
        "name": "Pink Jacquard Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-747_1.jpg?v=1786958617&width=1426",
        "price": 7490,
        "oldPrice": 7490
    },
    {
        "id": 57,
        "name": "Maroon Jacquard Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPS-26-4050_3_a1de3639-b140-4614-a5a4-13193f2fb64a.jpg?v=1786949925&width=1426",
        "price": 7490,
        "oldPrice": 7490
    },
    {
        "id": 58,
        "name": "Black Jacquard Embroidered Co Ord Set",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JST-S-26-2435_1.jpg",
        "price": 7490,
        "oldPrice": 7490
    },

    {
        "id": 59,
        "name": "Green Unstitched 3Pc",
        "price": 4990,
        "oldPrice": 9000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1474_1_c79cf695-5edf-4b49-974a-6d194768e098.jpg?v=1787310656&width=2000",
        "style": "JPLU-99-1198 ALARI"
    },
    {
        "id": 60,
        "name": "Beige Unstitched 3Pc",
        "price": 4080,
        "oldPrice": 6000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1357_1.jpg?v=1786973341&width=1426",
        "style": "JPLU-99-1193 MILKY SHEER"
    },
    {
        "id": 61,
        "name": "Yellow Unstitched 3Pc",
        "price": 7000,
        "oldPrice": 8000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1238_1.jpg?v=1786975464&width=2000",
        "style": "JPLU-99-1192 MEWAR"
    },
    {
        "id": 62,
        "name": "Multicolor Unstitched 3Pc",
        "price": 3400,
        "oldPrice": 4000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1238_1.jpg?v=1786975464&width=2000",
        "style": "JPLU-99-1189 ETHNIC PAISLEY"
    },
    {
        "id": 63,
        "name": "Yellow Unstitched 3Pc",
        "price": 3500,
        "oldPrice": 5000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1198_3.jpg?v=1786975377&width=940",
        "style": "JPLU-99-1215 ETHNIC ART"
    },
    {
        "id": 64,
        "name": "Beige Unstitched 3Pc",
        "price": 3000,
        "oldPrice": 4000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1193_1.jpg?v=1786975335&width=1426",
        "style": "JPLU-99-1122 SIMT"
    },
    {
        "id": 65,
        "name": "Brown Unstitched 3Pc",
        "price": 2000,
        "oldPrice": 3000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1192_1.jpg?v=1786974339&width=1426",
        "style": "JPLU-99-1093 MADDER-1-22"
    },
    {
        "id": 66,
        "name": "Black Unstitched 3Pc",
        "price": 1500,
        "oldPrice": 2000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1189_2.jpg?v=1786974295&width=360",
        "style": "JPLU-99-1088 NOIR."
    },
    {
        "id": 67,
        "name": "Brown Unstitched 3Pc",
        "price": 1000,
        "oldPrice": 2000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1215_2.jpg?v=1786975423&width=360",
        "style": "JPLU-99-1071 RANGOLI"
    },
    {
        "id": 68,
        "name": "Black Unstitched 3Pc",
        "price": 3500,
        "oldPrice": 4500,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1093_1.jpg?v=1786974179&width=1426",
        "style": "JPLU-99-1047 ROGAN 2"
    },
    {
        "id": 69,
        "name": "Green Unstitched 3Pc",
        "price": 4200,
        "oldPrice": 5200,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1088_1.jpg?v=1786974142&width=1426",
        "style": "JPLU-99-1044 GLIMMER"
    },
    {
        "id": 70,
        "name": "Black Unstitched 3Pc",
        "price": 4080,
        "oldPrice": 5200,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1071_1.jpg?v=1786973281&width=1426",
        "style": "JPLU-99-1041 FUSION"
    },
    {
        "id": 71,
        "name": "Multicolor Unstitched 3Pc",
        "price": 5300,
        "oldPrice": 6000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1047_1.jpg?v=1786973206&width=2000",
        "style": "JPLU-99-1559"
    },
    {
        "id": 72,
        "name": "Multicolor Unstitched 3Pc",
        "price": 1200,
        "oldPrice": 1600,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1041_1.jpg?v=1786973099&width=1426",
        "style": "JPLU-99-1512"
    },
    {
        "id": 73,
        "name": "Multicolor Unstitched 3Pc",
        "price": 3450,
        "oldPrice": 3500,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1559_4.jpg?v=1786973672&width=1426",
        "style": "JPLU-99-1506"
    },
    {
        "id": 74,
        "name": "Multicolor Unstitched 3Pc",
        "price": 6000,
        "oldPrice": 6500,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1512_1.jpg?v=1786973605&width=1426",
        "style": "JPLU-99-1499"
    },
    {
        "id": 75,
        "name": "Multicolor Unstitched 3Pc",
        "price": 6300,
        "oldPrice": 7000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1506_1.jpg?v=1786973561&width=1426",
        "style": "JPLU-99-1478"
    },
    {
        "id": 76,
        "name": "Multicolor Unstitched 3Pc",
        "price": 6400,
        "oldPrice": 7000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1499_1.jpg?v=1786973518&width=1426",
        "style": "JPLU-99-1324"
    },
    {
        "id": 77,
        "name": "Beige Unstitched 3Pc",
        "price": 4800,
        "oldPrice": 9000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1478_1.jpg?v=1786973474&width=1426",
        "style": "JPLU-99-1040 DREAM"
    },
    {
        "id": 78,
        "name": "Teal Embroidered Cambric Unstitched 2Pc",
        "price": 7000,
        "oldPrice": 7400,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1324_1.jpg?v=1786975533&width=1426",
        "style": "JST-S-26-2487 RAQS-4"
    },
    {
        "id": 79,
        "name": "Red Embroidered Cambric Unstitched 2Pc",
        "price": 4990,
        "oldPrice": 5000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPLU-99-1040_2.jpg?v=1786973046&width=940",
        "style": "JST-S-26-2486 RAQS-3"
    },
    {
        "id": 80,
        "name": "Blue Embroidered Cambric Unstitched 2Pc",
        "price": 10000,
        "oldPrice": 11000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2487_1.jpg?v=1786355646&width=1426",
        "style": "JST-S-26-2485 RAQS-2"
    },
    {
        "id": 81,
        "name": "Off White Embroidered Cambric Unstitched 2Pc",
        "price": 3000,
        "oldPrice": 3500,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2486_1.jpg?v=1786355638&width=1426",
        "style": "JST-S-26-2484 RAQS-1"
    },
    {
        "id": 82,
        "name": "Black Embroidered Dobby Unstitched 3Pc",
        "price": 6990,
        "oldPrice": 7000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2485_1.jpg?v=1786355633&width=2000",
        "style": "JLU-S-26-4617 THREADED BLOOM-4"
    },
    {
        "id": 83,
        "name": "Brown Embroidered Dobby Unstitched 3Pc",
        "price": 5500,
        "oldPrice": 5600,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2484_1.jpg?v=1786355626&width=1426",
        "style": "JLU-S-26-4616 THREADED BLOOM-3"
    },
    {
        "id": 84,
        "name": "Beige Embroidered Dobby Unstitched 3Pc",
        "price": 8700,
        "oldPrice": 9000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4617_3.jpg?v=1786353696&width=1426",
        "style": "JLU-S-26-4615 THREADED BLOOM-2"
    },
    {
        "id": 85,
        "name": "White Embroidered Dobby Unstitched 3Pc",
        "price": 8900,
        "oldPrice": 9200,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4616_1.jpg?v=1786353693&width=1426",
        "style": "JLU-S-26-4614 THREADED BLOOM-1"
    },
    {
        "id": 86,
        "name": "Pink Embroidered Dobby Unstitched 3Pc",
        "price": 9000,
        "oldPrice": 9800,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4615_1.jpg?v=1786353674&width=1426",
        "style": "JLU-S-26-4613 THREADED BLOOM"
    },
    {
        "id": 87,
        "name": "Green Embroidered Dobby Unstitched 3Pc",
        "price": 1800,
        "oldPrice": 2000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-2485_1.jpg?v=1786355633&width=2000",
        "style": "JLU-S-26-4612 THREADED BLOOM"
    },
    {
        "id": 88,
        "name": "Blue Embroidered Dobby Unstitched 3Pc",
        "price": 2800,
        "oldPrice": 3000,
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JLU-26-4322_5.jpg?v=1786354093&width=1426",
        "style": "JLU-S-26-4611 THREADED BLOOM"
    },

    {
        "id": 89,
        "name": "PINK ORGANZA EMBROIDERED FORMAL STITCHED 3PC",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/JPS-26-4088_3.jpg?v=1777316663&width=880",
        "price": 27990,
        "oldPrice": 28000,
        "productId": "JPS264088S"
    },
    {
        "id": 90,
        "name": "BEIGE RAW SILK EMBROIDERED FORMAL CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4045_2_1f5fd380-4b51-4783-a967-27ffde179aeb.jpg?v=1777087474&width=823",
        "price": 12990,
        "oldPrice": 13000,
        "productId": "JPS264045S"
    },
    {
        "id": 91,
        "name": "LILAC RAW SILK EMBROIDERED CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-3996_1__8_401ebf87-a8d5-43d7-81f2-4df43907b68b.jpg?v=1776974846&width=880",
        "price": 12950,
        "oldPrice": 14000,
        "productId": "JPS263996S"
    },
    {
        "id": 92,
        "name": "LILAC RAW SILK EMBROIDERED STITCHED 3PC",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4015_4_90789b3d-73c4-4f99-810f-3c9c74db5c65.jpg?v=1776974845&width=880",
        "price": 19990,
        "oldPrice": 20000,
        "productId": "JPS264015S"
    },
    {
        "id": 93,
        "name": "BLACK RAW SILK EMBROIDERED CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4043s_1_4e28699c-9f4f-44a3-85b8-d00c88a57b52.jpg?v=1776974854&width=880",
        "price": 12990,
        "oldPrice": 15000,
        "productId": "JPS264043S"
    },
    {
        "id": 94,
        "name": "BLUE IMPURE CHIFFON EMBROIDERED STITCHED 3PC",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4005s_1_fb876ec2-10d6-4636-980b-50f62ce025a0.jpg?v=1776974845&width=823",
        "price": 16990,
        "oldPrice": 18000,
        "productId": "JPS264005S"
    },
    {
        "id": 95,
        "name": "MUSTARD MAPLE SILK EMBROIDERED CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4014s_1_4ed69f23-a490-4765-95df-68040a3f1af3.jpg?v=1776974845&width=823",
        "price": 12990,
        "oldPrice": 14000,
        "productId": "JPS263998S"
    },
    {
        "id": 96,
        "name": "BEIGE PAPER COTTON EMBROIDERED CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4022s_1_c8d0a850-8ad9-4122-b27f-08faed97beb0.jpg?v=1776974845&width=823",
        "price": 12900,
        "oldPrice": 13000,
        "productId": "JPS264044S"
    },
    {
        "id": 97,
        "name": "WHITE RAW SILK EMBROIDERED STITCHED 3PC",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-3997s_1_f3e85ef5-287b-421c-85ef-a823d0257033.jpg?v=1776974804&width=823",
        "price": 19990,
        "oldPrice": 20000,
        "productId": "JPS264014S"
    },
    {
        "id": 98,
        "name": "MAROON PAPER COTTON EMBROIDERED STITCHED 3PC",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4047s_1_193dcedf-37f9-4ea5-8024-1d55170c281d.jpg?v=1776974723&width=823",
        "price": 14990,
        "oldPrice": 15000,
        "productId": "JPS264022S"
    },
    {
        "id": 99,
        "name": "PINK RAW SILK EMBROIDERED CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/jps-26-4048s_1_06d07da9-3b53-44fb-9f40-cf230e6d2ff5.jpg?v=1776975321&width=880",
        "price": 11990,
        "oldPrice": 12000,
        "productId": "JPS263997S"
    },
    {
        "id": 100,
        "name": "PINK COTTON NET EMBROIDERED FORMAL CO-ORD SET",
        "image": "https://www.junaidjamshed.com/cdn/shop/files/26-4002s_1_36b47fc8-96df-4fbd-8ba3-f40d89efb2a4.jpg?v=1777087467&width=823",
        "price": 11990,
        "oldPrice": 13000,
        "productId": "JPS264047S"
    }
]

# ============================================================
# SYNONYM / ROMAN-URDU NORMALIZATION MAPS
# (yehi wo hissa hai jo "har tarhan ke words match" karwata hai —
#  user Roman Urdu, Urdu-mix, ya English kuch bhi likhe, isay
#  catalog ke actual English words mein normalize kar dete hain)
# ============================================================

WORD_SYNONYMS = {
    # quantity / piece words
    "3 pieces": "3pc", "3 piece": "3pc", "3pcs": "3pc", "teen pc": "3pc",
    "teen piece": "3pc", "3 pc": "3pc",
    "2 pieces": "2pc", "2 piece": "2pc", "2pcs": "2pc", "do pc": "2pc",
    "do piece": "2pc", "2 pc": "2pc",
    "suites": "suit", "suits": "suit", "suite": "suit",
    "dresses": "suit", "dress": "suit", "libas": "suit",
    "pcs": "pc", "pieces": "pc", "piece": "pc",
    "kapre": "suit", "kapray": "suit", "kapra": "suit", "kapron": "suit",

    # colors (roman urdu -> english used in catalog)
    "kala": "black", "kaala": "black", "kali": "black", "kaali": "black",
    "safed": "white", "safaid": "white", "sufaid": "white",
    "neela": "blue", "nila": "blue", "neel": "blue",
    "sabz": "green", "hara": "green", "haraa": "green", "hare": "green",
    "laal": "red", "lal": "red", "surkh": "red",
    "gulabi": "pink", "pink wala": "pink",
    "peela": "yellow", "zard": "yellow",
    "bhoora": "brown", "bhora": "brown",
    "jamni": "purple", "banafshi": "purple",
    "maroon wala": "maroon",
    "beige wala": "beige", "gehri beige": "beige",
    "multi rang": "multicolor", "rangeen": "multicolor", "rang birangi": "multicolor",
    "teal wala": "teal", "aqua wala": "aqua",

    # material / fabric
    "kapra cotton": "cotton", "resham": "silk", "reshmi": "silk",
    "jali": "net", "jaali": "net",
    "chiffon wala": "chiffon", "lawn wala": "lawn",
    "cambric wala": "cambric", "silk wala": "silk",

    # stitched / unstitched
    "silai wala": "stitched", "silai": "stitched", "stitch wala": "stitched",
    "bina silai": "unstitched", "kacha": "unstitched",

    # generic category words
    "kameez": "shirt", "qameez": "shirt", "shirt wala": "shirt",
    "top wala": "top", "blouse wala": "blouse",
    "embroidered wala": "embroidered", "kadhai": "embroidered",
    "kadai wala": "embroidered", "printed wala": "printed",
    "chapa hua": "printed",
}

# ignored / filler words that should never affect matching
IGNORED_WORDS = {
    "give", "me", "show", "find", "want", "need", "get", "some", "any",
    "please", "for", "the", "and", "with", "under", "below", "less",
    "than", "around", "range", "price", "prices", "in", "of", "a", "an",
    "is", "are", "do", "you", "have", "can", "i", "my", "your",
    "mujha", "mujhe", "mujhy", "de", "do", "dedo", "dikhao", "dikha",
    "chahiye", "chahiy", "chahye", "chaiye", "kuch", "bhi", "koi",
    "sa", "se", "ka", "ke", "ki", "ko", "mein", "mn", "main", "wala",
    "wale", "wali", "walay", "walon", "ander", "andar", "under",
    "paison", "paisay", "paise", "rs", "rupees", "rupay", "pkr",
    "hai", "hain", "ho", "hoga", "hogi", "tak", "kam", "zayada",
    "zyada", "anything", "something", "products", "product", "item",
    "items", "please.", "plz", "pls",
}


def _normalize_text(text: str) -> str:
    """Lowercase + apply roman-urdu/english synonym normalization."""
    text = (text or "").lower().strip()
    text = text.replace("-", " ")

    # Apply longer phrases first so multi-word synonyms aren't broken
    # by shorter ones being replaced first.
    for old, new in sorted(WORD_SYNONYMS.items(), key=lambda kv: len(kv[0]), reverse=True):
        text = text.replace(old, new)

    return text


def _tokenize(text: str) -> list:
    return [
        w.strip()
        for w in text.split()
        if len(w.strip()) > 1
        and w.strip() not in IGNORED_WORDS
        and not w.strip().isdigit()
    ]


# ============================================================
# BI-DIRECTIONAL SYNONYM GROUPS
# ------------------------------------------------------------
# Ye groups batate hain ke catalog ke kis kis word ko ek hi
# "family" mana jaye. Jab user "suit" keh raha ho to hame isay
# catalog ke "set" / "co ord" / "pc" / "kurta" se bhi match karna
# chahiye — warna user ke aam lafz (suits, dress, co-ord, 2pc)
# kabhi data mein nahi milte. Har group ke andar har word doosre
# har word ka synonym hai (dono taraf).
# NOTE: inkay units ko _normalize_text se pehle apply kiya jata hai
# taake "co ord" -> "co-ord" jaisi aam spelling bhi normalize ho jaye.
# ============================================================
_SYNONYM_GROUPS = [
    # clothing categories — user ke aam words = catalog words
    {"suit", "suits", "dress", "dresses", "set", "sets", "co-ord", "co ord", "coord", "outfit", "outfits", "wear", "libas", "kapre", "kapray", "pc", "kurta", "kurti"},
    # piece counts
    {"1pc", "1 pc", "single piece", "single"},
    {"2pc", "2 pc", "two piece", "do pc", "do piece"},
    {"3pc", "3 pc", "three piece", "teen pc", "teen piece"},
    # stitched / unstitched
    {"stitched", "silai", "silai wala", "made", "ready", "ready-made"},
    {"unstitched", "bina silai", "kacha", "raw"},
    # generic tops
    {"shirt", "kameez", "qameez", "top", "blouse", "t-shirt", "tshirt"},
    # fabric
    {"cotton", "cotton wala", "kapra cotton"},
    {"silk", "resham", "reshmi", "silk wala"},
    {"lawn", "lawn wala"},
    {"cambric", "cambric wala"},
    {"chiffon", "chiffon wala"},
    {"net", "jali", "jaali", "net wala"},
    {"dobby", "dobby wala"},
    {"jacquard", "jacquard wala"},
    # embroidered / printed
    {"embroidered", "kadhai", "kadai", "embroidery", "embroidered wala", "kadai wala", "kadha"},
    {"printed", "printed wala", "print", "chapa hua"},
]

_build_group_map = {}


def _rebuild_synonym_map():
    """Har word ko uske pooray group se map karta hai (bi-directional)."""
    for group in _SYNONYM_GROUPS:
        for word in group:
            _build_group_map.setdefault(word, set())
            _build_group_map[word].update(group)


_rebuild_synonym_map()

# Catalog words/phrases ko Unicode-phonetic-safe chhota karke
# rakne ke liye (color words bhi yahin normalize hote hain).
_COLOR_MAP = {
    "kala": "black", "kaala": "black", "kali": "black", "kaali": "black",
    "black": "black", "safed": "white", "safaid": "white", "sufaid": "white",
    "white": "white", "neela": "blue", "nila": "blue", "neel": "blue",
    "blue": "blue", "sabz": "green", "hara": "green", "haraa": "green",
    "hare": "green", "green": "green", "laal": "red", "lal": "red",
    "surkh": "red", "red": "red", "gulabi": "pink", "pink": "pink",
    "peela": "yellow", "zard": "yellow", "yellow": "yellow",
    "bhoora": "brown", "bhora": "brown", "brown": "brown",
    "jamni": "purple", "banafshi": "purple", "purple": "purple",
    "maroon": "maroon", "beige": "beige", "teal": "teal", "aqua": "aqua",
    "multicolor": "multicolor", "multi": "multicolor",
    "navy": "navy", "grey": "grey", "gray": "grey", "gold": "gold",
    "silver": "silver", "mustard": "mustard", "cream": "cream",
    "orange": "orange", "peach": "peach", "dusty": "dusty", "rust": "rust",
}


def _expand_words(words: list) -> set:
    """Har word ko expand karta hai: uske synonym group + color alternatives
    sab mile to ek set ban jata hai jis se catalog match karwano."""
    expanded = set()
    for w in words:
        w_clean = w.strip().lower()
        if not w_clean:
            continue
        # Synonym groups (suit/dress/set, 2pc/2 pc/do pc, stitched/silai ...)
        grp = _build_group_map.get(w_clean, set())
        if grp:
            expanded.update(grp)
        else:
            expanded.add(w_clean)
        # Color aliases (kala->black, kali->black, neela->blue ...)
        c = _COLOR_MAP.get(w_clean)
        if c:
            expanded.add(c)
    return expanded


# ============================================================
# PRICE PARSER (Roman Urdu + English)
# ------------------------------------------------------------
# User ke lafz se price nikalta hai taake ye bi filter ho.
#   - "2000 ke ander / under 2000 / 2000 tak / se kam"  -> max
#   - "8000 se zayada / se upar / above 8000"           -> min
#   - "5000 se 8000 / 5000 to 8000"                     -> range
#   - sirf "2000 ka" (budget sanskeleton)               -> max (up to)
# ============================================================
_PRICE_UPPER_WORDS = (
    "under", "below", "less", "kam", "tak", "ander", "andar",
    "zayda nahi", "zyada nahi", "se kam", "se kum", "budget",
    "bajet", "maff kardo", "under", "chota", "within", "andar price",
)
_PRICE_LOWER_WORDS = (
    "zayada", "zyada", "zaida", "upper", "upar", "above",
    "more than", "se zyada", "se zayada", "se upper", "se upar", "minimum",
)


def _parse_price_range(text: str):
    """Return (min_price, max_price) parsed from free text, or (None, None)."""
    t = (text or "").lower()

    # 1) Explicit ranges: "5000 se 8000", "5000 to 8000", "5000-8000"
    range_match = re.search(r"(\d{2,7})\s*(?:se|to|tak|lekar|the|and|&|-)\s*(\d{2,7})", t)
    if range_match:
        a, b = int(range_match.group(1)), int(range_match.group(2))
        return (min(a, b), max(a, b))

    amounts = [(int(m.group(0)), m) for m in re.finditer(r"\d{2,7}", t)]
    if not amounts:
        return (None, None)

    min_price, max_price = None, None
    for value, m in amounts:
        start = max(0, m.start() - 40)
        end = min(len(t), m.end() + 40)
        seg = t[start:end]
        if any(w in seg for w in _PRICE_LOWER_WORDS):
            min_price = value
        elif any(w in seg for w in _PRICE_UPPER_WORDS):
            max_price = value

    # sirf ek number, koi word nahi -> budget (up-to)
    if min_price is None and max_price is None:
        max_price = max(value for value, _ in amounts)

    return (min_price, max_price)


# ============================================================
# GREETING DETECTION
# ------------------------------------------------------------
# Agar user sirf greeting/hello kare to "could not find" ke bajaye
# friendly assistant message + kuch popular products dikhao.
# ============================================================
_GREETING_WORDS = {
    "hello", "hi", "hey", "hiee", "hii", "hiya", "yo",
    "salam", "slm", "sallam", "salamalikum", "assalam",
    "assalamualaikum", "assalamoalaikum", "salamualaikum",
    "good", "morning", "afternoon", "evening", "goodmorning",
    "goodafternoon", "goodevening", "kia", "kya", "hal", "haal",
    "kaise", "kese", "kaisa", "kaisi", "hola", "namaste", "welcome",
    "thanks", "thank", "shukria", "shukriya", "bro", "bhai", "sir", "ji",
}

_GREETING_PHRASES = (
    "kia hal", "kya hal", "kaise ho", "kese ho", "kaise hai",
    "kese hai", "assalamualaikum", "assalamoalaikum", "good morning",
    "good evening", "good afternoon", "salam walekum", "salamalikum",
)

_PRICE_INTENT_WORDS = (
    "price", "prices", "rate", "rates", "cost", "kitna", "kitnay",
    "kitne", "mehnga", "sasta", "discount", "sale",
)


def _is_only_greeting(text: str) -> bool:
    """True agar text mein sirf greeting/filler ho (koi product intent nahi)."""
    low = (text or "").lower()
    norm = _normalize_text(low)

    matches_any_greeting = any(g in low for g in _GREETING_PHRASES) or \
        any(w in _GREETING_WORDS for w in _tokenize(norm))

    if any(w in low for w in _PRICE_INTENT_WORDS):
        return False

    for phrase in _GREETING_PHRASES:
        norm = norm.replace(phrase, " ")

    tokens = _tokenize(norm)
    meaningful = [
        w for w in tokens
        if w not in _GREETING_WORDS
        and not w.isdigit()
    ]
    return bool(matches_any_greeting) and len(meaningful) == 0


async def _list_impl(
    query: str = "",
    min_price: int | None = None,
    max_price: int | None = None,
    category: str = "",
    color: str = "",
    material: str = "",
    limit: int = 8,
    skip: int = 0,
):
    """
    Fast product search tool.

    The complete product catalog is stored locally (in-memory), so this
    call is O(n) over ~100 items and returns almost instantly. It filters
    and RANKS the catalog BEFORE returning products, and understands
    Roman Urdu / Urdu-English mixed phrasing (e.g. "kala 3pc suit 5000 ke
    ander"), so the AI does not need to process or guess anything itself —
    just pass along whatever the user said.

    LIMIT GUIDANCE FOR THE CALLER (the agent):
      - For a normal/quick request, pass a small limit (e.g. limit=4) so
        the reply stays fast and short.
      - If the user explicitly asks for the FULL / COMPLETE / ALL matching
        list (e.g. "sab dikhao", "pura list do", "complete list", "all
        products", "poori list", "har ek dikhao"), pass limit=100 so every
        matching product (up to the full catalog) is returned — do not
        keep it capped at 4 in that case.

    Every returned product dict includes its real "image" URL exactly as
    stored in the catalog — this must always be passed through to the
    user as-is (never replaced with placeholder text).
    """

    # ============================================================
    # SAFE LIMIT
    # (raised to 100 so "sab/complete/all" requests can return the
    #  entire matching catalog, not just a handful of items)
    # ============================================================
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 8
    limit = max(1, min(limit, 100))
    try:
        skip = int(skip)
    except (TypeError, ValueError):
        skip = 0
    skip = max(0, skip)

    # ============================================================
    # NORMALIZE ALL INPUTS (query, category, color, material)
    # ============================================================
    norm_query = _normalize_text(query)
    norm_category = _normalize_text(category)
    norm_color = _normalize_text(color)
    norm_material = _normalize_text(material)

    search_words = _tokenize(norm_query)
    category_words = _tokenize(norm_category)
    color_words = _tokenize(norm_color)
    material_words = _tokenize(norm_material)

    scored_results = []

    # ============================================================
    # FILTER + SCORE CATALOG LOCALLY
    # ============================================================
    for product in PRODUCT_DATA:

        name = str(product.get("name", "")).lower()
        style = str(product.get("style", "")).lower()
        searchable_text = f"{name} {style}"

        # --------------------------------------------------------
        # PRICE FILTER (hard filter — must satisfy if given)
        # --------------------------------------------------------
        price = product.get("price")
        if price is None:
            continue
        try:
            price = int(price)
        except (TypeError, ValueError):
            continue

        if min_price is not None and price < min_price:
            continue
        if max_price is not None and price > max_price:
            continue

        score = 0
        hard_filters_present = bool(category_words or color_words or material_words)
        hard_filters_matched = True

        # --------------------------------------------------------
        # CATEGORY FILTER (partial/substring match, scored)
        # --------------------------------------------------------
        if category_words:
            matched = any(w in searchable_text for w in category_words)
            if not matched:
                hard_filters_matched = False
            else:
                score += sum(2 for w in category_words if w in searchable_text)

        # --------------------------------------------------------
        # COLOR FILTER (partial/substring match, scored)
        # --------------------------------------------------------
        if color_words:
            matched = any(w in searchable_text for w in color_words)
            if not matched:
                hard_filters_matched = False
            else:
                score += sum(2 for w in color_words if w in searchable_text)

        # --------------------------------------------------------
        # MATERIAL FILTER (partial/substring match, scored)
        # --------------------------------------------------------
        if material_words:
            matched = any(w in searchable_text for w in material_words)
            if not matched:
                hard_filters_matched = False
            else:
                score += sum(2 for w in material_words if w in searchable_text)

        if hard_filters_present and not hard_filters_matched:
            continue

        # --------------------------------------------------------
        # QUERY / FREE-TEXT FILTER (partial/substring match, scored)
        # --------------------------------------------------------
        # Har user word ko uske synonym group + color aliases se
        # expand karke catalog text ke against match karte hain.
        # Agar EK bhi meaningful word (ya uska synonym) mile to
        # product match ho jata hai — rank sirf score se hoti hai.
        if search_words:
            expanded_search = _expand_words(search_words)
            matched_count = sum(1 for w in expanded_search if w in searchable_text)
            if matched_count == 0:
                continue
            score += matched_count

        scored_results.append((score, product))

    # ============================================================
    # RANK BY RELEVANCE (highest score first), THEN RETURN LIMIT
    # Same-score products ko price ke hisaab se round-robin kar ke
    # interleave karte hain — takay ek hi price ke products ek
    # sath piled na hon aur har page/batch mein alag-alag prices
    # aur alag products milein (phir "aur dikhao" pe naye 4 atay
    # hain, same price repeat nahi hota).
    # ============================================================
    scored_results.sort(key=lambda pair: pair[0], reverse=True)

    results = []
    i = 0
    while i < len(scored_results):
        j = i
        while j < len(scored_results) and scored_results[j][0] == scored_results[i][0]:
            j += 1

        group = scored_results[i:j]

        by_price = {}
        for _score, product in group:
            price = product.get("price") or 0
            by_price.setdefault(price, []).append((_score, product))

        interleaved = []
        took_item = True
        while took_item:
            took_item = False
            for price in sorted(by_price.keys()):
                bucket = by_price[price]
                if bucket:
                    interleaved.append(bucket.pop(0)[1])
                    took_item = True

        results.extend(interleaved)
        i = j

    return results[skip : skip + limit]


# Ye asal tool hai jo Agent ko diya jata hai — ye sirf _list_impl ko
# wrap karta hai. Data hamesha 100% real PRODUCT_DATA catalog se aata
# hai, koi fake/dummy fallback response kahin nahi hai — chahe ye
# LLM ke tool-call ke through chale ya (neeche ask_agent mein) direct
# Python call ke through, dono suraton mein yehi asli function chalta
# hai aur wahi asli catalog data deta hai.
@function_tool
async def List(
    query: str = "",
    min_price: int | None = None,
    max_price: int | None = None,
    category: str = "",
    color: str = "",
    material: str = "",
    limit: int = 8,
):
    """Same as _list_impl — exposed to the Agent as a callable tool."""
    return await _list_impl(
        query=query,
        min_price=min_price,
        max_price=max_price,
        category=category,
        color=color,
        material=material,
        limit=limit,
    )


# ============================================================
# STRUCTURED OUTPUT SCHEMA
# ------------------------------------------------------------
# Aap ne mangwaya tha ke chatbot ko sirf RAW product data (image,
# name, price) chahiye — LLM ki apni "soch"/paragraph nahi. Agents
# SDK mein iska sahi tareeqa ye hai ke Agent par output_type set kar
# dein. Jab output_type diya jata hai to SDK model ko force karta hai
# ke woh isi JSON shape mein jawab de — is se frontend ko hamesha
# clean structured data milta hai jise seedha image cards mein render
# kiya ja sakta hai, koi extra prose parse nahi karni parti.
# ============================================================

class ProductItem(BaseModel):
    id: int
    name: str
    image: str
    price: int
    oldPrice: Optional[int] = None
    style: Optional[str] = None
    productId: Optional[str] = None


class ProductAgentOutput(BaseModel):
    """
    IMPORTANT: Ye woh schema hai jo LLM khud generate karta hai. Isay
    JAAN-BUJH KAR chhota rakha gaya hai — sirf integer IDs, poore
    product objects (jin mein lamba image URL hota hai) NAHI. Wajah:
    agar LLM se har baar poora product JSON (name+image+price...)
    dobara likhwaya jaye to lambi image URLs ki wajah se JSON output
    max_tokens se tajawuz kar jata hai aur beech mein cut ho jata hai
    -> "Invalid JSON when parsing model output" crash. IDs chhote
    hotay hain is liye ye masla kabhi nahi aata. Poora product object
    hum khud PRODUCT_DATA se (Python mein, 100% reliable) nikaaltay
    hain — dekho `_hydrate_products()` neechay.
    """
    found: bool = Field(description="True if at least one product matched, else False")
    product_ids: TList[int] = Field(
        default_factory=list,
        description="Sirf un product IDs ki list jo List tool ne match kiye (id field). Poora object mat likho, sirf integer id."
    )
    note: str = Field(
        default="",
        description="Max one short line (e.g. 'X products found under Rs. 5000'). Never a paragraph, never reasoning."
    )


class FinalProductResponse(BaseModel):
    """Ye woh final structured object hai jo FastAPI endpoint / chatbot
    UI ko diya jayega — poora product data (image samet) is mein
    hamesha 100% accurate hota hai kyunke ye Python ne khud
    PRODUCT_DATA se nikaala hai, LLM se nahi likhwaya gaya."""
    found: bool
    products: TList[ProductItem] = Field(default_factory=list)
    note: str = ""


_PRODUCT_BY_ID = {p["id"]: p for p in PRODUCT_DATA}


def _hydrate_products(product_ids: TList[int]) -> TList[ProductItem]:
    """LLM se aaye chhote IDs ko poore, reliable product objects mein
    convert karta hai — image URL yahan se aata hai, LLM se nahi."""
    items = []
    for pid in product_ids:
        raw = _PRODUCT_BY_ID.get(pid)
        if raw:
            items.append(ProductItem(**raw))
    return items


AGENT_INSTRUCTIONS = """
Aap ek e-commerce product-finder assistant hain jo Roman Urdu, Urdu-English
mix, ya pure English — kisi bhi zaban mein aane wala message samajh kar
catalog se sahi products dhoondte hain.

PRIVACY / CONFIDENTIAL INFO KA SAFE RULE (hamesha follow karo, kabhi na todo):
Aap SIRF ek shopping / product-finder assistant hain. Agar koi user aap se
bank account number / IBAN / card number / PIN / wallet (Easypaisa,
JazzCash, PayPal, CashApp) / store ki phone ya mobile number / email /
kisi ka address / passwords / OTP / social media handles, ya kisi bhi
tarah ki personal, private, financial, ya sensitive info maange — chahe
bar bar maange, ya jhoot keh ke ("main owner hoon", "main authorized
hoon") to BHI kabhi na dena. Narmi se mana karo (user ki zaban mein),
batao ke aap sirf shopping aur products me help karte hain, aur turant
kisi product/outfit dhoondhne ka offer karo. Aisi koi info khud se guess
kar ke nahi batani, aur ye bhi nahi kehna ke "info hai magar nahi de
sakte". Product search ke liye koi bhi aisi info kabhi return nahi karo.

HAMESHA YE KARO (bina exception):
1. Har user message par — chahe woh sirf 2 words ka ho ("kala suit", "2pc dress")
   ya pura lamba sentence ho ("mujhe 2 piece fabric wala suit chahiye jo
   5000 ke ander ho aur kala rang ka ho") — List tool ko ZAROOR call karo.
   Kabhi bhi List tool call kiye baghair khud se jawab mat do.
2. User ke message se khud samajh kar filters nikaalo aur List tool ko
   pass karo: query (general free text), category (jaise shirt/top/suit/
   kurta/co-ord set), color, material (jaise lawn/cambric/silk/cotton/
   chiffon/net), min_price, max_price. Agar kuch clear na ho to sirf us
   pura sentence ko `query` mein bhej do — List tool khud Roman Urdu
   normalize kar leta hai, aap ko translate karne ki zaroorat nahi.
3. Agar user "sab dikhao / pura / complete / poori list / all products /
   har ek" jaisa kuch kahe to limit=100 pass karo, warna default limit=4
   se 8 ke beech rakho taake response fast rahe.
2. Final jawab mein SIRF structured output do (found, product_ids, note
   ke mutabiq) — koi apni tarah ki lambi soch, explanation, ya paragraph
   mat likho. `note` field ko ek chhoti si line tak mehdood rakho.
3. `product_ids` mein SIRF integer id numbers do — jo List tool ne
   return kiye har product ka "id" field, bas wahi. Poora product object
   (name/image/price waghera) DOBARA MAT LIKHO — sirf id chahiye, kyunke
   image URLs lambi hoti hain aur unhe dobara likhne se response cut ho
   sakta hai. Koi id khud se mat banao jo List tool ne na diya ho.
4. Agar List tool khali list de (koi match nahi mila) to found=false aur
   product_ids=[] set karo, aur note mein sirf ek line likho ke koi match
   nahi mila (mazeed suggestion ke tor par related category try karne
   ko keh sakte hain, lekin ye bhi ek line se zyada na ho).

IMAGE / TASVEER WALE MESSAGES KE LIYE:
5. Agar user ke message ke sath koi image attach ho (khud ki tasveer,
   kisi kapre/outfit ki pic, ya kisi bhi reference image), pehle us
   image ko dhyan se dekho aur uska overall color tone, style
   (casual/formal/ethnic), aur mauqa (occasion) andaza lagao. Phir
   usi andaze ke mutabiq color/category/material filters bana kar
   List tool ko call karo — jaise agar image mein warm pastel tones
   nazar aayein to color me un jaisa qareeb tareen catalog color
   (e.g. beige/pink/peach ka nazdeek tareen) pass karo.
6. Image se koi bhi cheez khud invent mat karo jo catalog mein List
   tool se na mile — hamesha List tool ke actual results hi return
   karo.

Yaad rahe: chatbot UI is response ko parse karke images + price cards
banata hai, is liye 'products' array hamesha accurate aur List tool
ke raw output jaisa hi hona chahiye.
"""


Orchestrated_Agent = Agent(
    name="Ratan lal",
    instructions=AGENT_INSTRUCTIONS,
    model=Model,
    tools=[List],
    model_settings= ModelSettings(max_tokens=1200, temperature=0.2),
    output_type=ProductAgentOutput,
)


# ============================================================
# VISION DESCRIBER AGENT
# ------------------------------------------------------------
# Sirf image dekh kar filters nikalne ke liye (koi tool nahi).
# Search wapis Python (_list_impl) karta hai — ye sirf "image mein
# kya hai" batata hai taake search wo enjoy kar sake. Agar model
# vision support na kare to _describe_image exception fekta hai aur
# hum seedha text search pe chale jate hain — kabhi crash nahi hota.
# ============================================================
Vision_Agent = Agent(
    name="Vision Describer",
    instructions=(
        "You are an expert fashion analyst. Look at the image and return "
        "ONLY a compact JSON object (no markdown, no extra text) with these keys: "
        "color (best matching catalog color: black/white/blue/green/red/pink/yellow/"
        "brown/purple/maroon/beige/teal/aqua/multicolor/orange/mustard/cream/navy), "
        "category (clothing category: shirt/top/blouse/suit/dress/kurta/co-ord-set/3pc/2pc), "
        "material (fabric if visible: lawn/cambric/silk/cotton/chiffon/net/dobby/jacquard), "
        "keywords (2-4 short english words describing tone/style e.g. 'formal ethnic pastel'). "
        "If it is a person/selfie, describe the outfit color tones and vibe of the clothes "
        "they are wearing or that would match them. If nothing is visible, use empty strings."
    ),
    model=Model,
    model_settings=ModelSettings(max_tokens=200, temperature=0.2),
)

def _image_to_data_url(path: str) -> str:
    """Local image file ko base64 data-url mein convert karta hai
    taake ise multimodal message ke andar bheja ja sake."""
    mime, _ = mimetypes.guess_type(path)
    mime = mime or "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime};base64,{b64}"


def build_input(text: str, image_path: str | None = None, image_url: str | None = None):
    """
    Agar sirf text ho to seedha string return karta hai (jaisa pehle tha).
    Agar image_path ya image_url diya gaya ho, to multimodal content
    banata hai (text + image) jo vision-capable model ko bheja jayega.
    """
    if not image_path and not image_url:
        return text

    content = [{"type": "input_text", "text": text or "is image ke hisab se dress suggest karo"}]

    if image_url:
        content.append({"type": "input_image", "image_url": image_url})
    elif image_path:
        content.append({"type": "input_image", "image_url": _image_to_data_url(image_path)})

    return [{"role": "user", "content": content}]


async def _describe_image(image_path: str | None = None, image_url: str | None = None) -> str:
    """Image se color/category/material/keywords nikalta hai (best effort).

    Kisi bhi failure (vision not supported, invalid image, timeout) par
    empty string wapis — search phir bhi chalta hai."""

    agent_input = build_input(
        "Describe this image and return the JSON.",
        image_path=image_path,
        image_url=image_url,
    )
    result = await Runner.run(starting_agent=Vision_Agent, input=agent_input)
    raw = str(result.final_output)
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return ""
    data = json.loads(match.group(0))
    parts = []
    for key in ("color", "category", "material", "keywords"):
        val = (data.get(key) or "").strip()
        if val and val.lower() != "none":
            parts.append(val)
    return " ".join(parts)


_APOLOGY_MARKERS = (
    "sorry", "mazrat", "maaf", "nahi mil", "nahee mil", "nhi mil",
    "unfortunately", "couldn't find", "can't find", "cannot find",
    "only have", "sirf yahi", "store mein yahi", "store me yahi",
    "koi match nahi", "no match", "not found", "nahi raha", "no results",
)


def _is_apology_note(note: str) -> bool:
    """Ek chhoti si helper — LLM ka note apology/confusion jaisa lage to
    True. Products milne ke bawajood user ko "sorry, store mein yahi hai"
    wali baat na dikhaye, is liye hum aise notes ko data-driven note se
    replace kar dete hain."""
    low = (note or "").lower()
    return any(marker in low for marker in _APOLOGY_MARKERS)


async def ask_agent(text: str, image_path: str | None = None, image_url: str | None = None, skip: int = 0, limit: int = 100) -> FinalProductResponse:
    """
    Ek hi entry point — chahe sirf 2 lafz ho, pura sentence ho, ya
    sath mein image ho.

    Flow (koi fallback/fake data nahi — sab real):
      1. `text` se price range nikala jata hai ("2000 ke ander" -> max).
      2. Agar sirf greeting/hello ho -> friendly message + popular
         products (koi "not found" wali bat nahi).
      3. Agar image ho -> Vision agent se color/style/category hint
         li jati hai (best effort; fail ho to bhi search chalta hai).
      4. Search hamesha `_list_impl` (Python, real catalog) se hota
         hai — LLM sirf ek chhoti note likhta hai, jiska fail hona
         kabhi bhi data/response ko nahi roadta.
    """
    search_text = (text or "").strip()

    # ----------------------------------------------------------
    # 1) PRICE PARSING (Roman Urdu / English)
    # ----------------------------------------------------------
    min_price, max_price = _parse_price_range(search_text)

    # ----------------------------------------------------------
    # 2) GREETING HANDLING
    #    "hello / hi / kia hal / salam" -> friendly message, no
    #    "couldn't find" response.
    # ----------------------------------------------------------
    if _is_only_greeting(search_text):
        popular = await _list_impl(query="set", limit=4, skip=skip)
        return FinalProductResponse(
            found=True,
            products=popular,
            note="Main apka AI assistant hoon aur apko pata hai! 👋 Bataiye aapko kya chahiye? "
                 "Neeche kuch popular products dekhen:",
        )

    # ----------------------------------------------------------
    # 3) IMAGE HINT (best effort)
    #    User apni tasveer de to us ke color/style se search karein.
    # ----------------------------------------------------------
    image_hint = ""
    if image_path or image_url:
        try:
            image_hint = await _describe_image(image_path=image_path, image_url=image_url)
        except Exception:
            image_hint = ""

    combined_query = f"{search_text} {image_hint}".strip()

    # ----------------------------------------------------------
    # 4) DETERMINISTIC SEARCH (reliable)
    # ----------------------------------------------------------
    # Search hamesha `_list_impl` se (real PRODUCT_DATA catalog) hoti
    # hai — LLM ki tool-call ya fabricated IDs par koi bharosa nahi.
    # Is liye images/prices 100% real aur hamesha wapas milte hain.
    #
    # FALLBACK POLICY (user ko "couldn't find" kabhi na mile):
    #   - Naye ek bhi product na mile to:
    #     (a) agar price filter hai -> price ke ander ke products do;
    #     (b) warna -> kuch popular products do.
    #   - Is tarah user kuch bhi kahe, hamesha asli catalog ka data
    #     milta hai.
    # ----------------------------------------------------------
    real_products = await _list_impl(
        query=combined_query,
        min_price=min_price,
        max_price=max_price,
        limit=100,
        skip=skip,
    )

    note = f"Found {len(real_products)} products for you." if real_products else \
        "I couldn't find matching products. Please try another product name, category, or price."

    if not real_products:
        # (a) Price ho to us budget ke saare products dikhao
        if min_price is not None or max_price is not None:
            real_products = await _list_impl(
                query="",
                min_price=min_price,
                max_price=max_price,
                limit=limit,
                skip=skip,
            )
            if real_products:
                note = f"Sirf budget ke andar ke {len(real_products)} products dikhaye ja rahe hain."

        # (b) Phir bhi kuch na mila to popular products dikhao
        if not real_products:
            popular = await _list_impl(query="set", limit=limit, skip=skip)
            if popular:
                real_products = popular
                note = "Koi exact match nahi mila — ye popular products dekhen."

    if real_products:
        try:
            result = await asyncio.wait_for(
                Runner.run(starting_agent=Orchestrated_Agent, input=build_input(search_text, image_path=image_path, image_url=image_url)),
                timeout=6,
            )
            llm_output: ProductAgentOutput = result.final_output
            # LLM ka note sirf tab use karo jab woh koi apology/confusion na ho
            # ("sorry, store mein yahi hai" jaisi baat) — warna data-driven note
            # hi dikhao (jo hamesha sahi hota hai).
            if llm_output.note and not _is_apology_note(llm_output.note):
                note = llm_output.note
        except Exception:
            # LLM is optional here — never let it break the real data or hang the chat.
            pass

    return FinalProductResponse(
        found=bool(real_products),
        products=real_products,
        note=note,
    )


async def main():
    while True:
        msg = input("Enter Your Sentence (ya 'exit'): ")

        if msg.lower() in ["exit", "quit"]:
            break

        # Optional: agar test karna ho image ke sath, terminal mein
        # image ka local path bhi de saktay hain "img:" prefix ke sath,
        # e.g.  img:/home/user/photo.jpg mujhe isi rang ka suit do
        image_path = None
        if msg.lower().startswith("img:"):
            rest = msg[4:].strip()
            image_path, _, msg = rest.partition(" ")

        final_output = await ask_agent(msg, image_path=image_path)

        # Chatbot UI ke liye clean, 100% real JSON — koi extra LLM prose,
        # koi fake/placeholder data nahi.
        print(json.dumps(final_output.model_dump(), indent=2, ensure_ascii=False))

    print("GoodBye!")


if __name__ == "__main__":
    asyncio.run(main())