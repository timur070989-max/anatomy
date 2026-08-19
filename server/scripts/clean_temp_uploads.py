import os
import glob

uploads_dir = r"C:\Users\user\anatomy\server\uploads"

# Clean up temp psd debug slices
patterns = [
    "man_layer_*.png",
    "man_psd_layer_*.png",
    "woman_layer_*.png",
    "woman_psd_layer_*.png",
    "thumb_*.png",
    "thumb_*.jpg",
]

removed_count = 0
for pat in patterns:
    for f in glob.glob(os.path.join(uploads_dir, pat)):
        try:
            os.remove(f)
            removed_count += 1
        except Exception:
            pass

# Also remove debug_woman and slices dirs if exist
import shutil
for d in ["debug_woman", "slices"]:
    dp = os.path.join(uploads_dir, d)
    if os.path.exists(dp):
        shutil.rmtree(dp)

print(f"Cleaned up {removed_count} temporary PSD debug files from uploads.")
