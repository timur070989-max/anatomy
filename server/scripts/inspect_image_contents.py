import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"

for f in sorted(os.listdir(folder)):
    if f.lower().endswith('.jpg'):
        p = os.path.join(folder, f)
        im = Image.open(p)
        # Let's inspect center vs corners
        c_top_left = im.getpixel((20, 20))
        c_center = im.getpixel((im.width // 2, im.height // 2))
        print(f"Image: {f:35s} | size: {im.size} | top_left: {c_top_left} | center: {c_center}")
