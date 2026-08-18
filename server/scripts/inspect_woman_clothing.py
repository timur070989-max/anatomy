import os
from PIL import Image
from psd_tools import PSDImage

base = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect\женщина"

im_png = Image.open(os.path.join(base, "женщина.png"))
print(f"женщина.png size={im_png.size}, mode={im_png.mode}")

im_jpg = Image.open(os.path.join(base, "женщина.jpg"))
print(f"женщина.jpg size={im_jpg.size}, mode={im_jpg.mode}")

psd = PSDImage.open(os.path.join(base, "органы.psd"))
for i, l in enumerate(psd):
    print(f"Layer {i}: name={l.name}, bbox={l.bbox}, size={l.size}")
