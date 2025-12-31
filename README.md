# CineScroll (static movie site)

A lightweight movie browsing demo with:
- **Infinite scroll**
- **Working search**
- Filters (genre/year/min rating), sorting
- Movie detail pages
- **HTML5 video player** (demo URL + load local file)
- Favorites (localStorage)
- Dark/light theme toggle
- Demo sign-in (localStorage)

## Run it

### Option A: Quick (recommended)
Use a tiny local server (so `fetch("movies.json")` works):

**Python**
```bash
cd movie_site
python -m http.server 8000
```
Then open: http://localhost:8000

**Node**
```bash
npx serve .
```

### Option B: VS Code Live Server
Right-click `index.html` → “Open with Live Server”.

## Replace with your own videos
In `movies.json`, each movie has:

```json
"video": { "type":"url", "src":"https://...", "label":"Trailer" }
```

Use only video/trailer URLs you have rights to distribute, or host your own files.

## Replace the dataset
Swap `movies.json` with your own list (same shape). The UI will adapt to genres/years.
