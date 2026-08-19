import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
im_c = Image.open(os.path.join(folder, "женшина.png"))
im_o = Image.open(os.path.join(folder, "органи.png"))

arr_c = np.array(im_c)
arr_o = np.array(im_o)

mask_c = arr_c[:, :, 3] > 10
y_c, x_c = np.where(mask_c)

mask_o = arr_o[:, :, 3] > 10
y_o, x_o = np.where(mask_o)

print(f"Woman body active bbox: x=[{np.min(x_c)}, {np.max(x_c)}] (width={np.max(x_c)-np.min(x_c)}), y=[{np.min(y_c)}, {np.max(y_c)}] (height={np.max(y_c)-np.min(y_c)})")
print(f"Organs active bbox: x=[{np.min(x_o)}, {np.max(x_o)}] (width={np.max(x_o)-np.min(x_o)}), y=[{np.min(y_o)}, {np.max(y_o)}] (height={np.max(y_o)-np.min(y_o)})")

# Let's crop both to their exact subject bounding boxes (with a consistent padding)
crop_c = im_c.crop((np.min(x_c), np.min(y_c), np.max(x_c)+1, np.max(y_c)+1))
crop_o = im_o.crop((np.min(x_o), np.min(y_o), np.max(x_o)+1, np.max(y_o)+1))

print(f"Woman body cropped size: {crop_c.size}")
print(f"Organs cropped size: {crop_o.size}")
