(() => {
  const root = document.documentElement;
  const body = document.body;
  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  const tabLinks = Array.from(document.querySelectorAll("[data-tab-link]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  const menuButton = document.getElementById("menuButton");
  const themeToggle = document.getElementById("themeToggle");
  const search = document.getElementById("wikiSearch");
  const results = document.getElementById("searchResults");

  const validTabs = new Set(panels.map(panel => panel.dataset.panel));

  function showTab(name, updateHash = true) {
    if (!validTabs.has(name)) name = "overview";

    panels.forEach(panel => panel.classList.toggle("active", panel.dataset.panel === name));
    tabs.forEach(tab => tab.classList.toggle("active", tab.dataset.tab === name));
    tabLinks.forEach(link => link.classList.toggle("active", link.dataset.tabLink === name));

    if (updateHash) history.replaceState(null, "", "#" + name);
    body.classList.remove("menu-open");
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  tabs.forEach(tab => tab.addEventListener("click", () => showTab(tab.dataset.tab)));
  tabLinks.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      showTab(link.dataset.tabLink);
    });
  });

  menuButton?.addEventListener("click", () => body.classList.toggle("menu-open"));

  document.addEventListener("click", event => {
    if (window.innerWidth <= 820 && body.classList.contains("menu-open")) {
      if (!event.target.closest("#sidebar") && !event.target.closest("#menuButton")) {
        body.classList.remove("menu-open");
      }
    }
  });

  const storedTheme = localStorage.getItem("ris-wiki-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    root.dataset.theme = storedTheme;
  }

  themeToggle?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    localStorage.setItem("ris-wiki-theme", root.dataset.theme);
  });

  const searchable = panels.map(panel => {
    const title = panel.querySelector("h1")?.textContent.trim() || panel.dataset.panel;
    const headings = Array.from(panel.querySelectorAll("h2,h3")).map(el => el.textContent.trim());
    return {
      tab: panel.dataset.panel,
      title,
      headings,
      text: panel.textContent.replace(/\s+/g, " ").trim()
    };
  });

  function closeResults() {
    results.hidden = true;
    results.innerHTML = "";
  }

  function renderSearch(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      closeResults();
      return;
    }

    const matches = [];
    searchable.forEach(item => {
      if (!item.text.toLowerCase().includes(q)) return;

      let label = item.title;
      const heading = item.headings.find(h => h.toLowerCase().includes(q));
      if (heading) label += " · " + heading;

      const pos = item.text.toLowerCase().indexOf(q);
      const start = Math.max(0, pos - 70);
      const end = Math.min(item.text.length, pos + q.length + 100);
      const excerpt = (start > 0 ? "…" : "") + item.text.slice(start, end) + (end < item.text.length ? "…" : "");

      matches.push({ ...item, label, excerpt });
    });

    results.innerHTML = "";
    if (!matches.length) {
      results.innerHTML = '<div class="search-empty">No result found</div>';
      results.hidden = false;
      return;
    }

    matches.slice(0, 8).forEach(match => {
      const link = document.createElement("a");
      link.href = "#" + match.tab;
      link.className = "search-result";
      link.innerHTML = "<strong></strong><span></span>";
      link.querySelector("strong").textContent = match.label;
      link.querySelector("span").textContent = match.excerpt;
      link.addEventListener("click", event => {
        event.preventDefault();
        showTab(match.tab);
        search.value = "";
        closeResults();
      });
      results.appendChild(link);
    });
    results.hidden = false;
  }

  search?.addEventListener("input", () => renderSearch(search.value));
  search?.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      search.value = "";
      closeResults();
      search.blur();
    }
  });

  document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      search?.focus();
    }
  });

  document.addEventListener("click", event => {
    if (!event.target.closest(".search-wrap")) closeResults();
  });

  const initial = location.hash.replace("#", "");
  showTab(validTabs.has(initial) ? initial : "overview", false);
})();