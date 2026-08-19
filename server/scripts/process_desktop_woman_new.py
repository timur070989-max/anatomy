import os
import json
from PIL import Image, ImageChops, ImageFilter
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

im_c_raw = Image.open(os.path.join(folder, "женшина.png")).convert("RGBA")
im_o_raw = Image.open(os.path.join(folder, "органи.png")).convert("RGBA")

# 1. Get tight bounding boxes
bbox_c = im_c_raw.getbbox()
bbox_o = im_o_raw.getbbox()
print(f"bbox_c: {bbox_c}")
print(f"bbox_o: {bbox_o}")

crop_c = im_c_raw.crop(bbox_c)
crop_o = im_o_raw.crop(bbox_o)

print(f"crop_c size: {crop_c.size}")
print(f"crop_o size: {crop_o.size}")

# Standard target height = 900
target_h = 900
# Target width based on organs full body aspect ratio
target_w = int(crop_o.width * (target_h / crop_o.height))
print(f"Target dimensions: {target_w}x{target_h}")

# Resize crop_o to target dimensions
final_organs_full = crop_o.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Scale crop_c to match the anatomical scale of crop_o
# In crop_o, total height is 1415 (full body to feet)
# If crop_c is full body or upper body:
# Let's resize crop_c to target_w, target_h
final_clean_body = crop_c.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Save both
final_clean_body.save(os.path.join(uploads_dir, "bodymap-female-clean.png"), "PNG")
final_organs_full.save(os.path.join(uploads_dir, "bodymap-female-organs.png"), "PNG")
print("Saved bodymap-female-clean.png and bodymap-female-organs.png!")

# Calibrated anatomical coordinates for this body model:
female_labels = [
    { "organ": "Мозг, Спиной мозг", "x": 50.0, "y": 6.5 },
    { "organ": "Глаза", "x": 50.0, "y": 10.0 },
    { "organ": "Нос", "x": 50.0, "y": 11.5 },
    { "organ": "Уши", "x": 42.0, "y": 11.2 },
    { "organ": "Зубы, Полость рта", "x": 50.0, "y": 13.5 },
    { "organ": "Глотка, Гортань", "x": 50.0, "y": 15.5 },
    { "organ": "Щитовидная железа", "x": 50.0, "y": 17.8 },
    { "organ": "Трахея, Бронхи, Лёгкие", "x": 46.0, "y": 23.0 },
    { "organ": "Сердце", "x": 52.0, "y": 25.5 },
    { "organ": "Молочные железы", "x": 42.0, "y": 26.0 },
    { "organ": "Мышцы", "x": 68.0, "y": 28.0 },
    { "organ": "Периферическая нервная система", "x": 25.0, "y": 28.0 },
    { "organ": "Кровеносная система", "x": 22.0, "y": 38.0 },
    { "organ": "Кости", "x": 72.0, "y": 38.0 },
    { "organ": "Печень, желчный пузырь", "x": 44.0, "y": 32.0 },
    { "organ": "Пищевод, желудок", "x": 54.0, "y": 32.5 },
    { "organ": "Поджелудочная", "x": 52.0, "y": 36.5 },
    { "organ": "Почки, мочеточник", "x": 42.0, "y": 36.0 },
    { "organ": "Кишечник", "x": 50.0, "y": 41.0 },
    { "organ": "Мочевой пузырь, мочеиспускательный канал", "x": 50.0, "y": 47.0 },
    { "organ": "Влагалище, матка, трубы, яичники", "x": 50.0, "y": 51.5 },
    { "organ": "Кожа", "x": 30.0, "y": 55.0 }
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
    "updatedAt": "2026-08-19T05:12:00.000Z"
}

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Updated bodymaps.json with female coordinates!")
