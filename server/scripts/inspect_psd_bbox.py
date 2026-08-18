import os
from psd_tools import PSDImage
from PIL import Image

# Let's inspect man 900.psd in detail
base_path = r"C:\Users\user\Downloads\Telegram Desktop\WM Human Body\WM Human Body\Project Perfect"

# 1. Man PSD
man_psd = PSDImage.open(os.path.join(base_path, "мужчина", "man 900.psd"))
print(f"Man PSD dimensions: {man_psd.size}")

# Find which layer has the black shorts!
# In PSD, layer 0 was naked man, and another layer had the black shorts.
# A full clean clothed man = Layer with naked body + Layer with shorts!
# And the organs = The internal organ layers!

for i, layer in enumerate(man_psd):
    print(f"Layer {i}: bbox={layer.bbox}, size={layer.size}, visible={layer.is_visible()}")

# Let's create:
# A) Man Clean Clothed Body = Naked Body + Black Shorts (layers without organs)
# B) Man Organs = Organs layers positioned at their exact bbox on the (420, 900) canvas!
