import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";

export default defineConfig({
    build: {
        lib: {
            entry: "./src/web/App.ts",
            formats: ["cjs"],
            name: "app",
            fileName: "app",
        },
        sourcemap: true,
        outDir: "./dist/latest",
        emptyOutDir: true,
    },
    plugins: [eslint()],
});
