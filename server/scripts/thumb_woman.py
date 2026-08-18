import os
from PIL import Image

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
out_debug = r"C:\Users\user\anatomy\server\uploads\debug_woman"
os.makedirs(out_debug, exist_ok=True)

files = os.listdir(folder)

for f in files:
    full_path = os.path.join(folder, f)
    if os.path.isfile(full_path) and f.lower().endswith('.jpg'):
        with Image.open(full_path) as im:
            # Make a thumb of 400x218 to quickly examine
            thumb = im.copy()
            thumb.thumbnail((500, 300))
            # Clean filename for ascii
            name = f.encode('ascii', 'ignore').decode() or "file.jpg"
            save_name = os.path.join(out_debug, f"thumb_{files.index(f)}_{name}")
            thumb.save(save_name, "JPEG")
            print(f"Processed [{files.index(f)}] {f} -> thumb size {thumb.size}")
