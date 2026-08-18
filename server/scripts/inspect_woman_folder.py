import os
from PIL import Image

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"

files = os.listdir(folder)
print(f"Total files in folder: {len(files)}")

for f in files:
    full_path = os.path.join(folder, f)
    if os.path.isfile(full_path):
        try:
            with Image.open(full_path) as im:
                print(f"{f}: size={im.size}, format={im.format}, mode={im.mode}")
        except Exception as e:
            print(f"{f}: error={e}")
