import os
import glob
from psd_tools import PSDImage
from PIL import Image

base_path = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body"
out_dir = r"C:\Users\user\anatomy\server\uploads"

print("--- Inspecting PSD and image files ---")

# 1. Man PSD
man_psd_path = os.path.join(base_path, "WM Human Body", "Project Perfect", "мужчина", "man 900.psd")
if os.path.exists(man_psd_path):
    print(f"\nReading {man_psd_path}...")
    psd = PSDImage.open(man_psd_path)
    print(f"PSD Size: {psd.size}")
    for layer in psd:
        print(f"  Layer: {layer.name}, visible: {layer.is_visible()}, size: {layer.size}")
        # Save individual layers
        layer_img = layer.composite()
        if layer_img:
            layer_name_clean = "".join(c for c in layer.name if c.isalnum() or c in (' ', '_', '-')).strip()
            save_path = os.path.join(out_dir, f"man_layer_{layer_name_clean}.png")
            layer_img.save(save_path)
            print(f"    -> Saved layer {save_path}")

# 2. Woman PSD
woman_psd_path = os.path.join(base_path, "WM Human Body", "Project Perfect", "женщина", "органы.psd")
if os.path.exists(woman_psd_path):
    print(f"\nReading {woman_psd_path}...")
    psd = PSDImage.open(woman_psd_path)
    print(f"PSD Size: {psd.size}")
    for layer in psd:
        print(f"  Layer: {layer.name}, visible: {layer.is_visible()}, size: {layer.size}")
        layer_img = layer.composite()
        if layer_img:
            layer_name_clean = "".join(c for c in layer.name if c.isalnum() or c in (' ', '_', '-')).strip()
            save_path = os.path.join(out_dir, f"woman_layer_{layer_name_clean}.png")
            layer_img.save(save_path)
            print(f"    -> Saved layer {save_path}")

print("\n--- Listing key PNG/JPG files found ---")
all_files = glob.glob(os.path.join(base_path, "**", "*.*"), recursive=True)
for f in all_files:
    ext = os.path.splitext(f)[1].lower()
    if ext in ['.png', '.jpg', '.jpeg', '.webp', '.psd']:
        print(f"  {os.path.relpath(f, base_path)} ({os.path.getsize(f)} bytes)")
