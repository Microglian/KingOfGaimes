from fastapi import FastAPI, APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Models ---

class ImageOffset(BaseModel):
    x: float = 0
    y: float = 0

class ImageCrop(BaseModel):
    zoom: float = 1.0

class CardBase(BaseModel):
    name: str = ""
    type: str = "normal_monster"
    attribute: str = "light"
    typeLine: List[str] = []
    level: Optional[int] = None
    rank: Optional[int] = None
    linkRating: Optional[int] = None
    linkArrows: List[str] = []
    atk: Optional[int] = None
    def_: Optional[int] = Field(None, alias="def")
    spellTrapType: Optional[str] = None
    description: str = ""
    imageUrl: str = ""
    imageOffset: ImageOffset = ImageOffset()
    imageCrop: ImageCrop = ImageCrop()
    frameStyle: str = "auto"
    nameColor: str = "#FFFFFF"
    overlays: List[str] = []
    archetypes: List[str] = []
    setCode: str = ""
    setNumber: str = ""
    rarity: str = "common"

    model_config = ConfigDict(populate_by_name=True)

class CardCreate(CardBase):
    pass

class CardUpdate(CardBase):
    pass

class CardResponse(CardBase):
    id: str
    createdAt: str
    updatedAt: str
    model_config = ConfigDict(populate_by_name=True)

class CardListResponse(BaseModel):
    cards: List[CardResponse]
    total: int

# --- Helpers ---

def card_doc_to_response(doc: dict) -> dict:
    doc.pop("_id", None)
    if "def_" in doc:
        doc["def"] = doc.pop("def_")
    return doc

# --- Startup ---

@app.on_event("startup")
async def startup_db():
    await db.cards.create_index("name")
    await db.cards.create_index("type")
    await db.cards.create_index("attribute")
    await db.cards.create_index("rarity")
    await db.cards.create_index("archetypes")
    await db.cards.create_index("setCode")
    logging.info("MongoDB indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# --- Card CRUD ---

@api_router.get("/")
async def root():
    return {"message": "Yu-Gi-Oh Card Creator API"}

@api_router.post("/cards", response_model=CardResponse, status_code=201)
async def create_card(card: CardCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = card.model_dump(by_alias=True)
    # Handle the def alias
    if "def" in doc:
        doc["def_"] = doc.pop("def")
    doc["id"] = str(uuid.uuid4())
    doc["createdAt"] = now
    doc["updatedAt"] = now
    await db.cards.insert_one(doc)
    return card_doc_to_response({k: v for k, v in doc.items() if k != "_id"})

@api_router.get("/cards", response_model=CardListResponse)
async def search_cards(
    name: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    attribute: Optional[str] = Query(None),
    rarity: Optional[str] = Query(None),
    archetype: Optional[str] = Query(None),
    setCode: Optional[str] = Query(None),
    typeLine: Optional[str] = Query(None),
    sort: Optional[str] = Query("updatedAt"),
    order: Optional[str] = Query("desc"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    query = {}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if type:
        query["type"] = type
    if attribute:
        query["attribute"] = attribute
    if rarity:
        query["rarity"] = rarity
    if archetype:
        query["archetypes"] = {"$in": [archetype]}
    if setCode:
        query["setCode"] = {"$regex": setCode, "$options": "i"}
    if typeLine:
        query["typeLine"] = {"$in": [typeLine]}

    sort_dir = -1 if order == "desc" else 1
    sort_field = sort if sort in ["name", "createdAt", "updatedAt", "rarity"] else "updatedAt"

    total = await db.cards.count_documents(query)
    cursor = db.cards.find(query, {"_id": 0}).sort(sort_field, sort_dir).skip(skip).limit(limit)
    cards = await cursor.to_list(limit)
    
    result_cards = []
    for c in cards:
        result_cards.append(card_doc_to_response(c))

    return {"cards": result_cards, "total": total}

@api_router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(card_id: str):
    doc = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Card not found")
    return card_doc_to_response(doc)

@api_router.put("/cards/{card_id}", response_model=CardResponse)
async def update_card(card_id: str, card: CardUpdate):
    existing = await db.cards.find_one({"id": card_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Card not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = card.model_dump(by_alias=True)
    if "def" in update_data:
        update_data["def_"] = update_data.pop("def")
    update_data["updatedAt"] = now
    
    await db.cards.update_one({"id": card_id}, {"$set": update_data})
    
    updated = await db.cards.find_one({"id": card_id}, {"_id": 0})
    return card_doc_to_response(updated)

@api_router.delete("/cards/{card_id}")
async def delete_card(card_id: str):
    result = await db.cards.delete_one({"id": card_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card deleted", "id": card_id}

# --- Import/Export ---

@api_router.post("/cards/import", response_model=List[CardResponse], status_code=201)
async def import_cards(cards: List[CardCreate]):
    now = datetime.now(timezone.utc).isoformat()
    results = []
    for card in cards:
        doc = card.model_dump(by_alias=True)
        if "def" in doc:
            doc["def_"] = doc.pop("def")
        doc["id"] = str(uuid.uuid4())
        doc["createdAt"] = now
        doc["updatedAt"] = now
        await db.cards.insert_one(doc)
        results.append(card_doc_to_response({k: v for k, v in doc.items() if k != "_id"}))
    return results

@api_router.get("/cards/export/all")
async def export_all_cards():
    cards = await db.cards.find({}, {"_id": 0}).to_list(10000)
    result = []
    for c in cards:
        result.append(card_doc_to_response(c))
    return result

# --- Image Proxy (for CORS) ---

@api_router.get("/proxy-image")
async def proxy_image(url: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as http_client:
            resp = await http_client.get(url)
            resp.raise_for_status()
            content_type = resp.headers.get("content-type", "image/png")
            return StreamingResponse(
                iter([resp.content]),
                media_type=content_type,
                headers={"Cache-Control": "public, max-age=86400"}
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not fetch image: {str(e)}")

# --- Include router ---
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
