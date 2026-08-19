import struct
import json
import numpy as np

glb_path = r"C:\Users\user\anatomy\server\uploads\bodymap-female.glb"

with open(glb_path, "rb") as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack("<I4s", f.read(8))
    json_chunk = json.loads(f.read(chunk_len).decode("utf-8"))
    
    bin_len, bin_type = struct.unpack("<I4s", f.read(8))
    bin_data = f.read(bin_len)

# Extract all vertices
all_vertices = []

for mesh in json_chunk.get("meshes", []):
    for prim in mesh.get("primitives", []):
        pos_acc_idx = prim.get("attributes", {}).get("POSITION")
        if pos_acc_idx is not None:
            acc = json_chunk["accessors"][pos_acc_idx]
            bv = json_chunk["bufferViews"][acc["bufferView"]]
            byte_offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
            count = acc["count"]
            # 3 floats per vertex (12 bytes)
            verts = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
            all_vertices.append(verts)

all_v = np.concatenate(all_vertices, axis=0)
print(f"Total vertices: {len(all_v)}")
print(f"Min X, Y, Z: {np.min(all_v, axis=0)}")
print(f"Max X, Y, Z: {np.max(all_v, axis=0)}")

# In glTF, standard is Y-up or Z-up?
# Notice: Y is in [-0.138, 0.126] (depth ~0.26m)
# X is in [-0.215, 0.229] (width ~0.44m)
# Z is in [-1.098, 0.0] (height ~1.10m inverted!)
# So Z is the vertical axis pointing down from 0.0 (head) to -1.10 (heels)!
# And Y is front/back depth (front is positive Y or negative Y)!
# Let's inspect the front face:
print("Z range (height):", np.min(all_v[:, 2]), "to", np.max(all_v[:, 2]))
z_min, z_max = np.min(all_v[:, 2]), np.max(all_v[:, 2])
total_h = z_max - z_min

# In <model-viewer>, data-position is in the 3D space:
# If Z is vertical in the mesh, model-viewer might orient it or display it in local coordinates.
# Let's calculate proportional Z coordinates from head (z_max = 0.0) to feet (z_min = -1.098):
# Head top: z = 0.0
# Eyes: z = -0.07
# Nose: z = -0.10
# Mouth: z = -0.13
# Throat/Neck: z = -0.17
# Thyroid: z = -0.20
# Chest / Heart / Lungs: z = -0.30
# Liver / Stomach: z = -0.42
# Pancreas / Kidneys: z = -0.47
# Intestines / Navel: z = -0.52
# Bladder / Uterus / Pelvis: z = -0.60
# Thighs / Muscle: z = -0.75
# Knees / Bones: z = -0.88
# Feet / Skin: z = -1.05
