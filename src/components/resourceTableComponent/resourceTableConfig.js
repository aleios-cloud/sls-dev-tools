import RESOURCE_TABLE_TYPE from "../../constants";

export const RESOURCE_TABLE_CONFIG = {
  [RESOURCE_TABLE_TYPE.LAMBDA]: {
    label: "<-         Lambda Functions         ->",
    columnWidth: [30, 30, 10, 10, 20, 10],
  },
  [RESOURCE_TABLE_TYPE.ALL_RESOURCES]: {
    label: "<-           All Resources          ->",
    columnWidth: [50, 30],
  },
};

export const switchTableConfig = (application, tableType) => {
  application.type = tableType;
  application.table.setLabel(RESOURCE_TABLE_CONFIG[tableType].label);
  application.options.columnWidth =
    RESOURCE_TABLE_CONFIG[tableType].columnWidth;
  this.table.options.columnWidth = [30, 30, 10, 10, 20, 10];
};
