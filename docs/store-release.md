# Browser release automation

The `Verify` workflow validates commit messages, tests FormFully, validates the Firefox build, compiles the generated Safari extension project with Xcode, and creates separate checksummed ZIPs for Chrome, Firefox, and Safari.

On a successful `main` push, its release job creates a GitHub Release with all three ZIPs and their SHA-256 checksum files. The first release uses the version already in `apps/extension/manifest.base.json`. Later releases follow conventional commits: `fix:` makes a patch release, `feat:` makes a minor release, and `BREAKING CHANGE:` makes a major release.

The separate `Publish browser extension` workflow submits the Chromium ZIP to Chrome Web Store and Microsoft Edge Add-ons. A manual run can retry Chrome, Edge, or both independently.

## One-time store setup

Both stores require an initial manual listing before their update APIs can be used.

### Chrome Web Store

1. Publish FormFully manually once and complete its Store listing and Privacy tabs.
2. Enable two-step verification on the publisher account.
3. In a Google Cloud project, enable **Chrome Web Store API**.
4. Configure an OAuth consent screen and create a **Web application** OAuth client.
5. Add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
6. In OAuth Playground, use that client and authorize the `https://www.googleapis.com/auth/chromewebstore` scope with the Google account that owns FormFully.
7. Exchange the authorization code and retain the refresh token.
8. Copy the publisher ID from the Chrome Web Store Developer Dashboard account settings.

For durable CI, do not leave an external OAuth app in **Testing**: Google expires its refresh tokens after seven days when non-profile scopes are used. Configure the OAuth audience/publishing status appropriately for production before generating the stored refresh token.

Official setup guide: <https://developer.chrome.com/docs/webstore/using-api>

### Microsoft Edge Add-ons

1. Publish FormFully manually once in Partner Center.
2. Open **Microsoft Edge > Publish API**.
3. Enable the new API-key experience and create API credentials.
4. Retain the generated client ID and API key.
5. Open FormFully in Partner Center and copy its Product ID GUID.

This workflow uses the supported v1.1 API-key flow. Do not configure the retired v1 client-secret/access-token flow.

Official setup guide: <https://learn.microsoft.com/en-us/microsoft-edge/extensions/update/api/using-addons-api>

## GitHub configuration

Create a GitHub Environment named `browser-store-production`. Put the following values in that environment's **Secrets**:

| Secret | Source |
| --- | --- |
| `CHROME_CLIENT_ID` | Google Cloud OAuth client |
| `CHROME_CLIENT_SECRET` | Google Cloud OAuth client |
| `CHROME_REFRESH_TOKEN` | OAuth Playground |
| `CHROME_PUBLISHER_ID` | Chrome Developer Dashboard account settings |
| `CHROME_EXTENSION_ID` | Existing Chrome Web Store item ID |
| `EDGE_CLIENT_ID` | Partner Center Publish API |
| `EDGE_API_KEY` | Partner Center Publish API |
| `EDGE_PRODUCT_ID` | Existing Edge product GUID |

Optionally add an environment **Variable** named `EDGE_CERTIFICATION_NOTES`. It is sent as the certification note; if omitted, the workflow uses a short version-specific automation note.

For stronger release governance, add required reviewers to the `browser-store-production` environment. The package/test job can finish without approval, but GitHub will not expose store credentials or start either publication job until the deployment is approved.

Edge API keys expire. Record the expiry date and rotate `EDGE_API_KEY` before it expires.

## Releasing a version

1. Commit to `main` using a conventional message, for example `fix: correct profile detection` or `feat: support saved templates`.
2. Wait for **Verify** to succeed. If the commit warrants a release, its `Create a versioned GitHub Release` job updates the extension version, creates a matching `v<version>` tag, and attaches the three ZIPs to the GitHub Release.
3. The first run bootstraps the existing manifest version, so no manual version bump is required.

To submit that release to the browser stores manually, open **Actions > Publish browser extension > Run workflow** and select the store. Alternatively, push a matching tag yourself:

   ```bash
   git tag v2.3.0
   git push origin v2.3.0
   ```

The store workflow rejects a tag whose value does not exactly equal `v` plus the manifest version. Successful Chrome and Edge API submission means the update entered each store's review process; actual public availability still depends on store approval.

If only one store needs a retry, open **Actions > Publish browser extension > Run workflow** and select `chrome` or `edge`.

## Local package verification

Run:

```bash
pnpm install --frozen-lockfile
pnpm check
VERSION="$(node -p "require('./apps/extension/manifest.base.json').version")"
unzip -l "artifacts/formfully-firefox-$VERSION.zip"
```

The ZIPs intentionally contain only runtime files. Shared entries include:

- `manifest.json`
- `icon.png`
- correctly sized manifest icons under `icons/`
- `index.html`
- `browser-api.js`
- `background.js`
- `form-filler.js`
- `i18n.js`
- `popup.js`
- `styles.css`

The Chromium package additionally includes its small `service-worker.js` loader. Tests, TypeScript source, source CSS, documentation, dependency folders, landing-page files, and repository metadata are excluded from every store package.

The packager writes `artifacts/formfully-<browser>-<version>.zip.sha256` beside every archive. Store jobs verify the Chromium checksum after downloading the immutable workflow artifact.

## Firefox and Safari distribution

CI produces submission-ready web-extension ZIPs for both browsers. Firefox submission/signing through AMO and Safari App Store signing remain manual because those stores require their own developer accounts and signing identities. The macOS CI job also uploads a self-contained generated Xcode project so the Safari package can be signed without rerunning the converter.

## Safety behavior

- Chrome uses the current Web Store API v2 and blocks submission when the API returns validation warnings.
- Chrome is configured for publication after review approval, using the listing's existing visibility.
- Edge waits for both asynchronous operations: package processing and submission creation.
- Mutating upload/publish requests are not blindly retried after uncertain server failures.
- Chrome and Edge run as independent jobs, so an outage in one store does not cancel the other.
- The same immutable ZIP is submitted to both stores.
- The workflow never changes store listing metadata; Edge's update API does not support metadata updates.
