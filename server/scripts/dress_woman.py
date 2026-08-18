import os
from PIL import Image, ImageDraw, ImageFilter

base_img_path = r"C:\Users\user\anatomy\server\uploads\bodymap-female-clean.png"
out_img_path = r"C:\Users\user\anatomy\server\uploads\bodymap-female-clean.png"

im = Image.open(base_img_path).convert("RGBA")
w, h = im.size
print(f"Woman size: {w}x{h}")

# Let's inspect the woman image and draw a stylish, corporate dark-navy / royal-blue athletic dress or top + shorts / skirt
# In the original image:
# Torso & hips are between y = 290 and y = 520, x between 90 and 240
# Let's create an overlay for a modern corporate dress / athletic sportswear (matching the man's shorts and corporate World Medicine style)

overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)

# Corporate World Medicine navy & cyan colors
navy_color = (6, 25, 55, 255) # #061937
blue_primary = (0, 82, 156, 255) # #00529C
blue_accent = (0, 160, 227, 255) # #00A0E3

# 1. Dress / Skirt & Top extension:
# From chest (y=290) down to above the knees (y=520)
# Body contour points at hips and thighs
# Let's draw athletic dress / sportswear extending down to y=520 (covering hips and upper thighs modestly)

# Athletic dress / shorts contour:
skirt_points = [
    (118, 300), # chest left
    (96, 380),  # waist left
    (88, 430),  # hip left
    (82, 490),  # thigh left
    (86, 525),  # hem bottom-left
    (138, 530), # center left
    (165, 520), # center crotch/hem
    (192, 530), # center right
    (244, 525), # hem bottom-right
    (248, 490), # thigh right
    (242, 430), # hip right
    (234, 380), # waist right
    (212, 300), # chest right
]

# Draw smooth filled dress
draw.polygon(skirt_points, fill=navy_color)

# Draw elegant corporate blue side stripes and waistband
draw.line([(96, 380), (88, 430), (82, 490), (86, 525)], fill=blue_accent, width=3)
draw.line([(234, 380), (242, 430), (248, 490), (244, 525)], fill=blue_accent, width=3)

# Waistband
draw.line([(100, 395), (230, 395)], fill=blue_primary, width=5)
# Hem border
draw.line([(86, 525), (165, 520), (244, 525)], fill=blue_primary, width=4)

# Top / Bodice elegance:
# Chest neckline and straps
draw.polygon([(118, 300), (140, 340), (190, 340), (212, 300), (210, 395), (120, 395)], fill=navy_color)
# Straps
draw.polygon([(126, 220), (136, 220), (130, 310), (120, 310)], fill=navy_color)
draw.polygon([(194, 220), (204, 220), (210, 310), (200, 310)], fill=navy_color)
draw.line([(126, 220), (130, 310)], fill=blue_accent, width=2)
draw.line([(204, 220), (210, 310)], fill=blue_accent, width=2)

# Blend overlay with woman image respecting original silhouette mask (only draw inside woman body)
# Extract woman silhouette alpha
alpha = im.split()[3]

# Mask overlay by woman's body alpha
overlay_r, overlay_g, overlay_b, overlay_a = overlay.split()
# Combined alpha: minimum of overlay alpha and body alpha
import numpy as np
arr_overlay_a = np.array(overlay_a)
arr_body_a = np.array(alpha)
combined_a = np.minimum(arr_overlay_a, (arr_body_a > 30) * 255)
overlay.putalpha(Image.fromarray(combined_a.astype('uint8')))

# Composite onto base image
final_woman = Image.alpha_composite(im, overlay)
final_woman.save(out_img_path, "PNG")
print("Saved elegant dressed woman to bodymap-female-clean.png!")
