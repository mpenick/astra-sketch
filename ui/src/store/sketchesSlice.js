import { createSlice } from "@reduxjs/toolkit";

// id, player, content
export const initialState = {};

export const slice = createSlice({
  name: "sketches",
  initialState,
  reducers: {
    setAll: (state, action) => {
      return action.payload;
    },
    addSketch: (state, action) => {
      state[action.payload.id] = action.payload;
    },
    reset: () => {
      return initialState;
    },
  },
});

export const { addSketch } = slice.actions;

export const selectSketches = (state) => state.answers;

export default slice.reducer;
