(function () {
  const $ = id => document.getElementById(id);
  const KEY = "receiptwindow.v1";
  const fmt = n => "$" + Math.round(n).toLocaleString("en-CA");
  const num = s => +String(s).replace(/[^0-9.]/g, "") || 0;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let S = JSON.parse(localStorage.getItem(KEY) || "null") || { you: "42000", sp: "", deps: [], rows: [] };
  let uid = Date.now();

  function example() {
    S = { you: "42000", sp: "55000", deps: [{ id: "d1", name: "Rob (19)", income: "8000" }], rows: [
      { id: 1, date: "2024-07-15", who: "you", what: 7, amount: "2500", re: "", prior: false },
      { id: 2, date: "2024-11-02", who: "spouse", what: 1, amount: "2000", re: "", prior: false },
      { id: 3, date: "2025-03-10", who: "kid", what: 2, amount: "1800", re: "", prior: false },
      { id: 4, date: "2025-05-20", who: "d1", what: 0, amount: "1300", re: "", prior: false },
      { id: 5, date: "2025-09-12", who: "you", what: 4, amount: "450", re: "200", prior: false },
      { id: 6, date: "2025-10-03", who: "spouse", what: 29, amount: "60", re: "", prior: false }] };
    drawAll(); say("Loaded the CRA example: Richard, Pauline, Jen who is 16, and Rob who is 19.");
  }
  function whoOptions(sel) {
    const o = [["you", "You"], ...(S.sp !== "" ? [["spouse", "Partner"]] : []), ["kid", "Child under 18"], ...S.deps.map(d => [d.id, d.name || "Relative"])];
    return o.map(([v, t]) => `<option value="${v}"${v === sel ? " selected" : ""}>${esc(t)}</option>`).join("");
  }
  const whatOptions = sel => EXPENSES.map((e, i) => `<option value="${i}"${+sel === i ? " selected" : ""}>${esc(e.name)}${e.eligible === "no" ? " (not eligible)" : ""}</option>`).join("");
  function drawDeps() {
    $("deps").innerHTML = S.deps.map(d => `<li data-id="${d.id}">
      <label class="fld sm">Name <input data-k="name" value="${esc(d.name)}" autocomplete="off"></label>
      <label class="fld sm">Their net income <span class="money"><input data-k="income" inputmode="numeric" value="${esc(d.income)}"></span></label>
      <button type="button" class="x" data-del aria-label="Remove ${esc(d.name || "this person")}">×</button></li>`).join("");
  }
  function drawRows() {
    $("rows").innerHTML = S.rows.map(r => `<tr data-id="${r.id}">
      <td><input type="date" data-k="date" value="${r.date}" min="2024-01-01" max="2025-12-31" aria-label="Date paid"></td>
      <td><select data-k="who" aria-label="For">${whoOptions(r.who)}</select></td>
      <td><select data-k="what" aria-label="What">${whatOptions(r.what)}</select></td>
      <td><span class="money"><input data-k="amount" inputmode="decimal" value="${esc(r.amount)}" aria-label="Amount"></span></td>
      <td><span class="money"><input data-k="re" inputmode="decimal" value="${esc(r.re)}" aria-label="Insurance paid"></span></td>
      <td class="c"><input type="checkbox" data-k="prior" ${r.prior ? "checked" : ""} aria-label="Already claimed on 2024 return"></td>
      <td><button type="button" class="x" data-del aria-label="Remove receipt">×</button></td></tr>`).join("");
    $("rcCount").textContent = `(${S.rows.length})`;
  }
  function drawAll() { $("incYou").value = S.you; $("incSp").value = S.sp; drawDeps(); drawRows(); compute(); }

  let t; const say = m => { clearTimeout(t); t = setTimeout(() => { $("live").textContent = m; }, 600); };
  const pos = d => { const a = Date.UTC(2024, 0, 1), b = Date.UTC(2025, 11, 31); const x = Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); return Math.max(0, Math.min(100, (x - a) / (b - a) * 100)); };
  const nice = d => new Date(d + "T12:00:00").toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
  const label = w => w === "you" ? "You" : w === "spouse" ? "Partner" : w === "kid" ? "Child" : ((S.deps.find(d => d.id === w) || {}).name || "Relative");

  function compute() {
    localStorage.setItem(KEY, JSON.stringify(S));
    const hh = { you: num(S.you), spouse: S.sp === "" ? null : num(S.sp), deps: S.deps.map(d => ({ id: d.id, name: d.name || "Relative", income: num(d.income) })) };
    const rc = S.rows.filter(r => r.date).map(r => ({ id: r.id, date: r.date, who: r.who, amount: num(r.amount), reimbursed: num(r.re), claimedBefore: r.prior, eligible: EXPENSES[r.what].eligible, what: EXPENSES[r.what] }));
    const p = Calc.plan(hh, rc);
    $("amt").textContent = fmt(p.best.total);
    $("cr").textContent = fmt(p.credit);
    $("who").textContent = p.best.claimer === "you" ? "You" : "Your partner";
    $("win").textContent = `${nice(p.window.start)} to ${nice(p.window.end)}`;
    const other = p.options[1];
    const gain = p.best.total - p.calendarYear33099 - p.best.deps.reduce((s, d) => s + d.line33199, 0);
    const bits = [];
    if (other) bits.push(other.total < p.best.total ? `If ${other.claimer === "you" ? "you" : "your partner"} claimed instead, the claim would be ${fmt(other.total)}.` : `It comes out the same whichever of you claims.`);
    if (gain > 0.5) bits.push(`Using just January to December 2025 would give ${fmt(p.calendarYear33099)} on line 33099, so this period adds ${fmt(gain)}.`);
    $("vs").textContent = bits.join(" ");
    // timeline
    const L = pos(p.window.start), W = pos(p.window.end) - L;
    $("track").innerHTML = `<span class="win" style="left:${L}%;width:${W}%"></span>` + rc.map(r => {
      const inside = p.used.includes(r), bad = r.eligible === "no" || r.claimedBefore;
      return `<span class="dot ${inside ? "in" : ""} ${bad ? "bad" : ""}" style="left:${pos(r.date)}%" title="${nice(r.date)}: ${fmt(r.amount)}"></span>`; }).join("");
    $("track").setAttribute("aria-label", `Timeline from January 2024 to December 2025. The chosen 12 months run ${nice(p.window.start)} to ${nice(p.window.end)} and hold ${p.used.length} of ${rc.length} receipts.`);
    // summary table
    const b = p.best;
    let rows = `<tr><th scope="row">Line 33099: you, partner, children under 18</th><td>${fmt(b.famTotal)}</td></tr>
      <tr><th scope="row">minus the lesser of 3% of ${b.claimer === "you" ? "your" : "your partner's"} income or $2,834</th><td>−${fmt(b.floor)}</td></tr>
      <tr class="t"><th scope="row">Line 33099 claim</th><td>${fmt(b.line33099)}</td></tr>`;
    for (const d of b.deps) rows += `<tr><th scope="row">Line 33199: ${esc(d.name)} (${fmt(d.total)} minus ${fmt(d.floor)})</th><td>${fmt(d.line33199)}</td></tr>`;
    rows += `<tr class="t"><th scope="row">Federal credit at 14.5%</th><td>${fmt(p.credit)}</td></tr>`;
    $("sum").innerHTML = rows;
    // to-do list
    const todo = [];
    const rx = p.used.filter(r => r.what.rx), cert = p.used.filter(r => r.what.cert), t22 = p.used.filter(r => r.what.t2201);
    if (rx.length) todo.push(`<li><b>Keep the prescription</b> for ${rx.map(r => esc(r.what.name.toLowerCase())).filter((v, i, a) => a.indexOf(v) === i).join(", ")}. The CRA can ask for it.</li>`);
    if (cert.length) todo.push(`<li><b>Get a written certification</b> from a medical practitioner for ${cert.map(r => esc(r.what.name.toLowerCase())).join(", ")}.</li>`);
    if (t22.length) todo.push(`<li><b>Form T2201</b> (disability tax credit) must be approved for ${t22.map(r => esc(r.what.name.toLowerCase())).join(", ")}.</li>`);
    if (p.notEligible.length) todo.push(`<li><b>Left out, not eligible:</b> ${p.notEligible.map(r => esc(r.what.name.toLowerCase()) + " " + fmt(r.amount)).join(", ")}.</li>`);
    if (p.outside.length) todo.push(`<li><b>Outside your 12 months:</b> ${p.outside.map(r => nice(r.date) + " " + fmt(Calc.net(r))).join(", ")}. If the receipt is from 2025 you may be able to use it next year instead.</li>`);
    if (rc.some(r => r.what.eligible === "check")) todo.push(`<li><b>Check the CRA list</b> for anything marked "something else" before you count it.</li>`);
    todo.push(`<li>Every receipt needs the name of the person or company you paid. Don't send them with your return; keep them in case the CRA asks.</li>`);
    if (b.claimer === "spouse") todo.push(`<li>Your partner enters ${fmt(b.famTotal)} on line 33099 of <b>their</b> return.</li>`);
    $("todo").innerHTML = todo.join("");
    say(`Claim ${fmt(p.best.total)}, about ${fmt(p.credit)} off federal tax, best claimed by ${$("who").textContent.toLowerCase()}.`);
  }

  // events
  $("incYou").addEventListener("input", e => { S.you = e.target.value; compute(); });
  $("incSp").addEventListener("input", e => { const had = S.sp !== ""; S.sp = e.target.value; if (had !== (S.sp !== "")) { if (S.sp === "") S.rows.forEach(r => { if (r.who === "spouse") r.who = "you"; }); drawRows(); } compute(); });
  $("addDep").addEventListener("click", () => { S.deps.push({ id: "d" + (++uid), name: "", income: "" }); drawDeps(); drawRows(); compute(); $("deps").lastElementChild.querySelector("input").focus(); });
  $("deps").addEventListener("input", e => { const li = e.target.closest("li"); const d = S.deps.find(x => x.id === li.dataset.id); d[e.target.dataset.k] = e.target.value; if (e.target.dataset.k === "name") drawRowsKeep(); compute(); });
  $("deps").addEventListener("click", e => { if (!e.target.hasAttribute("data-del")) return; const id = e.target.closest("li").dataset.id; S.deps = S.deps.filter(d => d.id !== id); S.rows.forEach(r => { if (r.who === id) r.who = "you"; }); drawDeps(); drawRows(); compute(); $("addDep").focus(); });
  function drawRowsKeep() { const a = document.activeElement; drawRows(); if (a && a.isConnected) a.focus(); }
  $("addRow").addEventListener("click", () => { S.rows.push({ id: ++uid, date: "2025-01-15", who: "you", what: 0, amount: "", re: "", prior: false }); drawRows(); compute(); $("rows").lastElementChild.querySelector("input").focus(); });
  const upd = e => { const tr = e.target.closest("tr"); if (!tr) return; const r = S.rows.find(x => x.id == tr.dataset.id); const k = e.target.dataset.k; r[k] = e.target.type === "checkbox" ? e.target.checked : (k === "what" ? +e.target.value : e.target.value); compute(); };
  $("rows").addEventListener("input", upd); $("rows").addEventListener("change", upd);
  $("rows").addEventListener("click", e => { if (!e.target.hasAttribute("data-del")) return; const id = e.target.closest("tr").dataset.id; S.rows = S.rows.filter(r => r.id != id); drawRows(); compute(); $("addRow").focus(); });
  $("example").addEventListener("click", example);
  $("print").addEventListener("click", () => window.print());
  $("clear").addEventListener("click", () => { if (!confirm("Clear all receipts and incomes?")) return; localStorage.removeItem(KEY); S = { you: "", sp: "", deps: [], rows: [] }; drawAll(); });

  if (!S.rows.length && !localStorage.getItem(KEY + ".seen")) { localStorage.setItem(KEY + ".seen", "1"); example(); } else drawAll();
})();
