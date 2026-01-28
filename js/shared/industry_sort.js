export function buildIndustryTrend(jobsData) {
  return Array.from(
    d3.group(jobsData, (d) => d.Industry),
    ([Industry, jobs]) => ({
      Industry,
      Total_Job_Openings_2024: d3.sum(jobs, (d) => d.Job_Openings_2024),
      Total_Projected_Openings_2030: d3.sum(
        jobs,
        (d) => d.Projected_Openings_2030,
      ),
    }),
  );
}

export function getSortedIndustries(sortBy, trend) {
  const arr = [...trend];

  if (sortBy === "2024") {
    return arr
      .sort((a, b) => b.Total_Job_Openings_2024 - a.Total_Job_Openings_2024)
      .map((d) => d.Industry);
  }

  if (sortBy === "2030") {
    return arr
      .sort(
        (a, b) =>
          b.Total_Projected_Openings_2030 - a.Total_Projected_Openings_2030,
      )
      .map((d) => d.Industry);
  }

  if (sortBy === "growth") {
    return arr
      .sort((a, b) => {
        const ga = a.Total_Projected_Openings_2030 - a.Total_Job_Openings_2024;
        const gb = b.Total_Projected_Openings_2030 - b.Total_Job_Openings_2024;
        return gb - ga;
      })
      .map((d) => d.Industry);
  }
}
