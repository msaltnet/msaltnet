"""Capture a comparable snapshot of a built site (used to prove the Astro migration keeps the Jekyll output).

Run from the repository root after a build: python3 scripts/snapshot_site.py [site_dir] [output_json]
"""
from html.parser import HTMLParser
from pathlib import Path
import json
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
IGNORED_META = {"generator"}
IMG_ATTRS = ("src", "alt", "loading", "srcset", "sizes", "width", "height")
ATOM = "{http://www.w3.org/2005/Atom}"
SITEMAP = "{http://www.sitemaps.org/schemas/sitemap/0.9}"


class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = None
        self.meta = {}
        self.links = []
        self.jsonld = []
        self.h1 = []
        self.nav = []
        self.nav_current = None
        self.article_links = []
        self.img = []
        self.main_text = []
        self._capture = None
        self._buffer = []
        self._in_nav = 0
        self._nav_href = None
        self._nav_is_current = False
        self._main_depth = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if self._main_depth:
            self._main_depth += 1
        if tag == "main":
            self._main_depth = max(self._main_depth, 1)
        if tag == "title":
            self._start("title")
        elif tag == "meta":
            key = attrs.get("name") or attrs.get("property")
            if key and key not in IGNORED_META:
                self.meta[key] = attrs.get("content")
        elif tag == "link" and attrs.get("rel"):
            self.links.append([attrs.get("rel"), attrs.get("type"), attrs.get("href")])
        elif tag == "script" and attrs.get("type") == "application/ld+json":
            self._start("jsonld")
        elif tag == "h1":
            self._start("h1")
        elif tag == "nav" and attrs.get("aria-label") == "주요 메뉴":
            self._in_nav = 1
        elif tag == "nav" and self._in_nav:
            self._in_nav += 1
        elif tag == "a":
            href = attrs.get("href", "")
            if self._in_nav:
                self._nav_href = href
                self._nav_is_current = attrs.get("aria-current") == "page"
                self._start("nav")
            elif self._main_depth and "/article/" in href:
                self.article_links.append(href)
        elif tag == "img":
            self.img.append({key: attrs.get(key) for key in IMG_ATTRS})

    def handle_endtag(self, tag):
        if self._main_depth:
            self._main_depth -= 1
        if tag == "nav" and self._in_nav:
            self._in_nav -= 1
        if self._capture and tag in {"title", "script", "h1", "a"}:
            text = " ".join("".join(self._buffer).split())
            kind = self._capture
            self._capture = None
            if kind == "title" and tag == "title":
                self.title = text
            elif kind == "jsonld" and tag == "script":
                self.jsonld.append(json.loads("".join(self._buffer)))
            elif kind == "h1" and tag == "h1":
                self.h1.append(text)
            elif kind == "nav" and tag == "a":
                self.nav.append([text, self._nav_href])
                if self._nav_is_current:
                    self.nav_current = text
            else:
                self._capture = kind

    def handle_data(self, data):
        if self._capture:
            self._buffer.append(data)
        if self._main_depth:
            value = " ".join(data.split())
            if value:
                self.main_text.append(value)

    def _start(self, kind):
        self._capture = kind
        self._buffer = []


def page_snapshot(html):
    parser = PageParser()
    parser.feed(html)
    return {
        "title": parser.title,
        "meta": parser.meta,
        "links": parser.links,
        "jsonld": parser.jsonld,
        "h1": parser.h1,
        "nav": parser.nav,
        "nav_current": parser.nav_current,
        "article_links": parser.article_links,
        "img": parser.img,
        "main_text": " ".join(parser.main_text),
    }


def sitemap_snapshot(path):
    tree = ET.parse(path)
    return sorted(
        [node.findtext(f"{SITEMAP}loc"), node.findtext(f"{SITEMAP}lastmod")]
        for node in tree.getroot().findall(f"{SITEMAP}url")
    )


def feed_snapshot(path):
    root = ET.parse(path).getroot()
    entries = []
    for entry in root.findall(f"{ATOM}entry"):
        link = entry.find(f"{ATOM}link")
        entries.append({
            "id": entry.findtext(f"{ATOM}id"),
            "title": entry.findtext(f"{ATOM}title"),
            "link": link.get("href") if link is not None else None,
            "published": entry.findtext(f"{ATOM}published"),
            "updated": entry.findtext(f"{ATOM}updated"),
        })
    return entries


def snapshot(site_dir):
    site_dir = Path(site_dir)
    pages, files = {}, []
    for path in sorted(site_dir.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(site_dir).as_posix()
        if relative.endswith("index.html"):
            pages[relative] = page_snapshot(path.read_text(encoding="utf-8"))
        else:
            files.append(relative)
    return {
        "pages": pages,
        "files": files,
        "sitemap": sitemap_snapshot(site_dir / "sitemap.xml"),
        "feed": feed_snapshot(site_dir / "feed.xml"),
    }


if __name__ == "__main__":
    site = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "_site"
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "tests/fixtures/jekyll-baseline.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(snapshot(site), ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {output}")
