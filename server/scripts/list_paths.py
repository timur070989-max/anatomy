import os
import glob

base_dir = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body"

for root, dirs, files in os.walk(base_dir):
    for f in files:
        full = os.path.join(root, f)
        print(f"PATH: {full}")
