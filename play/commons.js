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
  function box(doText, watchText) { return H.el("div", { "class": "howto-box" }, [H.el("p", {}, [H.el("strong", { text: "What to do: " }), doText]), H.el("p", {}, [H.el("strong", { text: "What to watch: " }), watchText])]); }
  var after = H.el("div", { "class": "after" }, [H.el("p", {}, [H.el("strong", { text: "What just happened? " }),
    "Whenever the four herders together took more than about 6 units in a season, the pasture lost more grass than it can grow back, even at its fastest. Your large shares gave you more grass in that season, but the loss was shared by all four herders, and less grass now means less regrowth later. The other herders chose at random, so another pasture can go better or worse. Press \u201cStart a new pasture\u201d to try again, or go on to step 2."])]);
  after.hidden = true;
  var play = H.el("section", { "class": "stage", "aria-labelledby": "s1" }, [H.el("p", { "class": "step-label", text: "Step 1 of 2 \u00b7 You play" }), H.el("h2", { id: "s1", text: "1. Herd for ten seasons" }),
    H.el("p", { text: "You are one of four herders. Each season the other three each pick a modest or a large share; you cannot see their choice in advance. In this game they choose at random, like tossing a coin." }),
    box("press \u201cTake a modest share\u201d (1.5 units) or \u201cTake a large share\u201d (3 units) for each of ten seasons.", "how much the herd ate, how much grass grew back, and the line on the chart. Is the grass holding up or going down?")]);
  var stock, mine, hist, rand, bm, bl, again;
  function start() { rand = H.rng(seed); stock = 100; mine = 0; hist = [100]; bm.disabled = bl.disabled = false; again.hidden = true; after.hidden = true; render(); H.live(region, "New pasture with 100 units of grass. Season 1: choose a modest or a large share."); }
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
    var regrew = stock - (before - r[1]);
    var msg = "Season " + (hist.length - 1) + ": you took a " + (large ? "large" : "modest") + " share; " + nl + " of the other 3 took a large share. " +
      (r[1] < want ? "There was not enough grass for everyone, so the herd ate the last " + H.fmt(r[1]) + " units. " : "Together the herd ate " + H.fmt(r[1]) + " units, ") +
      "then " + H.fmt(Math.max(0, regrew)) + " units grew back. Grass went from " + H.fmt(before) + " to " + H.fmt(stock) + "." +
      (stock > 0 && stock < 50 ? " The pasture is now under half full: the less grass is left, the less grows back." : "") +
      (stock === 0 ? " The pasture is bare, and nothing can grow back from nothing." : "");
    if (hist.length > PLAYS) { bm.disabled = bl.disabled = true; again.hidden = false; after.hidden = false; msg += " Ten seasons done. Your harvest: " + H.fmt(mine) + " units. Grass left: " + H.fmt(stock) + " of 100."; again.focus(); }
    H.live(region, msg);
  }
  bm = H.button("Take a modest share", "btn-primary", function () { choose(false); });
  bl = H.button("Take a large share", "btn-dark", function () { choose(true); });
  again = H.button("Start a new pasture", "btn-ghost", function () { seed += 1; start(); bm.focus(); });
  play.appendChild(H.el("div", { "class": "controls", role: "group", "aria-label": "Your choice" }, [bm, bl, again]));
  play.appendChild(score); play.appendChild(region); play.appendChild(chartBox); play.appendChild(after);
  // --- Part 2: simulate ---
  var region2 = H.el("p", { "class": "live", "aria-live": "polite" }), fig2 = H.el("div"), keepers = 4;
  var sim = H.el("section", { "class": "stage", "aria-labelledby": "s2" }, [H.el("p", { "class": "step-label", text: "Step 2 of 2 \u00b7 You watch" }), H.el("h2", { id: "s2", text: "2. Run thirty seasons" }),
    H.el("p", { text: "Now the computer plays all four herders for thirty seasons. Nobody chooses at random here: you decide how many herders keep to the modest share, and the rest take the large share every season." }),
    box("choose how many of the four herders keep to the modest share, then press Run to watch, Step to go one season at a time, or Reset to start over.", "whether the line levels off or heads down to zero, and how the answer changes as you move the slider from 4 to 0.")]);
  function draw(n) {
    var full = path(keepers, SEASONS), shown = full.slice(0, n + 1);
    fig2.innerHTML = "";
    fig2.appendChild(H.figure("Grass left with " + keepers + " of 4 herders taking the modest share", H.lineChart([{ name: keepers + " of 4 modest", values: shown.length > 1 ? shown : [100] }], 100, "Line chart of grass left; season " + n + ": " + H.fmt(shown[shown.length - 1]) + ".", "Season", "Grass units", SEASONS),
      H.table("Grass left", ["Season", "Grass"], shown.map(function (v, i) { return [i, v]; }))));
  }
  function why(k) {
    var take = k * MODEST + (HERDERS - k) * LARGE, p = path(k, SEASONS), z = p.indexOf(0);
    if (take <= 6) return " Together they take " + H.fmt(take) + " units a season, about what the pasture can grow back, so the grass falls slowly and then levels off.";
    if (z < 0) return " Together they take " + H.fmt(take) + " units a season, more than the pasture can grow back even at its fastest (a little over 6), so the grass keeps falling.";
    return " Together they take " + H.fmt(take) + " units a season, far more than the pasture can grow back, so the grass ran out in season " + z + ".";
  }
  var run = H.runner(SEASONS, draw, region2, function (n) { var v = path(keepers, SEASONS)[n]; return "After " + n + " seasons with " + keepers + " of 4 modest, grass left: " + H.fmt(v) + "." + why(keepers); });
  var sl = H.slider("commons-keepers", "Herders taking the modest share", 0, 4, 1, 4, " of 4", function (v) { keepers = v; run.reset(); });
  sim.appendChild(sl.node); sim.appendChild(run.node); sim.appendChild(region2); sim.appendChild(fig2);
  app.appendChild(play); app.appendChild(sim); app.hidden = false;
  start(); draw(0);
})();
