import os
from PIL import Image

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"

f_clean = os.path.join(folder, "женшина.png")
f_organs = os.path.join(folder, "органи.png")

im_clean = Image.open(f_clean)
im_organs = Image.open(f_organs)

print(f"женшина.png: size={im_clean.size}, format={im_clean.format}, mode={im_clean.mode}, bbox={im_clean.getbbox()}")
print(f"органи.png: size={im_organs.size}, format={im_organs.format}, mode={im_organs.mode}, bbox={im_organs.getbbox()}")
