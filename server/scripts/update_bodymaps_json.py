import json

fpath = r"C:\Users\user\anatomy\server\data\bodymaps.json"

with open(fpath, "r", encoding="utf-8") as f:
    data = json.load(f)

for profile in ["male", "female", "child"]:
    if profile in data:
        data[profile]["imageUrl"] = f"/uploads/bodymap-{profile}-clean.png"
        data[profile]["organsUrl"] = f"/uploads/bodymap-{profile}-organs.png"

with open(fpath, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated bodymaps.json with clean and organs image URLs!")
