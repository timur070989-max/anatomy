import json
import os

entries_path = r"C:\Users\user\anatomy\server\data\entries.json"
uploads_dir = r"C:\Users\user\anatomy\server\uploads"

with open(entries_path, "r", encoding="utf-8") as f:
    entries = json.load(f)

# Exact clean system mappings
for e in entries:
    sys = (e.get("system") or "").lower().strip()
    title = (e.get("title") or "").lower().strip()
    
    # 1. Heart (Сердце)
    if "сердц" in sys or "сердечн" in title or "ибс" in title or "инфаркт" in title or "стенокардия" in title or "аритми" in title:
        e["modelUrl"] = "/uploads/organ-heart.glb"
        
    # 2. Brain (Мозг, Спиной мозг)
    elif "мозг" in sys:
        e["modelUrl"] = "/uploads/organ-brain.glb"
        
    # 3. Eyes (Глаза)
    elif "глаз" in sys:
        e["modelUrl"] = "/uploads/organ-eye.glb"
        
    # 4. Nose (Нос) - exact word check
    elif sys == "нос" or sys.startswith("нос ") or sys.endswith(" нос"):
        e["modelUrl"] = "/uploads/organ-nose.glb"
        
    # 5. Ears (Уши)
    elif "уши" in sys or "ухо" in sys:
        e["modelUrl"] = "/uploads/organ-ear.glb"
        
    # 6. Mouth / Teeth (Зубы, Полость рта)
    elif "зуб" in sys or "рот" in sys:
        e["modelUrl"] = "/uploads/organ-mouth.glb"
        
    # 7. Lungs / Trachea (Трахея, Бронхи, Лёгкие)
    elif "легк" in sys or "лёгк" in sys or "бронх" in sys or "трахе" in sys:
        e["modelUrl"] = "/uploads/organ-lungs.glb"
        
    # 8. Liver / Gallbladder (Печень, желчный пузырь)
    elif "печен" in sys or "желчн" in sys:
        e["modelUrl"] = "/uploads/organ-liver.glb"
        
    # 9. Stomach / Esophagus (Пищевод, желудок)
    elif "желуд" in sys or "пищевод" in sys:
        e["modelUrl"] = "/uploads/organ-stomach.glb"
        
    # 10. Kidney (Почки, мочеточник)
    elif "почк" in sys or "мочеточ" in sys:
        e["modelUrl"] = "/uploads/organ-kidney.glb"
        
    # 11. Intestine (Кишечник)
    elif "кишеч" in sys:
        e["modelUrl"] = "/uploads/organ-intestine.glb"
        
    # 12. Uterus / Ovaries (Влагалище, матка, трубы, яичники)
    elif "матк" in sys or "яичник" in sys or "влагалищ" in sys:
        e["modelUrl"] = "/uploads/organ-uterus.glb"
        
    # 13. Thyroid (Щитовидная железа)
    elif "щитовид" in sys:
        e["modelUrl"] = "/uploads/organ-thyroid.glb"
        
    # 14. Larynx / Pharynx (Глотка, Гортань)
    elif "гортан" in sys or "глотк" in sys:
        e["modelUrl"] = "/uploads/organ-larynx.glb"
        
    # 15. Circulatory System (Кровеносная система)
    elif "кровеносн" in sys:
        e["modelUrl"] = "/uploads/organ-circulatory-system.glb" if os.path.exists(os.path.join(uploads_dir, "organ-circulatory-system.glb")) else "/uploads/organ-heart.glb"
        
    # 16. Skeleton / Bones (Кости, Скелет)
    elif "кост" in sys or "скелет" in sys or "сустав" in sys:
        e["modelUrl"] = "/uploads/organ-skeleton.glb"

with open(entries_path, "w", encoding="utf-8") as f:
    json.dump(entries, f, ensure_ascii=False, indent=2)

print("Accurately mapped all entries to their true 3D organ models!")
