import os
import re
import requests
from urllib.parse import urljoin, urlparse, unquote
from bs4 import BeautifulSoup

BASE = "https://labs.chaingpt.org/index.html"
ROOT = os.getcwd()
ASSET_DIR = os.path.join(ROOT, "assets")
os.makedirs(ASSET_DIR, exist_ok=True)

session = requests.Session()
session.headers["User-Agent"] = "Mozilla/5.0 (compatible; AssetDownloader/1.0)"

response = session.get(BASE, timeout=30)
response.raise_for_status()

with open("index.html", "wb") as f:
    f.write(response.content)

soup = BeautifulSoup(response.text, "html.parser")
urls = set()

for tag in soup.find_all(src=True):
    urls.add(urljoin(BASE, tag["src"]))

for tag in soup.find_all(href=True):
    href = tag["href"].strip()
    if href and not href.startswith(("mailto:", "tel:", "javascript:", "#")):
        urls.add(urljoin(BASE, href))

for tag in soup.find_all("video"):
    if tag.get("poster"):
        urls.add(urljoin(BASE, tag["poster"]))

for tag in soup.find_all("source", src=True):
    urls.add(urljoin(BASE, tag["src"]))

for url in sorted(urls):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        continue

    # Only download files, not navigation pages.
    if parsed.netloc == "labs.chaingpt.org" and not re.search(
        r"\.(css|js|png|jpe?g|gif|svg|webp|woff2?|ttf|otf|mp4|webm|ico)(?:$|\?)",
        parsed.path, re.I
    ):
        continue

    name = unquote(os.path.basename(parsed.path)) or "asset"
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    folder = os.path.join(ASSET_DIR, parsed.netloc)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, name)

    try:
        r = session.get(url, timeout=45)
        if r.ok and r.content:
            with open(path, "wb") as f:
                f.write(r.content)
            print("Downloaded:", url)
        else:
            print("Skipped:", r.status_code, url)
    except Exception as e:
        print("Failed:", url, "-", e)

print("\nFinished. Check the assets folder for downloaded files.")
