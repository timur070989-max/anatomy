import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
im_c = Image.open(os.path.join(folder, "женшина.png"))
im_o = Image.open(os.path.join(folder, "органи.png"))

# Save slices to see what's in im_c and im_o
out_dir = r"C:\Users\user\anatomy\server\uploads\slices"
os.makedirs(out_dir, exist_ok=True)

# 1. Clean woman top (head/shoulders), middle (torso), bottom (hips/legs)
arr_c = np.array(im_c)
y_c, x_c = np.where(arr_c[:, :, 3] > 10)
crop_c = im_c.crop((np.min(x_c), np.min(y_c), np.max(x_c)+1, np.max(y_c)+1))
crop_c.save(os.path.join(out_dir, "crop_clean.png"))

# 2. Organs
arr_o = np.array(im_o)
y_o, x_o = np.where(arr_o[:, :, 3] > 10)
crop_o = im_o.crop((np.min(x_o), np.min(y_o), np.max(x_o)+1, np.max(y_o)+1))
crop_o.save(os.path.join(out_dir, "crop_organs.png"))

print(f"Saved crop_clean ({crop_c.size}) and crop_organs ({crop_o.size}) to {out_dir}")
