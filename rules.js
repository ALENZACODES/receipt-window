/* Federal rules for the 2025 tax year (returns filed in 2026), from the CRA:
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html
   https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/whats-new.html */
const RULES = {
  taxYear: 2025,
  threshold: 2834,      // lesser of this or 3% of net income
  pctOfIncome: 0.03,
  creditRate: 0.145,    // full-year lowest federal rate for 2025 (15% to June 30, 14% from July 1)
  checked: "2026-10-18"
};
/* A subset of the CRA's "List of common medical expenses". rx = prescription needed, cert = certification in writing needed, t2201 = approved Form T2201 needed. */
const EXPENSES = [
  ["Prescription drugs and medications", "yes", 1, 0, 0],
  ["Dental services", "yes", 0, 0, 0],
  ["Orthodontic work", "yes", 0, 0, 0],
  ["Dentures and dental implants", "yes", 0, 0, 0],
  ["Eyeglasses or contact lenses", "yes", 1, 0, 0],
  ["Laser eye surgery", "yes", 0, 0, 0],
  ["Hearing aids", "yes", 0, 0, 0],
  ["Medical services by a doctor or specialist", "yes", 0, 0, 0],
  ["Medical services outside Canada", "yes", 0, 0, 0],
  ["Hospital services", "yes", 0, 0, 0],
  ["Nurse", "yes", 0, 0, 0],
  ["Ambulance service", "yes", 0, 0, 0],
  ["Premiums paid to a private health services plan", "yes", 0, 0, 0],
  ["Rehabilitative therapy", "yes", 0, 0, 0],
  ["Laboratory procedures or tests", "yes", 1, 0, 0],
  ["Vaccines", "yes", 1, 0, 0],
  ["Insulin or substitutes", "yes", 1, 0, 0],
  ["Needles and syringes", "yes", 1, 0, 0],
  ["Orthopaedic shoes, boots and inserts", "yes", 1, 0, 0],
  ["Braces for a limb", "yes", 0, 0, 0],
  ["Crutches", "yes", 0, 0, 0],
  ["Walking aids (canes, walkers)", "yes", 1, 0, 0],
  ["Wheelchairs", "yes", 0, 0, 0],
  ["CPAP or other breathing device", "yes", 1, 0, 0],
  ["In vitro fertility program", "yes", 0, 0, 0],
  ["Pre-natal and post-natal treatments", "yes", 0, 0, 0],
  ["Medical cannabis", "yes", 0, 0, 0],
  ["Tutoring services", "yes", 0, 1, 0],
  ["Therapy (personalized therapy plan)", "yes", 1, 0, 1],
  ["Over-the-counter medications", "no", 0, 0, 0],
  ["Supplements and vitamins", "no", 0, 0, 0],
  ["Gym or fitness club fees", "no", 0, 0, 0],
  ["Blood pressure monitor", "no", 0, 0, 0],
  ["Provincial health plan premiums", "no", 0, 0, 0],
  ["Health plan premiums paid by your employer (not in your income)", "no", 0, 0, 0],
  ["Cosmetic procedures (teeth whitening, fillers, hair replacement)", "no", 0, 0, 0],
  ["Organic food", "no", 0, 0, 0],
  ["Travel under 40 km for care", "no", 0, 0, 0],
  ["Something else (check the CRA list)", "check", 0, 0, 0]
].map(([name, eligible, rx, cert, t2201]) => ({ name, eligible, rx: !!rx, cert: !!cert, t2201: !!t2201 }));
if (typeof module !== "undefined") module.exports = { RULES, EXPENSES };
