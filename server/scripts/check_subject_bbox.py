import os
from PIL import Image
import numpy as np

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
base_path = os.path.join(folder, "Gemini_Generated_Image_33cmpk33cmpk33cm.jpg")

im = Image.open(base_path)
print(f"Base size: {im.size}")

# Let's inspect background color (corners)
corners = [
    im.getpixel((10, 10)),
    im.getpixel((im.width - 10, 10)),
    im.getpixel((10, im.height - 10)),
    im.getpixel((im.width - 10, im.height - 10))
]
print(f"Corner colors: {corners}")

# Let's find where the subject is by checking difference from background color
bg_color = np.array(corners[0][:3])
arr = np.array(im)[:, :, :3]
diff = np.max(np.abs(arr.astype(int) - bg_color.astype(int)), axis=2)

subject_mask = diff > 25
y_indices, x_indices = np.where(subject_mask)

if len(x_indices) > 0:
    min_x, max_x = np.min(x_indices), np.max(x_indices)
    min_y, max_y = np.min(y_indices), np.max(y_indices)
    print(f"Subject bounding box: x=[{min_x}, {max_x}], y=[{min_y}, {max_y}]")
    print(f"Subject width={max_x - min_x}, height={max_y - min_y}")
    
    # Let's crop the subject with some margin
    margin = 30
    crop_box = (
        max(0, min_x - margin),
        max(0, min_y - margin),
        min(im.width, max_x + margin),
        min(im.height, max_y + margin)
    )
    cropped = im.crop(crop_box)
    print(f"Cropped subject size: {cropped.size}")
