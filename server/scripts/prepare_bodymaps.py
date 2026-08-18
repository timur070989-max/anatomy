import os
import shutil
from PIL import Image

base_dir = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

# 1. Woman Clean and Organs
woman_clean_src = os.path.join(base_dir, "Project Perfect", "женщина", "женщина.png")
woman_organs_src = os.path.join(base_dir, "Project Perfect", "женщина", "woman_in.png")

if os.path.exists(woman_clean_src):
    shutil.copy2(woman_clean_src, os.path.join(uploads_dir, "bodymap-female-clean.png"))
    print("Saved bodymap-female-clean.png")

if os.path.exists(woman_organs_src):
    shutil.copy2(woman_organs_src, os.path.join(uploads_dir, "bodymap-female-organs.png"))
    print("Saved bodymap-female-organs.png")

# 2. Child Clean and Organs
child_clean_src = os.path.join(base_dir, "Вектор", "Образцы (обнов)", "ребенок 900.png")
child_organs_src = os.path.join(base_dir, "Вектор", "Образцы (обнов)", "ребенок 900 (1).png")

if os.path.exists(child_clean_src):
    shutil.copy2(child_clean_src, os.path.join(uploads_dir, "bodymap-child-clean.png"))
    print("Saved bodymap-child-clean.png")

if os.path.exists(child_organs_src):
    shutil.copy2(child_organs_src, os.path.join(uploads_dir, "bodymap-child-organs.png"))
    print("Saved bodymap-child-organs.png")

# 3. Man Clean and Organs (from PSD layers or Vector)
# Let's inspect man_psd_layer_0 and others
man_clean_layer = os.path.join(uploads_dir, "man_psd_layer_0.png")
if os.path.exists(man_clean_layer):
    shutil.copy2(man_clean_layer, os.path.join(uploads_dir, "bodymap-male-clean.png"))
    print("Saved bodymap-male-clean.png")

# For man organs, let's composite all organ layers (from layer 1 to 32)
from psd_tools import PSDImage
man_psd_path = os.path.join(base_dir, "Project Perfect", "мужчина", "man 900.psd")
if os.path.exists(man_psd_path):
    psd = PSDImage.open(man_psd_path)
    # Composite all layers (which has full man with organs)
    full_man = psd.composite()
    full_man.save(os.path.join(uploads_dir, "bodymap-male-organs.png"))
    print("Saved bodymap-male-organs.png")

print("All bodymap clean and organ layers ready!")
