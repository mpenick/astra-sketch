import React from "react";
import App from "./App";

export default {
  title: "Layouts/App",
  component: App,
};

const Template = (args) => <App {...args} />;

export const Primary = Template.bind({});
Primary.args = {};
