import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
base_img_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")
im = Image.open(base_img_path)
arr = np.array(im)[:, :, :3]

# Compute column-wise standard deviation or mean difference from gray
diff_from_gray = np.abs(arr[:, :, 0] - arr[:, :, 1]) + np.abs(arr[:, :, 1] - arr[:, :, 2])
col_scores = np.mean(diff_from_gray, axis=0) # score per column

# Where are the non-gray columns (the woman with skin tones and blue attire)?
active_cols = np.where(col_scores > 3.0)[0]
print(f"Active columns with colored subject: x=[{active_cols[0]}, {active_cols[-1]}] (out of {im.width})")

row_scores = np.mean(diff_from_gray[:, active_cols[0]:active_cols[-1]], axis=1)
active_rows = np.where(row_scores > 3.0)[0]
print(f"Active rows with colored subject: y=[{active_rows[0]}, {active_rows[-1]}] (out of {im.height})")
