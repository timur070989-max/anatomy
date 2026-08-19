import os
import json
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

im_c = Image.open(os.path.join(folder, "женшина.png")).convert("RGBA")
im_o = Image.open(os.path.join(folder, "органи.png")).convert("RGBA")

# 1. Clean Woman: isolate main body (x in [520, 1020], y in [10, 1015])
crop_c_main = im_c.crop((520, 10, 1020, 1015))
# Trim transparency inside crop
bbox_c_real = crop_c_main.getbbox()
woman_clean = crop_c_main.crop(bbox_c_real)
print(f"Woman clean main body size: {woman_clean.size}")

# 2. Organs Woman: isolate main body (x in [180, 830], y in [10, 1435])
crop_o_main = im_o.crop((180, 10, 830, 1435))
bbox_o_real = crop_o_main.getbbox()
woman_organs = crop_o_main.crop(bbox_o_real)
print(f"Woman organs main body size: {woman_organs.size}")

# 3. Standardize dimensions to height 900
target_h = 900
target_w = int(woman_clean.width * (target_h / woman_clean.height))
# If woman_clean and woman_organs have slightly different heights:
# Let's resize both cleanly to target_w, target_h
target_w = 420

final_clean = woman_clean.resize((target_w, target_h), Image.Resampling.LANCZOS)
final_organs = woman_organs.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Save production files
final_clean.save(os.path.join(uploads_dir, "bodymap-female-clean.png"), "PNG")
final_organs.save(os.path.join(uploads_dir, "bodymap-female-organs.png"), "PNG")

print(f"Saved bodymap-female-clean.png ({target_w}x{target_h}) and bodymap-female-organs.png ({target_w}x{target_h})!")

# 4. Calibrated anatomical organ coordinates
female_labels = [
    { "organ": "Мозг, Спиной мозг", "x": 50.0, "y": 6.0 },
    { "organ": "Глаза", "x": 50.0, "y": 9.5 },
    { "organ": "Нос", "x": 50.0, "y": 11.0 },
    { "organ": "Уши", "x": 41.0, "y": 10.8 },
    { "organ": "Зубы, Полость рта", "x": 50.0, "y": 13.0 },
    { "organ": "Глотка, Гортань", "x": 50.0, "y": 15.0 },
    { "organ": "Щитовидная железа", "x": 50.0, "y": 17.5 },
    { "organ": "Трахея, Бронхи, Лёгкие", "x": 45.0, "y": 22.5 },
    { "organ": "Сердце", "x": 52.5, "y": 25.0 },
    { "organ": "Молочные железы", "x": 41.0, "y": 25.5 },
    { "organ": "Мышцы", "x": 68.0, "y": 27.5 },
    { "organ": "Периферическая нервная система", "x": 24.0, "y": 27.5 },
    { "organ": "Кровеносная система", "x": 20.0, "y": 38.0 },
    { "organ": "Кости", "x": 72.0, "y": 38.0 },
    { "organ": "Печень, желчный пузырь", "x": 43.0, "y": 31.5 },
    { "organ": "Пищевод, желудок", "x": 54.5, "y": 32.0 },
    { "organ": "Поджелудочная", "x": 53.0, "y": 36.5 },
    { "organ": "Почки, мочеточник", "x": 42.0, "y": 36.0 },
    { "organ": "Кишечник", "x": 50.0, "y": 41.0 },
    { "organ": "Мочевой пузырь, мочеиспускательный канал", "x": 50.0, "y": 47.0 },
    { "organ": "Влагалище, матка, трубы, яичники", "x": 50.0, "y": 51.5 },
    { "organ": "Кожа", "x": 28.0, "y": 55.0 }
]

bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"
with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

bm_data["female"] = {
    "bodyProfile": "female",
    "imageUrl": "/uploads/bodymap-female-clean.png",
    "organsUrl": "/uploads/bodymap-female-organs.png",
    "modelUrl": None,
    "labels": female_labels,
    "labels3d": [],
    "updatedAt": "2026-08-19T05:13:00.000Z"
}

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Updated bodymaps.json successfully!")
