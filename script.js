
const animeList = document.getElementById('animeList');
const loginModal = document.getElementById('loginModal');

function toggleLogin() {
  loginModal.style.display = loginModal.style.display === 'flex' ? 'none' : 'flex';
}

async function searchAnime() {
  const q = document.getElementById('search').value;
  if (!q) return;
  const res = await fetch(`https://api.jikan.moe/v4/anime?q=${q}`);
  const data = await res.json();
  renderAnime(data.data);
}

async function loadGenre(id) {
  const res = await fetch(`https://api.jikan.moe/v4/anime?genres=${id}`);
  const data = await res.json();
  renderAnime(data.data);
}

function renderAnime(list) {
  animeList.innerHTML = "";
  list.slice(0, 20).forEach(a => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${a.images.jpg.image_url}">
      <h3>${a.title}</h3>
    `;
    animeList.appendChild(card);
  });
}

// Load top anime by default
loadGenre(1);
