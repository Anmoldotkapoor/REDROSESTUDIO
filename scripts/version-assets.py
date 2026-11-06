"""Give changed browser assets fresh URLs when publishing static updates."""
from pathlib import Path
import hashlib
import re

root = Path(__file__).resolve().parents[1]
if (root / 'dist' / 'index.html').is_file():
    root = root / 'dist'

def version(name):
    return hashlib.sha256((root / name).read_bytes()).hexdigest()[:10]

app = root / 'app.js'
app.write_text(re.sub(r"from './brush-studio\.mjs(?:\?v=[^']*)?'", "from './brush-studio.mjs?v=" + version('brush-studio.mjs') + "'", app.read_text()))
index = root / 'index.html'
html = index.read_text()
for name in ('styles.css', 'app.js'):
    html = re.sub(re.escape(name) + r'(?:\?v=[^"\s]*)?(?=")', name + '?v=' + version(name), html)
index.write_text(html)
print('Versioned browser assets.')
