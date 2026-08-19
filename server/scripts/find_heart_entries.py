import json
import os

entries_path = r"C:\Users\user\anatomy\server\data\entries.json"
with open(entries_path, "r", encoding="utf-8") as f:
    entries = json.load(f)

heart_entries = [e for e in entries if "сердц" in (e.get("system") or "").lower() or "сердц" in (e.get("title") or "").lower() or "ибс" in (e.get("title") or "").lower() or "инфаркт" in (e.get("title") or "").lower()]

print(f"Total heart entries found: {len(heart_entries)}")

for e in heart_entries[:15]:
    print(f"ID: {e.get('id')} | Title: {e.get('title')} | System: {e.get('system')} | modelUrl: {e.get('modelUrl')} | imageUrl: {e.get('imageUrl')}")
