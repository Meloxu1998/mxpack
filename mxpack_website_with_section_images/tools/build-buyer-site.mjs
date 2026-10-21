import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
for (const script of ['build-supplier-products.mjs', 'update-inquiry-integration.mjs', 'update-buyer-journey.mjs', 'update-site-shell.mjs', 'build-site-style.cjs', 'validate-seo.mjs']) {
  const result = spawnSync(process.execPath, [`tools/${script}`], {cwd:root,stdio:'inherit',env:process.env});
  if (result.status !== 0) process.exit(result.status || 1);
}
