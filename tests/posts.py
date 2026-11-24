"""Shared view of the Markdown posts for the Python output-contract tests."""
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "src/content/posts"


@dataclass(frozen=True)
class Post:
    slug: str
    date: str
    path: Path
    front: dict


def _front_matter(text):
    lines = text.split("\n")
    end = lines.index("---", 1)
    front = {}
    for line in lines[1:end]:
        key, _, value = line.partition(":")
        front[key.strip()] = value.strip().strip('"')
    return front


def posts(include_drafts=False):
    result = []
    for path in sorted(POSTS.glob("*.md")):
        front = _front_matter(path.read_text(encoding="utf-8"))
        if front.get("draft") == "true" and not include_drafts:
            continue
        result.append(Post(path.stem, front["date"], path, front))
    return result
