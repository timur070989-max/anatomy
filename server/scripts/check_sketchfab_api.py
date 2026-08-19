import requests

url = "https://api.sketchfab.com/v3/models/3b7f484252b144aa82af34d23bce7c67"
res = requests.get(url)
print("Status:", res.status_code)
if res.status_code == 200:
    data = res.json()
    print("Name:", data.get("name"))
    print("Is downloadable:", data.get("isDownloadable"))
    print("License:", data.get("license", {}).get("label"))
    print("Viewer URL:", data.get("viewerUrl"))
    print("Thumbnails:", [i.get("url") for i in data.get("thumbnails", {}).get("images", [])[:3]])
