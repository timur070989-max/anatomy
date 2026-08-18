import os
from PIL import Image

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"

for f in sorted(os.listdir(folder)):
    if f.lower().endswith('.jpg'):
        p = os.path.join(folder, f)
        im = Image.open(p)
        print(f"File: {f} | Size: {im.size}")
