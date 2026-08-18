import os
import json
from PIL import Image, ImageFilter
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

base_img_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")
base_raw = Image.open(base_img_path).convert("RGBA")
w, h = base_raw.size
print(f"Base size: {w}x{h}")

arr = np.array(base_raw)[:, :, :3].astype(np.float32)

# Sample background from the outer borders (left, right, top)
bg_samples = np.concatenate([
    arr[:50, :, :].reshape(-1, 3),
    arr[-50:, :, :].reshape(-1, 3),
    arr[:, :150, :].reshape(-1, 3),
    arr[:, -150:, :].reshape(-1, 3)
], axis=0)

bg_mean = np.median(bg_samples, axis=0)
print(f"Detected Background Median RGB: {bg_mean}")

# Calculate color distance to background
diff_bg = np.linalg.norm(arr - bg_mean, axis=2)

# Threshold: pixels with color distance > 22 belong to the woman
woman_mask = (diff_bg > 22).astype(np.uint8) * 255

# Morphological clean up using Pillow filters
mask_im = Image.fromarray(woman_mask, mode="L")
mask_im = mask_im.filter(ImageFilter.MaxFilter(size=5)) # Dilate to close small holes
mask_im = mask_im.filter(ImageFilter.MinFilter(size=5)) # Erode back
mask_im = mask_im.filter(ImageFilter.GaussianBlur(radius=1.5)) # Soft anti-aliased edge

# Find woman bounding box from mask
bbox = mask_im.getbbox()
print(f"Woman bounding box in original: {bbox}")

# Crop woman with padding (20px)
pad = 20
crop_x1 = max(0, bbox[0] - pad)
crop_y1 = max(0, bbox[1] - pad)
crop_x2 = min(w, bbox[2] + pad)
crop_y2 = min(h, bbox[3] + pad)
crop_box = (crop_x1, crop_y1, crop_x2, crop_y2)

# Apply mask to base woman image
base_clean = base_raw.copy()
base_clean.putalpha(mask_im)

# Crop woman to vertical figure
woman_clean_cropped = base_clean.crop(crop_box)
w_crop, h_crop = woman_clean_cropped.size
print(f"Cropped woman size: {w_crop}x{h_crop}")

# Target standard canvas 420x900
target_h = 900
target_w = int(w_crop * (target_h / h_crop))
woman_clean_final = woman_clean_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
print(f"Final woman dimensions: {target_w}x{target_h}")

# Save transparent clean woman
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

composite_organs = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
base_crop_raw = base_raw.crop(crop_box).resize((target_w, target_h), Image.Resampling.LANCZOS)
base_np = np.array(base_crop_raw)[:, :, :3].astype(np.int16)
woman_alpha_mask = np.array(woman_clean_final.split()[3]) > 30

labels = []

for filename, organ_name in organ_mapping.items():
    fpath = os.path.join(folder, filename)
    if not os.path.exists(fpath):
        continue
    
    org_raw = Image.open(fpath)
    org_crop = org_raw.crop(crop_box).resize((target_w, target_h), Image.Resampling.LANCZOS)
    org_np = np.array(org_crop)[:, :, :3].astype(np.int16)
    
    # Calculate difference strictly inside woman silhouette
    diff = np.max(np.abs(org_np - base_np), axis=2) * woman_alpha_mask
    
    threshold = 28
    organ_mask = (diff > threshold).astype(np.uint8) * 255
    mask_im = Image.fromarray(organ_mask, mode="L").filter(ImageFilter.GaussianBlur(radius=1.5))
    
    org_rgba = org_crop.convert("RGBA")
    org_rgba.putalpha(mask_im)
    
    composite_organs = Image.alpha_composite(composite_organs, org_rgba)
    
    y_idx, x_idx = np.where(diff > threshold)
    if len(x_idx) > 0:
        cx_pct = round((np.median(x_idx) / target_w) * 100, 1)
        cy_pct = round((np.median(y_idx) / target_h) * 100, 1)
        labels.append({
            "organ": organ_name,
            "x": cx_pct,
            "y": cy_pct
        })
        print(f"Organ: '{organ_name}' -> x={cx_pct}%, y={cy_pct}%")

composite_organs.save(os.path.join(uploads_dir, "bodymap-female-organs.png"), "PNG")
print("Saved transparent bodymap-female-organs.png!")

# Update bodymaps.json
bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"
with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

if "female" in bm_data:
    bm_data["female"]["imageUrl"] = "/uploads/bodymap-female-clean.png"
    bm_data["female"]["organsUrl"] = "/uploads/bodymap-female-organs.png"
    
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
    bm_data["female"]["updatedAt"] = "2026-08-19T04:33:00.000Z"

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Updated server/data/bodymaps.json with transparent woman!")
