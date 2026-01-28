import { create_Bar_Chart } from "./bar_chart.js";
import { create_Heatmap } from "./heatmap.js";
import { create_Stacked_Bar_Chart } from "./stacked_bar_chart.js";
import { mount_Sort_Industries_Controls } from "./shared/sort_industries_controls.js";
import { mount_Filter_Job_Titles_Controls } from "./shared/filter_job_titles_controls.js";
import { mount_Location_Controls } from "./shared/location_controls.js";

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

  mount_Sort_Industries_Controls("#sort_industries");

  const allJobTitles = Array.from(new Set(jobsData.map((d) => d.Job_Title)));
  mount_Filter_Job_Titles_Controls("#filter_job_titles", allJobTitles);

  const locationKey =
    jobsData.length && "Location" in jobsData[0]
      ? "Location"
      : jobsData.length && "Country" in jobsData[0]
        ? "Country"
        : null;

  const countries =
    locationKey === null
      ? []
      : Array.from(
          new Set(
            jobsData
              .map((d) => (d[locationKey] ?? "").trim())
              .filter((v) => v.length > 0),
          ),
        ).sort(d3.ascending);

  mount_Location_Controls("#location_controls", countries);

  create_Bar_Chart(jobsData);
  create_Heatmap(jobsData);
  create_Stacked_Bar_Chart(jobsData);
});
