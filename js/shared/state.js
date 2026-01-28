export const state1 = {
  sortBy: "2024",
  selectedJobTitles: [
    "Investment analyst",
    "Software engineer",
    "Lawyer",
    "Photographer",
  ],
  location: "All",
};

export const state2 = {
  hoveredPair: null,
  hoveredIndustry: null,
};

const listeners1 = new Set();
const listeners2 = new Set();

export function subscribe1(fn) {
  listeners1.add(fn);
  fn(state1);
  return () => listeners1.delete(fn);
}

export function subscribe2(fn) {
  listeners2.add(fn);
  fn(state2);
  return () => listeners2.delete(fn);
}

export function setSelectedJobTitles(next) {
  state1.selectedJobTitles = [...next];
  listeners1.forEach((fn) => fn(state1));
}

export function setSortBy(sortBy) {
  if (state1.sortBy === sortBy) return;
  state1.sortBy = sortBy;
  listeners1.forEach((fn) => fn(state1));
}

export function setLocation(location) {
  if (state1.location === location) return;
  state1.location = location;
  listeners1.forEach((fn) => fn(state1));
}

export function setHoveredPair(pair) {
  if (pair) state2.hoveredIndustry = null;

  const prev = state2.hoveredPair;
  const same =
    (prev === null && pair === null) ||
    (prev &&
      pair &&
      prev.jobTitle === pair.jobTitle &&
      prev.industry === pair.industry);

  if (same) return;

  state2.hoveredPair = pair;
  listeners2.forEach((fn) => fn(state2));
}

export function setHoveredIndustry(industry) {
  if (industry) state2.hoveredPair = null;

  if (state2.hoveredIndustry === industry) return;

  state2.hoveredIndustry = industry;
  listeners2.forEach((fn) => fn(state2));
}
