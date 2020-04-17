function generateFieldWithTitle(blessed, parent, title, value, width) {
  const titleBox = blessed.box({
    parent,
    width,
    left: "right",
    top: "center",
    align: "left",
    padding: { left: 1, right: 1 },
    content: title,
  });
  const textbox = blessed.textbox({
    parent,
    top: "center",
    left: "center",
    border: "line",
    pad: 2,
    width,
    style: {
      border: { fg: "green" },
      header: { fg: "bright-green", bold: true, underline: true },
      cell: { fg: "yellow" },
    },
    inputOnFocus: true,
    secret: false,
    censor: false,
    value,
  });
  return { titleBox, textbox };
}

module.exports = {
  generateFieldWithTitle,
};
