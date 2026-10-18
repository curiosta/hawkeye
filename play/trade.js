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
  var WHY = {
    OO: "Trade flowed both ways, so 3 points each.",
    TT: "Trade shrank on both sides, so 1 point each.",
    TO: "In this game that pays you the most (5) and leaves them with nothing (0).",
    OT: "That is the worst result for you: they get 5 and you get 0."
  };
  function box(doText, watchText) { return H.el("div", { "class": "howto-box" }, [H.el("p", {}, [H.el("strong", { text: "What to do: " }), doText]), H.el("p", {}, [H.el("strong", { text: "What to watch: " }), watchText])]); }
  var after = H.el("div", { "class": "after" }, [H.el("p", {}, [H.el("strong", { text: "What just happened? " }),
    "Look at the table of rounds. Did their move in each round match your move in the round before? Did they ever forgive a tariff? Those are clues to their strategy. Notice too that in every single round a tariff paid you more whatever they chose (5 instead of 3, or 1 instead of 0). Yet two countries that both keep putting up tariffs get only 1 point a round each, instead of the 3 each they get by both staying open. Press \u201cPlay a new partner\u201d to meet another strategy (it can turn out to be the same one by chance), or go on to step 2."])]);
  after.hidden = true;
  var play = H.el("section", { "class": "stage", "aria-labelledby": "s1" }, [H.el("p", { "class": "step-label", text: "Step 1 of 2 \u00b7 You play" }), H.el("h2", { id: "s1", text: "1. Play six rounds" }),
    H.el("p", { text: "You are one country. The other country follows a fixed strategy (a fixed plan for how to play) that you cannot see yet. It might be friendly, tough, or somewhere in between. Choose each round." }),
    box("press \u201cKeep open\u201d or \u201cPut up a tariff\u201d. Both countries choose at the same time, so you find out their choice only after you have made yours.", "after each round, read what both sides chose and why the points came out that way. Does the other country seem to react to what you did last round?")]);
  var btnO, btnT, again, logBox = H.el("div"), score = H.el("p", { "class": "score" });
  var opp, mine, theirs, you, them;
  function start() {
    var rand = H.rng(seed); opp = Math.floor(rand() * S.length); mine = []; theirs = []; you = 0; them = 0;
    btnO.disabled = false; btnT.disabled = false; again.hidden = true; after.hidden = true; render(); H.live(region, "New partner. Round 1 of " + ROUNDS + ": choose to keep open or put up a tariff.");
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
    var msg = "Round " + mine.length + ": you " + WORD[m] + ", they " + WORD[t] + ". " + WHY[m + t] + " You +" + p[0] + ", them +" + p[1] + ". Totals: you " + you + ", them " + them + ".";
    if (mine.length >= ROUNDS) { btnO.disabled = true; btnT.disabled = true; again.hidden = false; after.hidden = false; msg += " Game over. They were the " + S[opp][0] + ": it " + S[opp][1] + "."; again.focus(); }
    H.live(region, msg);
  }
  btnO = H.button("Keep open", "btn-primary", function () { choose("O"); });
  btnT = H.button("Put up a tariff", "btn-dark", function () { choose("T"); });
  again = H.button("Play a new partner", "btn-ghost", function () { seed += 1; start(); btnO.focus(); });
  play.appendChild(H.el("div", { "class": "controls", role: "group", "aria-label": "Your move" }, [btnO, btnT, again]));
  play.appendChild(score); play.appendChild(region); play.appendChild(logBox); play.appendChild(after);
  // --- Part 2: simulate ---
  var region2 = H.el("p", { "class": "live", "aria-live": "polite" }), figBox = H.el("div");
  var sim = H.el("section", { "class": "stage", "aria-labelledby": "s2" }, [H.el("p", { "class": "step-label", text: "Step 2 of 2 \u00b7 You watch" }), H.el("h2", { id: "s2", text: "2. Watch a tournament" }),
    H.el("p", { text: "Now the computer plays. Five strategies each play every other strategy (a round-robin), using the same points as before, and each strategy's points are added up. Here are the five:" })]);
  var list = H.el("ul", { "class": "strats" }); S.forEach(function (s) { list.appendChild(H.el("li", {}, [H.el("strong", { text: s[0] + ": " }), s[1].replace("your", "the other side's").replace("you", "the other side") + "."])); });
  sim.appendChild(list);
  sim.appendChild(box("move the slider to set how many rounds each pair plays, from 1 to 20. The bar chart updates straight away.", "which strategy comes first when each pair meets only once, and which comes first when they meet many times. Where does the Hardliner end up?"));
  function draw(rounds) {
    var t = tournament(rounds), rows = S.map(function (s, i) { return [s[0], t[i]]; }).sort(function (a, b) { return b[1] - a[1]; });
    figBox.innerHTML = "";
    var lab = "Bar chart of total points with " + rounds + " round(s) per match. Highest: " + rows[0][0] + " with " + rows[0][1] + ".";
    figBox.appendChild(H.figure("Total points, " + rounds + " round" + (rounds > 1 ? "s" : "") + " per match", H.barChart(rows, lab), H.table("Totals, " + rounds + " round(s) per match", ["Strategy", "Points"], rows)));
    var tops = rows.filter(function (r) { return r[1] === rows[0][1]; }).map(function (r) { return r[0]; });
    var who = tops.length > 1 ? tops.slice(0, -1).join(", ") + " and " + tops[tops.length - 1] + " share the top score" : "the top score is " + tops[0];
    var why = tops[0] === "Hardliner" ?
      " With so few rounds, the Hardliner wins: it collects 5 points whenever a partner stays open, and there are not enough later rounds for the others to catch up by trading openly." :
      " With this many rounds, strategies that start open and answer tariffs with tariffs come out on top: when two of them meet they stay open every round and earn 3 points each time, while the Hardliner earns only 1 point a round once partners answer back.";
    H.live(region2, "With " + rounds + " round" + (rounds > 1 ? "s" : "") + " per match, " + who + " (" + rows[0][1] + " points), and the lowest is " + rows[rows.length - 1][0] + " (" + rows[rows.length - 1][1] + ")." + why);
  }
  var sl = H.slider("trade-rounds", "Rounds per match", 1, 20, 1, 1, "", draw);
  sim.appendChild(sl.node); sim.appendChild(region2); sim.appendChild(figBox);
  app.appendChild(play); app.appendChild(sim); app.hidden = false;
  start(); draw(1);
})();
