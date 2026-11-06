"""Give changed browser assets fresh URLs when publishing static updates."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1]
if (root / 'dist' / 'index.html').is_file():
    root = root / 'dist'

def version(name):
    return hashlib.sha256((root / name).read_bytes()).hexdigest()[:10]

for entry, dependency in (('app.js', 'brush-studio.mjs'), ('academy.js', 'academy-data.mjs'), ('instagram.js', 'instagram-data.mjs'), ('app.js', 'instagram-links.mjs'), ('academy.js', 'instagram-links.mjs'), ('instagram.js', 'instagram-links.mjs')):
    script = root / entry
    if script.is_file():
        script.write_text(re.sub("from './" + re.escape(dependency) + r"(?:\?v=[^']*)?'", "from './" + dependency + '?v=' + version(dependency) + "'", script.read_text()))
for page in root.glob('*.html'):
    html = page.read_text()
    for name in ('styles.css', 'app.js', 'academy.css', 'academy.js', 'instagram.css', 'instagram.js'):
        if (root / name).is_file():
            html = re.sub(re.escape(name) + r'(?:\?v=[^"\s]*)?(?=")', name + '?v=' + version(name), html)
    page.write_text(html)
print('Versioned browser assets.')
