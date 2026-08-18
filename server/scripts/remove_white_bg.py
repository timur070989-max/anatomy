import os
import glob
from PIL import Image

uploads_dir = os.path.abspath(r"C:\Users\user\anatomy\server\uploads")
schema_files = glob.glob(os.path.join(uploads_dir, "schema-*.png"))

print(f"Found {len(schema_files)} schema files in {uploads_dir}")

for file_path in schema_files:
    fname = os.path.basename(file_path)
    print(f"Processing {fname}...")
    try:
        img = Image.open(file_path).convert("RGBA")
        datas = img.getdata()
        new_data = []

        # Remove white / near-white background
        # Threshold: if pixel is close to white (R>220, G>220, B>220 and saturation is low), make it transparent
        for item in datas:
            r, g, b, a = item
            if a == 0:
                new_data.append((r, g, b, 0))
                continue

            # Calculate brightness and color deviation
            min_c = min(r, g, b)
            max_c = max(r, g, b)
            diff = max_c - min_c

            if min_c > 240 and diff < 20:
                # Fully white background -> transparent
                new_data.append((r, g, b, 0))
            elif min_c > 210 and diff < 25:
                # Feathered edge / anti-aliasing
                alpha = int(255 * (1.0 - (min_c - 210) / 30.0))
                new_data.append((r, g, b, max(0, min(255, alpha))))
            else:
                new_data.append((r, g, b, a))

        img.putdata(new_data)
        img.save(file_path, "PNG")
        print(f"  -> Successfully saved transparent {fname}")
    except Exception as e:
        print(f"  -> Error processing {fname}: {e}")

print("All 2D schema images processed successfully!")
