const SITE_EMOJIS = {
  "instagram.com": "📸",
  "youtube.com": "▶️",
  "twitter.com": "🐦",
  "x.com": "🐦",
  "reddit.com": "🤖",
  "facebook.com": "👥",
  "tiktok.com": "🎵"
};

function getTodayKey() {
  const d = new Date();
  return `time_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

async function loadTodayStats() {
  const key = getTodayKey();
  const result = await chrome.storage.local.get([key]);
  const times = result[key] || {};

  const siteList = document.getElementById("site-list");
  const totalEl = document.getElementById("total-time");

  const entries = Object.entries(times).filter(([_, mins]) => mins > 0);

  if (entries.length === 0) {
    siteList.innerHTML = `<p class="loading">No scrolling detected today 🎉</p>`;
    totalEl.textContent = "0 mins";
    return;
  }

  const maxTime = Math.max(...entries.map(([_, m]) => m));
  let total = 0;

  siteList.innerHTML = entries
    .sort((a, b) => b[1] - a[1])
    .map(([site, mins]) => {
      total += mins;
      const percent = Math.min((mins / maxTime) * 100, 100);
      const emoji = SITE_EMOJIS[site] || "🌐";
      return `
        <div class="site-row">
          <div class="site-info">
            <span class="site-emoji">${emoji}</span>
            <span class="site-name">${site}</span>
          </div>
          <span class="site-time">${mins} mins</span>
        </div>
        <div class="site-bar">
          <div class="site-bar-fill" style="width: ${percent}%"></div>
        </div>
      `;
    }).join("");

  totalEl.textContent = `${total} mins`;
}

document.getElementById("dashboard-btn").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
});

document.getElementById("reset-btn").addEventListener("click", async () => {
  const key = getTodayKey();
  await chrome.storage.local.remove(key);
  await loadTodayStats();
  document.getElementById("status-msg").textContent = "Reset done ✅";
  setTimeout(() => {
    document.getElementById("status-msg").textContent = "Tracking active ✅";
  }, 2000);
});

loadTodayStats();