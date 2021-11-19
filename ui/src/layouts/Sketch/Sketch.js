import { Button, TextField, Grid, Typography } from "@material-ui/core";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux"
import { addSketch } from "../../api";
import { selectId, selectPlayer } from "../../store/gameSlice";

export default function JoinGame() {
    //const dispatch = useDispatch();
    const gameId = useSelector(selectId);
    const player = useSelector(selectPlayer);

    const submitSketch = async(e) => {
        await addSketch(gameId, player, );
    }

    return (
        <Grid container justifyContent="center">
        <Grid
          container
          direction="column"
          justifyContent="center"
          alignItems="center"
          style={{ width: 320 }}
        >
          <Grid item style={{ width: 300, marginBottom: 16 }}>
            <Typography>Draw!</Typography>
          </Grid>
  
          <SketchSurface />

          <Button
            fullWidth
            disableElevation
            onClick={submitSketch}
            size="large"
            variant="contained"
            color="primary"
          >
              submit
          </Button>
        </Grid>
      </Grid>
    );
}