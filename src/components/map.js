import { awsRegionLocations } from "../constants";

const contrib = require("blessed-contrib");

class Map {
  constructor(layoutGrid, program) {
    this.layoutGrid = layoutGrid;
    this.program = program;
    this.map = this.generateMap();
    this.flashMarker = false;
    this.markerLocation = program.region;
    this.selectedLocation = undefined;
    this.map.key(["up"], () => {
      this.updateSelectedPosition(false);
    });
    this.map.key(["down"], () => {
      this.updateSelectedPosition(true);
    });
    this.map.key(["left"], () => {
      this.updateSelectedPosition(false);
    });
    this.map.key(["right"], () => {
      this.updateSelectedPosition(true);
    });
  }

  generateMap() {
    const map = this.layoutGrid.set(4, 9, 4, 3, contrib.map, {
      label: `Servers Location (${this.program.region})`,
    });
    awsRegionLocations.forEach((region, index) => {
      map.addMarker({
        ...region.coords,
        color: "yellow",
        char: "X",
      });
      if (this.program.region === region.label) {
        this.currentLocation = index;
      }
    });
    return map;
  }

  updateMap() {
    if (this.flashMarker) {
      this.map.addMarker({
        ...awsRegionLocations[this.currentLocation].coords,
        color: "red",
        char: "X",
      });
      if (this.selectedLocation) {
        this.map.addMarker({
          ...awsRegionLocations[this.selectedLocation].coords,
          color: "red",
          char: "X",
        });
      }
    } else {
      this.map.addMarker({
        ...awsRegionLocations[this.currentLocation].coords,
        color: "green",
        char: ".",
      });
      if (this.selectedLocation) {
        this.map.addMarker({
          ...awsRegionLocations[this.selectedLocation].coords,
          color: "green",
          char: ".",
        });
      }
    }
    this.flashMarker = !this.flashMarker;
  }

  updateSelectedPosition(positive) {
    if (positive) {
      if (this.selectedLocation) {
        this.selectedLocation =
          this.selectedLocation === awsRegionLocations.length
            ? 0
            : this.selectedLocation + 1;
      } else {
        this.selectedLocation =
          this.currentLocation === awsRegionLocations.length
            ? 0
            : this.currentLocation + 1;
      }
    } else if (this.selectedLocation) {
      this.selectedLocation =
        this.selectedLocation === 0
          ? awsRegionLocations.length - 1
          : this.selectedLocation - 1;
    } else {
      this.selectedLocation =
        this.currentLocation === 0
          ? awsRegionLocations.length - 1
          : this.currentLocation - 1;
    }
  }
}

module.exports = {
  Map,
};
