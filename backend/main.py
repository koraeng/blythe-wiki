from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import re
from pathlib import Path

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

def _normalize(s: str) -> str:
    s = s.replace('‘', "'").replace('’', "'")
    s = s.replace('“', '"').replace('”', '"')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def load_overrides() -> dict:
    path = DATA_DIR / "overrides.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {_normalize(k): v for k, v in data.items() if not k.startswith("_")}

def load_dolls() -> list:
    path = DATA_DIR / "dolls.json"
    with open(path, encoding="utf-8") as f:
        dolls = json.load(f)
    overrides = load_overrides()
    if overrides:
        for doll in dolls:
            override = overrides.get(_normalize(doll["name"]))
            if isinstance(override, dict):
                for field, value in override.items():
                    if not field.startswith("_"):
                        doll[field] = value
    return dolls

dolls: list = load_dolls()

@app.get("/dolls")
def get_dolls():
    return dolls

@app.get("/count")
def get_count():
    return {"total": len(dolls)}

@app.post("/reload")
def reload():
    """dolls.json 핫리로드 (scrape.py 실행 후 서버 재시작 없이 반영)"""
    global dolls
    dolls = load_dolls()
    return {"status": "reloaded", "total": len(dolls)}
