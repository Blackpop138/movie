// CineScroll — movie page
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
  const a = parseInt(seed.slice(0,2), 16);
  const b = parseInt(seed.slice(2,4), 16);
  const c = parseInt(seed.slice(4,6), 16);
  const h1 = (a / 255) * 360;
  const h2 = (b / 255) * 360;
  const h3 = (c / 255) * 360;
  return `linear-gradient(135deg, hsl(${h1} 85% 55%), hsl(${h2} 85% 45%), hsl(${h3} 85% 40%))`;
}

function getId() {
  const url = new URL(location.href);
  return url.searchParams.get("id");
}

function favKey() { return "cinescroll:favorites"; }
function getFavs() {
  try { return JSON.parse(localStorage.getItem(favKey()) || "[]"); } catch { return []; }
}
function setFavs(arr) {
  localStorage.setItem(favKey(), JSON.stringify(arr));
}
function isFav(id) { return getFavs().includes(id); }

function updateFavButton(id) {
  const btn = el("favBtn");
  const on = isFav(id);
  btn.textContent = on ? "★ In favorites" : "★ Add to favorites";
  btn.className = on ? "btn" : "btn";
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied!");
  } catch {
    prompt("Copy this:", text);
  }
}

function wirePlayer(videoMeta) {
  const vid = el("video");
  const label = el("videoLabel");

  if (videoMeta?.src) {
    vid.src = videoMeta.src;
    label.textContent = videoMeta.label || "Video";
  } else {
    label.textContent = "No video";
  }

  el("copyLink").addEventListener("click", () => {
    const src = vid.currentSrc || vid.src;
    if (!src) return alert("No link.");
    copyToClipboard(src);
  });

  el("fileInput").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    vid.src = url;
    label.textContent = `Local: ${file.name}`;
    vid.play().catch(()=>{});
  });
}

function renderRelated(all, movie) {
  const sameGenre = all.filter(m => m.id !== movie.id && m.genres.some(g => movie.genres.includes(g)));
  sameGenre.sort((a,b)=> b.rating - a.rating);
  const picks = sameGenre.slice(0, 10);

  const grid = el("relatedGrid");
  grid.innerHTML = "";
  for (const m of picks) {
    const card = document.createElement("article");
    card.className = "card";
    card.tabIndex = 0;
    card.setAttribute("role","link");
    card.innerHTML = `
      <div class="poster" style="background:${posterStyle(m.posterSeed)}"></div>
      <div class="cardBody">
        <div class="cardTitle">${m.title}</div>
        <div class="cardMeta">
          <span>${m.year} • ${m.runtime}m</span>
          <span class="pill">★ ${m.rating}</span>
        </div>
      </div>
    `;
    const go = () => location.href = `movie.html?id=${encodeURIComponent(m.id)}`;
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") go(); });
    grid.appendChild(card);
  }
}

async function init() {
  loadTheme();
  el("toggleTheme").addEventListener("click", toggleTheme);
  el("yearNow").textContent = new Date().getFullYear();

  const id = getId();
  if (!id) {
    document.body.innerHTML = `<div class="wrap"><h1>Missing movie id</h1><a class="btn" href="index.html">Back</a></div>`;
    return;
  }

  const res = await fetch("movies.json");
  const data = await res.json();
  const movie = data.movies.find(m => m.id === id);

  if (!movie) {
    document.body.innerHTML = `<div class="wrap"><h1>Movie not found</h1><a class="btn" href="index.html">Back</a></div>`;
    return;
  }

  el("crumbTitle").textContent = movie.title;
  el("title").textContent = movie.title;
  el("metaLine").textContent = `${movie.year} • ${movie.genres.join(" / ")} • ${movie.runtime} min`;
  el("overview").textContent = movie.overview;
  el("director").textContent = movie.director;
  el("country").textContent = movie.country;
  el("runtime").textContent = `${movie.runtime} min`;
  el("rating").textContent = `★ ${movie.rating}`;

  const poster = el("poster");
  poster.style.background = posterStyle(movie.posterSeed);

  const favBtn = el("favBtn");
  updateFavButton(movie.id);
  favBtn.addEventListener("click", () => {
    const favs = getFavs();
    if (favs.includes(movie.id)) setFavs(favs.filter(x => x !== movie.id));
    else setFavs([movie.id, ...favs]);
    updateFavButton(movie.id);
  });

  wirePlayer(movie.video);
  renderRelated(data.movies, movie);
}

init().catch(err => {
  console.error(err);
  document.body.innerHTML = `<div class="wrap"><h1>Failed to load</h1><p class="tiny">${String(err)}</p></div>`;
});
