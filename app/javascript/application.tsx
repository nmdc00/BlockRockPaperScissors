import React from "react";
import ReactDOM from "react-dom/client";
import Web3Dashboard from "./components/Web3Dashboard"; // Adjust path if necessary

console.log("application.tsx is being loaded!");

const rootElement = document.getElementById("root");

console.log("ReactDOM:", ReactDOM);

if (rootElement) {
  console.log("Root element found, mounting React...");
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Web3Dashboard />);
  console.log("React has mounted!");
} else {
  console.error("Root element not found.");
}