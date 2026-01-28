import { subscribe1, setLocation } from "./state.js";

export function mount_Location_Controls(containerSelector, countries) {
  const container = d3.select(containerSelector);

  container.selectAll("*").remove();

  const location_controls = container
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "14px")
    .style("align-items", "flex-start");

  location_controls.append("span").text("Filter by location:");

  const select = location_controls
    .append("select")
    .style("height", "28px")
    .style("min-width", "220px");

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
