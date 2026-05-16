import { defineConfig } from "cypress";

/** Dev (Vite): 5173. E2E headless (`npm run test:e2e`): `run-e2e.mjs` define CYPRESS_BASE_URL=4173 (preview). */
const baseUrl =
  process.env.CYPRESS_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5173";

export default defineConfig({
  e2e: {
    baseUrl,
    video: false,
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },
});
