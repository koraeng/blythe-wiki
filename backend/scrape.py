from bs4 import BeautifulSoup
import requests
import re
import json
from pathlib import Path
from collections import Counter

BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

PAGES = [
    ("https://blythopia.com/neo-blythe-2026/", 2026),
    ("https://blythopia.com/neo-blythe-2025/", 2025),
    ("https://blythopia.com/neo-blythe-2024/", 2024),
    ("https://blythopia.com/neo-blythe-2023/", 2023),
    ("https://blythopia.com/neo-blythe-2022/", 2022),
    ("https://blythopia.com/neo-blythe-2021/", 2021),
    ("https://blythopia.com/neo-blythe-2020/", 2020),
    ("https://blythopia.com/neo-blythe-2019/", 2019),
    ("https://blythopia.com/neo-blythe-2018/", 2018),
    ("https://blythopia.com/neo-blythe-2017/", 2017),
    ("https://blythopia.com/neo-blythe-2016/", 2016),
    ("https://blythopia.com/neo-blythe-2015/", 2015),
    ("https://blythopia.com/neo-blythe-2013-2014/", 2013),
    ("https://blythopia.com/neo-blythe-2011-2012/", 2011),
    ("https://blythopia.com/neo-blythe-2009-2010/", 2009),
    ("https://blythopia.com/neo-blythe-2007-2008/", 2007),
    ("https://blythopia.com/neo-blythe-2005-2006/", 2005),
    ("https://blythopia.com/neo-blythe-2003-2004/", 2003),
    ("https://blythopia.com/neo-blythe-2001-2002/", 2001),
]

MONTHS = ["january","february","march","april","may","june",
          "july","august","september","october","november","december"]

FACE_TYPE_TEXT_MAP = [
    ("Radiance Evolution", "EVO"),
    ("Radiance Renew",     "RBL RENEW"),
    ("Radiance Plus",      "RBL+"),
    ("Radiance",           "RBL"),
    ("Fairest",            "FBL"),
    ("Superior",           "SBL"),
    ("Excellent",          "EBL"),
]

DETAIL_DELIM_PATTERN = re.compile(
    r'\b(face\s*type|face\s*colou?r|hair\s*colou?r|hair\s*style|hairstyle|'
    r'eye\s*shadow|eyeshadow|lips?|blush|cheek|eye\s*colou?r|eyelid|'
    r'eye\s*lashes|eyelashes|manicure|nail\s*polish|piercing|'
    r'(?:ear[\s-]?rings?|earrings?)|'
    r'(?:the\s+)?set\s*(?:contents|includes)|'
    r'make\s*up|makeup|release\s*date|'
    r'(?:suggested\s+retail\s+)?price)\s*[:：]',
    re.IGNORECASE
)

DETAIL_FIELD_ALIASES = {
    'face_color':   ['face color', 'face colour'],
    'hair_color':   ['hair color', 'hair colour'],
    'hairstyle':    ['hairstyle', 'hair style'],
    'eye_color':    ['eye color', 'eye colour'],
    'release_date': ['release date'],
    'price':        ['suggested retail price', 'price'],
}

TRAILING_HEADER_RE = re.compile(
    r'\s+(?:Makeup|Set\s*Contents)\s*$', re.IGNORECASE
)

def parse_detail_fields(text: str) -> dict:
    """'Key: Value Key: Value ...' 형태 단락에서 필드 추출"""
    parsed = {}
    matches = list(DETAIL_DELIM_PATTERN.finditer(text))
    for i, m in enumerate(matches):
        key = re.sub(r'\s+', ' ', m.group(1).lower().strip())
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        value = re.sub(r'\s+', ' ', text[start:end].strip())
        value = TRAILING_HEADER_RE.sub('', value).strip()
        if value:
            parsed[key] = value

    out = {field: '' for field in DETAIL_FIELD_ALIASES}
    for field, aliases in DETAIL_FIELD_ALIASES.items():
        for alias in aliases:
            if alias in parsed:
                out[field] = parsed[alias]
                break
    return out

def normalize(s: str) -> str:
    s = s.replace('\u2018', "'").replace('\u2019', "'")
    s = s.replace('\u201c', '"').replace('\u201d', '"')
    s = re.sub(r'\s+', ' ', s)
    return s.strip()

def load_face_type_map() -> dict:
    path = DATA_DIR / "face_type_map.json"
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {normalize(k): v for k, v in data.items() if not k.startswith("_")}

def load_overrides() -> dict:
    """data/overrides.json에서 수동 보정 데이터 로드. 키는 normalize된 인형명."""
    path = DATA_DIR / "overrides.json"
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {normalize(k): v for k, v in data.items() if not k.startswith("_")}

def apply_overrides(dolls: list, overrides: dict) -> int:
    """dolls에 overrides 머지. 적용된 인형 수 반환."""
    count = 0
    for doll in dolls:
        key = normalize(doll["name"])
        if key in overrides:
            override = overrides[key]
            if isinstance(override, dict):
                for field, value in override.items():
                    if not field.startswith("_"):
                        doll[field] = value
                count += 1
    return count

def parse_month(text):
    text_lower = text.lower()
    for i, month in enumerate(MONTHS):
        if month in text_lower:
            return i + 1
    return 0

def parse_year(text):
    match = re.search(r"(20\d{2}|19\d{2})", text)
    if match:
        return int(match.group(1))
    return 0

def parse_face_type_from_text(text: str) -> str:
    match = re.search(
        r"face\s+type[^a-zA-Z]*(?:is\s+)?([A-Za-z]+(?:\s+[A-Za-z]+)?)",
        text, re.IGNORECASE
    )
    if match:
        extracted = match.group(1).strip()
        for face_text, code in FACE_TYPE_TEXT_MAP:
            if face_text.lower() in extracted.lower():
                return code
    return ""

def is_year_heading(name):
    return bool(re.fullmatch(r"\d{4}", name.strip()))

def scrape_page(url, year, face_type_map):
    headers = {"User-Agent": "Mozilla/5.0"}
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")
    content = soup.select_one(".entry-content") or soup.select_one("article") or soup

    dolls = []
    for h2 in content.find_all("h2"):
        name = h2.get_text(strip=True)
        if not name or is_year_heading(name):
            continue

        image = ""
        month = 0
        actual_year = year
        text_chunks = []

        # 1순위: JSON 맵 조회
        face_type = face_type_map.get(normalize(name), "")

        for sibling in h2.find_next_siblings():
            if sibling.name == "h2":
                break

            text = sibling.get_text(" ", strip=True)
            if text:
                text_chunks.append(text)

            if not image:
                img = sibling.find("img") if sibling.name != "img" else sibling
                if img and img.get("src"):
                    image = img["src"].split("?")[0]

            if "release" in text.lower():
                if not month:
                    month = parse_month(text)
                parsed_year = parse_year(text)
                if parsed_year:
                    actual_year = parsed_year

            # 2순위: 텍스트 파싱 (JSON에 없는 경우만)
            if not face_type:
                face_type = parse_face_type_from_text(text)

        full_text = " ".join(text_chunks)
        details = parse_detail_fields(full_text)

        dolls.append({
            "name": name,
            "image": image,
            "release_year": actual_year,
            "release_month": month,
            "face_type": face_type,
            "face_color": details["face_color"],
            "hair_color": details["hair_color"],
            "hairstyle": details["hairstyle"],
            "eye_color": details["eye_color"],
            "release_date": details["release_date"],
            "price": details["price"],
            "description": full_text,
        })

    return dolls

def main():
    print("face_type_map.json 로드 중...")
    face_type_map = load_face_type_map()
    print(f"✅ 로드된 항목 수: {len(face_type_map)}")

    dolls = []
    for i, (url, year) in enumerate(PAGES):
        print(f"[{i+1}/{len(PAGES)}] 스크래핑 중: {url}")
        dolls += scrape_page(url, year, face_type_map)

    dolls.sort(key=lambda x: (x["release_year"], x["release_month"]), reverse=True)

    output_path = DATA_DIR / "dolls.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(dolls, f, ensure_ascii=False, indent=2)

    print(f"\n완료! 총 {len(dolls)}개 인형 → data/dolls.json 저장됨")
    print("※ overrides.json은 백엔드(main.py) 로드 시점에 머지됩니다.")

    print("\n=== face_type 종류별 갯수 ===")
    counts = Counter(d["face_type"] or "???" for d in dolls)
    for ft, cnt in sorted(counts.items()):
        print(f"{ft}: {cnt}")

    print("\n=== ??? 목록 ===")
    for d in dolls:
        if not d["face_type"]:
            print(f"??? | {d['name']}")

if __name__ == "__main__":
    main()
