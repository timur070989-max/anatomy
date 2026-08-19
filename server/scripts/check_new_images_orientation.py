import os
from PIL import Image

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
out_dir = r"C:\Users\user\anatomy\server\uploads"

im_clean = Image.open(os.path.join(folder, "женшина.png"))
im_organs = Image.open(os.path.join(folder, "органи.png"))

print(f"im_clean size={im_clean.size}")
print(f"im_organs size={im_organs.size}")

# Save thumbnails to inspect
thumb_clean = im_clean.copy()
thumb_clean.thumbnail((400, 400))
thumb_clean.save(os.path.join(out_dir, "thumb_clean.png"))

thumb_organs = im_organs.copy()
thumb_organs.thumbnail((400, 400))
thumb_organs.save(os.path.join(out_dir, "thumb_organs.png"))

# Check if im_clean is landscape and where the subject is located:
bbox_clean = im_clean.getbbox()
print(f"bbox clean: {bbox_clean}")
bbox_organs = im_organs.getbbox()
print(f"bbox organs: {bbox_organs}")

# Let's inspect non-transparent pixels in im_clean
import numpy as np
arr_clean = np.array(im_clean)
arr_org = np.array(im_organs)

print(f"arr_clean shape: {arr_clean.shape}")
print(f"arr_org shape: {arr_org.shape}")

# Find active columns in clean:
alpha_clean = arr_clean[:, :, 3] > 10
y_c, x_c = np.where(alpha_clean)
if len(x_c) > 0:
    print(f"Clean active x: [{np.min(x_c)}, {np.max(x_c)}], y: [{np.min(y_c)}, {np.max(y_c)}]")

# Find active columns in organs:
alpha_org = arr_org[:, :, 3] > 10
y_o, x_o = np.where(alpha_org)
if len(x_o) > 0:
    print(f"Organs active x: [{np.min(x_o)}, {np.max(x_o)}], y: [{np.min(y_o)}, {np.max(y_o)}]")
