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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const PACKAGE_FILES = Object.freeze([
  'manifest.json',
  'icon.png',
  'index.html',
  'background.js',
  'form-filler.js',
  'i18.js',
  'script.js',
  'src/output.css'
]);

function parseArgs(argv) {
  const args = { output: 'dist/formfully-extension.zip' };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--output') {
      args.output = argv[index + 1];
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

export function validateVersion(version) {
  if (typeof version !== 'string' || !/^(0|[1-9]\d*)(\.(0|[1-9]\d*)){0,3}$/.test(version)) {
    throw new Error(`Invalid manifest version "${version}". Use one to four dot-separated integers.`);
  }

  const components = version.split('.').map(Number);
  if (components.some((component) => component > 65535)) {
    throw new Error(`Invalid manifest version "${version}". Each component must be at most 65535.`);
  }

  return version;
}

export function assertReleaseTag(version, releaseTag = process.env.RELEASE_TAG) {
  if (!releaseTag) return;

  const expectedTag = `v${version}`;
  if (releaseTag !== expectedTag) {
    throw new Error(
      `Release tag "${releaseTag}" does not match manifest version "${version}". Expected "${expectedTag}".`
    );
  }
}

async function assertPackageFiles() {
  for (const relativePath of PACKAGE_FILES) {
    const absolutePath = path.join(ROOT, relativePath);
    const file = await lstat(absolutePath);
    if (!file.isFile() || file.isSymbolicLink()) {
      throw new Error(`Package entry must be a regular file: ${relativePath}`);
    }
  }
}

async function removeExisting(filePath) {
  try {
    await unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

async function main() {
  const { output } = parseArgs(process.argv.slice(2));
  const manifest = JSON.parse(await readFile(path.join(ROOT, 'manifest.json'), 'utf8'));
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
    { cwd: ROOT, encoding: 'utf8' }
  );

  if (result.error?.code === 'ENOENT') {
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
  main().catch((error) => {
    console.error(`Packaging failed: ${error.message}`);
    process.exitCode = 1;
  });
}
