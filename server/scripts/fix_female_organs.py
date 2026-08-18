import os
from PIL import Image

f_woman_in = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect\женщина\woman_in.png"
if os.path.exists(f_woman_in):
    im = Image.open(f_woman_in)
    print(f"woman_in.png size={im.size}, bbox={im.getbbox()}")
    # Let's save it directly as bodymap-female-organs.png!
    im.save(r"C:\Users\user\anatomy\server\uploads\bodymap-female-organs.png", "PNG")
    print("Saved bodymap-female-organs.png from woman_in.png!")
