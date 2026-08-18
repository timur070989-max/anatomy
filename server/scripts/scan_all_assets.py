import os
import glob
from PIL import Image

base_dir = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body"

all_files = glob.glob(os.path.join(base_dir, "**", "*.*"), recursive=True)

print(f"Total files found: {len(all_files)}")

for f in all_files:
    ext = os.path.splitext(f)[1].lower()
    if ext in ['.png', '.jpg', '.jpeg', '.webp', '.psd', '.cdr']:
        try:
            rel = os.path.relpath(f, base_dir)
            size_mb = os.path.getsize(f) / (1024 * 1024)
            dim = ""
            if ext in ['.png', '.jpg', '.jpeg', '.webp']:
                with Image.open(f) as im:
                    dim = f"{im.size[0]}x{im.size[1]} ({im.mode})"
            print(f"FILE: {rel} | {size_mb:.2f} MB | {dim}")
        except Exception as e:
            print(f"FILE: {rel} | error: {e}")
