import os
from PIL import Image

uploads_dir = r"C:\Users\user\anatomy\server\uploads"

for fname in ["bodymap-female-clean.png", "bodymap-female-organs.png"]:
    fpath = os.path.join(uploads_dir, fname)
    im = Image.open(fpath)
    print(f"{fname}: size={im.size}, mode={im.mode}, non-transparent bbox={im.getbbox()}")
