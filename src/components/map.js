import { awsRegionLocations } from "../constants";

const contrib = require("blessed-contrib");

class Map {
  constructor(layoutGrid, program) {
    this.layoutGrid = layoutGrid;
    this.program = program;
    this.map = this.generateMap();
    this.marker = false;
  }

  generateMap() {
    const map = this.layoutGrid.set(4, 9, 4, 3, contrib.map, {
      label: `Servers Location (${this.program.region})`,
    });
    Object.keys(awsRegionLocations).forEach((key) => {
      map.addMarker({
        ...awsRegionLocations[key],
        color: "yellow",
        char: "X",
      });
    });
    return map;
  }

  updateMap() {
    if (this.marker) {
      this.map.addMarker({
        ...awsRegionLocations[this.program.region],
        color: "red",
        char: "X",
      });
    } else {
      this.map.addMarker({
        ...awsRegionLocations[this.program.region],
        color: "green",
        char: ".",
      });
    }
    this.marker = !this.marker;
  }
}

module.exports = {
  Map,
};
