import { subscribe1, setSortBy } from "./state.js";

const OPTIONS = [
  { label: "Growth", value: "growth" },
  { label: "2024 Openings", value: "2024" },
  { label: "2030 Openings", value: "2030" },
];

export function mount_Sort_Industries_Controls(containerSelector) {
  const sort_industries = d3
    .select(containerSelector)
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "8px")
    .style("align-items", "flex-start")
    .attr("title", "Sort industries by openings or growth.");

  OPTIONS.forEach((option) => {
    const label = sort_industries
      .append("label")
      .style("cursor", "pointer")
      .style("display", "flex")
      .style("gap", "6px")
      .style("align-items", "center")
      .style("white-space", "nowrap")
      .attr("title", `Sort by ${option.label}.`);

    label
      .append("input")
      .attr("type", "radio")
      .attr("name", "sort_By_Job_Openings")
      .attr("value", option.value)
      .on("change", function () {
        if (this.checked) setSortBy(option.value);
      });

    label.append("span").text(option.label).style("white-space", "nowrap");
  });

  subscribe1(({ sortBy }) => {
    sort_industries
      .selectAll('input[type="radio"][name="sort_By_Job_Openings"]')
      .property("checked", function () {
        return this.value === sortBy;
      });
  });
}
