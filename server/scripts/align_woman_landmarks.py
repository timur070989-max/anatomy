import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
im_c = Image.open(os.path.join(folder, "женшина.png"))
im_o = Image.open(os.path.join(folder, "органи.png"))

arr_c = np.array(im_c)
arr_o = np.array(im_o)

# Let's inspect horizontal width of the silhouette at each y row
alpha_c = arr_c[:, :, 3] > 10
alpha_o = arr_o[:, :, 3] > 10

widths_c = np.sum(alpha_c, axis=1) # width per row
widths_o = np.sum(alpha_o, axis=1)

# Find top of head (first row with width > 10)
top_head_c = np.where(widths_c > 10)[0][0]
top_head_o = np.where(widths_o > 10)[0][0]

# Find bottom
bottom_c = np.where(widths_c > 10)[0][-1]
bottom_o = np.where(widths_o > 10)[0][-1]

print(f"Clean body: top_head={top_head_c}, bottom={bottom_c}, total_height={bottom_c - top_head_c}")
print(f"Organs:     top_head={top_head_o}, bottom={bottom_o}, total_height={bottom_o - top_head_o}")

# Let's find shoulder width (widest row in upper 30%)
upper_c = widths_c[top_head_c : top_head_c + int((bottom_c - top_head_c)*0.35)]
shoulder_y_c = top_head_c + np.argmax(upper_c)
shoulder_w_c = np.max(upper_c)

upper_o = widths_o[top_head_o : top_head_o + int((bottom_o - top_head_o)*0.35)]
shoulder_y_o = top_head_o + np.argmax(upper_o)
shoulder_w_o = np.max(upper_o)

print(f"Clean: shoulder_y={shoulder_y_c}, shoulder_width={shoulder_w_c}")
print(f"Organs: shoulder_y={shoulder_y_o}, shoulder_width={shoulder_w_o}")

# Calculate scale ratio between clean and organs
scale_ratio = shoulder_w_c / shoulder_w_o
print(f"Calculated scale ratio (clean/organs): {scale_ratio:.4f}")
