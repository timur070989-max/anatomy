import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
im_c = Image.open(os.path.join(folder, "женшина.png"))
im_o = Image.open(os.path.join(folder, "органи.png"))

print(f"im_c: {im_c.size}, mode={im_c.mode}")
print(f"im_o: {im_o.size}, mode={im_o.mode}")

# Let's inspect where pixels have opacity > 0
arr_c = np.array(im_c)
arr_o = np.array(im_o)

# Check alpha channel distribution
print("Clean alpha min/max/mean:", np.min(arr_c[:,:,3]), np.max(arr_c[:,:,3]), np.mean(arr_c[:,:,3]))
print("Organs alpha min/max/mean:", np.min(arr_o[:,:,3]), np.max(arr_o[:,:,3]), np.mean(arr_o[:,:,3]))

# Let's inspect background RGB of im_c
print("Corner (0,0) RGB:", arr_c[0, 0])
print("Corner (1535, 1023) RGB:", arr_c[1023, 1535])

# In im_c, is there a checkerboard or white/black background?
# Let's check unique RGB colors in outer 20 pixels
corners = np.concatenate([arr_c[:20, :, :], arr_c[-20:, :, :], arr_c[:, :20, :], arr_c[:, -20:, :]], axis=0)
print("Border sample RGB mean:", np.mean(corners, axis=(0,1)))
