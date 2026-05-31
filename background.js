const DOOMSCROLL_SITES = [
  "instagram.com",
  "youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "facebook.com",
  "tiktok.com"
];

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
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function getDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return DOOMSCROLL_SITES.find(site => hostname.includes(site)) || null;
  } catch {
    return null;
  }
}

let activeTab = null;
let activeStart = null;

chrome.tabs.onActivated.addListener(async (info) => {
  await saveActiveTime();
  const tab = await chrome.tabs.get(info.tabId);
  const domain = getDomain(tab.url || "");
  if (domain) {
    activeTab = { tabId: info.tabId, domain };
    activeStart = Date.now();
  } else {
    activeTab = null;
    activeStart = null;
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    await saveActiveTime();
    const domain = getDomain(tab.url || "");
    if (domain) {
      activeTab = { tabId, domain };
      activeStart = Date.now();
    } else if (activeTab?.tabId === tabId) {
      activeTab = null;
      activeStart = null;
    }
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  await saveActiveTime();
  activeTab = null;
  activeStart = null;
});

async function saveActiveTime() {
  if (!activeTab || !activeStart) return;

  // Calculate elapsed time in seconds (not minutes) for accuracy
  const elapsedSeconds = Math.floor((Date.now() - activeStart) / 1000);
  if (elapsedSeconds < 5) return; // ignore if less than 5 seconds

  const today = getTodayKey();
  const key = `time_${today}`;
  const result = await chrome.storage.local.get([key, "limits"]);
  const times = result[key] || {};
  const limits = result.limits || DEFAULT_LIMITS;

  // Store in seconds internally, show as minutes in UI
  const currentSeconds = times[`${activeTab.domain}_seconds`] || 0;
  const newSeconds = currentSeconds + elapsedSeconds;
  times[`${activeTab.domain}_seconds`] = newSeconds;
  
  // Convert to minutes for display (rounded)
  times[activeTab.domain] = Math.ceil(newSeconds / 60);

  await chrome.storage.local.set({ [key]: times });

  const limit = limits[activeTab.domain] || 20;
  if (times[activeTab.domain] >= limit && times[activeTab.domain] - Math.ceil(elapsedSeconds/60) < limit) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Doomscroll Stopper 🛑",
      message: `You've spent ${times[activeTab.domain]} mins on ${activeTab.domain} today. Time for a break!`
    });
  }

  // Reset start time to now
  activeStart = Date.now();
}

// Save every 10 seconds for accurate real-time tracking
setInterval(saveActiveTime, 10000);