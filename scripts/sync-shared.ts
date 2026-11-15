// Copies shared/theme into every theme mod's hooks/shared: an installed mod gets only its own folder.
// Files in hooks/shared that are not in shared/theme are deleted.
// Usage: node scripts/sync-shared.ts [--check]
// --check writes nothing and exits 1 when a copy is missing, out of date or extra

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"

const SOURCE_DIR: string = "shared/theme"
const PLUGINS_DIR: string = "plugins"
const TARGET_SUBDIR: string = "hooks/shared"

const isCheck: boolean = process.argv.includes("--check")

const readOrUndefined = (path: string): string | undefined =>
  existsSync(path) ? readFileSync(path, "utf8") : undefined

const sourceFiles: string[] = readdirSync(SOURCE_DIR)
// Theme mods only: other mods do not use shared/theme
const pluginDirs: string[] = readdirSync(PLUGINS_DIR)
  .filter(plugin => plugin.endsWith("-theme"))
  .map(plugin => join(PLUGINS_DIR, plugin))

const stale: string[] = []

for (const pluginDir of pluginDirs) {
  const targetDir: string = join(pluginDir, TARGET_SUBDIR)
  const extraFiles: string[] = existsSync(targetDir)
    ? readdirSync(targetDir).filter(file => !sourceFiles.includes(file))
    : []

  for (const file of extraFiles) {
    const extra: string = join(targetDir, file)

    if (isCheck) {
      stale.push(`${extra} (not in ${SOURCE_DIR})`)
      continue
    }

    rmSync(extra, { recursive: true })
    console.log(`deleted ${extra}`)
  }

  for (const file of sourceFiles) {
    const source: string = readFileSync(join(SOURCE_DIR, file), "utf8")
    const target: string = join(targetDir, file)

    if (readOrUndefined(target) === source) {
      continue
    }

    if (isCheck) {
      stale.push(target)
      continue
    }

    mkdirSync(targetDir, { recursive: true })
    writeFileSync(target, source)
    console.log(`copied ${target}`)
  }
}

if (stale.length > 0) {
  console.error(`Out of date, run npm run sync:\n${stale.join("\n")}`)
  process.exit(1)
}
