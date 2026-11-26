"""
Crawl DSA learning resources into Markdown files with Crawl4AI (free, local).

Setup (once):
    pip install -U crawl4ai
    crawl4ai-setup        # downloads the browser
    crawl4ai-doctor       # optional: checks everything works

Run:
    python tools/crawl_resources.py                 # crawls the roadmap's reference pages
    python tools/crawl_resources.py URL [URL ...]   # crawls the pages you give it

Output: one .md file per page in ./crawled/, plus crawled/links.md listing every
outgoing link found (handy for discovering more resources).
"""
import asyncio
import re
import sys
from pathlib import Path

from crawl4ai import AsyncWebCrawler, BrowserConfig, CacheMode, CrawlerRunConfig

DEFAULT_URLS = [
    "https://www.freecodecamp.org/news/data-structures-and-algorithms-in-javascript/",
    "https://www.freecodecamp.org/news/data-structure-and-algorithm-patterns-for-leetcode-interviews/",
    "https://www.freecodecamp.org/news/learn-big-o-notation/",
    "https://www.freecodecamp.org/news/learn-dynamic-programing-to-solve-coding-challenges/",
    "https://www.freecodecamp.org/news/graph-algorithms-for-technical-interviews/",
    "https://javascript.info/recursion",
    "https://javascript.info/map-set",
    "https://github.com/trekhleb/javascript-algorithms",
    "https://alok722.github.io/namaste-javascript-notes/lectures.html",
    "https://namastedev.com/learn/namaste-dsa",
]

OUT = Path("crawled")


def slug(url: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", url.lower().split("://", 1)[-1]).strip("-")[:90]


async def main(urls: list[str]) -> None:
    OUT.mkdir(exist_ok=True)
    run = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, page_timeout=45_000)
    all_links: dict[str, set[str]] = {}
    async with AsyncWebCrawler(config=BrowserConfig(headless=True)) as crawler:
        for url in urls:
            r = await crawler.arun(url, config=run)
            if not r.success:
                print(f"FAILED  {url}  ({r.error_message})")
                continue
            md = r.markdown.raw_markdown if r.markdown else ""
            (OUT / f"{slug(url)}.md").write_text(f"<!-- source: {url} -->\n\n{md}", encoding="utf-8")
            links = {l.get("href", "") for l in (r.links or {}).get("external", [])}
            all_links[url] = {l for l in links if "youtube.com" in l or "youtu.be" in l or "github.com" in l}
            print(f"OK      {url}  ({len(md):,} chars, {len(all_links[url])} video/GitHub links)")
    lines = ["# Video and GitHub links found\n"]
    for src, links in all_links.items():
        lines.append(f"\n## {src}\n")
        lines += [f"- {l}" for l in sorted(links)]
    (OUT / "links.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nSaved to {OUT.resolve()}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1:] or DEFAULT_URLS))
