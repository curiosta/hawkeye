/* Hawkeye Play, chapter: Trade or tariff. MIT licence. Twin of play.py (tournament). */
(function () {
  "use strict";
  var H = window.HP, app = document.getElementById("play-app"); if (!app || !H) return;
  var PAY = { OO: [3, 3], TO: [5, 0], OT: [0, 5], TT: [1, 1] };
  var S = [
    ["Mirror", "opens first, then copies your last move", function (me, th) { return th.length ? th[th.length - 1] : "O"; }],
    ["Hardliner", "always puts up a tariff", function () { return "T"; }],
    ["Opener", "always keeps its market open", function () { return "O"; }],
    ["Grudge-holder", "stays open until you tariff once, then tariffs for good", function (me, th) { return th.indexOf("T") >= 0 ? "T" : "O"; }],
    ["Forgiving mirror", "tariffs only after two tariffs in a row from you", function (me, th) { var n = th.length; return n >= 2 && th[n - 1] === "T" && th[n - 2] === "T" ? "T" : "O"; }]
  ];
  var WORD = { O: "kept open", T: "put up a tariff" };
  function tournament(rounds) {
    var tot = S.map(function () { return 0; });
    for (var i = 0; i < S.length; i++) for (var j = i + 1; j < S.length; j++) {
      var a = [], b = [];
      for (var r = 0; r < rounds; r++) { var x = S[i][2](a, b), y = S[j][2](b, a), p = PAY[x + y]; tot[i] += p[0]; tot[j] += p[1]; a.push(x); b.push(y); }
    }
    return tot;
  }
  window.HP.tradeTournament = tournament;
  var ROUNDS = 6, seed = Number(new URLSearchParams(location.search).get("seed")) || 1;
  // --- Part 1: play ---
  var region = H.el("p", { "class": "live", "aria-live": "polite", id: "trade-live" });
  var play = H.el("section", { "class": "stage", "aria-labelledby": "s1" }, [H.el("h2", { id: "s1", text: "1. Play six rounds" }),
    H.el("p", { text: "You are one country. The other country follows a fixed strategy that you cannot see yet. Choose each round." })]);
  var btnO, btnT, again, logBox = H.el("div"), score = H.el("p", { "class": "score" });
  var opp, mine, theirs, you, them;
  function start() {
    var rand = H.rng(seed); opp = Math.floor(rand() * S.length); mine = []; theirs = []; you = 0; them = 0;
    btnO.disabled = false; btnT.disabled = false; again.hidden = true; render(); H.live(region, "New partner. Round 1 of " + ROUNDS + ": choose.");
  }
  function render() {
    score.textContent = "Round " + Math.min(mine.length + 1, ROUNDS) + " of " + ROUNDS + ". Your points: " + you + ". Their points: " + them + ".";
    logBox.innerHTML = "";
    if (mine.length) logBox.appendChild(H.table("Rounds played", ["Round", "You", "Them", "Your points", "Their points"], mine.map(function (m, i) { var p = PAY[m + theirs[i]]; return [i + 1, WORD[m], WORD[theirs[i]], p[0], p[1]]; })));
  }
  function choose(m) {
    if (mine.length >= ROUNDS) return;
    var t = S[opp][2](theirs, mine), p = PAY[m + t];
    mine.push(m); theirs.push(t); you += p[0]; them += p[1]; render();
    var msg = "Round " + mine.length + ": you " + WORD[m] + ", they " + WORD[t] + ". You +" + p[0] + ", them +" + p[1] + ". Totals: you " + you + ", them " + them + ".";
    if (mine.length >= ROUNDS) { btnO.disabled = true; btnT.disabled = true; again.hidden = false; msg += " Game over. They were the " + S[opp][0] + ": it " + S[opp][1] + "."; again.focus(); }
    H.live(region, msg);
  }
  btnO = H.button("Keep open", "btn-primary", function () { choose("O"); });
  btnT = H.button("Put up a tariff", "btn-dark", function () { choose("T"); });
  again = H.button("Play a new partner", "btn-ghost", function () { seed += 1; start(); btnO.focus(); });
  play.appendChild(H.el("div", { "class": "controls", role: "group", "aria-label": "Your move" }, [btnO, btnT, again]));
  play.appendChild(score); play.appendChild(region); play.appendChild(logBox);
  // --- Part 2: simulate ---
  var region2 = H.el("p", { "class": "live", "aria-live": "polite" }), figBox = H.el("div");
  var sim = H.el("section", { "class": "stage", "aria-labelledby": "s2" }, [H.el("h2", { id: "s2", text: "2. Watch a tournament" }),
    H.el("p", { text: "Five strategies each play every other strategy. Change how many rounds each pair plays." })]);
  var list = H.el("ul", { "class": "strats" }); S.forEach(function (s) { list.appendChild(H.el("li", {}, [H.el("strong", { text: s[0] + ": " }), s[1].replace("your", "the other side's").replace("you", "the other side") + "."])); });
  sim.appendChild(list);
  function draw(rounds) {
    var t = tournament(rounds), rows = S.map(function (s, i) { return [s[0], t[i]]; }).sort(function (a, b) { return b[1] - a[1]; });
    figBox.innerHTML = "";
    var lab = "Bar chart of total points with " + rounds + " round(s) per match. Highest: " + rows[0][0] + " with " + rows[0][1] + ".";
    figBox.appendChild(H.figure("Total points, " + rounds + " round" + (rounds > 1 ? "s" : "") + " per match", H.barChart(rows, lab), H.table("Totals, " + rounds + " round(s) per match", ["Strategy", "Points"], rows)));
    H.live(region2, "With " + rounds + " round" + (rounds > 1 ? "s" : "") + " per match, the top score is " + rows[0][0] + " (" + rows[0][1] + " points), and the lowest is " + rows[rows.length - 1][0] + " (" + rows[rows.length - 1][1] + ").");
  }
  var sl = H.slider("trade-rounds", "Rounds per match", 1, 20, 1, 1, "", draw);
  sim.appendChild(sl.node); sim.appendChild(region2); sim.appendChild(figBox);
  app.appendChild(play); app.appendChild(sim); app.hidden = false;
  start(); draw(1);
})();
