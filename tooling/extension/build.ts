import { copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const extensionRoot = path.join(repositoryRoot, 'apps/extension');
const outputRoot = path.join(extensionRoot, 'dist');

function run(command: string, args: string[]): void {
  const result = spawnSync(command, args, {
    cwd: extensionRoot,
    encoding: 'utf8',
    stdio: 'inherit'
  });

  if (result.error && 'code' in result.error && result.error.code === 'ENOENT') {
    throw new Error(`Required command "${command}" is not available.`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${result.status ?? 'unknown'}.`);
  }
}

async function main(): Promise<void> {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json']);
  run('pnpm', [
    'exec',
    'tailwindcss',
    '-c',
    'tailwind.config.cjs',
    '-i',
    'src/styles/input.css',
    '-o',
    'dist/styles.css',
    '--minify'
  ]);

  await Promise.all(
    ['manifest.json', 'index.html', 'icon.png'].map((file) =>
      copyFile(path.join(extensionRoot, file), path.join(outputRoot, file))
    )
  );

  console.log(`Built extension at ${path.relative(repositoryRoot, outputRoot)}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Extension build failed: ${message}`);
  process.exitCode = 1;
});
