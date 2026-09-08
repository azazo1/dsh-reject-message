import { defineConfig } from 'tsdown'

const PLUGIN_ID = 'dsh-reject-message'

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  format: ['cjs'],
  platform: 'browser',
  outDir: 'lib',
  dts: false,
  clean: false,
  sourcemap: true,
  target: 'es2022',
  fixedExtension: false,
  deps: {
    neverBundle: ['react', 'react/jsx-runtime', 'react-dom', '@deepseek-ai/cordis'],
  },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_ID)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})
