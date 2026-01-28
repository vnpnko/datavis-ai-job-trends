import { truncateTickText } from "./shared/truncate.js";
import {
  buildIndustryTrend,
  getSortedIndustries,
} from "./shared/industry_sort.js";
import { subscribe1, subscribe2, setHoveredPair } from "./shared/state.js";

export function create_Stacked_Bar_Chart(jobsData) {
  const tooltip = d3.select("#stacked_bar_tooltip").style("opacity", 0);

  function showTooltip(event, html) {
    tooltip
      .html(html)
      .style("opacity", 1)
      .style("left", event.pageX + 12 + "px")
      .style("top", event.pageY + 12 + "px");
  }

  function moveTooltip(event) {
    tooltip
      .style("left", event.pageX + 12 + "px")
      .style("top", event.pageY + 12 + "px");
  }

  function hideTooltip() {
    tooltip.style("opacity", 0);
  }

  function applyStackedHover(hoveredPair, hoveredIndustry) {
    stacked_bar_chart_svg
      .selectAll("g.layer rect")
      .style("stroke", function (d) {
        const industry = this.parentNode.__data__.key;

        if (hoveredPair) {
          const match =
            d.data.Job_Title === hoveredPair.jobTitle &&
            industry === hoveredPair.industry;
          return match ? "black" : "none";
        }

        if (hoveredIndustry) {
          return industry === hoveredIndustry ? "black" : "none";
        }

        return "none";
      });

    xAxisG.selectAll(".tick text").style("font-weight", (d) => {
      if (!hoveredPair) return "normal";
      return d === hoveredPair.jobTitle ? "700" : "normal";
    });

    yAxisG.selectAll(".tick text").style("font-weight", (d) => {
      if (hoveredPair) return d === hoveredPair.industry ? "700" : "normal";
      if (hoveredIndustry) return d === hoveredIndustry ? "700" : "normal";
      return "normal";
    });
  }

  const create_Stacked_Bar_Chart_margin = {
    top: 40,
    right: 0,
    bottom: 40,
    left: 0,
  };
  const create_Stacked_Bar_Chart_width =
    500 -
    create_Stacked_Bar_Chart_margin.left -
    create_Stacked_Bar_Chart_margin.right;
  const create_Stacked_Bar_Chart_height =
    400 -
    create_Stacked_Bar_Chart_margin.top -
    create_Stacked_Bar_Chart_margin.bottom;

  d3.select("#stacked_bar_chart").selectAll("svg").remove();

  const stacked_bar_chart_svg = d3
    .select("#stacked_bar_chart")
    .append("svg")
    .attr(
      "width",
      create_Stacked_Bar_Chart_width +
        create_Stacked_Bar_Chart_margin.left +
        create_Stacked_Bar_Chart_margin.right,
    )
    .attr(
      "height",
      create_Stacked_Bar_Chart_height +
        create_Stacked_Bar_Chart_margin.top +
        create_Stacked_Bar_Chart_margin.bottom,
    )
    .append("g")
    .attr(
      "transform",
      `translate(${create_Stacked_Bar_Chart_margin.left}, ${create_Stacked_Bar_Chart_margin.top})`,
    );

  const xAxisG = stacked_bar_chart_svg
    .append("g")
    .attr("transform", `translate(0, ${create_Stacked_Bar_Chart_height})`);

  const yAxisG = stacked_bar_chart_svg.append("g");

  stacked_bar_chart_svg
    .append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text("AI Impact Distribution Across Industries");

  const impactToNum = new Map([
    ["Low", 1],
    ["Moderate", 5],
    ["High", 10],
  ]);

  function updateStacked(sortBy, selectedJobTitles, filteredJobs, trend) {
    const sortedIndustries = getSortedIndustries(sortBy, trend).reverse();

    const filteredData = filteredJobs.filter((d) =>
      selectedJobTitles.includes(d.Job_Title),
    );

    const wide = selectedJobTitles.map((jt) => {
      const row = { Job_Title: jt };

      for (const ind of sortedIndustries) {
        const avg = d3.mean(
          filteredData.filter((d) => d.Job_Title === jt && d.Industry === ind),
          (d) => impactToNum.get(d.AI_Impact_Level),
        );
        row[ind] = avg ?? 0;
      }
      return row;
    });

    const stacked = d3.stack().keys(sortedIndustries)(wide);

    const maxStack =
      d3.max(wide, (d) => d3.sum(sortedIndustries, (ind) => d[ind])) ?? 0;

    const stacked_bar_chart_x = d3
      .scaleBand()
      .range([0, create_Stacked_Bar_Chart_width])
      .domain(selectedJobTitles)
      .padding(0.025);

    const stacked_bar_chart_y = d3
      .scaleLinear()
      .domain([0, maxStack])
      .nice()
      .range([create_Stacked_Bar_Chart_height, 0]);

    const palette = d3.schemeTableau10;
    const color = d3
      .scaleOrdinal()
      .domain([0, sortedIndustries])
      .range(sortedIndustries.map((_, i) => palette[i % palette.length]));

    xAxisG
      .transition()
      .duration(750)
      .call(d3.axisBottom(stacked_bar_chart_x).tickSize(0))
      .call((ax) => {
        ax.select(".domain").attr("stroke", "none");
        ax.selectAll("line").remove();
        ax.selectAll("text").style("font-size", "14px");
      })
      .on("end", () => {
        xAxisG.select(".domain").remove();

        xAxisG
          .selectAll(".tick text")
          .call(truncateTickText, stacked_bar_chart_x.bandwidth());

        xAxisG
          .selectAll(".tick text")
          .style("cursor", "pointer")
          .on("click", (event, d) => {
            const filterInput = d3.select("#filter_job_titles input");
            filterInput.property("value", d);
            filterInput.dispatch("input");
          });
      });

    yAxisG
      .transition()
      .duration(750)
      .call(d3.axisLeft(stacked_bar_chart_y).tickSize(0))
      .call((ax) => {
        ax.select(".domain").attr("stroke", "none");
        ax.selectAll("line").remove();
        ax.selectAll("text").style("font-size", "14px");
      })
      .on("end", () => {
        yAxisG.select(".domain").remove();
      });

    const layers = stacked_bar_chart_svg
      .selectAll("g.layer")
      .data(stacked, (d) => d.key)
      .join(
        (enter) => enter.append("g").attr("class", "layer"),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("fill", (d) => color(d.key));

    layers
      .selectAll("rect")
      .data(
        (d) => d,
        (d) => d.data.Job_Title,
      )
      .join(
        (enter) =>
          enter
            .append("rect")
            .style("stroke-width", 2)
            .style("stroke", "none")
            .style("opacity", 0.9)
            .on("mouseover", function (event, d) {
              const industry = this.parentNode.__data__.key;
              setHoveredPair({ jobTitle: d.data.Job_Title, industry });

              const rows = filteredJobs.filter(
                (r) =>
                  r.Job_Title === d.data.Job_Title && r.Industry === industry,
              );

              let aiImpact = "N/A";

              if (rows.length > 0) {
                const counts = d3.rollups(
                  rows,
                  (v) => v.length,
                  (r) => r.AI_Impact_Level,
                );

                aiImpact =
                  counts.sort((a, b) => d3.descending(a[1], b[1]))[0]?.[0] ??
                  "N/A";
              }

              const autoRisk =
                rows.length > 0
                  ? d3.mean(rows, (r) => r.Automation_Risk_Percent)
                  : NaN;

              const autoRiskTxt = Number.isFinite(autoRisk)
                ? `${autoRisk.toFixed(2)}%`
                : "N/A";

              showTooltip(
                event,
                `<div><strong>Industry:</strong> ${industry}</div>
                 <div><strong>Job title:</strong> ${d.data.Job_Title}</div>
                 <div><strong>AI impact:</strong> ${aiImpact}</div>
                 <div><strong>Automation risk:</strong> ${autoRiskTxt}</div>`,
              );
            })
            .on("mousemove", function (event) {
              moveTooltip(event);
            })
            .on("mouseout", function () {
              setHoveredPair(null);
              hideTooltip();
            }),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("x", (d) => stacked_bar_chart_x(d.data.Job_Title))
      .attr("y", (d) => stacked_bar_chart_y(d[1]))
      .attr(
        "height",
        (d) => stacked_bar_chart_y(d[0]) - stacked_bar_chart_y(d[1]),
      )
      .attr("width", stacked_bar_chart_x.bandwidth());
  }

  subscribe1(({ sortBy, selectedJobTitles, location }) => {
    const filteredJobs =
      location === "All"
        ? jobsData
        : jobsData.filter((d) => d.Location === location);

    const trend = buildIndustryTrend(filteredJobs);
    updateStacked(sortBy, selectedJobTitles, filteredJobs, trend);
  });

  subscribe2(({ hoveredPair, hoveredIndustry }) => {
    applyStackedHover(hoveredPair, hoveredIndustry);
  });
}
