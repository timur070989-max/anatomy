import os
from PIL import Image, ImageChops, ImageEnhance
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
out_dir = r"C:\Users\user\anatomy\server\uploads"

# 1. Base clean image
base_img_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")
base_im = Image.open(base_img_path).convert("RGB")
w, h = base_im.size
print(f"Base image size: {w}x{h}")

# Save base clean woman
# Crop or keep aspect ratio
# Let's inspect base image bounding box / content
base_np = np.array(base_im, dtype=np.int16)

# List of organ images
organ_files = [
    "Глаза.jpg",
    "Нос.jpg",
    "Уши.jpg",
    "зубы и полость рта.jpg",
    "Глотка, Гортань.jpg",
    "Щитовидная железа.jpg",
    "Трахея, Бронхи, Лёгкие.jpg",
    "сердца.jpg",
    "печен.jpg",
    "матка.jpg",
    "мышца.jpg"
]

# We will composite all isolated organs into a single high-resolution internal organs layer (RGBA)
composite_organs = Image.new("RGBA", (w, h), (0, 0, 0, 0))

labels_detected = []

for org_name in organ_files:
    org_path = os.path.join(folder, org_name)
    if not os.path.exists(org_path):
        print(f"File not found: {org_name}")
        continue
    
    org_im = Image.open(org_path).convert("RGB")
    if org_im.size != (w, h):
        org_im = org_im.resize((w, h), Image.Resampling.LANCZOS)
    
    org_np = np.array(org_im, dtype=np.int16)
    
    # Calculate difference
    diff = np.abs(org_np - base_np)
    diff_magnitude = np.max(diff, axis=2) # 0..255
    
    # Find regions where organ appears (diff > threshold)
    threshold = 28
    mask = (diff_magnitude > threshold).astype(np.uint8) * 255
    
    # Soften / smooth mask
    mask_im = Image.fromarray(mask, mode="L")
    # Clean noise
    from PIL import ImageFilter
    mask_im = mask_im.filter(ImageFilter.GaussianBlur(radius=1.5))
    
    # Extract organ RGB with smooth alpha
    org_rgba = org_im.convert("RGBA")
    org_rgba.putalpha(mask_im)
    
    # Alpha composite onto composite_organs
    composite_organs = Image.alpha_composite(composite_organs, org_rgba)
    
    # Calculate organ center of mass for exact bodymap label coordinate!
    y_indices, x_indices = np.where(diff_magnitude > threshold)
    if len(x_indices) > 0:
        center_x_pct = round((np.median(x_indices) / w) * 100, 1)
        center_y_pct = round((np.median(y_indices) / h) * 100, 1)
        clean_name = os.path.splitext(org_name)[0]
        labels_detected.append({
            "organ": clean_name,
            "x": center_x_pct,
            "y": center_y_pct,
            "pixels": len(x_indices)
        })
        print(f"Organ: {clean_name} -> center at ({center_x_pct}%, {center_y_pct}%), affected pixels: {len(x_indices)}")

# Save final assembled woman layers
# 1. Base clean woman image
base_im.save(os.path.join(out_dir, "bodymap-female-clean.png"), "PNG")
# 2. Assembled organs layer
composite_organs.save(os.path.join(out_dir, "bodymap-female-organs.png"), "PNG")

print("\nSuccessfully assembled composite organs and clean woman body!")
print(f"Total labels detected: {len(labels_detected)}")
import json
print(json.dumps(labels_detected, ensure_ascii=False, indent=2))
