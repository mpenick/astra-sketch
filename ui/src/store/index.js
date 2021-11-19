import { configureStore } from "@reduxjs/toolkit";
import persistState from "redux-localstorage";
import { combineReducers } from "redux";
import gameReducer from "./gameSlice"


export const reducers = combineReducers ({
    game: gameReducer,
});

export default configureStore({
    reducer: reducers,
    enhancers: [persistState()],
})