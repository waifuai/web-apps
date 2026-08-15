# web-apps

A curated collection of small standalone web apps/demos, organized by topic and rendered to a static HTML site under `docs/`.

## Structure

- `src/webapps/<topic>/*.json` — one JSON entry per web app (e.g. `src/webapps/ai-os/`, with topics for bonding-curves, chats, exchanges, guides, misc, quantum-consciousness, simulations-visualizations)
- `<topic>.json` (repo root) — per-topic metadata (title, link, description) used to build the topic page
- `docs/<topic>.html` — generated static pages, one per topic, plus `docs/index.html` as the landing page
- `src/scripts/` — build/maintenance scripts:
  - `generate_index_html.py` — walks `src/webapps/` and regenerates the HTML index of all apps
  - `generate_webapp_json.py` — generates/updates the per-app JSON metadata
  - `extract.py` — extracts plain text from a directory of HTML files (used for content review/search)

## Usage

Regenerate the site index after adding or editing apps under `src/webapps/`:

```bash
python src/scripts/generate_index_html.py
```

Then open `docs/index.html` (or the relevant `docs/<topic>.html`) to browse.
