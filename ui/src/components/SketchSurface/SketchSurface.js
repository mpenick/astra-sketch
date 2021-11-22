import React from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Grid, Item } from "@material-ui/core";
import './SketchSurface.css'

const styles = {
  border: "4px solid #9c9c9c",
  borderRadius: "0",
};

const SketchSurface = () => {
  const canvasRef = React.createRef();

  const colorSelected = (e) => {
    console.log('clicked ' + JSON.stringify(canvasRef.current));
  };


  // https://github.com/vinothpandian/react-sketch-canvas#list-of-props
  return (
    <Grid container justifyContent="center">
      <Grid
        container
        direction="column"
        justifyContent="center"
        alignItems="center"
        style={{ width: 320 }}
        spacing={2}
      >
        <Grid item>
          <ReactSketchCanvas
            name="sketch"
            ref={canvasRef}
            style={styles}
            width="400px"
            height="400px"
            strokeWidth={4}
            strokeColor="red"
          />
        </Grid>
        <Grid item>
          <Grid container spacing={1}>
            <Grid item>
              <input name="orange" className="btn" type="button" onClick={colorSelected} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

SketchSurface.propTypes = {};

SketchSurface.defaultProps = {};

export default SketchSurface;
