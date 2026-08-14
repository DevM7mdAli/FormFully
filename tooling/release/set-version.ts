import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const files = [
  'apps/extension/manifest.base.json',
  'apps/extension/package.json'
] as const;

if (!versionPattern.test(version ?? '')) {
  throw new Error(`Expected a stable semantic version, received: ${version ?? ''}`);
}

await Promise.all(
  files.map(async (relativePath) => {
    const file = path.join(root, relativePath);
    const source = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
    source.version = version;
    await writeFile(file, `${JSON.stringify(source, null, 2)}\n`, 'utf8');
  })
);
