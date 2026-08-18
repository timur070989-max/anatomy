import os
from PIL import Image

uploads_dir = r"C:\Users\user\anatomy\server\uploads"

for p in ['male', 'female', 'child']:
    for kind in ['clean', 'organs']:
        fname = f"bodymap-{p}-{kind}.png"
        fpath = os.path.join(uploads_dir, fname)
        if os.path.exists(fpath):
            im = Image.open(fpath)
            bbox = im.getbbox()
            extrema = im.getextrema()
            print(f"{fname}: size={im.size}, mode={im.mode}, bbox={bbox}")
        else:
            print(f"{fname}: NOT FOUND!")
