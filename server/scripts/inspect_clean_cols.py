import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
im_c = Image.open(os.path.join(folder, "женшина.png"))
arr = np.array(im_c)

# Let's inspect alpha and non-zero pixels horizontally
alpha = arr[:, :, 3] > 10
col_counts = np.sum(alpha, axis=0)

print(f"Total columns: {len(col_counts)}")
for x in range(0, len(col_counts), 50):
    print(f"Col x={x:4d}: pixels={col_counts[x]:4d}")
