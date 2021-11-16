import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import SketchSurface from "./SketchSurface";

describe("SketchSurface", () => {
  it("renders without crashing", () => {
    render(<SketchSurface />);
  });
});
