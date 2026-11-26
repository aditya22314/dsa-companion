# Run Crawl4AI yourself (free, no cloud account)

[Crawl4AI](https://docs.crawl4ai.com/) turns web pages into clean Markdown. It is Apache-2.0 open source and runs on your own computer. Use it to collect and re-check learning resources, or plug it into an AI app through MCP.

## Option A: Python (simplest)

```bash
pip install -U crawl4ai
crawl4ai-setup          # downloads the headless browser it needs
crawl4ai-doctor         # checks the install

# crawl one page to Markdown from the terminal
crwl https://javascript.info/recursion -o markdown

# or crawl the roadmap's resource pages and save them to ./crawled/
python tools/crawl_resources.py
```

`tools/crawl_resources.py` (in this repo) saves one Markdown file per page and a `crawled/links.md` file with every YouTube and GitHub link it found. You can pass your own URLs too: `python tools/crawl_resources.py https://example.com/page`.

## Option B: Docker server (a local "Firecrawl")

Follow the official [self-hosting guide](https://docs.crawl4ai.com/core/self-hosting/). In short:

```bash
docker pull unclecode/crawl4ai:latest
docker run -d -p 11235:11235 --name crawl4ai --shm-size=1g unclecode/crawl4ai:latest
```

Then open http://localhost:11235/playground to try it in the browser. Stop it with `docker stop crawl4ai` and start it again with `docker start crawl4ai`.

## Option C: Connect it to an AI app through MCP

The Docker server also exposes an MCP endpoint, so an MCP-capable app (Claude Desktop, Claude Code, Cursor and others) can call its crawl tools. The self-hosting guide lists the endpoint. At the time of writing it was an SSE endpoint under `http://localhost:11235/mcp/`. For Claude Code, for example:

```bash
claude mcp add --transport sse crawl4ai http://localhost:11235/mcp/sse
```

The community wrapper [sadiuysal/crawl4ai-mcp-server](https://github.com/sadiuysal/crawl4ai-mcp-server) is another option that exposes `scrape` and `crawl` tools. Follow its README.

## Notes

- Check the guide for the current image tag and endpoint names. They change between releases.
- Crawl politely: a few pages at a time, and respect each site's terms. Do not crawl paid course pages (for example, Namaste DSA lesson content). Public pages only.
- Crawl4AI could not be tested against live sites while this repo was built, because that cloud environment blocked outside websites. The script was syntax-checked only. Run `crawl4ai-doctor` first if something fails.
