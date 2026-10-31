import { build } from 'esbuild'
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = resolve(rootDir, 'api/index.js')
const legacyTsEntry = resolve(rootDir, 'api/index.ts')

mkdirSync(resolve(rootDir, 'api'), { recursive: true })

if (existsSync(legacyTsEntry)) {
  rmSync(legacyTsEntry)
}

await build({
  absWorkingDir: rootDir,
  entryPoints: [resolve(rootDir, 'server/vercel_entry.ts')],
  outfile: outFile,
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  minify: true,
  legalComments: 'none',
  logLevel: 'info',
  // Vercel expects module.exports = handler, not { default: handler }.
  footer: {
    js: '\nmodule.exports = module.exports.default || module.exports;\n',
  },
})


writeFileSync(
  resolve(rootDir, 'api/package.json'),
  `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`,
)

console.log(`Bundled Vercel API -> ${outFile}`)
