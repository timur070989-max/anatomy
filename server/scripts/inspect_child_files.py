import os
from PIL import Image

child_files = [
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900.png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900 (1).png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900ч (1).png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect\Final\wm.swf",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\photo_2023-12-19_10-25-28 (1).png",
    r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\photo_2023-12-19_10-25-28 (1)при.png",
]

for cf in child_files:
    if os.path.exists(cf) and cf.endswith('.png'):
        im = Image.open(cf)
        print(f"File {os.path.basename(cf)}: size={im.size}, mode={im.mode}")
        # Save a small thumbnail to check
        im.thumbnail((400, 400))
        im.save(os.path.join(r"C:\Users\user\anatomy\server\uploads", f"thumb_{os.path.basename(cf)}"))
