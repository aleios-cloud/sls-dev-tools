import { awsRegionLocations } from "../constants";

const contrib = require("blessed-contrib");

class Map {
  constructor(layoutGrid, program, application) {
    this.layoutGrid = layoutGrid;
    this.program = program;
    this.map = this.generateMap();
    this.flashMarker = false;
    this.markerLocation = program.region;
    this.selectedLocation = undefined;
    this.application = application;
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
    this.map.key(["tab"], () => {
      this.resetMap();
    });
    this.map.key(["enter"], () => {
      if (
        this.selectedLocation !== undefined &&
        this.selectedLocation !== this.currentLocation
      ) {
        this.map.addMarker({
          ...awsRegionLocations[this.currentLocation].coords,
          color: "yellow",
          char: "X",
        });
        this.currentLocation = this.selectedLocation;
        // eslint-disable-next-line no-underscore-dangle
        this.map._label.content = `Location (${
          awsRegionLocations[this.currentLocation].label
        })`;
        this.selectedLocation = undefined;
        this.application.updateRegion(
          awsRegionLocations[this.currentLocation].label
        );
        console.log(
          `Welcome to ${awsRegionLocations[this.currentLocation].label}`
        );
      }
    });
  }

  generateMap() {
    const map = this.layoutGrid.set(4, 9, 4, 3, contrib.map, {
      label: `Location (${this.program.region})`,
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
      if (this.selectedLocation !== undefined) {
        this.map.addMarker({
          ...awsRegionLocations[this.selectedLocation].coords,
          color: [255, 130, 0],
          char: "X",
        });
      }
    } else {
      this.map.addMarker({
        ...awsRegionLocations[this.currentLocation].coords,
        color: "green",
        char: ".",
      });
      if (this.selectedLocation !== undefined) {
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
    if (this.selectedLocation !== undefined) {
      this.map.addMarker({
        ...awsRegionLocations[this.selectedLocation].coords,
        color: "yellow",
        char: "X",
      });
    }
    if (positive) {
      if (this.selectedLocation !== undefined) {
        this.selectedLocation =
          this.selectedLocation === awsRegionLocations.length - 1
            ? 0
            : this.selectedLocation + 1;
      } else {
        this.selectedLocation =
          this.currentLocation === awsRegionLocations.length - 1
            ? 0
            : this.currentLocation + 1;
      }
    } else if (this.selectedLocation !== undefined) {
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
    // eslint-disable-next-line no-underscore-dangle
    this.map._label.content = `Location (${
      this.program.region
    })\nSelected Region: ${awsRegionLocations[this.selectedLocation].label}`;
  }

  resetMap() {
    // eslint-disable-next-line no-underscore-dangle
    this.map._label.content = `Location (${
      awsRegionLocations[this.currentLocation].label
    })`;
    if (
      this.selectedLocation !== undefined &&
      this.selectedLocation !== this.currentLocation
    ) {
      this.map.addMarker({
        ...awsRegionLocations[this.selectedLocation].coords,
        color: "yellow",
        char: "X",
      });
    }
    this.selectedLocation = undefined;
  }
}

module.exports = {
  Map,
};
