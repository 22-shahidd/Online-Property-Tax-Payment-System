// Tax calculation utility
// This file has all the tax math in one place so it is easy to explain

// Usage factor based on property type
export function usageFactor(propertyType, rates) {
  if (propertyType === "residential") return rates.residentialFactor;
  if (propertyType === "commercial") return rates.commercialFactor;
  if (propertyType === "industrial") return rates.industrialFactor;
  return 1; // unknown type defaults to 1
}

// Age factor based on how old the building is
export function ageFactor(constructionYear) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - constructionYear;

  if (age <= 10) return 1.0;
  if (age <= 20) return 0.95;
  return 0.9;
}

// Base tax = area x baseRate x usageFactor x ageFactor
export function calculateBaseTax(area, propertyType, constructionYear, rates) {
  const uf = usageFactor(propertyType, rates);
  const af = ageFactor(constructionYear);
  const base = area * rates.baseRate * uf * af;
  return Math.round(base * 100) / 100; // round to 2 decimals
}

// Final amount due, including rebate or penalty
export function calculateFinalDue(baseTax, dueDate, rates) {
  const today = new Date();
  const due = new Date(dueDate);

  let rebate = 0;
  let penalty = 0;

  if (today <= due) {
    // Paid on or before due date - apply rebate
    rebate = Math.round((baseTax * rates.rebatePercent) / 100 * 100) / 100;
  } else {
    // Paid after due date - add monthly penalty
    const monthsLate = Math.ceil((today - due) / (1000 * 60 * 60 * 24 * 30));
    penalty = Math.round((baseTax * rates.penaltyPercent * monthsLate) / 100 * 100) / 100;
    // Do not let penalty exceed the cap
    if (penalty > rates.penaltyCap) penalty = rates.penaltyCap;
  }

  const totalDue = Math.round((baseTax - rebate + penalty) * 100) / 100;
  return { rebate, penalty, totalDue };
}
