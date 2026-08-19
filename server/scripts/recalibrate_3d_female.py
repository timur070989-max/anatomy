import json
import os

bodymaps_path = r"C:\Users\user\anatomy\server\data\bodymaps.json"

with open(bodymaps_path, "r", encoding="utf-8") as f:
    bm_data = json.load(f)

# Calibrated 3D coordinates for g-001.glb (where Z is height from 0.0 at head to -1.05 at feet, Y is front surface ~0.08..0.12)
labels3d_g001 = [
    { "organ": "Мозг, Спиной мозг", "x": 0.0, "y": 0.04, "z": -0.03, "nx": 0, "ny": 0, "nz": 1 },
    { "organ": "Глаза", "x": 0.0, "y": 0.08, "z": -0.06, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Нос", "x": 0.0, "y": 0.09, "z": -0.08, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Уши", "x": -0.06, "y": 0.03, "z": -0.07, "nx": -1, "ny": 0, "nz": 0 },
    { "organ": "Зубы, Полость рта", "x": 0.0, "y": 0.08, "z": -0.10, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Глотка, Гортань", "x": 0.0, "y": 0.06, "z": -0.13, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Щитовидная железа", "x": 0.0, "y": 0.06, "z": -0.16, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Трахея, Бронхи, Лёгкие", "x": -0.04, "y": 0.07, "z": -0.22, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Сердце", "x": 0.03, "y": 0.08, "z": -0.24, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Молочные железы", "x": -0.05, "y": 0.09, "z": -0.25, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Мышцы", "x": 0.14, "y": 0.02, "z": -0.30, "nx": 1, "ny": 0, "nz": 0 },
    { "organ": "Периферическая нервная система", "x": -0.14, "y": 0.02, "z": -0.30, "nx": -1, "ny": 0, "nz": 0 },
    { "organ": "Печень, желчный пузырь", "x": -0.04, "y": 0.08, "z": -0.32, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Пищевод, желудок", "x": 0.04, "y": 0.08, "z": -0.33, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Поджелудочная", "x": 0.02, "y": 0.07, "z": -0.37, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Почки, мочеточник", "x": -0.05, "y": -0.04, "z": -0.38, "nx": 0, "ny": -1, "nz": 0 },
    { "organ": "Кишечник", "x": 0.0, "y": 0.08, "z": -0.42, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Мочевой пузырь, мочеиспускательный канал", "x": 0.0, "y": 0.07, "z": -0.50, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Влагалище, матка, трубы, яичники", "x": 0.0, "y": 0.06, "z": -0.54, "nx": 0, "ny": 1, "nz": 0 },
    { "organ": "Кровеносная система", "x": -0.08, "y": 0.05, "z": -0.70, "nx": -1, "ny": 0, "nz": 0 },
    { "organ": "Кости", "x": 0.08, "y": 0.05, "z": -0.70, "nx": 1, "ny": 0, "nz": 0 },
    { "organ": "Кожа", "x": 0.08, "y": 0.03, "z": -0.92, "nx": 1, "ny": 0, "nz": 0 }
]

if "female" in bm_data:
    bm_data["female"]["labels3d"] = labels3d_g001
    bm_data["female"]["updatedAt"] = "2026-08-19T05:49:00.000Z"

with open(bodymaps_path, "w", encoding="utf-8") as f:
    json.dump(bm_data, f, ensure_ascii=False, indent=2)

print("Calibrated 3D organ coordinates for g-001.glb!")
