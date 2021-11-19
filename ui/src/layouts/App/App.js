import React from "react";
import { Routes, Route } from "react-router-dom";
import JoinGame from "../JoinGame";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<JoinGame />} />
    </Routes>
  );
};

App.propTypes = {};

App.defaultProps = {};

export default App;
