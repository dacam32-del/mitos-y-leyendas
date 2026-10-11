#!/usr/bin/env python3
"""Genera miniaturas (fotos/thumbs/) para cada foto listada en catalogo.csv.
Uso: python3 scripts/miniaturas.py   (requiere Pillow: pip install pillow)"""
import csv, os
from PIL import Image
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
os.makedirs('fotos/thumbs', exist_ok=True)
for r in csv.DictReader(open('catalogo.csv', encoding='utf-8')):
    f = r.get('foto', '')
    if not f or not os.path.exists(f):
        continue
    out = 'fotos/thumbs/' + os.path.basename(f)
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        continue
    im = Image.open(f).convert('RGB'); im.thumbnail((360, 500))
    im.save(out, quality=78, optimize=True); print('miniatura', out)
