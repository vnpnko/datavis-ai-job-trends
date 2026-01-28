import { subscribe1, setSelectedJobTitles } from "./state.js";

export function mount_Filter_Job_Titles_Controls(
  containerSelector,
  allJobTitles,
) {
  const minSelected = 2;
  const maxSelected = 5;

  let pickedJobTitle = null;

  const filter_job_titles = d3
    .select(containerSelector)
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "14px")
    .style("align-items", "flex-start")
    .style("width", "340px");

  const filter_job_titles_header = filter_job_titles
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "row")
    .style("width", "100%")
    .style("justify-content", "space-between");

  filter_job_titles_header
    .append("span")
    .text("Filter jobs:")
    .style("align-content", "center");

  const buttons = filter_job_titles_header
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "row")
    .style("gap", "6px");

  const addBtn = buttons
    .append("button")
    .text("Add")
    .property("disabled", true)
    .style("height", "25px");

  const removeBtn = buttons
    .append("button")
    .text("Remove")
    .property("disabled", true)
    .style("height", "25px");

  const picker = filter_job_titles
    .append("div")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("gap", "6px")
    .style("width", "100%");

  const filterInput = picker
    .append("input")
    .attr("type", "text")
    .attr("placeholder", "Write a job title")
    .style("height", "25px");

  const list = picker
    .append("div")
    .style("height", "80px")
    .style("overflow-y", "auto")
    .style("border", "1px solid lightgrey");

  function getInputValue() {
    return filterInput.property("value").trim();
  }

  let selectedCache = [];

  function renderJobTitleList(query) {
    const q = (query ?? "").trim().toLowerCase();
    const filtered =
      q.length === 0
        ? allJobTitles
        : allJobTitles.filter((t) => t.toLowerCase().includes(q));

    const items = list.selectAll(".job-item").data(filtered, (d) => d);
    items.exit().remove();

    const itemsEnter = items
      .enter()
      .append("div")
      .attr("class", "job-item")
      .style("padding", "2px")
      .style("cursor", "pointer")
      .style("background", "transparent")
      .style("border-bottom", "1px solid lightgrey")
      .on("click", function (event, d) {
        pickedJobTitle = d;
        list.selectAll(".job-item").style("background", "transparent");
        d3.select(this).style("background", "lightgrey");
        filterInput.property("value", d);
        updateButtonState(selectedCache);
      });

    itemsEnter.merge(items).text((d) => d);
  }

  function resetPicker() {
    pickedJobTitle = null;
    filterInput.property("value", "");
    renderJobTitleList("");
    updateButtonState(selectedCache);
  }

  function updateButtonState(selectedJobTitles) {
    const selected = selectedJobTitles ?? [];
    const val = getInputValue();

    if (!val) {
      addBtn.property("disabled", true);
      removeBtn.property("disabled", true);
      return;
    }

    const isValid = allJobTitles.includes(val);
    if (!isValid) {
      addBtn.property("disabled", true);
      removeBtn.property("disabled", true);
      return;
    }

    const isSelected = selected.includes(val);
    const atMax = selected.length >= maxSelected;
    const atMin = selected.length <= minSelected;

    if (isSelected) {
      addBtn.property("disabled", true);
      removeBtn.property("disabled", atMin);
    } else {
      addBtn.property("disabled", atMax);
      removeBtn.property("disabled", true);
    }
  }

  addBtn.on("click", () => {
    const val = getInputValue();
    if (!val) return;
    if (!allJobTitles.includes(val)) return;
    if (selectedCache.includes(val)) return;
    if (selectedCache.length >= maxSelected) return;

    setSelectedJobTitles([...selectedCache, val]);
    resetPicker();
  });

  removeBtn.on("click", () => {
    const val = getInputValue();
    if (!val) return;

    const idx = selectedCache.indexOf(val);
    if (idx === -1) return;
    if (selectedCache.length <= minSelected) return;

    const next = [...selectedCache];
    next.splice(idx, 1);
    setSelectedJobTitles(next);
    resetPicker();
  });

  filterInput.on("input", function () {
    renderJobTitleList(this.value);
    updateButtonState(selectedCache);
  });

  renderJobTitleList("");

  subscribe1(({ selectedJobTitles }) => {
    selectedCache = selectedJobTitles;
    updateButtonState(selectedJobTitles);
  });
}
