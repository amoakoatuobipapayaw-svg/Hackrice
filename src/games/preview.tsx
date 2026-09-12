import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../globals.css";
import { SignSkeletonDemo } from "./SignSkeletonDemo";

createRoot(document.getElementById("root")!).render(
  <StrictMode><SignSkeletonDemo /></StrictMode>,
);
