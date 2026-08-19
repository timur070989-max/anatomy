import json
import struct
import numpy as np

glb_path = r"C:\Users\user\anatomy\server\uploads\bodymap-female.glb"

with open(glb_path, "rb") as f:
    f.seek(12)
    chunk_len, chunk_type = struct.unpack("<I4s", f.read(8))
    json_chunk = json.loads(f.read(chunk_len).decode("utf-8"))

print("Nodes in g-001.glb:")
for i, n in enumerate(json_chunk.get("nodes", [])):
    print(f"Node {i}: name={n.get('name')}, mesh={n.get('mesh')}, matrix={n.get('matrix')}, rotation={n.get('rotation')}, scale={n.get('scale')}, translation={n.get('translation')}")
