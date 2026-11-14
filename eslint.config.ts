import js from "@eslint/js"
import prettier from "eslint-config-prettier"
import { defineConfig, globalIgnores } from "eslint/config"
import tseslint from "typescript-eslint"

export default defineConfig(
  // Copied unchanged from the plugin-authoring skill, engine-written types, and copies of shared/
  globalIgnores([
    "**/make-colors.js",
    "**/make-colors.d.ts",
    "**/.claude-plugin/types/",
    "plugins/*/hooks/shared/",
  ]),
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
)
