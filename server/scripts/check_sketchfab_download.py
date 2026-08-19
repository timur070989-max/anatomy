import requests

url = "https://api.sketchfab.com/v3/models/3b7f484252b144aa82af34d23bce7c67/download"
res = requests.get(url)
print("Download status:", res.status_code)
print("Download body:", res.text)
