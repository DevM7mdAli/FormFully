import { createHash } from 'node:crypto';
import {
  lstat,
  mkdir,
  readFile,
  unlink,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BUILD_ROOT = path.join(ROOT, 'apps/extension/dist');

export const PACKAGE_FILES = Object.freeze([
  'manifest.json',
  'icon.png',
  'index.html',
  'background.js',
  'form-filler.js',
  'i18n.js',
  'popup.js',
  'styles.css'
]);

interface PackageArguments {
  output: string;
}

interface ExtensionManifest {
  version?: unknown;
}

function parseArgs(argv: string[]): PackageArguments {
  const args = { output: 'dist/formfully-extension.zip' };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') {
      continue;
    } else if (argument === '--output') {
      args.output = argv[index + 1] || '';
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!args.output) {
    throw new Error('--output requires a file path.');
  }

  return args;
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

async function assertPackageFiles(): Promise<void> {
  for (const relativePath of PACKAGE_FILES) {
    const absolutePath = path.join(BUILD_ROOT, relativePath);
    const file = await lstat(absolutePath);
    if (!file.isFile() || file.isSymbolicLink()) {
      throw new Error(`Package entry must be a regular file: ${relativePath}`);
    }
  }
}

async function removeExisting(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error: unknown) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
}

async function main(): Promise<void> {
  const { output } = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(
    await readFile(path.join(BUILD_ROOT, 'manifest.json'), 'utf8')
  ) as ExtensionManifest;
  const version = validateVersion(manifest.version);
  assertReleaseTag(version);
  await assertPackageFiles();

  const outputPath = path.resolve(ROOT, output);
  if (path.extname(outputPath).toLowerCase() !== '.zip') {
    throw new Error('The package output must use the .zip extension.');
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await removeExisting(outputPath);
  await removeExisting(`${outputPath}.sha256`);

  const result = spawnSync(
    'zip',
    ['-q', '-X', '-9', outputPath, ...PACKAGE_FILES],
    { cwd: BUILD_ROOT, encoding: 'utf8' }
  );

  if (result.error && 'code' in result.error && result.error.code === 'ENOENT') {
    throw new Error('The "zip" executable is required to package the extension.');
  }
  if (result.status !== 0) {
    throw new Error(`zip failed: ${(result.stderr || result.stdout).trim()}`);
  }

  const archive = await readFile(outputPath);
  const digest = createHash('sha256').update(archive).digest('hex');
  await writeFile(
    `${outputPath}.sha256`,
    `${digest}  ${path.basename(outputPath)}\n`,
    'utf8'
  );

  console.log(`Packaged FormFully ${version}`);
  console.log(`Archive: ${path.relative(ROOT, outputPath)}`);
  console.log(`SHA-256: ${digest}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Packaging failed: ${message}`);
    process.exitCode = 1;
  });
}
