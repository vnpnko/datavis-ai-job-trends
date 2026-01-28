import { truncateTickText } from "./shared/truncate.js";
import {
  buildIndustryTrend,
  getSortedIndustries,
} from "./shared/industry_sort.js";
import { subscribe1, subscribe2, setHoveredPair } from "./shared/state.js";

export function create_Heatmap(jobsData) {
  function applyHeatmapHover(hoveredPair, hoveredIndustry) {
    heatmap_svg.selectAll("rect.cell").style("stroke", (d) => {
      if (hoveredPair) {
        return d.Job_Title === hoveredPair.jobTitle &&
          d.Industry === hoveredPair.industry
          ? "black"
          : "none";
      }
      if (hoveredIndustry) {
        return d.Industry === hoveredIndustry ? "black" : "none";
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

  const create_Heatmap_margin = { top: 0, right: 0, bottom: 40, left: 110 };
  const create_Heatmap_width =
    550 - create_Heatmap_margin.left - create_Heatmap_margin.right;
  const create_Heatmap_height =
    400 - create_Heatmap_margin.top - create_Heatmap_margin.bottom;

  d3.select("#heatmap").selectAll("svg").remove();

  const heatmap_svg = d3
    .select("#heatmap")
    .append("svg")
    .attr(
      "width",
      create_Heatmap_width +
        create_Heatmap_margin.left +
        create_Heatmap_margin.right
    )
    .attr(
      "height",
      create_Heatmap_height +
        create_Heatmap_margin.top +
        create_Heatmap_margin.bottom
    )
    .append("g")
    .attr(
      "transform",
      `translate(${create_Heatmap_margin.left}, ${create_Heatmap_margin.top})`
    );

  const xAxisG = heatmap_svg
    .append("g")
    .attr("transform", `translate(0, ${create_Heatmap_height})`);

  const yAxisG = heatmap_svg.append("g");

  function updateHeatmap(sortBy, selectedJobTitles, filteredJobs, trend) {
    const sortedIndustries = getSortedIndustries(sortBy, trend);

    const heatmap_data = [];
    for (const job of selectedJobTitles) {
      for (const ind of sortedIndustries) {
        let sum = 0;
        let count = 0;

        for (const d of filteredJobs) {
          if (d.Job_Title === job && d.Industry === ind) {
            sum += d.Automation_Risk_Percent;
            count += 1;
          }
        }

        heatmap_data.push({
          Job_Title: job,
          Industry: ind,
          Automation_Risk_Percent: count > 0 ? sum / count : NaN,
        });
      }
    }

    const heatmap_x = d3
      .scaleBand()
      .range([0, create_Heatmap_width])
      .domain(selectedJobTitles)
      .padding(0.025);

    const heatmap_y = d3
      .scaleBand()
      .range([0, create_Heatmap_height])
      .domain(sortedIndustries)
      .padding(0.1);

    const myColor = d3
      .scaleSequential()
      .interpolator(d3.interpolateReds)
      .domain([0, 100])
      .clamp(true);

    xAxisG
      .transition()
      .duration(750)
      .call(d3.axisBottom(heatmap_x).tickSize(0))
      .call((ax) => {
        ax.select(".domain").attr("stroke", "none");
        ax.selectAll("line").remove();
        ax.selectAll("text").style("font-size", "15px");
      })
      .on("end", () => {
        xAxisG.select(".domain").remove();

        xAxisG
          .selectAll(".tick text")
          .call(truncateTickText, heatmap_x.bandwidth());

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
      .call(d3.axisLeft(heatmap_y).tickSize(0))
      .call((ax) => {
        ax.select(".domain").attr("stroke", "none");
        ax.selectAll("line").remove();
        ax.selectAll("text").style("font-size", "15px");
      })
      .on("end", () => {
        yAxisG.select(".domain").remove();
      });

    heatmap_svg
      .selectAll("rect.cell")
      .data(heatmap_data, (d) => `${d.Job_Title}:${d.Industry}`)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "cell")
            .attr("rx", 4)
            .attr("ry", 4)
            .style("stroke-width", 2)
            .style("opacity", 0.8)
            .on("mouseover", function (event, d) {
              setHoveredPair({ jobTitle: d.Job_Title, industry: d.Industry });
            })
            .on("mouseout", function () {
              setHoveredPair(null);
            }),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("x", (d) => heatmap_x(d.Job_Title))
      .attr("y", (d) => heatmap_y(d.Industry))
      .attr("width", heatmap_x.bandwidth())
      .attr("height", heatmap_y.bandwidth())
      .style("fill", (d) =>
        isFinite(d.Automation_Risk_Percent)
          ? myColor(d.Automation_Risk_Percent)
          : "lightgrey"
      );

    heatmap_svg
      .selectAll("text.cell-label")
      .data(heatmap_data, (d) => `${d.Job_Title}:${d.Industry}`)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "cell-label")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("font-size", "12px")
            .style("pointer-events", "none"),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr("x", (d) => heatmap_x(d.Job_Title) + heatmap_x.bandwidth() / 2)
      .attr("y", (d) => heatmap_y(d.Industry) + heatmap_y.bandwidth() / 2)
      .style("fill", (d) =>
        d.Automation_Risk_Percent > 60 ? "white" : "black"
      )
      .text((d) =>
        isFinite(d.Automation_Risk_Percent)
          ? `${d.Automation_Risk_Percent.toFixed(2)}%`
          : NaN
      );
  }

  subscribe1(({ sortBy, selectedJobTitles, location }) => {
    const filteredJobs =
      location === "All"
        ? jobsData
        : jobsData.filter((d) => d.Location === location);

    const trend = buildIndustryTrend(filteredJobs);
    updateHeatmap(sortBy, selectedJobTitles, filteredJobs, trend);
  });

  subscribe2(({ hoveredPair, hoveredIndustry }) => {
    applyHeatmapHover(hoveredPair, hoveredIndustry);
  });
}
