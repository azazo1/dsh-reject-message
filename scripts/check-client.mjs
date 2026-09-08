import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pluginId = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name
const code = readFileSync(join(root, 'lib/client.js'), 'utf8')

if (/^\s*import\s/m.test(code)) {
  throw new Error('client bundle still has a top-level ESM import')
}
if (/\bexport\s/.test(code)) {
  throw new Error('client bundle still has an ESM export')
}

if (!code.includes('__ModuleLoader__.load') || !code.includes(`id: "${pluginId}"`)) {
  throw new Error(`client bundle is missing __ModuleLoader__.load id ${pluginId}`)
}

let handoff
const sandbox = {
  window: {
    __ModuleLoader__: {
      load(next) {
        handoff = next
      },
    },
  },
}
sandbox.window.window = sandbox.window
vm.runInNewContext(code, sandbox, { filename: 'client.js' })

if (handoff === undefined) {
  throw new Error('client bundle did not register via __ModuleLoader__.load')
}
if (handoff.id !== pluginId) {
  throw new Error(`registered id ${handoff.id} !== ${pluginId}`)
}

const require = createRequire(import.meta.url)
const exports = handoff.factory((spec) => {
  if (spec === 'react' || spec === 'react/jsx-runtime') return require(spec)
  throw new Error(`unexpected require: ${spec}`)
})

if (typeof exports.apply !== 'function') {
  throw new Error('factory did not export apply')
}
if (!Array.isArray(exports.inject) || !exports.inject.includes('slots') || !exports.inject.includes('remote')) {
  throw new Error(`unexpected inject: ${JSON.stringify(exports.inject)}`)
}

console.log('dsh-reject-message: client loader registration ok')
