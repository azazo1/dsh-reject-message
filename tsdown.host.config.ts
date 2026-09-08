import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  format: ['esm'],
  platform: 'node',
  outDir: 'lib',
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  fixedExtension: false,
  deps: {
    neverBundle: [
      '@deepseek-ai/cordis',
      '@deepseek-ai/dsh-llm',
      '@deepseek-ai/dsh-tools',
      '@deepseek-ai/dsh-typert-protocol',
      '@deepseek-ai/dsh-typert-registry',
      '@deepseek-ai/schemastery',
    ],
  },
})
