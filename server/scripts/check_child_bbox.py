import os
import glob
from PIL import Image

f1 = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\photo_2023-12-19_10-25-28 (1).png"
f2 = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\photo_2023-12-19_10-25-28 (1)при.png"
f3 = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900 (1).png"
f4 = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900ч (1).png"

for f in [f1, f2, f3, f4]:
    if os.path.exists(f):
        im = Image.open(f)
        bbox = im.getbbox()
        print(f"{os.path.basename(f)}: size={im.size}, non-zero bbox={bbox}")
