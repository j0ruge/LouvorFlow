/* LouvorFlow UI Kit — views (Dashboard + Músicas)
 * Mobile-first rendering. Consumes shell.css primitives.
 */

(() => {
  const content = document.getElementById("content");
  const crumbs  = document.getElementById("crumbs");
  const toggle  = document.getElementById("toggle-sidebar");
  const theme   = document.getElementById("toggle-theme");
  const sunIc   = theme.querySelector(".ic-sun");
  const moonIc  = theme.querySelector(".ic-moon");
  const app     = document.querySelector(".app");

  /* inject scrim */
  const scrim = document.createElement("div");
  scrim.className = "scrim";
  app.appendChild(scrim);
  scrim.addEventListener("click", () => app.classList.remove("drawer-open"));

  toggle.addEventListener("click", () => app.classList.toggle("drawer-open"));

  /* theme */
  const applyTheme = (dark) => {
    document.documentElement.classList.toggle("dark", dark);
    sunIc.style.display = dark ? "none" : "";
    moonIc.style.display = dark ? "" : "none";
    localStorage.setItem("lf-theme", dark ? "dark" : "light");
  };
  applyTheme(localStorage.getItem("lf-theme") === "dark");
  theme.addEventListener("click", () => applyTheme(!document.documentElement.classList.contains("dark")));

  /* Icons (Lucide minimal inline) */
  const I = {
    music:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    users:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    trending: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    plus:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    search:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    filter:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    key:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    chevron:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    corner:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg>'
  };

  /* Upcoming mock data */
  const upcoming = [
    { day: 20, month: "Abr", title: "Culto de Domingo — Manhã", meta: "5 músicas · 6 integrantes", tag: "Culto Domingo" },
    { day: 24, month: "Abr", title: "Ensaio Geral",              meta: "Banda + Vocal",            tag: "Ensaio" },
    { day: 27, month: "Abr", title: "Culto de Domingo — Noite",  meta: "6 músicas · 5 integrantes", tag: "Culto Domingo" },
    { day:  1, month: "Mai", title: "Reunião de Oração",         meta: "3 músicas · 4 integrantes", tag: "Especial" }
  ];
  const team = [
    { name: "Ana Martins",   role: "Vocal · Ministra" },
    { name: "Bruno Lima",    role: "Violão · Guitarra" },
    { name: "Carla Freitas", role: "Teclado" },
    { name: "Daniel Ribeiro",role: "Bateria" },
    { name: "Elisa Coelho",  role: "Vocal" }
  ];
  const initials = (s) => s.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();

  /* ── Views ─────────────────────────────────────────────── */

  function renderDashboard() {
    crumbs.textContent = "Dashboard";
    content.innerHTML = `
      <div class="page-head">
        <div class="page-head-row">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-sub">Visão geral do ministério de louvor</p>
          </div>
          <button class="btn btn-primary btn-sm">${I.plus}<span>Nova Escala</span></button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat"><div class="tint"></div>
          <div class="ic">${I.music}</div>
          <h3>Músicas</h3><div class="val">247</div><div class="foot">No repertório</div>
        </div>
        <div class="stat"><div class="tint" style="background:linear-gradient(135deg,hsl(var(--secondary)),hsl(var(--accent)))"></div>
          <div class="ic" style="background:hsla(350,45%,42%,0.12);color:hsl(var(--accent))">${I.calendar}</div>
          <h3>Escalas</h3><div class="val">36</div><div class="foot">${upcoming.length} próximas</div>
        </div>
        <div class="stat"><div class="tint" style="background:linear-gradient(135deg,hsl(var(--accent)),hsl(var(--primary)))"></div>
          <div class="ic">${I.users}</div>
          <h3>Integrantes</h3><div class="val">18</div><div class="foot">Membros ativos</div>
        </div>
        <div class="stat"><div class="tint"></div>
          <div class="ic">${I.trending}</div>
          <h3>Eventos</h3><div class="val">${upcoming.length}</div><div class="foot">Futuros agendados</div>
        </div>
      </div>

      <div class="dash-grid">
        <section class="card">
          <div class="card-head">
            <h2 class="section-title">${I.calendar} Próximas Escalas</h2>
            <button class="btn btn-outline btn-sm">Ver todas ${I.chevron}</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px">
            ${upcoming.map(e => `
              <div class="event-row">
                <div class="event-date"><div class="d">${e.day}</div><div class="m">${e.month}</div></div>
                <div class="event-body">
                  <div class="event-title">${e.title}</div>
                  <div class="event-meta">${e.meta}</div>
                </div>
                <span class="badge badge-soft event-tag">${e.tag}</span>
              </div>
            `).join("")}
          </div>
        </section>

        <section class="card">
          <div class="card-head">
            <h2 class="section-title">${I.users} Equipe do Ministério</h2>
            <button class="btn btn-outline btn-sm">Ver integrantes ${I.chevron}</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px">
            ${team.map(m => `
              <div class="member-row">
                <div class="member-avatar">${initials(m.name)}</div>
                <div style="min-width:0">
                  <div class="member-name">${m.name}</div>
                  <div class="member-role">${m.role}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </section>
      </div>
    `;
  }

  function renderSongs() {
    crumbs.textContent = "Músicas";
    const songs = JSON.parse(document.getElementById("songs-data").textContent);
    content.innerHTML = `
      <div class="page-head">
        <div class="page-head-row">
          <div>
            <h1 class="page-title">Músicas</h1>
            <p class="page-sub">Gerencie o repertório do ministério</p>
          </div>
          <button class="btn btn-primary btn-sm">${I.plus}<span>Nova Música</span></button>
        </div>
      </div>

      <div class="songs-toolbar">
        <div class="input-wrap">${I.search}<input class="input" placeholder="Buscar por nome ou artista..."/></div>
        <button class="btn btn-outline btn-sm">${I.filter}<span>Filtrar</span></button>
      </div>

      <div class="tabs" role="tablist">
        <button class="tab active">Todas (${songs.length})</button>
        <button class="tab">Adoração</button>
        <button class="tab">Celebração</button>
        <button class="tab">Intimidade</button>
      </div>

      <div class="song-list">
        ${songs.map(s => `
          <div class="song" role="button" tabindex="0">
            <div class="song-tile">${I.music}</div>
            <div class="song-title">${s.nome}</div>
            <div class="song-artist">${s.artista}</div>
            <div class="song-meta">
              <span>${s.duracao}</span>
              <span>${s.bpm} BPM</span>
              <span class="badge badge-soft">${s.cat}</span>
            </div>
            <div class="song-key">
              <span class="k">${s.tom}</span>
              <span class="bpm">${s.bpm} BPM</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  /* ── Router ────────────────────────────────────────────── */
  /**
   * Views suportadas pelo shell deste preview enxuto. Caso o usuário
   * tente abrir uma view ainda não migrada (`lf-view` no localStorage
   * compartilhado com o shell completo), normalizamos para `dashboard`
   * para não destacar um nav-item incoerente com o conteúdo.
   */
  const supportedViews = new Set(["dashboard", "songs"]);

  function go(view) {
    const safeView = supportedViews.has(view) ? view : "dashboard";
    document.querySelectorAll(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.view === safeView));
    if (safeView === "songs") renderSongs();
    else renderDashboard();
    localStorage.setItem("lf-view", safeView);
    if (window.matchMedia("(max-width: 899px)").matches) app.classList.remove("drawer-open");
    window.scrollTo({ top: 0 });
  }

  document.querySelectorAll(".nav-item[data-view]").forEach(n => {
    n.addEventListener("click", (e) => { e.preventDefault(); go(n.dataset.view); });
  });

  /**
   * CTAs "Nova Escala" / "Nova Música" do header neste preview são
   * apenas demonstração visual — o shell completo está em `index.html`.
   * Marcamos como `disabled` para não enganar o leitor que clicaria.
   */
  document.querySelectorAll('.page-head-row .btn-primary').forEach(b => {
    b.disabled = true;
    b.title = "Demo estático — abra index.html para a versão interativa";
  });

  go(localStorage.getItem("lf-view") || "dashboard");
})();
