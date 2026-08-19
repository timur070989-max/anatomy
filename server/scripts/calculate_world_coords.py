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

# Extract raw vertices
all_raw_verts = []
for mesh in json_chunk.get("meshes", []):
    for prim in mesh.get("primitives", []):
        pos_acc_idx = prim.get("attributes", {}).get("POSITION")
        if pos_acc_idx is not None:
            acc = json_chunk["accessors"][pos_acc_idx]
            bv = json_chunk["bufferViews"][acc["bufferView"]]
            byte_offset = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
            count = acc["count"]
            verts = np.frombuffer(bin_data[byte_offset : byte_offset + count * 12], dtype=np.float32).reshape(-1, 3)
            all_raw_verts.append(verts)

verts_raw = np.concatenate(all_raw_verts, axis=0)

# Matrix chain from Node 0 -> 1 -> 2 -> 3:
# In glTF, matrices are column-major 4x4
def get_node_matrix(node):
    if "matrix" in node:
        return np.array(node["matrix"], dtype=np.float32).reshape((4, 4), order="F")
    m = np.eye(4, dtype=np.float32)
    if "translation" in node:
        t = node["translation"]
        m[0, 3] = t[0]; m[1, 3] = t[1]; m[2, 3] = t[2]
    return m

m0 = get_node_matrix(json_chunk["nodes"][0])
m1 = get_node_matrix(json_chunk["nodes"][1])
m2 = get_node_matrix(json_chunk["nodes"][2])
m3 = get_node_matrix(json_chunk["nodes"][3])

world_matrix = m0 @ m1 @ m2 @ m3
print("Total World Matrix:\n", world_matrix)

# Transform vertices to world coordinates
ones = np.ones((len(verts_raw), 1), dtype=np.float32)
verts_homo = np.hstack([verts_raw, ones])
verts_world = (world_matrix @ verts_homo.T).T[:, :3]

print(f"\nWORLD COORDINATES (as seen in <model-viewer>):")
print(f"Min X, Y, Z: {np.min(verts_world, axis=0)}")
print(f"Max X, Y, Z: {np.max(verts_world, axis=0)}")
print(f"Center X, Y, Z: {np.mean(verts_world, axis=0)}")

min_w = np.min(verts_world, axis=0)
max_w = np.max(verts_world, axis=0)
print(f"Width (X): {max_w[0] - min_w[0]:.3f} (from {min_w[0]:.3f} to {max_w[0]:.3f})")
print(f"Height (Y): {max_w[1] - min_w[1]:.3f} (from {min_w[1]:.3f} to {max_w[1]:.3f})")
print(f"Depth (Z): {max_w[2] - min_w[2]:.3f} (from {min_w[2]:.3f} to {max_w[2]:.3f})")
