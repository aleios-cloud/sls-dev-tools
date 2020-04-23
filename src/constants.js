export const logo = `
 ____  __    ____      ____  ____  _  _      ____  __    __   __    ____
/ ___)(  )  / ___) ___(    \\(  __)/ )( \\ ___(_  _)/  \\  /  \\ (  )  / ___)
\\___ \\/ (_/\\\\___ \\(___)) D ( ) _) \\ \\/ /(___) )( (  O )(  O )/ (_/\\\\___ \\
(____/\\____/(____/    (____/(____) \\__/      (__) \\__/  \\__/ \\____/(____/
`;

export const awsRegionLocations = [
  { label: "us-west-1", coords: { lat: 37.35, lon: -121.96 } },
  { label: "us-west-2", coords: { lat: 46.15, lon: -123.88 } },
  { label: "us-east-1", coords: { lat: 38.13, lon: -78.45 } },
  { label: "us-east-2", coords: { lat: 39.96, lon: -83 } },
  { label: "ca-central-1", coords: { lat: 45.5, lon: -73.6 } },
  { label: "sa-east-1", coords: { lat: -23.34, lon: -46.38 } },
  { label: "eu-west-1", coords: { lat: 53, lon: -8 } },
  { label: "eu-west-2", coords: { lat: 51, lon: -0.1 } },
  { label: "eu-west-3", coords: { lat: 48.86, lon: 2.35 } },
  { label: "eu-central-1", coords: { lat: 50, lon: 8 } },
  { label: "ap-south-1", coords: { lat: 19.08, lon: 72.88 } },
  { label: "ap-southeast-1", coords: { lat: 1.37, lon: 103.8 } },
  { label: "ap-southeast-2", coords: { lat: -33.86, lon: 151.2 } },
  { label: "ap-northeast-1", coords: { lat: 35.41, lon: 139.42 } },
  { label: "ap-northeast-2", coords: { lat: 37.56, lon: 126.98 } },
];

export const dateFormats = {
  graphDisplayTime: "HH:mm",
  graphDisplayDate: "DDMM",
};

export const DEPLOYMENT_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
};

export const RESOURCE_TABLE_TYPE = {
  LAMBDA: "LAMBDA",
  ALL_RESOURCES: "ALL_RESOURCES",
};

export const DASHBOARD_FOCUS_INDEX = {
  RESOURCE_TABLE: 0,
  EVENT_BRIDGE_TREE: 1,
}
