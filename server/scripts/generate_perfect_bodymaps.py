import os
from psd_tools import PSDImage
from PIL import Image

base_path = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect"
out_dir = r"C:\Users\user\anatomy\server\uploads"

# ==========================================
# 1. MAN (Мужчина): canvas (420, 900)
# ==========================================
man_psd = PSDImage.open(os.path.join(base_path, "мужчина", "man 900.psd"))
print("Building MAN layers...")

# Clean clothed body: Layer 0 (body) + Layer 34 (shorts)
man_clean = Image.new("RGBA", (420, 900), (0, 0, 0, 0))
layer_0_img = man_psd[0].composite()
layer_34_img = man_psd[34].composite() # Black shorts

# Paste at exact bbox
man_clean.paste(layer_0_img, (man_psd[0].bbox[0], man_psd[0].bbox[1]), layer_0_img)
man_clean.paste(layer_34_img, (man_psd[34].bbox[0], man_psd[34].bbox[1]), layer_34_img)

# Man organs layer: paste all organ layers at exact bbox
man_organs = Image.new("RGBA", (420, 900), (0, 0, 0, 0))
# Organs layers: 7..23, 25..29, 31..32, 35..38
organ_indices = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28, 29, 31, 32, 35, 36, 37, 38]
for idx in organ_indices:
    l_img = man_psd[idx].composite()
    if l_img:
        bbox = man_psd[idx].bbox
        man_organs.paste(l_img, (bbox[0], bbox[1]), l_img)

man_clean.save(os.path.join(out_dir, "bodymap-male-clean.png"), "PNG")
man_organs.save(os.path.join(out_dir, "bodymap-male-organs.png"), "PNG")
print("  -> Saved bodymap-male-clean.png and bodymap-male-organs.png (420x900)")

# ==========================================
# 2. WOMAN (Женщина): canvas (331, 899)
# ==========================================
woman_psd = PSDImage.open(os.path.join(base_path, "женщина", "органы.psd"))
print("Building WOMAN layers...")

# Clean body: Layer 0 (swimsuit body)
woman_clean = Image.new("RGBA", (331, 899), (0, 0, 0, 0))
w_layer_0 = woman_psd[0].composite()
woman_clean.paste(w_layer_0, (woman_psd[0].bbox[0], woman_psd[0].bbox[1]), w_layer_0)

# Woman organs: Layers 2..23
woman_organs = Image.new("RGBA", (331, 899), (0, 0, 0, 0))
for idx in range(2, 24):
    w_org_img = woman_psd[idx].composite()
    if w_org_img:
        bbox = woman_psd[idx].bbox
        woman_organs.paste(w_org_img, (bbox[0], bbox[1]), w_org_img)

woman_clean.save(os.path.join(out_dir, "bodymap-female-clean.png"), "PNG")
woman_organs.save(os.path.join(out_dir, "bodymap-female-organs.png"), "PNG")
print("  -> Saved bodymap-female-clean.png and bodymap-female-organs.png (331x899)")

# ==========================================
# 3. CHILD (Ребёнок): canvas (390, 900)
# ==========================================
f_child_clean = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900 (1).png"
f_child_organs = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Вектор\Образцы (обнов)\ребенок 900ч (1).png"

im_ch_clean = Image.open(f_child_clean)
im_ch_org = Image.open(f_child_organs)

child_clean = im_ch_clean.resize((390, 900), Image.Resampling.LANCZOS)
child_organs = im_ch_org.resize((390, 900), Image.Resampling.LANCZOS)

child_clean.save(os.path.join(out_dir, "bodymap-child-clean.png"), "PNG")
child_organs.save(os.path.join(out_dir, "bodymap-child-organs.png"), "PNG")
print("  -> Saved bodymap-child-clean.png and bodymap-child-organs.png (390x900)")

print("\nALL PERFECT BODYMAP ASSETS GENERATED!")
