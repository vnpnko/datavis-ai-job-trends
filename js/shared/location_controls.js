import { subscribe1, setLocation } from "./state.js";

export function mount_Location_Controls(containerSelector, countries) {
  const container = d3.select(containerSelector);

  container.selectAll("*").remove();

  const location_controls = container
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "8px")
    .style("align-items", "flex-start")
    .attr("title", "Filter jobs by location.");

  const select = location_controls
    .append("select")
    .style("height", "26px")
    .style("min-width", "220px")
    .attr("title", "Select a location to filter jobs.");

  const options = ["All", ...countries];

  select
    .selectAll("option")
    .data(options, (d) => d)
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d);

  select.on("change", function () {
    setLocation(this.value);
  });

  subscribe1(({ location }) => {
    select.property("value", location ?? "All");
  });
}
