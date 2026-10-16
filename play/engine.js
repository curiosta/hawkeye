/* Hawkeye Play engine. MIT licence (see /play/LICENSE-CODE.txt). No libraries, no network. */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function rng(seed) { // mulberry32
    var a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    for (var k in attrs || {}) { if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }
  function sv(tag, attrs, text) { var n = document.createElementNS(NS, tag); for (var k in attrs) n.setAttribute(k, attrs[k]); if (text != null) n.textContent = text; return n; }
  function width() { var a = document.getElementById("play-app"); var cw = a && a.clientWidth ? a.clientWidth - 40 : 640; return Math.max(300, Math.min(640, Math.round(cw))); }
  var DASH = ["", "8 5", "2 4", "12 4 2 4", "4 3"];
  function fmt(v) { return (Math.round(v * 10) / 10).toString(); }
  function lineChart(series, ymax, label, xlab, ylab, xmax) {
    var w = width(), h = Math.round(w * 0.5) + 40, L = 52, B = 40, T = 16, R = w < 500 ? 110 : 150, pw = w - L - R, ph = h - T - B, n = 1;
    series.forEach(function (s) { n = Math.max(n, s.values.length - 1); }); if (xmax) n = Math.max(n, xmax);
    function X(i) { return L + pw * i / n; } function Y(v) { return T + ph * (1 - Math.max(0, Math.min(v, ymax)) / ymax); }
    var s = sv("svg", { viewBox: "0 0 " + w + " " + h, "class": "chart", role: "img", "aria-label": label });
    s.appendChild(sv("line", { x1: L, y1: T + ph, x2: L + pw, y2: T + ph, "class": "ax" }));
    s.appendChild(sv("line", { x1: L, y1: T, x2: L, y2: T + ph, "class": "ax" }));
    for (var k = 0; k < 5; k++) { var v = ymax * k / 4, y = Y(v); s.appendChild(sv("line", { x1: L, y1: y, x2: L + pw, y2: y, "class": "grid" })); s.appendChild(sv("text", { x: L - 6, y: y + 4, "class": "tick", "text-anchor": "end" }, fmt(v))); }
    for (var j = 0; j <= n; j += Math.max(1, Math.floor(n / 5))) s.appendChild(sv("text", { x: X(j), y: T + ph + 16, "class": "tick", "text-anchor": "middle" }, j));
    s.appendChild(sv("text", { x: L + pw / 2, y: h - 4, "class": "axl", "text-anchor": "middle" }, xlab));
    s.appendChild(sv("text", { x: 12, y: T + ph / 2, "class": "axl", "text-anchor": "middle", transform: "rotate(-90 12 " + (T + ph / 2) + ")" }, ylab));
    series.forEach(function (se, i) {
      var pts = se.values.map(function (v, j) { return X(j).toFixed(1) + "," + Y(v).toFixed(1); }).join(" ");
      s.appendChild(sv("polyline", { points: pts, "class": "ln ln" + i, "stroke-dasharray": DASH[i % 5] }));
      var lv = se.values[se.values.length - 1]; s.appendChild(sv("circle", { cx: X(se.values.length - 1), cy: Y(lv), r: 4, "class": "pt pt" + i }));
      if (se.values.length) s.appendChild(sv("text", { x: L + pw + 6, y: Y(se.values[se.values.length - 1]) + 4, "class": "lab lab" + i }, se.name));
    });
    return s;
  }
  function barChart(rows, label) {
    var w = width(), bh = 26, gap = 10, L = 130, h = rows.length * (bh + gap) + 10, mx = 1;
    rows.forEach(function (r) { mx = Math.max(mx, r[1]); });
    var s = sv("svg", { viewBox: "0 0 " + w + " " + h, "class": "chart", role: "img", "aria-label": label });
    rows.forEach(function (r, i) {
      var y = 5 + i * (bh + gap), bw = (w - L - 60) * r[1] / mx;
      s.appendChild(sv("text", { x: L - 8, y: y + bh * 0.68, "class": "tick", "text-anchor": "end" }, r[0]));
      s.appendChild(sv("rect", { x: L, y: y, width: bw.toFixed(1), height: bh, rx: 4, "class": "bar" }));
      s.appendChild(sv("text", { x: L + bw + 6, y: y + bh * 0.68, "class": "tick" }, r[1]));
    });
    return s;
  }
  function table(caption, head, rows) {
    var t = el("table", { "class": "data" }, [el("caption", { text: caption })]);
    var tr = el("tr"); head.forEach(function (x) { tr.appendChild(el("th", { scope: "col", text: x })); });
    t.appendChild(el("thead", {}, [tr]));
    var tb = el("tbody");
    rows.forEach(function (r) { var row = el("tr"); r.forEach(function (c, k) { row.appendChild(el(k ? "td" : "th", k ? { text: String(c) } : { scope: "row", text: String(c) })); }); tb.appendChild(row); });
    t.appendChild(tb);
    return el("div", { "class": "tbl-wrap" }, [t]);
  }
  function figure(caption, chart, tbl) {
    return el("figure", { "class": "pfig" }, [el("figcaption", { text: caption }), chart, el("details", { "class": "tbl" }, [el("summary", { text: "Data table" }), tbl])]);
  }
  function slider(id, label, min, max, step, value, unit, onchange) {
    var out = el("output", { "for": id, id: id + "-out" });
    var inp = el("input", { type: "range", id: id, min: min, max: max, step: step, value: value });
    function upd() { out.textContent = inp.value + (unit || ""); inp.setAttribute("aria-valuetext", inp.value + (unit || "")); }
    inp.addEventListener("input", function () { upd(); onchange(Number(inp.value)); });
    upd();
    return { node: el("div", { "class": "slider" }, [el("label", { "for": id, text: label }), inp, out]), input: inp };
  }
  function button(text, cls, onclick) { var b = el("button", { type: "button", "class": "btn " + (cls || "btn-ghost") , text: text }); b.addEventListener("click", onclick); return b; }
  function live(region, msg) { region.textContent = ""; setTimeout(function () { region.textContent = msg; }, 30); }
  // Runner: step-through always; animated run only without reduced motion.
  function runner(total, draw, region, label) {
    var i = 0, timer = null;
    var stepB = button("Step", "btn-ghost", function () { stop(); if (i < total) { i++; draw(i); } if (i >= total) live(region, label(i)); });
    var runB = button(reduced ? "Show result" : "Run", "btn-primary", function () {
      stop(); if (i >= total) i = 0;
      if (reduced) { i = total; draw(i); live(region, label(i)); return; }
      timer = setInterval(function () { i++; draw(i); if (i >= total) { stop(); live(region, label(i)); } }, 90);
    });
    var resetB = button("Reset", "btn-ghost", function () { stop(); i = 0; draw(0); live(region, "Reset to the start."); });
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    return { node: el("div", { "class": "controls", role: "group", "aria-label": "Simulation controls" }, [runB, stepB, resetB]), reset: function () { stop(); i = 0; draw(0); }, done: function () { stop(); i = total; draw(i); } };
  }
  window.HP = { rng: rng, el: el, lineChart: lineChart, barChart: barChart, table: table, figure: figure, slider: slider, button: button, live: live, runner: runner, reduced: reduced, fmt: fmt };
  document.documentElement.classList.add("js");
})();
