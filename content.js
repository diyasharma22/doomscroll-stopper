let scrollCount = 0;
let scrollStartTime = Date.now();
let warningShown = false;
let overlayExists = false;

function getMinutesSpent() {
  return Math.floor((Date.now() - scrollStartTime) / 1000 / 60);
}

function showOverlay(minutes) {
  if (overlayExists) return;
  overlayExists = true;

  const overlay = document.createElement("div");
  overlay.id = "doomscroll-overlay";
  overlay.innerHTML = `
    <div id="doomscroll-box">
      <div id="doomscroll-emoji">🛑</div>
      <h2>Hey, take a break!</h2>
      <p>You've been scrolling for <strong>${minutes} minutes</strong> straight.</p>
      <p>Your eyes and brain need rest. Step away for a bit!</p>
      <div id="doomscroll-buttons">
        <button id="doomscroll-dismiss">I'll take a break ✅</button>
        <button id="doomscroll-ignore">Keep scrolling 😔</button>
      </div>
    </div>
  `;

  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.75);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: sans-serif;
  `;

  const box = overlay.querySelector("#doomscroll-box");
  box.style.cssText = `
    background: white;
    border-radius: 16px;
    padding: 32px;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  `;

  overlay.querySelector("#doomscroll-emoji").style.fontSize = "48px";

  overlay.querySelector("h2").style.cssText = `
    font-size: 24px;
    color: #e74c3c;
    margin: 12px 0;
  `;

  overlay.querySelector("p").style.cssText = `
    color: #555;
    font-size: 15px;
    line-height: 1.5;
  `;

  const btnStyle = `
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    margin: 6px;
    font-weight: 600;
  `;

  overlay.querySelector("#doomscroll-buttons").style.cssText = `
    margin-top: 20px;
  `;

  const dismissBtn = overlay.querySelector("#doomscroll-dismiss");
  dismissBtn.style.cssText = btnStyle + "background: #2ecc71; color: white;";
  dismissBtn.addEventListener("click", () => {
    overlay.remove();
    overlayExists = false;
    scrollCount = 0;
    scrollStartTime = Date.now();
    warningShown = false;
  });

  const ignoreBtn = overlay.querySelector("#doomscroll-ignore");
  ignoreBtn.style.cssText = btnStyle + "background: #ecf0f1; color: #666;";
  ignoreBtn.addEventListener("click", () => {
    overlay.remove();
    overlayExists = false;
    warningShown = true;
    scrollStartTime = Date.now();
  });

  document.body.appendChild(overlay);
}

window.addEventListener("scroll", () => {
  scrollCount++;
  const minutes = getMinutesSpent();

  if (minutes >= 10 && !warningShown) {
    showOverlay(minutes);
  }
});

setInterval(() => {
  const minutes = getMinutesSpent();
  if (minutes >= 10 && !warningShown && !overlayExists) {
    showOverlay(minutes);
  }
}, 30000);