import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("node_modules")) {
            if (
              normalizedId.includes("/src/app/tabs/NutritionTab") ||
              normalizedId.includes("/src/components/nutrition/")
            ) {
              return "nutrition";
            }

            if (normalizedId.includes("/src/app/tabs/")) return undefined;

            if (
              normalizedId.includes("/src/app/initial_stage_prep_data") ||
              normalizedId.includes("/src/app/compound_library_catalog")
            ) {
              return "app-data";
            }

            if (
              [
                "/src/app/adaptation_engine",
                "/src/app/checkin_visuals",
                "/src/app/conditioning_engine",
                "/src/app/ecosystem_planning",
                "/src/app/food_engine",
                "/src/app/food_trust",
                "/src/app/monitoring_engine",
                "/src/app/performance_libraries",
                "/src/app/prep_model",
                "/src/app/prep_signal_engine",
                "/src/app/relationship_engine",
                "/src/app/review_engine",
                "/src/app/science_model",
                "/src/app/support_stack_engine",
              ].some((modulePath) => normalizedId.includes(modulePath))
            ) {
              return "app-engines";
            }

            if (
              [
                "/src/app/auth_adapter",
                "/src/app/food_connector",
                "/src/app/membership_adapter",
                "/src/app/notification_adapter",
                "/src/app/product_infrastructure",
              ].some((modulePath) => normalizedId.includes(modulePath))
            ) {
              return "app-infrastructure";
            }

            return undefined;
          }

          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("lucide-react")) return "icons";
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
