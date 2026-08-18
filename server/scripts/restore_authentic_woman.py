import os
import json
import shutil
from PIL import Image, ImageDraw
import numpy as np

base_perfect = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect\женщина"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

src_clean = os.path.join(base_perfect, "женщина.png")
src_organs = os.path.join(base_perfect, "woman_in.png")

print(f"Reading original clean woman from {src_clean}...")
im_clean = Image.open(src_clean).convert("RGBA")
print(f"Reading original organs from {src_organs}...")
im_organs = Image.open(src_organs).convert("RGBA")

w, h = im_clean.size
print(f"Woman dimensions: {w}x{h}")

# Add corporate dark-navy modesty sportswear/dress to im_clean
overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

navy_color = (6, 25, 55, 255) # #061937
blue_primary = (0, 82, 156, 255) # #00529C
blue_accent = (0, 160, 227, 255) # #00A0E3

# Skirt / shorts contour covering hips & thighs modestly down to y=520
skirt_points = [
    (118, 300), # chest left
    (96, 380),  # waist left
    (88, 430),  # hip left
    (82, 490),  # thigh left
    (86, 525),  # hem bottom-left
    (138, 530), # center left
    (165, 520), # center crotch/hem
    (192, 530), # center right
    (244, 525), # hem bottom-right
    (248, 490), # thigh right
    (242, 430), # hip right
    (234, 380), # waist right
    (212, 300), # chest right
]

draw.polygon(skirt_points, fill=navy_color)
draw.line([(96, 380), (88, 430), (82, 490), (86, 525)], fill=blue_accent, width=3)
draw.line([(234, 380), (242, 430), (248, 490), (244, 525)], fill=blue_accent, width=3)
draw.line([(100, 395), (230, 395)], fill=blue_primary, width=5)
draw.line([(86, 525), (165, 520), (244, 525)], fill=blue_primary, width=4)

# Bodice and straps
draw.polygon([(118, 300), (140, 340), (190, 340), (212, 300), (210, 395), (120, 395)], fill=navy_color)
draw.polygon([(126, 220), (136, 220), (130, 310), (120, 310)], fill=navy_color)
draw.polygon([(194, 220), (204, 220), (210, 310), (200, 310)], fill=navy_color)
draw.line([(126, 220), (130, 310)], fill=blue_accent, width=2)
draw.line([(204, 220), (210, 310)], fill=blue_accent, width=2)

# Mask overlay to woman body silhouette
alpha = im_clean.split()[3]
overlay_r, overlay_g, overlay_b, overlay_a = overlay.split()
arr_overlay_a = np.array(overlay_a)
arr_body_a = np.array(alpha)
combined_a = np.minimum(arr_overlay_a, (arr_body_a > 30) * 255)
overlay.putalpha(Image.fromarray(combined_a.astype('uint8')))

final_clean_woman = Image.alpha_composite(im_clean, overlay)

# Save perfectly aligned files
final_clean_woman.save(os.path.join(uploads_dir, "bodymap-female-clean.png"), "PNG")
im_organs.save(os.path.join(uploads_dir, "bodymap-female-organs.png"), "PNG")
print("Saved clean bodymap-female-clean.png and bodymap-female-organs.png (331x899)!")

# Update bodymaps.json with exact anatomical coordinates for all 22 organ zones
bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"
with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

# Calibrated anatomical coordinates on woman silhouette (331x899):
calibrated_female_labels = [
    { "x": 49.5, "y": 6.8, "organ": "Мозг, Спиной мозг" },
    { "x": 49.5, "y": 10.3, "organ": "Глаза" },
    { "x": 49.5, "y": 11.8, "organ": "Нос" },
    { "x": 41.5, "y": 11.5, "organ": "Уши" },
    { "x": 49.5, "y": 13.8, "organ": "Зубы, Полость рта" },
    { "x": 49.5, "y": 15.6, "organ": "Глотка, Гортань" },
    { "x": 49.5, "y": 18.2, "organ": "Щитовидная железа" },
    { "x": 45.0, "y": 21.5, "organ": "Трахея, Бронхи, Лёгкие" },
    { "x": 40.5, "y": 26.5, "organ": "Молочные железы" },
    { "x": 51.5, "y": 26.5, "organ": "Сердце" },
    { "x": 66.0, "y": 26.0, "organ": "Мышцы" },
    { "x": 24.0, "y": 26.0, "organ": "Периферическая нервная система" },
    { "x": 20.0, "y": 38.0, "organ": "Кровеносная система" },
    { "x": 70.0, "y": 38.0, "organ": "Кости" },
    { "x": 43.0, "y": 32.5, "organ": "Печень, желчный пузырь" },
    { "x": 54.0, "y": 32.5, "organ": "Пищевод, желудок" },
    { "x": 53.0, "y": 37.5, "organ": "Поджелудочная" },
    { "x": 42.0, "y": 36.9, "organ": "Почки, мочеточник" },
    { "x": 49.5, "y": 39.5, "organ": "Кишечник" },
    { "x": 49.5, "y": 47.5, "organ": "Мочевой пузырь, мочеиспускательный канал" },
    { "x": 49.5, "y": 51.5, "organ": "Влагалище, матка, трубы, яичники" },
    { "x": 31.0, "y": 54.0, "organ": "Кожа" }
]

bm_data["female"] = {
    "bodyProfile": "female",
    "imageUrl": "/uploads/bodymap-female-clean.png",
    "organsUrl": "/uploads/bodymap-female-organs.png",
    "modelUrl": None,
    "labels": calibrated_female_labels,
    "labels3d": [],
    "updatedAt": "2026-08-19T04:37:00.000Z"
}

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Updated bodymaps.json with calibrated anatomical coordinates for woman!")
