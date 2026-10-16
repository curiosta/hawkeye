/* Hawkeye Play, chapter: Interest and growth. MIT licence. Twin of play.py (debt). */
(function () {
  "use strict";
  var H = window.HP, app = document.getElementById("play-app"); if (!app || !H) return;
  function next(d, r, g, pb) { return d + (r - g) / (100 + g) * d - pb; }
  function path(r, g, pb, n) { var d = 60, p = [60]; for (var i = 0; i < n; i++) { d = next(d, r, g, pb); p.push(Math.round(d * 10) / 10); } return p; }
  window.HP.debtPath = path;
  var seed = Number(new URLSearchParams(location.search).get("seed")) || 1;
  // --- Part 1: play ---
  var YEARS = 5, R = 3, region = H.el("p", { "class": "live", "aria-live": "polite" }), box = H.el("div"), score = H.el("p", { "class": "score" });
  var play = H.el("section", { "class": "stage", "aria-labelledby": "s1" }, [H.el("h2", { id: "s1", text: "1. Five budget years" }),
    H.el("p", { text: "The real interest rate is 3%. Growth each year is uncertain (between 0% and 4%). Each year, pick the primary balance." })]);
  var d, hist, rows, rand, btns = [], again;
  function start() { rand = H.rng(seed); d = 60; hist = [60]; rows = []; btns.forEach(function (b) { b.disabled = false; }); again.hidden = true; render(); H.live(region, "Debt starts at 60% of GDP. Year 1: choose a primary balance."); }
  function render() {
    score.textContent = "Year " + Math.min(hist.length, YEARS) + " of " + YEARS + ". Debt: " + H.fmt(d) + "% of GDP.";
    box.innerHTML = "";
    box.appendChild(H.figure("Debt ratio after each year", H.lineChart([{ name: "Debt", values: hist }], 120, "Line chart of the debt ratio; now " + H.fmt(d) + "% of GDP.", "Year", "Debt, % of GDP", YEARS),
      H.table("Your years", ["Year", "Growth %", "Primary balance %", "Debt % of GDP"], rows)));
  }
  function choose(pb) {
    if (hist.length > YEARS) return;
    var g = Math.floor(rand() * 5), before = d; d = next(d, R, g, pb); hist.push(Math.round(d * 10) / 10); rows.push([hist.length - 1, g, pb, H.fmt(d)]); render();
    var msg = "Year " + (hist.length - 1) + ": growth " + g + "%, interest 3%, primary balance " + (pb > 0 ? "+" : "") + pb + "%. Debt moved from " + H.fmt(before) + "% to " + H.fmt(d) + "% of GDP.";
    if (hist.length > YEARS) { btns.forEach(function (b) { b.disabled = true; }); again.hidden = false; msg += " Five years done."; again.focus(); }
    H.live(region, msg);
  }
  [[-2, "Deficit of 2%"], [0, "Balanced (0%)"], [2, "Surplus of 2%"]].forEach(function (o, i) { btns.push(H.button(o[1], i === 1 ? "btn-primary" : "btn-dark", function () { choose(o[0]); })); });
  again = H.button("Start again", "btn-ghost", function () { seed += 1; start(); btns[1].focus(); });
  play.appendChild(H.el("div", { "class": "controls", role: "group", "aria-label": "Primary balance" }, btns.concat([again])));
  play.appendChild(score); play.appendChild(region); play.appendChild(box);
  // --- Part 2: simulate ---
  var r = 4, g = 2, pb = 0, region2 = H.el("p", { "class": "live", "aria-live": "polite" }), fig2 = H.el("div"), N = 30;
  var sim = H.el("section", { "class": "stage", "aria-labelledby": "s2" }, [H.el("h2", { id: "s2", text: "2. Thirty years" }),
    H.el("p", { text: "Set the interest rate, the growth rate and a constant primary balance, then run, step year by year, or reset." })]);
  function draw(n) {
    var shown = path(r, g, pb, N).slice(0, n + 1);
    fig2.innerHTML = "";
    var rowsT = []; for (var i = 0; i < shown.length; i += (shown.length > 11 ? 5 : 1)) rowsT.push([i, shown[i]]);
    if ((shown.length - 1) % 5 && shown.length > 11) rowsT.push([shown.length - 1, shown[shown.length - 1]]);
    fig2.appendChild(H.figure("Debt ratio, r " + r + "%, g " + g + "%, primary balance " + pb + "%", H.lineChart([{ name: "Debt", values: shown.length > 1 ? shown : [60] }], 150, "Line chart of the debt ratio; year " + n + ": " + H.fmt(shown[shown.length - 1]) + "% of GDP.", "Year", "Debt, % of GDP", N),
      H.table("Debt ratio, % of GDP", ["Year", "Debt"], rowsT)));
  }
  var run = H.runner(N, draw, region2, function (n) { return "After " + n + " years with r " + r + "%, g " + g + "% and primary balance " + pb + "%, debt is " + H.fmt(path(r, g, pb, N)[n]) + "% of GDP."; });
  var s1 = H.slider("debt-r", "Real interest rate (r)", 0, 8, 0.5, r, "%", function (v) { r = v; run.reset(); });
  var s2 = H.slider("debt-g", "Real growth rate (g)", 0, 8, 0.5, g, "%", function (v) { g = v; run.reset(); });
  var s3 = H.slider("debt-pb", "Primary balance, % of GDP", -4, 4, 0.5, pb, "%", function (v) { pb = v; run.reset(); });
  [s1, s2, s3].forEach(function (s) { sim.appendChild(s.node); });
  sim.appendChild(run.node); sim.appendChild(region2); sim.appendChild(fig2);
  app.appendChild(play); app.appendChild(sim); app.hidden = false;
  start(); draw(0);
})();
