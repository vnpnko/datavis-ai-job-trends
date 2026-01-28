d3.csv("ai_job_trends_dataset.csv").then(function (jobsData) {
  jobsData.forEach((d) => {
    d.Job_Title = d.Job_Title;
    d.Industry = d.Industry;
    d.Job_Status = d.Job_Status;
    d.AI_Impact_Level = d.AI_Impact_Level;
    d.Median_Salary_USD = Number(d.Median_Salary_USD);
    d.Required_Education = d.Required_Education;
    d.Experience_Required_Years = Number(d.Experience_Required_Years);
    d.Job_Openings_2024 = Number(d.Job_Openings_2024);
    d.Projected_Openings_2030 = Number(d.Projected_Openings_2030);
    d.Remote_Work_Ratio_Percent = Number(d.Remote_Work_Ratio_Percent);
    d.Automation_Risk_Percent = Number(d.Automation_Risk_Percent);
    d.Location = d.Location;
    d.Gender_Diversity_Percent = Number(d.Gender_Diversity_Percent);
  });

  //
  // Bar Chart
  //

  // Group data by industry and calculate job openings trend
  const Job_Openings_trend = Array.from(
    d3.group(jobsData, (d) => d.Industry),
    ([industry, jobs]) => ({
      Industry: industry,
      Total_Job_Openings_2024: d3.sum(jobs, (d) => d.Job_Openings_2024),
      Total_Projected_Openings_2030: d3.sum(
        jobs,
        (d) => d.Projected_Openings_2030
      ),
      isGrowing:
        d3.sum(jobs, (d) => d.Projected_Openings_2030) >
        d3.sum(jobs, (d) => d.Job_Openings_2024),
    })
  );

  // Prepare data for stacked bar chart
  const bar_chart_data = [];
  Job_Openings_trend.forEach((d) => {
    let x0 = 0;
    bar_chart_data.push({
      Industry: d.Industry,
      value: d.isGrowing
        ? d.Total_Job_Openings_2024
        : d.Total_Projected_Openings_2030,
      x0: x0,
      x1:
        x0 + d.isGrowing
          ? d.Total_Job_Openings_2024
          : d.Total_Projected_Openings_2030,
      color: d.isGrowing ? d3.schemePaired[2] : d3.schemePaired[0],
    });

    if (d.isGrowing) {
      x0 += d.Total_Job_Openings_2024;
      const growth =
        d.Total_Projected_Openings_2030 - d.Total_Job_Openings_2024;
      bar_chart_data.push({
        Industry: d.Industry,
        value: growth,
        x0: x0,
        x1: x0 + growth,
        color: d3.schemePaired[3],
      });
    } else {
      x0 += d.Total_Projected_Openings_2030;
      const decline =
        d.Total_Job_Openings_2024 - d.Total_Projected_Openings_2030;
      bar_chart_data.push({
        Industry: d.Industry,
        value: decline,
        x0: x0,
        x1: x0 + decline,
        color: d3.schemePaired[1],
      });
    }
  });

  let allIndustries = Job_Openings_trend.sort(
    (a, b) => b.Total_Job_Openings_2024 - a.Total_Job_Openings_2024
  ).map((d) => d.Industry);

  const bar_chart_margin = { top: 80, right: 30, bottom: 40, left: 90 },
    bar_chart_width = 460 - bar_chart_margin.left - bar_chart_margin.right,
    bar_chart_height = 500 - bar_chart_margin.top - bar_chart_margin.bottom;

  // append the svg object to the body of the page
  const bar_chart_svg = d3
    .select("#bar_chart")
    .append("svg")
    .attr(
      "width",
      bar_chart_width + bar_chart_margin.left + bar_chart_margin.right
    )
    .attr(
      "height",
      bar_chart_height + bar_chart_margin.top + bar_chart_margin.bottom
    )
    .append("g")
    .attr(
      "transform",
      `translate(${bar_chart_margin.left}, ${bar_chart_margin.top})`
    );

  // Add X axis
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(bar_chart_data, (d) => d.x1)])
    .range([0, bar_chart_width]);
  bar_chart_svg
    .append("g")
    .attr("transform", `translate(0, ${bar_chart_height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Y axis
  const y = d3
    .scaleBand()
    .range([bar_chart_height, 0])
    .domain(allIndustries)
    .padding(0.05);
  bar_chart_svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

  //Bars
  bar_chart_svg
    .selectAll("myRect")
    .data(bar_chart_data)
    .join("rect")
    .attr("x", (d) => x(d.x0))
    .attr("y", (d) => y(d.Industry))
    .attr("width", (d) => x(d.x1) - x(d.x0))
    .attr("height", y.bandwidth())
    .attr("fill", (d) => d.color);

  // Sorting function
  function updateChart(sortBy) {
    let allIndustries = [];

    if (sortBy === "2024") {
      allIndustries = Job_Openings_trend.sort(
        (a, b) => b.Total_Job_Openings_2024 - a.Total_Job_Openings_2024
      ).map((d) => d.Industry);
    } else if (sortBy === "2030") {
      allIndustries = Job_Openings_trend.sort(
        (a, b) =>
          b.Total_Projected_Openings_2030 - a.Total_Projected_Openings_2030
      ).map((d) => d.Industry);
    } else if (sortBy === "growth") {
      allIndustries = Job_Openings_trend.sort((a, b) => {
        const growthA =
          a.Total_Projected_Openings_2030 - a.Total_Job_Openings_2024;
        const growthB =
          b.Total_Projected_Openings_2030 - b.Total_Job_Openings_2024;
        return growthB - growthA;
      }).map((d) => d.Industry);
    } else if (sortBy === "decline") {
      allIndustries = Job_Openings_trend.sort((a, b) => {
        const declineA =
          a.Total_Job_Openings_2024 - a.Total_Projected_Openings_2030;
        const declineB =
          b.Total_Job_Openings_2024 - b.Total_Projected_Openings_2030;
        return declineB - declineA;
      }).map((d) => d.Industry);
    }

    y.domain(allIndustries);
    bar_chart_svg
      .selectAll("rect")
      .transition()
      .duration(750)
      .attr("y", (d) => y(d.Industry));

    bar_chart_svg.selectAll(".y-axis").remove();
    bar_chart_svg.append("g").attr("class", "y-axis").call(d3.axisLeft(y));
  }

  // Add title to bar chart
  bar_chart_svg
    .append("text")
    .attr("x", 0)
    .attr("y", -50)
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text("Bar Chart");

  // Add subtitle to bar chart
  bar_chart_svg
    .append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("fill", "grey")
    .style("max-width", 400)
    .text("A short description of the take-away message of this chart.");

  // Add sorting options

  const sortOptions = d3
    .select("#bar_chart")
    .append("div")
    .style("margin-top", "10px");

  [
    { label: "2024 Openings", value: "2024" },
    { label: "2030 Openings", value: "2030" },
    { label: "Growth", value: "growth" },
    { label: "Decline", value: "decline" },
  ].forEach((option, index) => {
    sortOptions
      .append("label")
      .style("margin-right", "15px")
      .style("cursor", "pointer")
      .html(
        `<input type="radio" name="sortBy" value="${option.value}" ${
          index === 0 ? "checked" : ""
        } /> ${option.label}`
      )
      .on("change", (event) => {
        if (event.target.checked) {
          updateChart(option.value);
        }
      });
  });

  //
  // Heatmap
  //

  const heatmap_margin = { top: 80, right: 25, bottom: 30, left: 100 },
    heatmap_width = 450 - heatmap_margin.left - heatmap_margin.right,
    heatmap_height = 450 - heatmap_margin.top - heatmap_margin.bottom;

  // append the svg object to the body of the page
  const heatmap_svg = d3
    .select("#heatmap")
    .append("svg")
    .attr("width", heatmap_width + heatmap_margin.left + heatmap_margin.right)
    .attr("height", heatmap_height + heatmap_margin.top + heatmap_margin.bottom)
    .append("g")
    .attr(
      "transform",
      `translate(${heatmap_margin.left}, ${heatmap_margin.top})`
    );

  const selected_Job_titles = [
    "Software engineer",
    "Lawyer",
    "Market researcher",
  ];

  // Aggregate data by Job_Title and Industry to get average Automation_Risk_Percent
  const heatmap_data = {};
  selected_Job_titles.forEach((job) => {
    allIndustries.forEach((ind) => {
      const key = job + ":" + ind;
      heatmap_data[key] = {
        Job_Title: job,
        Industry: ind,
        Automation_Risk_Percent: 0,
      };

      let sum = 0;
      let count = 0;

      jobsData.forEach((d) => {
        if (d.Job_Title === job && d.Industry === ind) {
          sum += d.Automation_Risk_Percent;
          count += 1;
        }
      });

      heatmap_data[key].Automation_Risk_Percent = sum / count;
    });
  });

  console.log("heatmap_data:", heatmap_data);

  // Build X scales and axis:
  const heatmap_x = d3
    .scaleBand()
    .range([0, heatmap_width])
    .domain(selected_Job_titles)
    .padding(0.05);
  heatmap_svg
    .append("g")
    .style("font-size", 15)
    .attr("transform", `translate(0, ${heatmap_height})`)
    .call(d3.axisBottom(heatmap_x).tickSize(0))
    .select(".domain")
    .remove();

  // Build Y scales and axis:
  const heatmap_y = d3
    .scaleBand()
    .range([heatmap_height, 0])
    .domain(allIndustries)
    .padding(0.05);
  heatmap_svg
    .append("g")
    .style("font-size", 15)
    .call(d3.axisLeft(heatmap_y).tickSize(0))
    .select(".domain")
    .remove();

  // Build color scale
  const myColor = d3
    .scaleSequential()
    .interpolator(d3.interpolateInferno)
    .domain([1, 100]);

  // create a tooltip
  const tooltip = d3.select("#heatmap_tooltip");
  // .style("opacity", 0);
  // .style("background-color", "white")
  // .style("border", "solid")
  // .style("border-width", "2px")
  // .style("border-radius", "5px")
  // .style("padding", "5px");

  // add the squares
  heatmap_svg
    .selectAll()
    .data(Object.values(heatmap_data))
    .join("rect")
    .attr("x", function (d) {
      return heatmap_x(d.Job_Title);
    })
    .attr("y", function (d) {
      return heatmap_y(d.Industry);
    })
    .attr("rx", 4)
    .attr("ry", 4)
    .attr("width", heatmap_x.bandwidth())
    .attr("height", heatmap_y.bandwidth())
    .style("fill", function (d) {
      const key = d.Job_Title + ":" + d.Industry;
      const avgRisk = heatmap_data[key].Automation_Risk_Percent;
      return myColor(avgRisk);
    })
    .style("stroke-width", 4)
    .style("stroke", "none")
    .style("opacity", 0.8)
    .on("mouseover", function (event, d) {
      d3.select(this).style("stroke", "black");

      tooltip
        .classed("show", true)
        .html(
          "The exact value of this cell is: " +
            d.Automation_Risk_Percent.toFixed(2) +
            "<br> Job Title: " +
            d.Job_Title +
            "<br> Industry: " +
            d.Industry
        )
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY + 12 + "px");
    })
    .on("mousemove", function (event, d) {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY + 12 + "px");
    })
    .on("mouseout", function (event, d) {
      tooltip.classed("show", false);
      d3.select(this).style("stroke", "none");
    });

  // Add the input and buttons for modifying selected job titles
  const jobTitleControls = d3
    .select("#heatmap")
    .append("div")
    .style("margin-bottom", "10px");

  // Input field to add a new job title
  jobTitleControls
    .append("input")
    .attr("type", "text")
    .attr("id", "newJobTitle")
    .attr("placeholder", "Enter job title")
    .style("margin-right", "10px");

  // Button to add job title
  jobTitleControls
    .append("button")
    .text("Add Job Title")
    .on("click", function () {
      const newJobTitle = document.getElementById("newJobTitle").value;
      if (newJobTitle && !selected_Job_titles.includes(newJobTitle)) {
        selected_Job_titles.push(newJobTitle);
        updateHeatmap();
      }
      document.getElementById("newJobTitle").value = ""; // Clear input field
    });

  // Button to remove the last job title
  jobTitleControls
    .append("button")
    .text("Remove Last Job Title")
    .on("click", function () {
      selected_Job_titles.pop();
      updateHeatmap();
    });

  // Function to update the heatmap
  function updateHeatmap() {
    // Recalculate the heatmap data based on the selected job titles
    const heatmap_data = {};
    selected_Job_titles.forEach((job) => {
      allIndustries.forEach((ind) => {
        const key = job + ":" + ind;
        heatmap_data[key] = {
          Job_Title: job,
          Industry: ind,
          Automation_Risk_Percent: 0,
        };

        let sum = 0;
        let count = 0;

        jobsData.forEach((d) => {
          if (d.Job_Title === job && d.Industry === ind) {
            sum += d.Automation_Risk_Percent;
            count += 1;
          }
        });

        heatmap_data[key].Automation_Risk_Percent = count > 0 ? sum / count : 0;
      });
    });

    // Redraw the heatmap
    const heatmap_svg = d3.select("#heatmap").select("svg").select("g");

    // Update X scale and axis
    const heatmap_x = d3
      .scaleBand()
      .range([0, heatmap_width])
      .domain(selected_Job_titles)
      .padding(0.05);
    heatmap_svg
      .select(".x-axis")
      .call(d3.axisBottom(heatmap_x).tickSize(0))
      .select(".domain")
      .remove();

    // Update Y scale and axis
    const heatmap_y = d3
      .scaleBand()
      .range([heatmap_height, 0])
      .domain(allIndustries)
      .padding(0.05);
    heatmap_svg
      .select(".y-axis")
      .call(d3.axisLeft(heatmap_y).tickSize(0))
      .select(".domain")
      .remove();

    // Update color scale
    const myColor = d3
      .scaleSequential()
      .interpolator(d3.interpolateInferno)
      .domain([1, 100]);

    // Remove existing heatmap squares
    heatmap_svg.selectAll("rect").remove();

    // Add updated squares
    heatmap_svg
      .selectAll()
      .data(Object.values(heatmap_data))
      .join("rect")
      .attr("x", function (d) {
        return heatmap_x(d.Job_Title);
      })
      .attr("y", function (d) {
        return heatmap_y(d.Industry);
      })
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("width", heatmap_x.bandwidth())
      .attr("height", heatmap_y.bandwidth())
      .style("fill", function (d) {
        const key = d.Job_Title + ":" + d.Industry;
        const avgRisk = heatmap_data[key].Automation_Risk_Percent;
        return myColor(avgRisk);
      })
      .style("stroke-width", 4)
      .style("stroke", "none")
      .style("opacity", 0.8);
  }

  // Add title to graph
  heatmap_svg
    .append("text")
    .attr("x", 0)
    .attr("y", -50)
    .attr("text-anchor", "left")
    .style("font-size", "22px")
    .text("Heatmap");

  // Add subtitle to graph
  heatmap_svg
    .append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("text-anchor", "left")
    .style("font-size", "14px")
    .style("fill", "grey")
    .style("max-width", 400)
    .text("A short description of the take-away message of this chart.");

  //
  // Stacked Bar Chart
  //
});
