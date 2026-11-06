from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Check(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []; self.ids = set(); self.refs = []; self.errors = []; self.h1 = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            if a['id'] in self.ids: self.errors.append('Duplicate id: ' + a['id'])
            self.ids.add(a['id'])
        for key in ('src', 'href'):
            if key in a: self.refs.append(a[key])
        if tag == 'h1': self.h1 += 1
        if tag == 'img' and 'alt' not in a: self.errors.append('Image missing alt')
        if tag not in void: self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in void: return
        if not self.stack or self.stack[-1] != tag:
            self.errors.append('Mismatched closing tag: ' + tag)
        else: self.stack.pop()
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in void: self.handle_endtag(tag)

check = Check(); check.feed((root/'index.html').read_text())
if check.stack: check.errors.append('Unclosed tags: ' + repr(check.stack))
if check.h1 != 1: check.errors.append('Expected exactly one h1')
for ref in check.refs:
    if ref.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:')): continue
    if ref.startswith('#'):
        if ref[1:] not in check.ids: check.errors.append('Missing fragment: ' + ref)
    elif not (root/urlsplit(ref).path).is_file(): check.errors.append('Missing file: ' + ref)
for script in [*root.glob('*.js'), *root.glob('*.mjs')]:
    for ref in re.findall(r'\bfrom\s+[\'\"](\./[^\'\"]+)[\'\"]', script.read_text()):
        if not (script.parent/urlsplit(ref).path).is_file(): check.errors.append('Missing module: ' + ref)
for css in root.glob('*.css'):
    for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css.read_text()):
        if not ref.startswith(('data:', 'https:', 'http:')) and not (root/ref).is_file(): check.errors.append('Missing CSS asset: ' + ref)
if check.errors: raise SystemExit('\n'.join(check.errors))
print('PASS: HTML nesting, unique IDs, heading, image alt text, local links, styles and assets.')
