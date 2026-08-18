import os
import glob
from PIL import Image

base_path = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body"

all_files = glob.glob(os.path.join(base_path, "**", "*женщин*.*"), recursive=True)
all_files += glob.glob(os.path.join(base_path, "**", "*woman*.*"), recursive=True)

print("Woman files found:")
for f in all_files:
    print(f"  {os.path.relpath(f, base_path)} ({os.path.getsize(f)} bytes)")
