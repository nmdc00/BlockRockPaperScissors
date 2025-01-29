import React from "react";
import ReactDOM from "react-dom/client";
import Web3Dashboard from "./components/Web3Dashboard"; // Adjust path if necessary

document.addEventListener("DOMContentLoaded", () => {
  const rootElement = document.getElementById("react-root");

  if (rootElement) {
    const contractAddress = window.ENV?.CONTRACT_ADDRESS || "No contract address provided";

    console.log("Contract Address in react:", contractAddress);

    const root = ReactDOM.createRoot(rootElement);
    root.render(<Web3Dashboard contractAddress={contractAddress} />);
  } else {
    console.error("No React component to mount.");
  }
});
