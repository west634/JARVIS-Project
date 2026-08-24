import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app lives inside a larger repo that also has its own lockfile;
  // pin the workspace root explicitly so Turbopack doesn't have to guess.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
