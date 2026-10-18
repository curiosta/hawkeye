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
  function howto(doText, watchText) { return H.el("div", { "class": "howto-box" }, [H.el("p", {}, [H.el("strong", { text: "What to do: " }), doText]), H.el("p", {}, [H.el("strong", { text: "What to watch: " }), watchText])]); }
  var after = H.el("div", { "class": "after" }, [H.el("p", {}, [H.el("strong", { text: "What just happened? " }),
    "In years when growth came in below the 3% interest rate, the gap pushed the debt ratio up. In years when growth came in above 3%, it pulled the ratio down, and when growth was exactly 3% the two cancelled out. Your primary balance then took points off the ratio (a surplus) or added points to it (a deficit). Press \u201cStart again\u201d for a new run of growth years, or go on to step 2."])]);
  after.hidden = true;
  var play = H.el("section", { "class": "stage", "aria-labelledby": "s1" }, [H.el("p", { "class": "step-label", text: "Step 1 of 2 \u00b7 You play" }), H.el("h2", { id: "s1", text: "1. Five budget years" }),
    H.el("p", { text: "The real interest rate is 3%. Growth each year is uncertain (between 0% and 4%). Each year, pick the primary balance: what the budget adds to the debt (a deficit) or pays towards it (a surplus), leaving interest aside." }),
    howto("press one of the three buttons for each of five years: a deficit of 2% of GDP, a balanced budget (0%), or a surplus of 2% of GDP.", "how much interest pushed the ratio up, how much growth pulled it down, and how much your choice added or took off.")]);
  var d, hist, rows, rand, btns = [], again;
  function start() { rand = H.rng(seed); d = 60; hist = [60]; rows = []; btns.forEach(function (b) { b.disabled = false; }); again.hidden = true; after.hidden = true; render(); H.live(region, "Debt starts at 60% of GDP. Year 1: choose a primary balance."); }
  function render() {
    score.textContent = "Year " + Math.min(hist.length, YEARS) + " of " + YEARS + ". Debt: " + H.fmt(d) + "% of GDP.";
    box.innerHTML = "";
    box.appendChild(H.figure("Debt ratio after each year", H.lineChart([{ name: "Debt", values: hist }], 120, "Line chart of the debt ratio; now " + H.fmt(d) + "% of GDP.", "Year", "Debt, % of GDP", YEARS),
      H.table("Your years", ["Year", "Growth %", "Primary balance %", "Debt % of GDP"], rows)));
  }
  function choose(pb) {
    if (hist.length > YEARS) return;
    var g = Math.floor(rand() * 5), before = d; d = next(d, R, g, pb); hist.push(Math.round(d * 10) / 10); rows.push([hist.length - 1, g, pb, H.fmt(d)]); render();
    var gapEffect = (R - g) / (100 + g) * before;
    var gapText = g < R ? "Growth was below interest, so the gap added " + H.fmt(gapEffect) + " points." : (g > R ? "Growth was above interest, so the gap took off " + H.fmt(-gapEffect) + " points." : "Growth equalled interest, so the two cancelled out.");
    var pbText = pb > 0 ? " Your surplus of " + pb + "% took off " + pb + " points." : (pb < 0 ? " Your deficit of " + (-pb) + "% added " + (-pb) + " points." : " Your balanced budget added nothing and took nothing off.");
    var msg = "Year " + (hist.length - 1) + ": growth " + g + "%, interest 3%, primary balance " + (pb > 0 ? "+" : "") + pb + "%. " + gapText + pbText + " Debt moved from " + H.fmt(before) + "% to " + H.fmt(d) + "% of GDP.";
    if (hist.length > YEARS) { btns.forEach(function (b) { b.disabled = true; }); again.hidden = false; after.hidden = false; msg += " Five years done."; again.focus(); }
    H.live(region, msg);
  }
  [[-2, "Deficit of 2%"], [0, "Balanced (0%)"], [2, "Surplus of 2%"]].forEach(function (o, i) { btns.push(H.button(o[1], i === 1 ? "btn-primary" : "btn-dark", function () { choose(o[0]); })); });
  again = H.button("Start again", "btn-ghost", function () { seed += 1; start(); btns[1].focus(); });
  play.appendChild(H.el("div", { "class": "controls", role: "group", "aria-label": "Primary balance" }, btns.concat([again])));
  play.appendChild(score); play.appendChild(region); play.appendChild(box); play.appendChild(after);
  // --- Part 2: simulate ---
  var r = 4, g = 2, pb = 0, region2 = H.el("p", { "class": "live", "aria-live": "polite" }), fig2 = H.el("div"), N = 30;
  var sim = H.el("section", { "class": "stage", "aria-labelledby": "s2" }, [H.el("p", { "class": "step-label", text: "Step 2 of 2 \u00b7 You watch" }), H.el("h2", { id: "s2", text: "2. Thirty years" }),
    H.el("p", { text: "Now the computer runs thirty years. Nothing is random here: you set the interest rate (r), the growth rate (g) and a primary balance that stays the same every year. A positive balance is a surplus; a negative one is a deficit." }),
    howto("move the three sliders, then press Run to watch, Step to go one year at a time, or Reset to start over.", "where the line ends after thirty years. Compare a setting with r above g with one where r is below g.")]);
  function draw(n) {
    var shown = path(r, g, pb, N).slice(0, n + 1);
    fig2.innerHTML = "";
    var rowsT = []; for (var i = 0; i < shown.length; i += (shown.length > 11 ? 5 : 1)) rowsT.push([i, shown[i]]);
    if ((shown.length - 1) % 5 && shown.length > 11) rowsT.push([shown.length - 1, shown[shown.length - 1]]);
    fig2.appendChild(H.figure("Debt ratio, r " + r + "%, g " + g + "%, primary balance " + pb + "%", H.lineChart([{ name: "Debt", values: shown.length > 1 ? shown : [60] }], 150, "Line chart of the debt ratio; year " + n + ": " + H.fmt(shown[shown.length - 1]) + "% of GDP.", "Year", "Debt, % of GDP", N),
      H.table("Debt ratio, % of GDP", ["Year", "Debt"], rowsT)));
  }
  function why() {
    var hold = (r - g) / (100 + g) * 60, h = H.fmt(Math.abs(hold));
    var rel = r > g ? " Here r is above g, so without a surplus the ratio rises." : (r < g ? " Here r is below g, so without a deficit the ratio falls." : " Here r equals g, so without a surplus or deficit the ratio stays where it is.");
    var holdText = h === "0" ? " A primary balance of zero holds the ratio at 60% in this setting." : " In this setting, a primary " + (hold > 0 ? "surplus" : "deficit") + " of about " + h + "% of GDP every year would hold the ratio at 60%.";
    return rel + holdText;
  }
  var run = H.runner(N, draw, region2, function (n) { return "After " + n + " years with r " + r + "%, g " + g + "% and primary balance " + pb + "%, debt is " + H.fmt(path(r, g, pb, N)[n]) + "% of GDP." + why(); });
  var s1 = H.slider("debt-r", "Real interest rate (r)", 0, 8, 0.5, r, "%", function (v) { r = v; run.reset(); });
  var s2 = H.slider("debt-g", "Real growth rate (g)", 0, 8, 0.5, g, "%", function (v) { g = v; run.reset(); });
  var s3 = H.slider("debt-pb", "Primary balance, % of GDP", -4, 4, 0.5, pb, "%", function (v) { pb = v; run.reset(); });
  [s1, s2, s3].forEach(function (s) { sim.appendChild(s.node); });
  sim.appendChild(run.node); sim.appendChild(region2); sim.appendChild(fig2);
  app.appendChild(play); app.appendChild(sim); app.hidden = false;
  start(); draw(0);
})();
