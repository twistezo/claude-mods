// Copies each shared/ folder into the hooks/shared of every mod that uses it: an installed mod gets
// only its own folder. Files in a mod's hooks/shared that no source of that mod holds are deleted.
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

type SharedSource = {
  dir: string
  // Whether the mod in plugins/<name> uses this folder
  usedBy: (plugin: string) => boolean
}

const SOURCES: readonly SharedSource[] = [
  { dir: "shared/theme", usedBy: plugin => plugin.endsWith("-theme") },
  // session-band shows the rate limits; christmas-theme's snow follows its 5h figure
  {
    dir: "shared/rate-limits",
    usedBy: plugin => ["session-band", "christmas-theme"].includes(plugin),
  },
]
const PLUGINS_DIR: string = "plugins"
const TARGET_SUBDIR: string = "hooks/shared"

const isCheck: boolean = process.argv.includes("--check")

const readOrUndefined = (path: string): string | undefined =>
  existsSync(path) ? readFileSync(path, "utf8") : undefined

// Each file a mod gets, by name, with the shared folder it comes from
const filesFor = (plugin: string): Map<string, string> => {
  const files: Map<string, string> = new Map()

  for (const source of SOURCES.filter(entry => entry.usedBy(plugin))) {
    for (const file of readdirSync(source.dir)) {
      const taken: string | undefined = files.get(file)

      if (taken !== undefined) {
        throw new Error(`${file} is in both ${taken} and ${source.dir}`)
      }

      files.set(file, source.dir)
    }
  }

  return files
}

const stale: string[] = []

for (const plugin of readdirSync(PLUGINS_DIR)) {
  const files: Map<string, string> = filesFor(plugin)

  if (files.size === 0) {
    continue
  }

  const targetDir: string = join(PLUGINS_DIR, plugin, TARGET_SUBDIR)
  const extraFiles: string[] = existsSync(targetDir)
    ? readdirSync(targetDir).filter(file => !files.has(file))
    : []

  for (const file of extraFiles) {
    const extra: string = join(targetDir, file)

    if (isCheck) {
      stale.push(`${extra} (in no shared folder of ${plugin})`)
      continue
    }

    rmSync(extra, { recursive: true })
    console.log(`deleted ${extra}`)
  }

  for (const [file, sourceDir] of files) {
    const source: string = readFileSync(join(sourceDir, file), "utf8")
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
