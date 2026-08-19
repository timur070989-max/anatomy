import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
im_c = Image.open(os.path.join(folder, "женшина.png"))
im_o = Image.open(os.path.join(folder, "органи.png"))

print("im_c size:", im_c.size)
print("im_o size:", im_o.size)

# Let's inspect center of mass of both images
arr_c = np.array(im_c)
y_c, x_c = np.where(arr_c[:, :, 3] > 20)

arr_o = np.array(im_o)
y_o, x_o = np.where(arr_o[:, :, 3] > 20)

print(f"im_c center of mass: x={np.mean(x_c):.1f}, y={np.mean(y_c):.1f}")
print(f"im_o center of mass: x={np.mean(x_o):.1f}, y={np.mean(y_o):.1f}")

# Let's check where the colors are:
# In im_c: what are the average RGB values across vertical 10-percent bands?
for pct in range(0, 100, 10):
    y1 = int(np.min(y_c) + (np.max(y_c) - np.min(y_c)) * (pct / 100.0))
    y2 = int(np.min(y_c) + (np.max(y_c) - np.min(y_c)) * ((pct + 10) / 100.0))
    band = arr_c[y1:y2, np.min(x_c):np.max(x_c), :]
    alpha_mask = band[:, :, 3] > 20
    if np.sum(alpha_mask) > 0:
        mean_rgb = np.mean(band[alpha_mask, :3], axis=0)
        print(f"im_c band {pct:2d}%-{pct+10:2d}% (y={y1}..{y2}): mean_rgb={[int(c) for c in mean_rgb]}")

print("\n--- im_o ---")
for pct in range(0, 100, 10):
    y1 = int(np.min(y_o) + (np.max(y_o) - np.min(y_o)) * (pct / 100.0))
    y2 = int(np.min(y_o) + (np.max(y_o) - np.min(y_o)) * ((pct + 10) / 100.0))
    band = arr_o[y1:y2, np.min(x_o):np.max(x_o), :]
    alpha_mask = band[:, :, 3] > 20
    if np.sum(alpha_mask) > 0:
        mean_rgb = np.mean(band[alpha_mask, :3], axis=0)
        print(f"im_o band {pct:2d}%-{pct+10:2d}% (y={y1}..{y2}): mean_rgb={[int(c) for c in mean_rgb]}")
