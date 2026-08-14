import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  EXTENSION_TARGET_DEFINITIONS,
  packageFilesForTarget,
  resolveTargets,
  type ExtensionTarget
} from './targets.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILD_ROOT = path.join(ROOT, 'apps/extension/dist');
const ARTIFACT_ROOT = path.join(ROOT, 'artifacts');

export const PACKAGE_FILES = Object.freeze(packageFilesForTarget('chrome'));

interface ExtensionManifest {
  version?: unknown;
  background?: unknown;
}

export function validateVersion(version: unknown): string {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/.test(version)) {
    throw new Error(`Invalid manifest version "${version}". Use one to four dot-separated integers.`);
  }

  const components = version.split('.').map(Number);
  if (components.some((component) => component > 65535)) {
    throw new Error(`Invalid manifest version "${version}". Each component must be at most 65535.`);
  }

  return version;
}

export function assertReleaseTag(
  version: string,
  releaseTag = process.env.RELEASE_TAG
): void {
  if (!releaseTag) return;

  const expectedTag = `v${version}`;
  if (releaseTag !== expectedTag) {
    throw new Error(
      `Release tag "${releaseTag}" does not match manifest version "${version}". Expected "${expectedTag}".`
    );
  }
}

function backgroundEntries(background: unknown): readonly string[] {
  if (!background || typeof background !== 'object') return [];
  const value = background as { service_worker?: unknown; scripts?: unknown };
  if (typeof value.service_worker === 'string') return [value.service_worker];
  if (Array.isArray(value.scripts)) {
    return value.scripts.filter((entry): entry is string => typeof entry === 'string');
  }
  return [];
}

async function assertPackageFiles(
  target: ExtensionTarget,
  buildRoot: string,
  manifest: ExtensionManifest
): Promise<readonly string[]> {
  const packageFiles = packageFilesForTarget(target);
  const declaredBackground = backgroundEntries(manifest.background);
  if (declaredBackground.length === 0) {
    throw new Error(`${target}: the manifest declares no background script.`);
  }
  for (const entry of declaredBackground) {
    if (!packageFiles.includes(entry)) {
      throw new Error(`${target}: background script "${entry}" is not packaged.`);
    }
  }

  await Promise.all(
    packageFiles.map(async (relativePath) => {
      const absolutePath = path.join(buildRoot, relativePath);
      const detail = await lstat(absolutePath).catch(() => undefined);
      if (!detail) throw new Error(`${target}: missing package file: ${relativePath}`);
      if (!detail.isFile() || detail.isSymbolicLink()) {
        throw new Error(`${target}: package entry must be a regular file: ${relativePath}`);
      }
    })
  );

  return packageFiles;
}

async function packageTarget(target: ExtensionTarget): Promise<string> {
  const buildRoot = path.join(BUILD_ROOT, target);
  const manifest = JSON.parse(
    await readFile(path.join(buildRoot, 'manifest.json'), 'utf8')
  ) as ExtensionManifest;
  const version = validateVersion(manifest.version);
  assertReleaseTag(version);
  const packageFiles = await assertPackageFiles(target, buildRoot, manifest);

  const outputPath = path.join(ARTIFACT_ROOT, `formfully-${target}-${version}.zip`);
  await Promise.all([
    rm(outputPath, { force: true }),
    rm(`${outputPath}.sha256`, { force: true })
  ]);

  const result = spawnSync('zip', ['-q', '-X', '-9', outputPath, ...packageFiles], {
    cwd: buildRoot,
    encoding: 'utf8'
  });

  if (result.error && 'code' in result.error && result.error.code === 'ENOENT') {
    throw new Error('The "zip" executable is required to package the extension.');
  }
  if (result.status !== 0) {
    throw new Error(`zip failed: ${(result.stderr || result.stdout).trim()}`);
  }

  const digest = createHash('sha256')
    .update(await readFile(outputPath))
    .digest('hex');
  await writeFile(
    `${outputPath}.sha256`,
    `${digest}  ${path.basename(outputPath)}\n`,
    'utf8'
  );

  console.log(
    `${EXTENSION_TARGET_DEFINITIONS[target].label}: ${path.relative(ROOT, outputPath)}`
  );
  console.log(`  SHA-256: ${digest}`);
  return version;
}

async function main(): Promise<void> {
  const targets = resolveTargets(process.argv.slice(2));
  await mkdir(ARTIFACT_ROOT, { recursive: true });

  const versions = new Set<string>();
  for (const target of targets) versions.add(await packageTarget(target));
  if (versions.size !== 1) {
    throw new Error(`Browser builds disagree on the version: ${[...versions].join(', ')}`);
  }

  console.log(`Packaged FormFully ${[...versions][0]} for ${targets.join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Packaging failed: ${message}`);
    process.exitCode = 1;
  });
}
