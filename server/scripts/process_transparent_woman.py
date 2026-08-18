import os
import json
from PIL import Image, ImageFilter
import numpy as np
from rembg import remove, new_session

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

print("Initializing rembg session...")
session = new_session("u2net")

# 1. Base clean image
base_img_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")
base_raw = Image.open(base_img_path)
print(f"Base raw size: {base_raw.size}")

print("Removing background from base clean woman image...")
base_nobg = remove(base_raw, session=session)

# Find woman bounding box
bbox = base_nobg.getbbox()
print(f"Woman silhouette bbox in original: {bbox}")

# Crop woman with slight margin to make a vertical portrait (e.g. padding of 20px)
pad = 20
crop_x1 = max(0, bbox[0] - pad)
crop_y1 = max(0, bbox[1] - pad)
crop_x2 = min(base_nobg.width, bbox[2] + pad)
crop_y2 = min(base_nobg.height, bbox[3] + pad)
crop_box = (crop_x1, crop_y1, crop_x2, crop_y2)

# Crop base clean woman
woman_clean_cropped = base_nobg.crop(crop_box)
w_crop, h_crop = woman_clean_cropped.size
print(f"Cropped woman size: {w_crop}x{h_crop}")

# Resize to standard height 900 for web performance
target_h = 900
target_w = int(w_crop * (target_h / h_crop))
woman_clean_final = woman_clean_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
print(f"Final clean woman dimensions: {target_w}x{target_h}")

# Save clean woman
woman_clean_final.save(os.path.join(uploads_dir, "bodymap-female-clean.png"), "PNG")

# 2. Process all organ layers
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

# Total composite organs canvas
composite_organs = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))

labels = []

# Base RGB array inside crop box
base_crop_raw = base_raw.crop(crop_box).resize((target_w, target_h), Image.Resampling.LANCZOS)
base_np = np.array(base_crop_raw)[:, :, :3].astype(np.int16)
woman_alpha_mask = np.array(woman_clean_final.split()[3]) > 20

for filename, organ_name in organ_mapping.items():
    fpath = os.path.join(folder, filename)
    if not os.path.exists(fpath):
        print(f"Missing file: {filename}")
        continue
    
    org_raw = Image.open(fpath)
    org_crop = org_raw.crop(crop_box).resize((target_w, target_h), Image.Resampling.LANCZOS)
    org_np = np.array(org_crop)[:, :, :3].astype(np.int16)
    
    # Calculate difference strictly inside woman silhouette
    diff = np.max(np.abs(org_np - base_np), axis=2)
    # Mask diff only where woman body exists
    diff = diff * woman_alpha_mask
    
    threshold = 30
    organ_mask = (diff > threshold).astype(np.uint8) * 255
    
    # Smooth mask
    mask_im = Image.fromarray(organ_mask, mode="L").filter(ImageFilter.GaussianBlur(radius=1.5))
    
    org_rgba = org_crop.convert("RGBA")
    org_rgba.putalpha(mask_im)
    
    # Composite into organs layer
    composite_organs = Image.alpha_composite(composite_organs, org_rgba)
    
    # Calculate organ centroid
    y_idx, x_idx = np.where(diff > threshold)
    if len(x_idx) > 0:
        cx_pct = round((np.median(x_idx) / target_w) * 100, 1)
        cy_pct = round((np.median(y_idx) / target_h) * 100, 1)
        labels.append({
            "organ": organ_name,
            "x": cx_pct,
            "y": cy_pct
        })
        print(f"Organ: '{organ_name}' -> x={cx_pct}%, y={cy_pct}% (pixels: {len(x_idx)})")

# Save final composite organs
composite_organs.save(os.path.join(uploads_dir, "bodymap-female-organs.png"), "PNG")
print("Saved bodymap-female-organs.png!")

# 3. Update bodymaps.json
bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"
with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

if "female" in bm_data:
    bm_data["female"]["imageUrl"] = "/uploads/bodymap-female-clean.png"
    bm_data["female"]["organsUrl"] = "/uploads/bodymap-female-organs.png"
    
    # Keep comprehensive list of labels
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
            
    existing_orgs = set(el["organ"] for el in existing_labels)
    for l in labels:
        if l["organ"] not in existing_orgs:
            updated_labels.append(l)
            
    bm_data["female"]["labels"] = updated_labels
    bm_data["female"]["updatedAt"] = "2026-08-19T04:32:00.000Z"

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Updated bodymaps.json with clean transparent woman and perfect organ coordinates!")
