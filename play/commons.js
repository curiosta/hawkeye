/* Hawkeye Play, chapter: The shared pasture. MIT licence. Twin of play.py (commons). */
(function () {
  "use strict";
  var H = window.HP, app = document.getElementById("play-app"); if (!app || !H) return;
  var K = 100, R = 0.25, MODEST = 1.5, LARGE = 3, HERDERS = 4, SEASONS = 30;
  function grow(s) { return Math.min(K, s + R * s * (1 - s / K)); }
  function step(s, want) { var take = Math.min(want, s); s -= take; return [Math.round(grow(s) * 10) / 10, take]; }
  function path(keepers, n) {
    var s = 100, p = [100];
    for (var i = 0; i < n; i++) { s = grow(s - Math.min(s, keepers * MODEST + (HERDERS - keepers) * LARGE)); p.push(Math.round(s * 10) / 10); }
    return p;
  }
  window.HP.commonsPath = path;
  var seed = Number(new URLSearchParams(location.search).get("seed")) || 1;
  // --- Part 1: play ---
  var PLAYS = 10, region = H.el("p", { "class": "live", "aria-live": "polite" }), chartBox = H.el("div"), score = H.el("p", { "class": "score" });
  var play = H.el("section", { "class": "stage", "aria-labelledby": "s1" }, [H.el("h2", { id: "s1", text: "1. Herd for ten seasons" }),
    H.el("p", { text: "You are one of four herders. Each season the other three each pick a modest or a large share; you cannot see their choice in advance." })]);
  var stock, mine, hist, rand, bm, bl, again;
  function start() { rand = H.rng(seed); stock = 100; mine = 0; hist = [100]; bm.disabled = bl.disabled = false; again.hidden = true; render(); H.live(region, "New pasture with 100 units of grass. Season 1: choose."); }
  function render() {
    score.textContent = "Season " + Math.min(hist.length, PLAYS) + " of " + PLAYS + ". Grass left: " + H.fmt(stock) + ". Your harvest so far: " + H.fmt(mine) + ".";
    chartBox.innerHTML = "";
    chartBox.appendChild(H.figure("Grass left after each season", H.lineChart([{ name: "Grass", values: hist }], 100, "Line chart of grass left; now " + H.fmt(stock) + " after " + (hist.length - 1) + " seasons.", "Season", "Grass units", PLAYS),
      H.table("Grass left", ["Season", "Grass"], hist.map(function (v, i) { return [i, v]; }))));
  }
  function choose(large) {
    if (hist.length > PLAYS) return;
    var others = 0, nl = 0; for (var i = 0; i < 3; i++) { var l = rand() < 0.5; nl += l ? 1 : 0; others += l ? LARGE : MODEST; }
    var want = (large ? LARGE : MODEST) + others, before = stock, r = step(stock, want);
    var share = want ? (large ? LARGE : MODEST) / want * r[1] : 0; mine += share; stock = r[0]; hist.push(stock); render();
    var msg = "Season " + (hist.length - 1) + ": you took a " + (large ? "large" : "modest") + " share; " + nl + " of the other 3 took a large share. Grass went from " + H.fmt(before) + " to " + H.fmt(stock) + ".";
    if (hist.length > PLAYS) { bm.disabled = bl.disabled = true; again.hidden = false; msg += " Ten seasons done. Your harvest: " + H.fmt(mine) + "."; again.focus(); }
    H.live(region, msg);
  }
  bm = H.button("Take a modest share", "btn-primary", function () { choose(false); });
  bl = H.button("Take a large share", "btn-dark", function () { choose(true); });
  again = H.button("Start a new pasture", "btn-ghost", function () { seed += 1; start(); bm.focus(); });
  play.appendChild(H.el("div", { "class": "controls", role: "group", "aria-label": "Your choice" }, [bm, bl, again]));
  play.appendChild(score); play.appendChild(region); play.appendChild(chartBox);
  // --- Part 2: simulate ---
  var region2 = H.el("p", { "class": "live", "aria-live": "polite" }), fig2 = H.el("div"), keepers = 4;
  var sim = H.el("section", { "class": "stage", "aria-labelledby": "s2" }, [H.el("h2", { id: "s2", text: "2. Run thirty seasons" }),
    H.el("p", { text: "Choose how many of the four herders keep to the modest share, then run, step season by season, or reset." })]);
  function draw(n) {
    var full = path(keepers, SEASONS), shown = full.slice(0, n + 1);
    fig2.innerHTML = "";
    fig2.appendChild(H.figure("Grass left with " + keepers + " of 4 herders taking the modest share", H.lineChart([{ name: keepers + " of 4 modest", values: shown.length > 1 ? shown : [100] }], 100, "Line chart of grass left; season " + n + ": " + H.fmt(shown[shown.length - 1]) + ".", "Season", "Grass units", SEASONS),
      H.table("Grass left", ["Season", "Grass"], shown.map(function (v, i) { return [i, v]; }))));
  }
  var run = H.runner(SEASONS, draw, region2, function (n) { var v = path(keepers, SEASONS)[n]; return "After " + n + " seasons with " + keepers + " of 4 modest, grass left: " + H.fmt(v) + "."; });
  var sl = H.slider("commons-keepers", "Herders taking the modest share", 0, 4, 1, 4, " of 4", function (v) { keepers = v; run.reset(); });
  sim.appendChild(sl.node); sim.appendChild(run.node); sim.appendChild(region2); sim.appendChild(fig2);
  app.appendChild(play); app.appendChild(sim); app.hidden = false;
  start(); draw(0);
})();
