// CineScroll — simple demo auth (localStorage only)
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

const key = "cinescroll:session";
function getSession() {
  try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; }
}
function setSession(s) {
  if (!s) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(s));
}
function renderSession() {
  const s = getSession();
  el("sessionInfo").textContent = s ? `Signed in as ${s.email}` : "Not signed in.";
}

function init() {
  loadTheme();
  el("toggleTheme").addEventListener("click", toggleTheme);
  el("yearNow").textContent = new Date().getFullYear();

  renderSession();

  el("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = el("email").value.trim();
    const password = el("password").value;
    if (!email || !password) return;

    setSession({ email, ts: Date.now() });
    el("password").value = "";
    renderSession();
    alert("Signed in (demo).");
  });

  el("signOutBtn").addEventListener("click", () => {
    setSession(null);
    renderSession();
    alert("Signed out.");
  });
}

init();
