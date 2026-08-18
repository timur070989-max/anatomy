import os
from PIL import Image

uploads_dir = r"C:\Users\user\anatomy\server\uploads"

profiles = ['male', 'female', 'child']

for p in profiles:
    clean_f = os.path.join(uploads_dir, f"bodymap-{p}-clean.png")
    organs_f = os.path.join(uploads_dir, f"bodymap-{p}-organs.png")

    img_clean = Image.open(clean_f).convert("RGBA")
    img_organs = Image.open(organs_f).convert("RGBA")

    print(f"{p}: clean size = {img_clean.size}, organs size = {img_organs.size}")

    # Ensure same size
    target_w = max(img_clean.width, img_organs.width)
    target_h = max(img_clean.height, img_organs.height)

    # Pad or resize to identical canvas size
    canvas_clean = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas_clean.paste(img_clean, ((target_w - img_clean.width) // 2, (target_h - img_clean.height) // 2))

    canvas_organs = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    canvas_organs.paste(img_organs, ((target_w - img_organs.width) // 2, (target_h - img_organs.height) // 2))

    # Remove white background if any
    def make_transparent(img):
        datas = img.getdata()
        new_data = []
        for item in datas:
            r, g, b, a = item
            if a == 0:
                new_data.append((r, g, b, 0))
                continue
            min_c = min(r, g, b)
            max_c = max(r, g, b)
            diff = max_c - min_c
            if min_c > 240 and diff < 20:
                new_data.append((r, g, b, 0))
            elif min_c > 215 and diff < 25:
                alpha = int(255 * (1.0 - (min_c - 215) / 25.0))
                new_data.append((r, g, b, max(0, min(255, alpha))))
            else:
                new_data.append((r, g, b, a))
        img.putdata(new_data)
        return img

    canvas_clean = make_transparent(canvas_clean)
    canvas_organs = make_transparent(canvas_organs)

    canvas_clean.save(clean_f, "PNG")
    canvas_organs.save(organs_f, "PNG")
    print(f"  -> Aligned and saved {p} ({target_w}x{target_h})")
