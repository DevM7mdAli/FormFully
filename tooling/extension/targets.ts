/**
 * Browser-specific Manifest V3 differences.
 *
 * Chromium runs a service worker. Firefox still represents a Manifest V3
 * background process as an event page, and Safari supports the same portable
 * event-page form back to Safari 15.4.
 */

export const EXTENSION_TARGETS = ['chrome', 'firefox', 'safari'] as const;

export type ExtensionTarget = (typeof EXTENSION_TARGETS)[number];
export type ExtensionManifest = Record<string, unknown>;

type TargetDefinition = {
  readonly label: string;
  readonly manifest: (base: ExtensionManifest) => ExtensionManifest;
};

const GECKO_ID = 'formfully@devm7mdali.github.io';

function withPortableMacShortcut(base: ExtensionManifest): ExtensionManifest {
  const commands = (base.commands ?? {}) as Record<string, Record<string, unknown>>;
  const alternate = commands['fill-form-alt'] ?? {};
  const suggestedKey = (alternate.suggested_key ?? {}) as Record<string, unknown>;
  return {
    ...base,
    commands: {
      ...commands,
      'fill-form-alt': {
        ...alternate,
        suggested_key: { ...suggestedKey, mac: 'Alt+Shift+F' }
      }
    }
  };
}

export const EXTENSION_TARGET_DEFINITIONS: Record<ExtensionTarget, TargetDefinition> = {
  chrome: {
    label: 'Chrome and Edge',
    manifest: (base) => ({
      ...base,
      minimum_chrome_version: '102',
      background: { service_worker: 'service-worker.js' }
    })
  },
  firefox: {
    label: 'Firefox',
    manifest: (base) => ({
      ...withPortableMacShortcut(base),
      browser_specific_settings: {
        gecko: {
          id: GECKO_ID,
          strict_min_version: '142.0',
          data_collection_permissions: { required: ['none'] }
        }
      },
      background: {
        scripts: ['browser-api.js', 'form-filler.js', 'background.js']
      }
    })
  },
  safari: {
    label: 'Safari',
    manifest: (base) => ({
      ...withPortableMacShortcut(base),
      browser_specific_settings: {
        safari: { strict_min_version: '15.4' }
      },
      background: {
        scripts: ['browser-api.js', 'form-filler.js', 'background.js']
      }
    })
  }
};

const SHARED_PACKAGE_FILES = [
  'manifest.json',
  'icon.png',
  'icons/icon-16.png',
  'icons/icon-48.png',
  'icons/icon-128.png',
  'index.html',
  'browser-api.js',
  'background.js',
  'form-filler.js',
  'i18n.js',
  'popup.js',
  'styles.css'
] as const;

export function packageFilesForTarget(target: ExtensionTarget): readonly string[] {
  return target === 'chrome'
    ? [...SHARED_PACKAGE_FILES, 'service-worker.js']
    : SHARED_PACKAGE_FILES;
}

export function isExtensionTarget(value: string): value is ExtensionTarget {
  return (EXTENSION_TARGETS as readonly string[]).includes(value);
}

export function resolveTargets(args: readonly string[]): readonly ExtensionTarget[] {
  const values = args.filter((argument) => argument !== '--');
  if (values.length === 0) return EXTENSION_TARGETS;

  return values.map((value) => {
    if (!isExtensionTarget(value)) {
      throw new Error(
        `Unknown target "${value}". Expected one of: ${EXTENSION_TARGETS.join(', ')}`
      );
    }
    return value;
  });
}
