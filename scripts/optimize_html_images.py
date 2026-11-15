"""Add responsive variants to article images after the Jekyll build."""
from html import escape, unescape
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
IMAGE = re.compile(r'<img\b[^>]*>', re.IGNORECASE)
SRC = re.compile(r'\bsrc\s*=\s*(["\'])(.*?)\1', re.IGNORECASE)


def optimize_html(html, metadata):
    index = 0
    def replace(match):
        nonlocal index
        tag = match.group()
        src = SRC.search(tag)
        if not src:
            return tag
        priority = index == 0
        index += 1
        # Includes already provide responsive attributes and their own loading policy.
        if re.search(r'\bsrcset\s*=', tag, re.IGNORECASE):
            return tag
        asset = metadata.get(unescape(src.group(2)))
        attributes = ''
        if asset:
            tag = tag[:src.start(2)] + escape(asset['src'], quote=True) + tag[src.end(2):]
            srcset = f"{asset['mobile']} {asset['mobile_width']}w"
            if asset['width'] > asset['mobile_width']:
                srcset += f", {asset['src']} {asset['width']}w"
            attributes += (f' srcset="{escape(srcset, quote=True)}" sizes="(max-width: 800px) calc(100vw - 48px), 760px"'
                           f' width="{asset["width"]}" height="{asset["height"]}"')
        if not re.search(r'\bloading\s*=', tag, re.IGNORECASE):
            attributes += ' loading="eager"' if priority else ' loading="lazy"'
        if priority and not re.search(r'\bfetchpriority\s*=', tag, re.IGNORECASE):
            attributes += ' fetchpriority="high"'
        return re.sub(r'\s*/?>$', lambda end: attributes + end.group(), tag)
    return IMAGE.sub(replace, html)


def main():
    metadata = json.loads((ROOT / '_data/images.json').read_text(encoding='utf-8'))
    for path in (ROOT / '_site/article').glob('*/index.html'):
        html = path.read_text(encoding='utf-8')
        path.write_text(optimize_html(html, metadata), encoding='utf-8')


if __name__ == '__main__':
    main()
