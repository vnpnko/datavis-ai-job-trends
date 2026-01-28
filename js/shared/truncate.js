export function truncateTickText(tickTextSelection, maxWidth) {
  tickTextSelection.each(function () {
    const text = d3.select(this);
    const full = text.attr("data-full") ?? text.text();
    text.attr("data-full", full).text(full);

    let truncated = full;
    while (this.getComputedTextLength() > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
      text.text(truncated + "…");
    }
  });
}
