import {
  buildIndustryTrend,
  getSortedIndustries,
} from "./shared/industry_sort.js";
import { subscribe1, subscribe2, setHoveredIndustry } from "./shared/state.js";

export function create_Bar_Chart(jobsData) {
  const margin = { top: 0, right: 30, bottom: 0, left: 110 };
  const width = 310 - margin.left - margin.right;
  const height = 360 - margin.top - margin.bottom;

  d3.select("#bar_chart").selectAll("svg").remove();

  const svg = d3
    .select("#bar_chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const barsG = g.append("g").attr("class", "bars");
  const pctG = g.append("g").attr("class", "pct-labels");
  const yAxisG = g.append("g").attr("class", "y-axis");

  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`);

  const x = d3.scaleLinear().range([0, width]);

  function buildBarChartData(trend) {
    const data = [];

    trend.forEach((d) => {
      let x0 = 0;

      const isGrowing =
        d.Total_Projected_Openings_2030 > d.Total_Job_Openings_2024;

      const base = isGrowing
        ? d.Total_Job_Openings_2024
        : d.Total_Projected_Openings_2030;

      data.push({
        Industry: d.Industry,
        segIndex: 0,
        x0,
        x1: x0 + base,
        color: isGrowing ? d3.schemePaired[2] : d3.schemePaired[0],
      });

      x0 += base;

      if (isGrowing) {
        const growth =
          d.Total_Projected_Openings_2030 - d.Total_Job_Openings_2024;
        data.push({
          Industry: d.Industry,
          segIndex: 1,
          x0,
          x1: x0 + growth,
          color: d3.schemePaired[3],
        });
      } else {
        const decline =
          d.Total_Job_Openings_2024 - d.Total_Projected_Openings_2030;
        data.push({
          Industry: d.Industry,
          segIndex: 1,
          x0,
          x1: x0 + decline,
          color: d3.schemePaired[1],
        });
      }
    });

    return data;
  }

  function applyBarHover(hoveredIndustry) {
    yAxisG.selectAll(".tick text").style("font-weight", (d) => {
      if (!hoveredIndustry) return "normal";
      return d === hoveredIndustry ? "700" : "normal";
    });
  }

  function updateChart(sortBy, filteredJobs) {
    const trend = buildIndustryTrend(filteredJobs);

    const sortedIndustries = getSortedIndustries(sortBy, trend);

    const bar_chart_data = buildBarChartData(trend);

    x.domain([0, d3.max(bar_chart_data, (d) => d.x1) || 1]);

    const y = d3
      .scaleBand()
      .range([0, height])
      .domain(sortedIndustries)
      .padding(0.1);

    yAxisG
      .transition()
      .duration(750)
      .call(d3.axisLeft(y).tickSize(0))
      .call((ax) => {
        ax.select(".domain").attr("stroke", "none");
        ax.selectAll("line").remove();
        ax.selectAll("text").style("font-size", "14px");
      })
      .on("end", () => {
        yAxisG.select(".domain").remove();
      });

    const pctChangeByIndustry = new Map(
      trend.map((d) => {
        const pct =
          ((d.Total_Projected_Openings_2030 - d.Total_Job_Openings_2024) /
            d.Total_Job_Openings_2024) *
          100;
        return [d.Industry, pct];
      })
    );

    const pctLabels = pctG
      .selectAll("text.pct")
      .data(sortedIndustries, (d) => d);
    pctLabels
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "pct")
            .attr("x", +10)
            .attr("y", (ind) => y(ind) + y.bandwidth() / 2)
            .attr("dominant-baseline", "middle")
            .style("font-size", "12px")
            .style("pointer-events", "none")
            .text((ind) => {
              const pct = pctChangeByIndustry.get(ind);
              if (!Number.isFinite(pct)) return "";
              const sign = pct >= 0 ? "+" : "";
              return `${sign}${pct.toFixed(2)}%`;
            }),
        (update) =>
          update.text((ind) => {
            const pct = pctChangeByIndustry.get(ind);
            if (!Number.isFinite(pct)) return "";
            const sign = pct >= 0 ? "+" : "";
            return `${sign}${pct.toFixed(2)}%`;
          }),
        (exit) => exit.remove()
      )
      .attr("y", (ind) => y(ind) + y.bandwidth() / 2);

    const rects = barsG
      .selectAll("rect")
      .data(bar_chart_data, (d) => `${d.Industry}:${d.segIndex}`);

    const rectsJoin = rects.join(
      (enter) =>
        enter
          .append("rect")
          .style("stroke-width", 2)
          .style("stroke", "none")
          .on("mouseover", (event, d) => setHoveredIndustry(d.Industry))
          .on("mouseout", () => setHoveredIndustry(null)),
      (update) => update,
      (exit) => exit.remove()
    );

    rectsJoin.attr("fill", (d) => d.color);

    rectsJoin
      .attr("x", (d) => x(d.x0))
      .attr("y", (d) => y(d.Industry))
      .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0)))
      .attr("height", y.bandwidth());
  }

  subscribe1(({ sortBy, location }) => {
    const filteredJobs =
      location === "All"
        ? jobsData
        : jobsData.filter((d) => d.Location === location);

    updateChart(sortBy, filteredJobs);
  });

  subscribe2(({ hoveredIndustry }) => applyBarHover(hoveredIndustry));
}
