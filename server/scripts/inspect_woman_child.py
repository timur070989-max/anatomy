import os
from psd_tools import PSDImage
from PIL import Image

base_path = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect"

# 1. Woman
woman_psd = PSDImage.open(os.path.join(base_path, "женщина", "органы.psd"))
print(f"Woman PSD dimensions: {woman_psd.size}")
for i, layer in enumerate(woman_psd):
    print(f"Woman Layer {i}: name={layer.name}, bbox={layer.bbox}, size={layer.size}, visible={layer.is_visible()}")

# 2. Child: let's inspect all files in 'Вектор' and 'Project Perfect' for child
child_candidates = [
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900.png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900 (1).png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900ч (1).png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\photo.png",
]

for cp in child_candidates:
    if os.path.exists(cp):
        im = Image.open(cp)
        print(f"Child Candidate {os.path.basename(cp)}: size={im.size}, mode={im.mode}")
