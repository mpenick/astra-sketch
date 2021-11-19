import { createSlice } from "@reduxjs/toolkit";
import constants from "../constants";

export const initialState = {
  id: "",
  page: "",
  player: "",
};

export const slice = createSlice({
  name: "game",
  initialState,
  reducers: {
    initialize: (state, action) => {
      state.id = action.payload;
      state.page = "todo";
    },
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setPlayer: (state, action) => {
      state.player = action.payload;
    },
    setId: (state, action) => {
      state.id = action.payload;
    },
    reset: () => {
      return initialState;
    },
  },
});

export const resetGame = () => {
  return (dispatch) => {
    dispatch(slice.actions.reset());
    localStorage.removeItem(constants.LOCAL_STORAGE_KEY);
  };
};

export const {
  initialize,
  setPage,
  setPlayer,
  setId,
} = slice.actions;

export const selectId = (state) => state.game.id;
export const selectPage = (state) => state.game.page;
export const selectPlayer = (state) => state.game.player;

export default slice.reducer;