const assert = require("assert");
const C = require("./calc.js");
// CRA's own example (Richard and Pauline): family expenses $6,300
assert.strictEqual(C.allowable(6300, 55000), 4650);   // Pauline
assert.strictEqual(C.allowable(6300, 42000), 5040);   // Richard
assert.strictEqual(C.floorFor(200000), 2834);          // cap
assert.strictEqual(C.endOf("2024-07-01"), "2025-06-30");
assert.strictEqual(C.startOf("2025-06-30"), "2024-07-01");
assert.strictEqual(C.endOf("2024-02-29"), "2025-02-28");
// the planner picks Richard and a window that holds the family's receipts
const hh = { you: 42000, spouse: 55000, deps: [{ id: "d1", name: "Rob", income: 8000 }] };
const rc = [
  { date: "2024-07-15", who: "you", amount: 2500 },
  { date: "2024-11-02", who: "spouse", amount: 2000 },
  { date: "2025-03-10", who: "kid", amount: 1800 },
  { date: "2025-05-20", who: "d1", amount: 1300 },
  { date: "2025-11-30", who: "you", amount: 400 }   // falls outside Jul 2024 to Jun 2025
];
const p = C.plan(hh, rc);
assert.strictEqual(p.best.claimer, "you");
assert.strictEqual(p.best.famTotal, 6300);
assert.strictEqual(p.best.line33099, 5040);
assert.strictEqual(p.best.deps[0].line33199, 1300 - 240);
assert.ok(p.window.start <= "2024-07-15" && p.window.end >= "2025-05-20");
assert.ok(p.best.total > p.calendarYear33099); // beats just using Jan to Dec 2025
// reimbursed, already-claimed and ineligible receipts don't count
const q = C.plan({ you: 50000, spouse: null, deps: [] }, [
  { date: "2025-02-01", who: "you", amount: 3000, reimbursed: 2000 },
  { date: "2025-03-01", who: "you", amount: 900, claimedBefore: true },
  { date: "2025-04-01", who: "you", amount: 500, eligible: "no" }]);
assert.strictEqual(q.best.famTotal, 1000);
assert.strictEqual(q.best.line33099, 0);
// a receipt from 2023 can never land in a window ending in 2025
assert.strictEqual(C.plan({ you: 30000, deps: [] }, [{ date: "2023-12-31", who: "you", amount: 5000 }]).best.famTotal, 0);
// estimated federal tax: $42,000 -> 42000*14.5% - 16129*14.5%
assert.ok(Math.abs(C.estTax(42000) - (42000 - 16129) * 0.145) < 0.01);
assert.strictEqual(C.estTax(15000), 0);
assert.strictEqual(C.estTax(100000), Math.round((57375 * 0.145 + 42625 * 0.205 - 16129 * 0.145) * 100) / 100);
// a partner with almost no tax to reduce shouldn't be picked just for a bigger claim
const low = C.plan({ you: 60000, spouse: 17000, deps: [] }, [{ date: "2025-04-01", who: "you", amount: 4000 }]);
assert.strictEqual(low.best.claimer, "you");
assert.ok(low.options.find(o => o.claimer === "spouse").total > low.best.total);
console.log("all tests pass");
