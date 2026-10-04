// Bundles tests/entry.jsx with esbuild (shipped with Vite) and runs it in Node.
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const out = resolve('tests/.entry.bundle.mjs');
await build({
  entryPoints: ['tests/entry.jsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: out,
  jsx: 'automatic',
  loader: { '.js': 'jsx' },
  external: ['node:*'],
  logLevel: 'error',
  banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
});
await import(pathToFileURL(out).href);
