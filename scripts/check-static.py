from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import urlsplit

root = Path(__file__).resolve().parents[1]
void = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Check(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []; self.ids = set(); self.refs = []; self.errors = []; self.h1 = 0; self.aria = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            if a['id'] in self.ids: self.errors.append('Duplicate id: ' + a['id'])
            self.ids.add(a['id'])
        for key in ('src', 'href'):
            if key in a: self.refs.append(a[key])
        for key in ('aria-labelledby', 'aria-describedby', 'aria-controls'):
            self.aria.extend(a.get(key, '').split())
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

pages = {}
for page in root.glob('*.html'):
    check = Check(); check.feed(page.read_text()); pages[page.name] = check
    if check.stack: check.errors.append('Unclosed tags: ' + repr(check.stack))
    if check.h1 != 1: check.errors.append('Expected exactly one h1')
errors = []
for name, check in pages.items():
    for ref in check.aria:
        if ref not in check.ids: check.errors.append('Missing ARIA target: ' + ref)
    for ref in check.refs:
        if ref.startswith(('http:', 'https:', 'mailto:', 'tel:', 'data:')): continue
        parsed = urlsplit(ref)
        if not parsed.path:
            if parsed.fragment and parsed.fragment not in check.ids: check.errors.append('Missing fragment: ' + ref)
        elif not (root/parsed.path).is_file(): check.errors.append('Missing file: ' + ref)
        elif parsed.fragment and parsed.path in pages and parsed.fragment not in pages[parsed.path].ids:
            check.errors.append('Missing page fragment: ' + ref)
    errors.extend(name + ': ' + error for error in check.errors)
for script in [*root.glob('*.js'), *root.glob('*.mjs')]:
    for ref in re.findall(r'\bfrom\s+[\'\"](\./[^\'\"]+)[\'\"]', script.read_text()):
        if not (script.parent/urlsplit(ref).path).is_file(): errors.append('Missing module: ' + ref)
for css in root.glob('*.css'):
    for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css.read_text()):
        if not ref.startswith(('data:', 'https:', 'http:', '#')) and not (root/ref).is_file(): errors.append('Missing CSS asset: ' + ref)
if errors: raise SystemExit('\n'.join(errors))
print('PASS: ' + str(len(pages)) + ' pages; HTML, ARIA targets, links, modules, styles and assets.')
