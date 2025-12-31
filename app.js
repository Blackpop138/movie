// CineScroll — main listing (infinite scroll + search + filters)
const state = {
  all: [],
  filtered: [],
  query: "",
  filters: { genre: "All", year: "All", minRating: 0, sort: "relevance" },
  pageSize: 30,
  rendered: 0,
  observer: null
};

const el = (id) => document.getElementById(id);

function loadTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.dataset.theme = saved;
}
function toggleTheme() {
  const cur = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = cur;
  localStorage.setItem("theme", cur);
}

function posterStyle(seed) {
  // Create a deterministic gradient from the seed
  const a = parseInt(seed.slice(0,2), 16);
  const b = parseInt(seed.slice(2,4), 16);
  const c = parseInt(seed.slice(4,6), 16);
  const h1 = (a / 255) * 360;
  const h2 = (b / 255) * 360;
  const h3 = (c / 255) * 360;
  return `linear-gradient(135deg, hsl(${h1} 85% 55%), hsl(${h2} 85% 45%), hsl(${h3} 85% 40%))`;
}

function setStats() {
  el("statCount").textContent = state.all.length.toLocaleString();
  el("statGenres").textContent = new Set(state.all.flatMap(m => m.genres)).size;
  el("yearNow").textContent = new Date().getFullYear();
}

function buildSelectOptions() {
  const genreSelect = el("genreSelect");
  const yearSelect = el("yearSelect");

  const allGenres = Array.from(new Set(state.all.flatMap(m => m.genres))).sort((a,b)=>a.localeCompare(b));
  const years = Array.from(new Set(state.all.map(m => m.year))).sort((a,b)=>b-a);

  genreSelect.innerHTML = `<option>All</option>` + allGenres.map(g => `<option>${g}</option>`).join("");
  yearSelect.innerHTML = `<option>All</option>` + years.map(y => `<option>${y}</option>`).join("");

  // Quick chips
  const chips = el("quickChips");
  const top = allGenres.slice(0, 10);
  chips.innerHTML = top.map(g => `<button class="chip" data-genre="${g}">${g}</button>`).join("");
  chips.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-genre]");
    if (!btn) return;
    genreSelect.value = btn.dataset.genre;
    state.filters.genre = btn.dataset.genre;
    apply();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function normalize(s) {
  return (s || "").toString().toLowerCase().normalize("NFKD");
}

function relevanceScore(movie, q) {
  if (!q) return 0;
  const hay = normalize([movie.title, movie.director, ...movie.cast, ...movie.genres].join(" "));
  let score = 0;
  if (hay.includes(q)) score += 5;
  if (normalize(movie.title).includes(q)) score += 6;
  if (movie.genres.some(g => normalize(g).includes(q))) score += 3;
  if (normalize(movie.director).includes(q)) score += 2;
  return score;
}

function apply() {
  const q = normalize(state.query.trim());
  const { genre, year, minRating, sort } = state.filters;

  let list = state.all.filter(m => {
    if (genre !== "All" && !m.genres.includes(genre)) return false;
    if (year !== "All" && m.year !== Number(year)) return false;
    if (Number(m.rating) < Number(minRating)) return false;
    if (q) {
      const hay = normalize([m.title, m.overview, m.director, ...m.cast, ...m.genres, m.country].join(" "));
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // Sorting
  if (sort === "rating_desc") list.sort((a,b)=> b.rating - a.rating);
  else if (sort === "year_desc") list.sort((a,b)=> b.year - a.year);
  else if (sort === "year_asc") list.sort((a,b)=> a.year - b.year);
  else if (sort === "title_asc") list.sort((a,b)=> a.title.localeCompare(b.title));
  else if (sort === "relevance" && q) list.sort((a,b)=> relevanceScore(b,q) - relevanceScore(a,q) || b.rating - a.rating);
  else list.sort((a,b)=> b.rating - a.rating);

  state.filtered = list;
  state.rendered = 0;
  el("grid").innerHTML = "";
  renderMore(true);

  el("resultsBadge").textContent = `${state.filtered.length.toLocaleString()} results`;
}

function card(movie) {
  const div = document.createElement("article");
  div.className = "card";
  div.tabIndex = 0;
  div.setAttribute("role", "link");
  div.setAttribute("aria-label", `${movie.title} (${movie.year})`);
  div.innerHTML = `
    <div class="poster" style="background:${posterStyle(movie.posterSeed)}"></div>
    <div class="cardBody">
      <div class="cardTitle">${movie.title}</div>
      <div class="cardMeta">
        <span>${movie.year} • ${movie.runtime}m</span>
        <span class="pill">★ ${movie.rating}</span>
      </div>
    </div>
  `;
  const go = () => location.href = `movie.html?id=${encodeURIComponent(movie.id)}`;
  div.addEventListener("click", go);
  div.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") go(); });
  return div;
}

function renderMore(force = false) {
  if (!force && state.rendered >= state.filtered.length) return;

  const grid = el("grid");
  const next = state.filtered.slice(state.rendered, state.rendered + state.pageSize);
  next.forEach(m => grid.appendChild(card(m)));
  state.rendered += next.length;
}

function setupInfiniteScroll() {
  const sentinel = el("sentinel");
  state.observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) renderMore();
    }
  }, { rootMargin: "900px 0px" });
  state.observer.observe(sentinel);
}

function readQueryFromUrl() {
  const url = new URL(location.href);
  const q = url.searchParams.get("q");
  if (q) {
    state.query = q;
    el("searchInput").value = q;
  }
}

function wire() {
  loadTheme();
  el("toggleTheme").addEventListener("click", toggleTheme);

  el("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    state.query = el("searchInput").value || "";
    const url = new URL(location.href);
    if (state.query.trim()) url.searchParams.set("q", state.query.trim());
    else url.searchParams.delete("q");
    history.replaceState({}, "", url.toString());
    apply();
  });

  el("genreSelect").addEventListener("change", (e) => { state.filters.genre = e.target.value; apply(); });
  el("yearSelect").addEventListener("change", (e) => { state.filters.year = e.target.value; apply(); });
  el("sortSelect").addEventListener("change", (e) => { state.filters.sort = e.target.value; apply(); });

  const minRating = el("minRating");
  const badge = el("minRatingBadge");
  minRating.addEventListener("input", () => { badge.textContent = Number(minRating.value).toFixed(1); });
  minRating.addEventListener("change", () => { state.filters.minRating = Number(minRating.value); apply(); });

  el("clearFilters").addEventListener("click", () => {
    state.query = "";
    el("searchInput").value = "";
    state.filters = { genre: "All", year: "All", minRating: 0, sort: "relevance" };
    el("genreSelect").value = "All";
    el("yearSelect").value = "All";
    el("sortSelect").value = "relevance";
    el("minRating").value = 0;
    el("minRatingBadge").textContent = "0.0";
    history.replaceState({}, "", "index.html");
    apply();
  });
}

async function init() {
  wire();
  const res = await fetch("movies.json");
  const data = await res.json();
  state.all = data.movies;

  setStats();
  buildSelectOptions();
  readQueryFromUrl();
  setupInfiniteScroll();
  apply();
}

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<div class="wrap"><h1>Failed to load</h1><p class="tiny">${String(err)}</p></div>`;
});
