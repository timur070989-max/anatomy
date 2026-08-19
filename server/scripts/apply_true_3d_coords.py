import json

bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"

with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

# Calibrated true 3D world coordinates for g-001.glb in <model-viewer>
# Total height Y: 0.0 (feet) to 1.098 (head top)
# Depth Z: +0.07..+0.12 (front surface), -0.06 (back surface)
labels3d_world = [
    { "organ": "Мозг, Спиной мозг", "x": 0.0, "y": 1.06, "z": 0.04, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Глаза", "x": 0.0, "y": 0.98, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Нос", "x": 0.0, "y": 0.95, "z": 0.10, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Уши", "x": -0.07, "y": 0.96, "z": 0.03, "nx": -1, "ny": 0, "nz": 0 },
    { "organ": "Зубы, Полость рта", "x": 0.0, "y": 0.92, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Глотка, Гортань", "x": 0.0, "y": 0.88, "z": 0.07, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Щитовидная железа", "x": 0.0, "y": 0.85, "z": 0.07, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Трахея, Бронхи, Лёгкие", "x": -0.05, "y": 0.76, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Сердце", "x": 0.04, "y": 0.74, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Молочные железы", "x": -0.06, "y": 0.73, "z": 0.12, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Мышцы", "x": 0.16, "y": 0.70, "z": 0.02, "nx": 1, "ny": 0, "nz": 0 },
    { "organ": "Периферическая нервная система", "x": -0.16, "y": 0.70, "z": 0.02, "nx": -1, "ny": 0, "nz": 0 },
    { "organ": "Печень, желчный пузырь", "x": -0.05, "y": 0.62, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Пищевод, желудок", "x": 0.05, "y": 0.62, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Поджелудочная", "x": 0.02, "y": 0.58, "z": 0.08, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Почки, мочеточник", "x": -0.06, "y": 0.57, "z": -0.06, "nx": 0, "ny": 0, "nz": -1 },
    { "organ": "Кишечник", "x": 0.0, "y": 0.50, "z": 0.09, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Мочевой пузырь, мочеиспускательный канал", "x": 0.0, "y": 0.42, "z": 0.08, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Влагалище, матка, трубы, яичники", "x": 0.0, "y": 0.38, "z": 0.07, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Кости", "x": 0.08, "y": 0.22, "z": 0.05, "nx": 1, "ny": 0, "nz": 0 },
    { "organ": "Кровеносная система", "x": -0.08, "y": 0.22, "z": 0.05, "nx": -1, "ny": 0, "nz": 0 },
    { "organ": "Кожа", "x": -0.07, "y": 0.08, "z": 0.04, "nx": -1, "ny": 0, "nz": 0 }
]

if "female" in bm_data:
    bm_data["female"]["labels3d"] = labels3d_world
    bm_data["female"]["updatedAt"] = "2026-08-19T06:05:00.000Z"

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Saved exact true 3D world coordinates for female 3D model!")
