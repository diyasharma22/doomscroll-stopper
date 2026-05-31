const SITE_EMOJIS = {
  "instagram.com": "📸",
  "youtube.com": "▶️",
  "twitter.com": "🐦",
  "x.com": "🐦",
  "reddit.com": "🤖",
  "facebook.com": "👥",
  "tiktok.com": "🎵"
};

const DEFAULT_LIMITS = {
  "instagram.com": 20,
  "youtube.com": 30,
  "twitter.com": 20,
  "x.com": 20,
  "reddit.com": 25,
  "facebook.com": 20,
  "tiktok.com": 15
};

function getTodayKey() {
  const d = new Date();
  return `time_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getDateKey(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `time_${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getDayLabel(daysAgo) {
  if (daysAgo === 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

async function loadDashboard() {
  const keys = Array.from({length: 7}, (_, i) => getDateKey(i));
  const result = await chrome.storage.local.get([...keys, "limits"]);
  const limits = result.limits || DEFAULT_LIMITS;

  const todayData = result[keys[0]] || {};
  const todayEntries = Object.entries(todayData).filter(([_, m]) => m > 0);
  const todayTotal = todayEntries.reduce((sum, [_, m]) => sum + m, 0);

  document.getElementById("today-total").textContent = todayTotal;

  const weekTotal = keys.reduce((sum, key) => {
    const data = result[key] || {};
    return sum + Object.values(data).reduce((s, m) => s + m, 0);
  }, 0);
  document.getElementById("week-total").textContent = weekTotal;

  if (todayEntries.length > 0) {
    const top = todayEntries.sort((a, b) => b[1] - a[1])[0];
    document.getElementById("top-site").textContent =
      (SITE_EMOJIS[top[0]] || "🌐") + " " + top[0].replace(".com", "");
  }

  let streak = 0;
  for (let i = 0; i < 7; i++) {
    const data = result[keys[i]] || {};
    const total = Object.values(data).reduce((s, m) => s + m, 0);
    if (total > 0) streak++;
    else break;
  }
  document.getElementById("streak").textContent = streak;

  const breakdownEl = document.getElementById("today-breakdown");
  if (todayEntries.length === 0) {
    breakdownEl.innerHTML = `<p class="empty">No scrolling today 🎉 Great job!</p>`;
  } else {
    const maxTime = Math.max(...todayEntries.map(([_, m]) => m));
    breakdownEl.innerHTML = todayEntries
      .sort((a, b) => b[1] - a[1])
      .map(([site, mins]) => {
        const percent = Math.min((mins / maxTime) * 100, 100);
        return `
          <div class="breakdown-row">
            <span class="breakdown-emoji">${SITE_EMOJIS[site] || "🌐"}</span>
            <div class="breakdown-info">
              <div class="breakdown-name">${site}</div>
              <div class="breakdown-bar">
                <div class="breakdown-bar-fill" style="width:${percent}%"></div>
              </div>
            </div>
            <span class="breakdown-time">${mins} mins</span>
          </div>
        `;
      }).join("");
  }

  const weekEl = document.getElementById("weekly-chart");
  const weekData = keys.map((key, i) => {
    const data = result[key] || {};
    const total = Object.values(data).reduce((s, m) => s + m, 0);
    return { label: getDayLabel(i), total };
  });
  const maxWeek = Math.max(...weekData.map(d => d.total), 1);
  weekEl.innerHTML = weekData.map(({ label, total }) => {
    const percent = Math.min((total / maxWeek) * 100, 100);
    return `
      <div class="week-row">
        <span class="week-day">${label}</span>
        <div class="week-bar">
          <div class="week-bar-fill" style="width:${percent}%">
            ${total > 0 ? total + "m" : ""}
          </div>
        </div>
      </div>
    `;
  }).join("");

  const limitsEl = document.getElementById("limits-section");
  limitsEl.innerHTML = Object.entries(DEFAULT_LIMITS).map(([site, def]) => `
    <div class="limit-row">
      <span class="limit-site">
        ${SITE_EMOJIS[site] || "🌐"} ${site}
      </span>
      <input
        class="limit-input"
        type="number"
        min="1"
        max="300"
        value="${limits[site] || def}"
        data-site="${site}"
      />
    </div>
  `).join("");

  document.getElementById("save-limits-btn").addEventListener("click", async () => {
    const inputs = document.querySelectorAll(".limit-input");
    const newLimits = {};
    inputs.forEach(input => {
      newLimits[input.dataset.site] = parseInt(input.value) || 20;
    });
    await chrome.storage.local.set({ limits: newLimits });
    const btn = document.getElementById("save-limits-btn");
    btn.textContent = "✅ Saved!";
    setTimeout(() => btn.textContent = "💾 Save Limits", 2000);
  });

  document.getElementById("reset-all-btn").addEventListener("click", async () => {
    if (confirm("Reset ALL your doomscroll data? This cannot be undone.")) {
      await chrome.storage.local.clear();
      loadDashboard();
    }
  });
}

loadDashboard();