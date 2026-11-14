// Copies shared/theme into every mod's hooks/shared: an installed mod gets only its own folder.
// Usage: node scripts/sync-shared.ts [--check]
// --check writes nothing and exits 1 when a copy is missing or out of date

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
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
const pluginDirs: string[] = readdirSync(PLUGINS_DIR)
  .map(plugin => join(PLUGINS_DIR, plugin))
  .filter(dir => existsSync(join(dir, "hooks")))

const stale: string[] = []

for (const pluginDir of pluginDirs) {
  const targetDir: string = join(pluginDir, TARGET_SUBDIR)
  const extraFiles: string[] = existsSync(targetDir)
    ? readdirSync(targetDir).filter(file => !sourceFiles.includes(file))
    : []

  stale.push(
    ...extraFiles.map(
      file => `${join(targetDir, file)} (not in ${SOURCE_DIR})`,
    ),
  )

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
