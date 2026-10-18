/* Pure functions. Dates are "YYYY-MM-DD" strings. */
(function (root) {
  const R = (typeof module !== "undefined") ? require("./rules.js").RULES : RULES;
  const day = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  const iso = t => new Date(t).toISOString().slice(0, 10);
  // the last day of a 12-month period that starts on s
  function endOf(s) {
    const y = +s.slice(0, 4) + 1, m = +s.slice(5, 7) - 1, d = +s.slice(8, 10);
    let t = Date.UTC(y, m, d);
    if (new Date(t).getUTCDate() !== d) t = Date.UTC(y, m + 1, 1); // Feb 29 start
    return iso(t - 864e5);
  }
  function startOf(e) { // the first day of a 12-month period that ends on e
    const y = +e.slice(0, 4) - 1, m = +e.slice(5, 7) - 1, d = +e.slice(8, 10);
    const t = Date.UTC(y, m, d) + 864e5;
    return iso(t);
  }
  const net = r => Math.max(0, (+r.amount || 0) - (+r.reimbursed || 0));
  const counts = r => r.eligible !== "no" && !r.claimedBefore && net(r) > 0;
  const inWin = (r, w) => r.date >= w.start && r.date <= w.end;

  // Every 12-month window that ends in the tax year and starts or ends on a receipt date
  function windows(receipts, year) {
    const Y = year || R.taxYear, lo = `${Y}-01-01`, hi = `${Y}-12-31`;
    const out = [{ start: `${Y}-01-01`, end: hi }];
    for (const r of receipts) {
      const e1 = endOf(r.date);
      if (e1 >= lo && e1 <= hi) out.push({ start: r.date, end: e1 });
      if (r.date >= lo && r.date <= hi) out.push({ start: startOf(r.date), end: r.date });
    }
    return out;
  }
  function sumIn(receipts, w, pred) {
    return receipts.filter(r => counts(r) && inWin(r, w) && pred(r)).reduce((s, r) => s + net(r), 0);
  }
  const floorFor = income => Math.min(R.threshold, Math.round((+income || 0) * R.pctOfIncome * 100) / 100);
  // Rough federal tax before this credit: brackets minus the basic personal amount. Ignores other credits (CPP, EI, Canada employment amount), so real tax is usually a bit lower.
  function estTax(income) {
    const ni = Math.max(0, +income || 0); let tax = 0, lo = 0;
    for (const [hi, rate] of R.brackets) { if (ni > lo) tax += (Math.min(ni, hi) - lo) * rate; lo = hi; }
    const b = R.bpa, bpa = ni <= b.from ? b.max : ni >= b.to ? b.min : b.max - (b.max - b.min) * (ni - b.from) / (b.to - b.from);
    return Math.max(0, Math.round((tax - bpa * R.creditRate) * 100) / 100);
  }
  const allowable = (total, income) => Math.max(0, Math.round((total - floorFor(income)) * 100) / 100);

  /* household: { you: income, spouse: income|null, deps: [{id, name, income}] }
     receipt.who: "you" | "spouse" | "kid" | dependant id */
  function plan(household, receipts, year) {
    const fam = r => r.who === "you" || r.who === "spouse" || r.who === "kid";
    const ws = windows(receipts.filter(counts), year);
    let best = null;
    for (const w of ws) {
      const famTotal = sumIn(receipts, w, fam);
      const claimers = [{ who: "you", income: household.you }];
      if (household.spouse != null && household.spouse !== "") claimers.push({ who: "spouse", income: household.spouse });
      const options = claimers.map(c => {
        const line33099 = allowable(famTotal, c.income);
        const deps = (household.deps || []).map(d => {
          const t = sumIn(receipts, w, r => r.who === d.id);
          return { id: d.id, name: d.name, total: t, floor: floorFor(d.income), line33199: allowable(t, d.income) };
        });
        const total = line33099 + deps.reduce((s, d) => s + d.line33199, 0);
        const credit = Math.round(total * R.creditRate * 100) / 100, tax = estTax(c.income);
        return { claimer: c.who, famTotal, floor: floorFor(c.income), line33099, deps, total, credit, tax, usable: Math.min(credit, tax) };
      }).sort((a, b) => b.usable - a.usable || b.total - a.total);
      const top = options[0];
      if (!best || top.usable > best.top.usable || (top.usable === best.top.usable && (top.total > best.top.total || (top.total === best.top.total && w.end > best.window.end)))) best = { window: w, top, options };
    }
    const credit = best.top.usable, capped = best.top.usable < best.top.credit;
    const used = receipts.filter(r => counts(r) && inWin(r, best.window));
    const outside = receipts.filter(r => counts(r) && !inWin(r, best.window));
    const notEligible = receipts.filter(r => r.eligible === "no");
    const calendar = (() => { const w = { start: `${(year || R.taxYear)}-01-01`, end: `${(year || R.taxYear)}-12-31` };
      const t = sumIn(receipts, w, fam); const c = best.options.find(o => o.claimer === best.top.claimer);
      return allowable(t, c.claimer === "you" ? household.you : household.spouse); })();
    return { window: best.window, best: best.top, options: best.options, credit, capped, used, outside, notEligible, calendarYear33099: calendar };
  }
  const api = { estTax, endOf, startOf, windows, floorFor, allowable, plan, net };
  if (typeof module !== "undefined") module.exports = api; else root.Calc = api;
})(this);
