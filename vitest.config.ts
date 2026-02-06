import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./packages/web/src/tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/*.spec.ts",
      "**/build/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "**/e2e/**",
        "**/*.d.ts",
        "**/*.config.*",
        "**/dist/**",
        "**/build/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./packages/web/src"),
    },
  },
});
