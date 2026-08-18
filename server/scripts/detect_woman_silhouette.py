import os
from PIL import Image, ImageFilter
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
base_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")

im = Image.open(base_path).convert("RGBA")
w, h = im.size
print(f"Original size: {w}x{h}")

# Analyze background:
# The background in Gemini generation is a gradient/solid dark studio backdrop (roughly gray/dark gray).
# Let's inspect column averages and row averages to detect woman's exact silhouette.
arr = np.array(im)[:, :, :3]

# Estimate background color from left (x=0..100) and right (x=w-100..w) columns
bg_left = arr[:, :100, :]
bg_right = arr[:, -100:, :]
bg_sample = np.concatenate([bg_left, bg_right], axis=1)
bg_mean = np.mean(bg_sample, axis=(0, 1))
print(f"Estimated background mean RGB: {bg_mean}")

# Calculate difference of each pixel from background color
# Also check local color variance
diff_from_bg = np.linalg.norm(arr - bg_mean, axis=2)

# Woman is centered horizontally (x from ~35% to ~65%)
# Let's find woman mask
woman_mask = (diff_from_bg > 35)

# Fill holes and smooth
from scipy import ndimage
try:
    import scipy.ndimage as ndimage
    woman_mask = ndimage.binary_fill_holes(woman_mask)
    woman_mask = ndimage.binary_opening(woman_mask, iterations=2)
    woman_mask = ndimage.binary_closing(woman_mask, iterations=4)
except ImportError:
    pass

# Find vertical bounding box of the woman
y_idx, x_idx = np.where(woman_mask)
min_x, max_x = np.min(x_idx), np.max(x_idx)
min_y, max_y = np.min(y_idx), np.max(y_idx)

print(f"Woman detected bbox: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
print(f"Woman width: {max_x - min_x}, height: {max_y - min_y}")
