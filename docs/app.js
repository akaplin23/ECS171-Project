import { predict } from "./predict.js";

const B = await (await fetch("./model.json")).json();
const $ = s => document.querySelector(s);

/* ---------------- theme ---------------- */
const root = document.documentElement;
const btn = $("#theme");
const setTheme = t => {
  root.dataset.theme = t;
  btn.textContent = t === "dark" ? "☀ Light" : "☾ Dark";
  localStorage.setItem("theme", t);
  draw();
};
btn.onclick = () => setTheme(root.dataset.theme === "dark" ? "light" : "dark");

/* ---------------- controls ---------------- */
const SLIDERS = [
  { k:"Age",         label:"Age",                 min:28, max:77,  step:1,   unit:"years" },
  { k:"RestingBP",   label:"Resting blood pressure", min:80, max:200, step:1, unit:"mm Hg" },
  { k:"Cholesterol", label:"Cholesterol",         min:0,  max:603, step:1,   unit:"mg/dl · 0 = not measured" },
  { k:"MaxHR",       label:"Max heart rate",      min:60, max:202, step:1,   unit:"bpm" },
  { k:"Oldpeak",     label:"Oldpeak (ST depression)", min:-2.6, max:6.2, step:0.1, unit:"mm" },
];
const SELECTS = [
  { k:"Sex",            label:"Sex",            opts:[["M","Male"],["F","Female"]] },
  { k:"ChestPainType",  label:"Chest pain type", opts:[["ASY","Asymptomatic"],["ATA","Atypical angina"],["NAP","Non-anginal pain"],["TA","Typical angina"]] },
  { k:"ExerciseAngina", label:"Exercise-induced angina", opts:[["N","No"],["Y","Yes"]] },
  { k:"ST_Slope",       label:"ST slope",       opts:[["Up","Up"],["Flat","Flat"],["Down","Down"]] },
  { k:"FastingBS",      label:"Fasting blood sugar > 120", opts:[["0","No"],["1","Yes"]] },
  { k:"RestingECG",     label:"Resting ECG",    opts:[["Normal","Normal"],["ST","ST-T abnormality"],["LVH","LV hypertrophy"]] },
];

const PRESETS = {
  median:  { Age:54, Sex:"M", ChestPainType:"ASY", RestingBP:130, Cholesterol:237, FastingBS:"0", RestingECG:"Normal", MaxHR:138, ExerciseAngina:"N", Oldpeak:0.6, ST_Slope:"Flat" },
  healthy: { Age:41, Sex:"F", ChestPainType:"ATA", RestingBP:118, Cholesterol:198, FastingBS:"0", RestingECG:"Normal", MaxHR:178, ExerciseAngina:"N", Oldpeak:0.0, ST_Slope:"Up" },
  sick:    { Age:64, Sex:"M", ChestPainType:"ASY", RestingBP:158, Cholesterol:290, FastingBS:"1", RestingECG:"ST",     MaxHR:104, ExerciseAngina:"Y", Oldpeak:2.8, ST_Slope:"Flat" },
};
let state = { ...PRESETS.median };

const ctrls = $("#ctrls");
SLIDERS.forEach(s => {
  const d = document.createElement("div"); d.className = "f";
  d.innerHTML = `<label for="i_${s.k}"><span>${s.label} <span class="u">${s.unit}</span></span>
    <b id="v_${s.k}"></b></label>
    <input type="range" id="i_${s.k}" min="${s.min}" max="${s.max}" step="${s.step}">`;
  ctrls.appendChild(d);
  d.querySelector("input").oninput = e => { state[s.k] = +e.target.value; render(); };
});
SELECTS.forEach(s => {
  const d = document.createElement("div"); d.className = "f";
  d.innerHTML = `<label for="i_${s.k}">${s.label}</label>
    <select id="i_${s.k}">${s.opts.map(([v,t]) => `<option value="${v}">${t}</option>`).join("")}</select>`;
  ctrls.appendChild(d);
  d.querySelector("select").onchange = e => { state[s.k] = e.target.value; render(); };
});
document.querySelectorAll(".presets button").forEach(b => {
  b.onclick = () => { state = { ...PRESETS[b.dataset.preset] }; sync(); render(); };
});

function sync() {
  SLIDERS.forEach(s => { $(`#i_${s.k}`).value = state[s.k]; });
  SELECTS.forEach(s => { $(`#i_${s.k}`).value = state[s.k]; });
}

function render() {
  SLIDERS.forEach(s => {
    const v = state[s.k];
    $(`#v_${s.k}`).textContent =
      s.k === "Cholesterol" && v === 0 ? "not measured" :
      s.step < 1 ? v.toFixed(1) : v;
  });

  const p = predict(state, B);
  const col = p >= 0.66 ? "var(--accent)" : p >= 0.36 ? "var(--warn)" : "var(--good)";
  $("#pct").textContent = p.toFixed(3);
  $("#pct").style.color = col;
  $("#fill").style.width = (p * 100).toFixed(1) + "%";
  $("#fill").style.background = col;

  const v = $("#verdict");
  const sick = p >= 0.5;
  v.textContent = sick ? "Predicted: heart disease" : "Predicted: no heart disease";
  v.style.background = sick ? "rgba(255,92,108,.14)" : "rgba(63,185,80,.14)";
  v.style.color = sick ? "var(--accent)" : "var(--good)";
  $("#t50").textContent = p >= 0.50 ? "disease" : "no disease";
  $("#t36").textContent = p >= 0.36 ? "disease" : "no disease";
}

/* ---------------- charts ---------------- */
const css = v => getComputedStyle(root).getPropertyValue(v).trim();
const COLOR = {
  "Logistic Regression":           "--c-lr",
  "Decision Tree":                 "--c-dt",
  "Standard init + SGD":           "--c-ssgd",
  "Standard init + Adam":          "--c-sadam",
  "Xavier init + Adam":            "--c-xav",
  "Standard init + SGD, 6 layers": "--c-dead",
};
const colOf = n => css(COLOR[n] || "--tx3");
const NS = "http://www.w3.org/2000/svg";
const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
const txt = (x, y, s, o = {}) => {
  const t = el("text", { x, y, fill: o.fill || css("--tx3"), "font-size": o.size || 10.5,
    "text-anchor": o.anchor || "start", "font-weight": o.weight || 400 });
  t.textContent = s; return t;
};

function axes(svg, X, Y, W, H, xs, ys, fmt) {
  const line = css("--line");
  ys.forEach(([v, y]) => {
    svg.appendChild(el("line", { x1:X, y1:y, x2:X+W, y2:y, stroke:line, "stroke-width":1 }));
    svg.appendChild(txt(X-8, y+3.5, fmt(v), { anchor:"end" }));
  });
  xs.forEach(([v, x]) => svg.appendChild(txt(x, Y+H+17, v, { anchor:"middle" })));
}

function depthChart() {
  const svg = $("#depthChart"); svg.innerHTML = "";
  const X=42, Y=14, W=378, H=196;
  const lo=0.60, hi=0.96, sx=d=>X+(d-1)/5*W, sy=v=>Y+H-(v-lo)/(hi-lo)*H;
  axes(svg, X, Y, W, H,
    [1,2,3,4,5,6].map(d=>[d,sx(d)]),
    [0.6,0.7,0.8,0.9].map(v=>[v,sy(v)]), v=>v.toFixed(1));
  svg.appendChild(txt(X+W/2, Y+H+34, "hidden layers", { anchor:"middle", size:11 }));

  for (const [opt, color] of [["Adam", css("--accent2")], ["SGD", css("--accent")]]) {
    const pts = B.standard_sweep.filter(s => s.opt === opt).sort((a,b)=>a.depth-b.depth);
    svg.appendChild(el("polyline", { points: pts.map(p=>`${sx(p.depth)},${sy(p.auc)}`).join(" "),
      fill:"none", stroke:color, "stroke-width":2, "stroke-linejoin":"round" }));
    pts.forEach(p => {
      if (p.degenerate) {
        const x=sx(p.depth), y=sy(p.auc), r=5;
        svg.appendChild(el("line",{x1:x-r,y1:y-r,x2:x+r,y2:y+r,stroke:color,"stroke-width":2.4}));
        svg.appendChild(el("line",{x1:x-r,y1:y+r,x2:x+r,y2:y-r,stroke:color,"stroke-width":2.4}));
      } else {
        svg.appendChild(el("circle",{cx:sx(p.depth),cy:sy(p.auc),r:3.8,fill:color}));
      }
    });
  }
  const ly = Y+H-30;
  svg.appendChild(el("rect",{x:X+10,y:ly-8,width:9,height:9,rx:2,fill:css("--accent2")}));
  svg.appendChild(txt(X+24, ly, "Adam — trains at every depth", { fill:css("--tx2") }));
  svg.appendChild(el("rect",{x:X+10,y:ly+8,width:9,height:9,rx:2,fill:css("--accent")}));
  svg.appendChild(txt(X+24, ly+16, "SGD — collapses at depth 4+", { fill:css("--tx2") }));
}

function xavChart() {
  const svg = $("#xavChart"); svg.innerHTML = "";
  const X=42, Y=14, W=378, H=196;
  const lo=0.60, hi=0.96, sx=d=>X+(d-1)/5*W, sy=v=>Y+H-(v-lo)/(hi-lo)*H;
  axes(svg, X, Y, W, H,
    [1,2,3,4,5,6].map(d=>[d,sx(d)]),
    [0.6,0.7,0.8,0.9].map(v=>[v,sy(v)]), v=>v.toFixed(1));
  svg.appendChild(txt(X+W/2, Y+H+34, "hidden layers", { anchor:"middle", size:11 }));

  const c = css("--good"), pts = B.xavier_depth;
  svg.appendChild(el("polyline", { points: pts.map(p=>`${sx(p.depth)},${sy(p.auc)}`).join(" "),
    fill:"none", stroke:c, "stroke-width":2 }));
  pts.forEach(p => svg.appendChild(el("circle",{cx:sx(p.depth),cy:sy(p.auc),r:3.8,fill:c})));
  const lyx = Y+H-22;
  svg.appendChild(el("rect",{x:X+10,y:lyx-8,width:9,height:9,rx:2,fill:c}));
  svg.appendChild(txt(X+24, lyx, "Xavier + Adam — stable at every depth", { fill:css("--tx2") }));
}

function rocChart() {
  const svg = $("#rocChart"); svg.innerHTML = "";
  const X=42, Y=14, W=378, H=204, sx=v=>X+v*W, sy=v=>Y+H-v*H;
  axes(svg, X, Y, W, H,
    [0,0.25,0.5,0.75,1].map(v=>[v,sx(v)]),
    [0,0.25,0.5,0.75,1].map(v=>[v,sy(v)]), v=>v.toFixed(2));
  svg.appendChild(el("line",{x1:sx(0),y1:sy(0),x2:sx(1),y2:sy(1),stroke:css("--tx3"),
    "stroke-width":1,"stroke-dasharray":"3 3"}));
  svg.appendChild(txt(X+W/2, Y+H+32, "false positive rate", { anchor:"middle", size:11 }));

  for (const [name, r] of Object.entries(B.roc)) {
    const p = el("polyline", { points: r.fpr.map((f,k)=>`${sx(f)},${sy(r.tpr[k])}`).join(" "),
      fill:"none", stroke:colOf(name), "stroke-width": r.collapsed?1.8:2,
      "stroke-linejoin":"round" });
    if (r.collapsed) p.setAttribute("stroke-dasharray","5 4");
    svg.appendChild(p);
  }
  // legend under the plot, two columns
  const names = Object.keys(B.roc), ly = Y+H+50;
  names.forEach((name, i) => {
    const cx = X + (i % 2) * 196, cy = ly + Math.floor(i / 2) * 15;
    svg.appendChild(el("rect",{x:cx,y:cy-7.5,width:9,height:9,rx:2,fill:colOf(name)}));
    const m = B.models.find(m=>m.name===name);
    svg.appendChild(txt(cx+13, cy, `${name} · ${m.auc.toFixed(3)}`,
      { fill: m.collapsed ? css("--tx3") : css("--tx2"), size:10 }));
  });
}

function table() {
  const tb = $("#cmp tbody"); tb.innerHTML = "";
  const live = B.models.filter(m => !m.collapsed);
  const best = k => Math.max(...live.map(m => m[k]));
  const fewest = Math.min(...live.map(m => m.fn));
  B.models.forEach(m => {
    const tr = document.createElement("tr");
    if (m.collapsed) tr.className = "dead";
    const cell = k => `<b class="${!m.collapsed && m[k]===best(k) ? "best" : ""}">${m[k].toFixed(3)}</b>`;
    const tag = m.collapsed ? '<span class="chip dead">collapsed</span>' : "";
    tr.innerHTML =
      `<td><span class="swatch" style="background:${colOf(m.name)}"></span>${m.name}${tag}</td>
       <td>${cell("auc")}</td><td>${cell("acc")}</td><td>${cell("recall")}</td>
       <td><b class="${!m.collapsed && m.fn===fewest ? "best" : ""}">${m.fn}</b></td>`;
    tb.appendChild(tr);
  });
}

function stats() {
  const f = B.facts;
  $("#stats").innerHTML = [
    [f.n_total, "patients"],
    [`${f.n_train} / ${f.n_val} / ${f.n_test}`, "train / val / test"],
    [f.n_params.toLocaleString(), "model parameters"],
    [f.prior.toFixed(3), "majority baseline accuracy"],
  ].map(([v,k]) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`).join("");
}

function draw() { depthChart(); xavChart(); rocChart(); table(); }

setTheme(localStorage.getItem("theme") || "dark");
sync(); render(); table(); stats();
