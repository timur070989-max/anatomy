import os
from PIL import Image

f_child_clean = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900 (1).png"
f_child_organs = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900ч (1).png"

im1 = Image.open(f_child_clean)
im2 = Image.open(f_child_organs)

print(f"Child clean size: {im1.size}")
print(f"Child organs size: {im2.size}")

# Resize both to 400x923 so they are lightweight and load fast in browser
child_clean_resized = im1.resize((390, 900), Image.Resampling.LANCZOS)
child_organs_resized = im2.resize((390, 900), Image.Resampling.LANCZOS)

out_dir = r"C:\Users\user\anatomy\server\uploads"
child_clean_resized.save(os.path.join(out_dir, "bodymap-child-clean.png"), "PNG")
child_organs_resized.save(os.path.join(out_dir, "bodymap-child-organs.png"), "PNG")

print("Saved perfectly resized bodymap-child-clean.png and bodymap-child-organs.png!")
