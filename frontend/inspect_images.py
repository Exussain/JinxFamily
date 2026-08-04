import os

img_dir = "/root/jinxfamily/frontend/public/images/games"
files = os.listdir(img_dir)

for f in files:
    path = os.path.join(img_dir, f)
    if os.path.isfile(path):
        size = os.path.getsize(path)
        with open(path, "rb") as file:
            header = file.read(100)
        is_html = b"<html" in header or b"<!DOCTYPE" in header or b"<HTML" in header
        print(f"File: {f} | Size: {size} bytes | Is HTML: {is_html} | Header: {header[:30]}")
