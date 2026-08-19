import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"

im_clean = Image.open(os.path.join(folder, "женшина.png"))
im_organs = Image.open(os.path.join(folder, "органи.png"))

print("Clean mode:", im_clean.mode, "size:", im_clean.size)
print("Organs mode:", im_organs.mode, "size:", im_organs.size)

# Crop both to their non-transparent bounding boxes
bbox_c = im_clean.getbbox()
crop_clean = im_clean.crop(bbox_c)
print(f"Clean cropped to content size: {crop_clean.size}")

bbox_o = im_organs.getbbox()
crop_organs = im_organs.crop(bbox_o)
print(f"Organs cropped to content size: {crop_organs.size}")
