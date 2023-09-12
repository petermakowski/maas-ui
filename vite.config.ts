// import { defineConfig, loadEnv } from "vite";

// import stylelint from "vite-plugin-stylelint";
// import autoprefixer from "autoprefixer";
import * as path from "path";

import reactRefresh from "@vitejs/plugin-react-refresh";
import react from "@vitejs/plugin-react-swc";

const commitHash = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString();
// // https://vitejs.dev/config/

// export default defineConfig(({ mode }) => {
//   // TODO: fix loading env variables
//   const env = loadEnv(mode, process.cwd(), "");
//   return {
//     define: {
//       "process.env.NODE_DEBUG": process.env.NODE_DEBUG,
//       "import.meta.env.VITE_REACT_APP_GIT_SHA": JSON.stringify(commitHash),
//     },
//     plugins: [react()],
//     css: {
//       postcss: {
//         plugins: [autoprefixer()],
//       },
//     },
//     server: { port: Number(env.VITE_UI_PORT) },
//     resolve: {
//       alias: { "@": path.resolve(__dirname, "src") },
//     },
//   };
// });

import dotenv from "dotenv-flow";
import { createProxyMiddleware } from "http-proxy-middleware";
import { defineConfig } from "vite";

dotenv.config();

const BASENAME = process.env.BASENAME;
const REACT_BASENAME = process.env.REACT_BASENAME || "/r";
const PROXY_PORT = process.env.PROXY_PORT || 8400;
const REACT_PORT = 8401;
const API_ENDPOINTS = [
  `${BASENAME}/accounts/login/`,
  `${BASENAME}/api`,
  `${BASENAME}/accounts`,
  `${BASENAME}/a`,
];

function apiProxy() {
  return {
    name: "api-proxy",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url.split("?")[0];
        console.warn(path);
        if (
          path === BASENAME ||
          path === "/" ||
          path === `${BASENAME}/` ||
          API_ENDPOINTS.includes(path) ||
          path.startsWith(`${BASENAME}`)
        ) {
          return createProxyMiddleware({
            changeOrigin: true,
            onProxyReq(proxyReq) {
              proxyReq.setHeader(
                "Referer",
                `${process.env.MAAS_URL}${proxyReq.path}`
              );
            },
            secure: false,
            target: process.env.MAAS_URL,
          })(req, res, next);
        } else if (path === `${BASENAME}/ws` || path === "/sockjs-node") {
          return createProxyMiddleware({
            secure: false,
            target: `ws://localhost:${REACT_PORT}/`,
            ws: true,
          })(req, res, next);
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: Number(PROXY_PORT),
  },
  define: {
    "process.env.NODE_DEBUG": process.env.NODE_DEBUG,
    "import.meta.env.VITE_REACT_APP_GIT_SHA": JSON.stringify(commitHash),
  },
  plugins: [react(), reactRefresh(), apiProxy()],

  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
