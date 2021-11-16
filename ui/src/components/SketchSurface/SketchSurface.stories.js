import React from "react";
import SketchSurface from "./SketchSurface";

export default {
  title: "Components/SketchSurface",
  component: SketchSurface,
};

const Template = (args) => <SketchSurface {...args} />;

export const Primary = Template.bind({});
Primary.args = {};
