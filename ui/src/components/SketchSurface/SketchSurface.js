import React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const styles = {
  border: "4px solid #9c9c9c",
  borderRadius: "0",
};

const SketchSurface = () => {
  // https://github.com/vinothpandian/react-sketch-canvas#list-of-props
  return (
    <ReactSketchCanvas
      style={styles}
      width="400px"
      height="400px"
      strokeWidth={4}
      strokeColor="red"
    />
  );
};

SketchSurface.propTypes = {};

SketchSurface.defaultProps = {};

export default SketchSurface;
