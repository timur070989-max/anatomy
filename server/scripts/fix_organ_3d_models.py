import json
import os

entries_path = r"C:\Users\user\anatomy\server\data\entries.json"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

# List all glb files in uploads
glb_files = [f for f in os.listdir(uploads_dir) if f.endswith(".glb") or f.endswith(".gltf")]
print("Available 3D models in server/uploads:")
for g in glb_files:
    size_mb = os.path.getsize(os.path.join(uploads_dir, g)) / (1024 * 1024)
    print(f"  - {g} ({size_mb:.2f} MB)")

with open(entries_path, "r", encoding="utf-8") as f:
    entries = json.load(f)

print(f"\nChecking all {len(entries)} entries for system vs modelUrl mismatches...")

system_to_model = {
    "сердце": "/uploads/organ-heart.glb",
    "мозг, спиной мозг": "/uploads/organ-brain.glb",
    "глаза": "/uploads/organ-eye.glb",
    "нос": "/uploads/organ-nose.glb",
    "уши": "/uploads/organ-ear.glb",
    "зубы, полость рта": "/uploads/organ-mouth.glb",
    "трахея, бронхи, лёгкие": "/uploads/organ-lungs.glb",
    "печень, желчный пузырь": "/uploads/organ-liver.glb",
    "пищевод, желудок": "/uploads/organ-stomach.glb",
    "почки, мочеточник": "/uploads/organ-kidney.glb",
    "кишечник": "/uploads/organ-intestine.glb",
    "влагалище, матка, трубы, яичники": "/uploads/organ-uterus.glb",
    "щитовидная железа": "/uploads/organ-thyroid.glb",
    "глотка, гортань": "/uploads/organ-larynx.glb",
    "скелет": "/uploads/organ-skeleton.glb",
    "кости": "/uploads/organ-skeleton.glb"
}

mismatches = []
fixed_count = 0

for e in entries:
    sys = (e.get("system") or "").lower().strip()
    model = (e.get("modelUrl") or "").strip()
    
    # Check if system is Heart
    if "сердц" in sys:
        if model != "/uploads/organ-heart.glb":
            mismatches.append({
                "id": e.get("id"),
                "title": e.get("title"),
                "system": e.get("system"),
                "wrong_model": model,
                "correct_model": "/uploads/organ-heart.glb"
            })
            e["modelUrl"] = "/uploads/organ-heart.glb"
            fixed_count += 1
            
    # Check other systems if model exists
    for key, correct_glb in system_to_model.items():
        if key in sys and os.path.exists(os.path.join(uploads_dir, os.path.basename(correct_glb))):
            if model and model != correct_glb and not any(k in model for k in key.split(",")):
                mismatches.append({
                    "id": e.get("id"),
                    "title": e.get("title"),
                    "system": e.get("system"),
                    "wrong_model": model,
                    "correct_model": correct_glb
                })
                e["modelUrl"] = correct_glb
                fixed_count += 1

print(f"\nTotal mismatched models found and fixed: {len(mismatches)}")
for m in mismatches:
    print(f"  Fixed [{m['id']} - {m['title']}]: {m['wrong_model']} -> {m['correct_model']}")

# Save fixed entries.json
with open(entries_path, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)

print("\nSuccessfully saved fixed entries.json!")
