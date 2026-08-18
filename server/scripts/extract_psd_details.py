import os
from psd_tools import PSDImage
from PIL import Image

base_dir = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect"
out_dir = r"C:\Users\user\anatomy\server\uploads"

# 1. Man PSD
man_psd_path = os.path.join(base_dir, "мужчина", "man 900.psd")
psd = PSDImage.open(man_psd_path)

print("MAN PSD LAYERS:")
for i, layer in enumerate(psd):
    print(f"  [{i}] name: {layer.name}, visible: {layer.is_visible()}, size: {layer.size}")

# Let's save the bottom layer (skin body) and top layers (organs)
# Composite only skin layers:
# Let's inspect each layer's image
for i, layer in enumerate(psd):
    img = layer.composite()
    if img:
        img.save(os.path.join(out_dir, f"man_psd_layer_{i}.png"))
        print(f"    Saved layer {i} as man_psd_layer_{i}.png (size: {img.size})")

# 2. Woman PSD
woman_psd_path = os.path.join(base_dir, "женщина", "органы.psd")
psd_w = PSDImage.open(woman_psd_path)
print("\nWOMAN PSD LAYERS:")
for i, layer in enumerate(psd_w):
    print(f"  [{i}] name: {layer.name}, visible: {layer.is_visible()}, size: {layer.size}")
    img = layer.composite()
    if img:
        img.save(os.path.join(out_dir, f"woman_psd_layer_{i}.png"))
        print(f"    Saved layer {i} as woman_psd_layer_{i}.png (size: {img.size})")
