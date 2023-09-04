import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import stylelint from "vite-plugin-stylelint";
import autoprefixer from "autoprefixer";
import * as path from "path";

const commitHash = require("child_process")
  .execSync("git rev-parse --short HEAD")
  .toString();
// https://vitejs.dev/config/

export default defineConfig(({ mode }) => {
  // TODO: fix loading env variables
  const env = loadEnv(mode, process.cwd(), "");
  return {
    define: {
      "process.env.NODE_DEBUG": process.env.NODE_DEBUG,
      "import.meta.env.VITE_REACT_APP_GIT_SHA": JSON.stringify(commitHash),
    },
    plugins: [react()],
    css: {
      postcss: {
        plugins: [autoprefixer()],
      },
    },
    server: { port: Number(env.VITE_UI_PORT) },
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
  };
});
