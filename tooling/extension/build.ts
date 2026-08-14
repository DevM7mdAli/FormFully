import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  EXTENSION_TARGET_DEFINITIONS,
  EXTENSION_TARGETS,
  resolveTargets,
  type ExtensionManifest,
  type ExtensionTarget
} from './targets.js';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const extensionRoot = path.join(repositoryRoot, 'apps/extension');
const outputRoot = path.join(extensionRoot, 'dist');
const sharedScriptsRoot = path.join(outputRoot, '.scripts');
const sharedStylesRoot = path.join(outputRoot, '.styles');
const sharedStyles = path.join(sharedStylesRoot, 'styles.css');
const runtimeScripts = [
  'browser-api.js',
  'background.js',
  'form-filler.js',
  'i18n.js',
  'popup.js'
] as const;

function run(command: string, args: readonly string[]): void {
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

async function buildTarget(
  target: ExtensionTarget,
  baseManifest: ExtensionManifest
): Promise<void> {
  const definition = EXTENSION_TARGET_DEFINITIONS[target];
  const targetRoot = path.join(outputRoot, target);
  await rm(targetRoot, { recursive: true, force: true });
  await mkdir(targetRoot, { recursive: true });

  await Promise.all([
    writeFile(
      path.join(targetRoot, 'manifest.json'),
      `${JSON.stringify(definition.manifest(baseManifest), null, 2)}\n`,
      'utf8'
    ),
    copyFile(path.join(extensionRoot, 'icon.png'), path.join(targetRoot, 'icon.png')),
    cp(path.join(extensionRoot, 'icons'), path.join(targetRoot, 'icons'), {
      recursive: true
    }),
    copyFile(path.join(extensionRoot, 'index.html'), path.join(targetRoot, 'index.html')),
    copyFile(sharedStyles, path.join(targetRoot, 'styles.css')),
    ...runtimeScripts.map((file) =>
      copyFile(path.join(sharedScriptsRoot, file), path.join(targetRoot, file))
    )
  ]);

  if (target === 'chrome') {
    await writeFile(
      path.join(targetRoot, 'service-worker.js'),
      "importScripts('browser-api.js', 'form-filler.js', 'background.js');\n",
      'utf8'
    );
  }

  console.log(`Built ${definition.label} at ${path.relative(repositoryRoot, targetRoot)}`);
}

async function main(): Promise<void> {
  const targets = resolveTargets(process.argv.slice(2));
  const baseManifest = JSON.parse(
    await readFile(path.join(extensionRoot, 'manifest.base.json'), 'utf8')
  ) as ExtensionManifest;

  if (targets.length === EXTENSION_TARGETS.length) {
    await rm(outputRoot, { recursive: true, force: true });
  }
  await Promise.all([
    rm(sharedScriptsRoot, { recursive: true, force: true }),
    rm(sharedStylesRoot, { recursive: true, force: true })
  ]);
  await Promise.all([
    mkdir(sharedScriptsRoot, { recursive: true }),
    mkdir(sharedStylesRoot, { recursive: true })
  ]);

  try {
    run('pnpm', [
      'exec',
      'tsc',
      '-p',
      'tsconfig.json',
      '--outDir',
      sharedScriptsRoot
    ]);
    run('pnpm', [
      'exec',
      'tailwindcss',
      '-c',
      'tailwind.config.cjs',
      '-i',
      'src/styles/input.css',
      '-o',
      sharedStyles,
      '--minify'
    ]);

    for (const target of targets) await buildTarget(target, baseManifest);
  } finally {
    await Promise.all([
      rm(sharedScriptsRoot, { recursive: true, force: true }),
      rm(sharedStylesRoot, { recursive: true, force: true })
    ]);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Extension build failed: ${message}`);
  process.exitCode = 1;
});
