import os
from PIL import Image

folder = r"C:\Users\user\OneDrive\Рабочий стол\женшина"
files = [f for f in os.listdir(folder) if f.lower().endswith('.jpg')]

for f in files:
    full_path = os.path.join(folder, f)
    with Image.open(full_path) as im:
        # Check center region vs edges
        print(f"{f}: size={im.size}, aspect={im.width / im.height:.2f}")
