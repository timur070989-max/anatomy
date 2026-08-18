import os
import json
from PIL import Image, ImageFilter, ImageOps
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

# 1. Base clean image
base_img_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")
base_im = Image.open(base_img_path).convert("RGBA")
target_w, target_h = base_im.size

print(f"Base size: {target_w}x{target_h}")

# Mapping of filenames to standardized organ names
organ_mapping = {
    "Глаза.jpg": "Глаза",
    "Нос.jpg": "Нос",
    "Уши.jpg": "Уши",
    "зубы и полость рта.jpg": "Зубы, Полость рта",
    "Глотка, Гортань.jpg": "Глотка, Гортань",
    "Щитовидная железа.jpg": "Щитовидная железа",
    "Трахея, Бронхи, Лёгкие.jpg": "Трахея, Бронхи, Лёгкие",
    "сердца.jpg": "Сердце",
    "печен.jpg": "Печень, желчный пузырь",
    "матка.jpg": "Влагалище, матка, трубы, яичники",
    "мышца.jpg": "Мышцы"
}

base_arr = np.array(base_im)[:, :, :3].astype(np.int16)

# Composite organs canvas (RGBA)
composite_organs = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))

labels = []

for filename, organ_name in organ_mapping.items():
    fpath = os.path.join(folder, filename)
    if not os.path.exists(fpath):
        print(f"Missing: {filename}")
        continue
    
    org_im = Image.open(fpath).convert("RGBA")
    if org_im.size != (target_w, target_h):
        org_im = org_im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    org_arr = np.array(org_im)[:, :, :3].astype(np.int16)
    
    # Calculate difference from base
    diff = np.max(np.abs(org_arr - base_arr), axis=2) # 0..255
    
    # Organ mask
    threshold = 24
    organ_mask = (diff > threshold).astype(np.uint8) * 255
    
    # Smooth edges
    mask_im = Image.fromarray(organ_mask, mode="L").filter(ImageFilter.GaussianBlur(radius=1.2))
    
    org_layer = org_im.copy()
    org_layer.putalpha(mask_im)
    
    # Composite into total organs layer
    composite_organs = Image.alpha_composite(composite_organs, org_layer)
    
    # Calculate organ centroid for bodymap label point
    y_idx, x_idx = np.where(diff > threshold)
    if len(x_idx) > 0:
        cx_pct = round((np.median(x_idx) / target_w) * 100, 1)
        cy_pct = round((np.median(y_idx) / target_h) * 100, 1)
        labels.append({
            "organ": organ_name,
            "x": cx_pct,
            "y": cy_pct
        })
        print(f"Mapped organ '{organ_name}' -> x={cx_pct}%, y={cy_pct}%")

# Save high-res clean base and organs
base_im.save(os.path.join(uploads_dir, "bodymap-female-clean.png"), "PNG")
composite_organs.save(os.path.join(uploads_dir, "bodymap-female-organs.png"), "PNG")

print("\nSaved bodymap-female-clean.png and bodymap-female-organs.png!")

# Update server/data/bodymaps.json for female profile
bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"
with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

if "female" in bm_data:
    bm_data["female"]["imageUrl"] = "/uploads/bodymap-female-clean.png"
    bm_data["female"]["organsUrl"] = "/uploads/bodymap-female-organs.png"
    # Keep comprehensive list of labels including newly detected positions
    # Merge detected positions
    pos_map = {l["organ"]: (l["x"], l["y"]) for l in labels}
    
    existing_labels = bm_data["female"].get("labels", [])
    updated_labels = []
    for el in existing_labels:
        org = el["organ"]
        if org in pos_map:
            updated_labels.append({
                "organ": org,
                "x": pos_map[org][0],
                "y": pos_map[org][1]
            })
        else:
            updated_labels.append(el)
            
    # Add any labels that weren't in existing_labels
    existing_orgs = set(el["organ"] for el in existing_labels)
    for l in labels:
        if l["organ"] not in existing_orgs:
            updated_labels.append(l)
            
    bm_data["female"]["labels"] = updated_labels
    bm_data["female"]["updatedAt"] = "2026-08-19T04:28:00.000Z"

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Updated server/data/bodymaps.json with new female coordinates!")
