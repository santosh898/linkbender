import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    define: {
      "process.env": env, // Make sure Vite injects the environment variables
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
