// Self-hosts the runtime of the DEM2 in-browser Streamlit dashboard (stlite + Pyodide + Python wheels)
// in public/projects/marketing-roi-optimizer/dashboard/vendor/ (gitignored), so visitors never hit a CDN or PyPI.
// Runs before `astro dev` / `astro build`. Every downloaded file is checked against a pinned SHA-256; files
// already present with the right hash are skipped. To add a Python package: add its lock name to PACKAGES
// (hash comes from the lock file) or a pure-Python wheel to PYPI (with its hash, version and import names).
// The PyPI wheels are added to a patched pyodide-lock.json, so micropip resolves everything locally.
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const vendor = join(root, 'public/projects/marketing-roi-optimizer/dashboard/vendor');
const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.29.3/full/'; // the version @stlite/browser 1.9.2 expects

const CORE = {
  'pyodide.mjs': '23213d27e9dacbda6f25f955fb38dabfc40ada082c04ee253047ea5dddcaa3b5',
  'pyodide.asm.js': '1263f02b5b26099b96112378156f242dd98b39a8201ba7765e5fe3d455c5ce91',
  'pyodide.asm.wasm': 'e2f4ee75b325e35eb31bfb8c613d4dd5098f5502c156a97847686875b5025480',
  'python_stdlib.zip': '4298b6ee445cb724c3973437da47789752b9e6ff4e26619026b283ec801fc46b',
  'pyodide-lock.upstream.json': '3256ffc76388de0e37f4b34d42ab484268d1afc675179ff97b2a5bb14f84ccac',
};
// Pyodide packages loaded by the dashboard (scikit-learn, altair, pandas + Streamlit's dependencies).
const PACKAGES = [
  'micropip', 'scikit-learn', 'scipy', 'numpy', 'libopenblas', 'joblib', 'threadpoolctl', 'pyodide-http',
  'altair', 'typing-extensions', 'jinja2', 'markupsafe', 'jsonschema', 'attrs', 'six', 'pyrsistent', 'referencing',
  'rpds-py', 'jsonschema-specifications', 'packaging', 'narwhals', 'fastparquet', 'cramjam', 'pandas',
  'python-dateutil', 'pytz', 'fsspec', 'anyio', 'ssl', 'libopenssl', 'sniffio', 'starlette', 'pillow',
];
// Streamlit dependencies that are not in the Pyodide distribution (pure-Python wheels from PyPI).
const PYPI = [
  { url: 'https://files.pythonhosted.org/packages/e4/04/d52c7016b04b6c5108f26691f9d33ec82a9b65d041f1a9c771137693d618/protobuf-7.36.2-py3-none-any.whl',
    sha256: 'bdb3a345d48db958e6ce1f18e508beb0cc981d64f24088427549c866cd039f1e', name: 'protobuf', version: '7.36.2', imports: ['google'] },
  { url: 'https://files.pythonhosted.org/packages/10/cb/f2ad4230dc2eb1a74edf38f1a38b9b52277f75bef262d8908e60d957e13c/blinker-1.9.0-py3-none-any.whl',
    sha256: 'ba0efaa9080b619ff2f3459d1d500c57bddea4a6b424b60a91141db6fd2f08bc', name: 'blinker', version: '1.9.0', imports: ['blinker'] },
  { url: 'https://files.pythonhosted.org/packages/04/96/92447566d16df59b2a776c0fb82dbc4d9e07cd95062562af01e408583fc4/itsdangerous-2.2.0-py3-none-any.whl',
    sha256: 'c6242fc49e35958c8b15141343aa660db5fc54d4f13a1db01a3f5891b98700ef', name: 'itsdangerous', version: '2.2.0', imports: ['itsdangerous'] },
  { url: 'https://files.pythonhosted.org/packages/e1/04/e8135ebd1ad02c56ec633277529b2602ff99ff634be76cdba5744cf554fd/python_multipart-0.0.32-py3-none-any.whl',
    sha256: 'ff6d3f776f16878c894e52e107296ffc890e913c611b1a4ec6c44e2821fe2e23', name: 'python-multipart', version: '0.0.32', imports: ['multipart', 'python_multipart'] },
];

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

async function fetchPinned(url, file, hash) {
  if (existsSync(file) && sha(readFileSync(file)) === hash) return false;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (sha(buf) !== hash) throw new Error(`${url}: SHA-256 mismatch`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buf);
  return true;
}

// 1. stlite (npm package), without source maps
const stlite = join(root, 'node_modules/@stlite/browser/build');
const stliteOut = join(vendor, 'stlite');
const version = JSON.parse(readFileSync(join(stlite, '../package.json'), 'utf8')).version;
const stamp = join(stliteOut, '.version');
if (!existsSync(stamp) || readFileSync(stamp, 'utf8') !== version) {
  rmSync(stliteOut, { recursive: true, force: true });
  cpSync(stlite, stliteOut, { recursive: true, filter: (src) => !src.endsWith('.map') });
  writeFileSync(stamp, version);
}

// 2. Pyodide core + packages (hashes from the pinned lock file)
let fetched = 0;
for (const [name, hash] of Object.entries(CORE)) {
  const remote = name.replace('.upstream', '');
  fetched += await fetchPinned(PYODIDE + remote, join(vendor, 'pyodide', name), hash);
}
const lockFile = JSON.parse(readFileSync(join(vendor, 'pyodide/pyodide-lock.upstream.json'), 'utf8'));
const lock = lockFile.packages;
const jobs = PACKAGES.map((name) => {
  const pkg = lock[name];
  if (!pkg) throw new Error(`${name} is not in pyodide-lock.json`);
  return fetchPinned(PYODIDE + pkg.file_name, join(vendor, 'pyodide', pkg.file_name), pkg.sha256);
});

// 3. PyPI wheels next to the Pyodide packages, registered in the lock file the page loads
for (const w of PYPI) {
  const file = w.url.split('/').pop();
  jobs.push(fetchPinned(w.url, join(vendor, 'pyodide', file), w.sha256));
  lock[w.name] = {
    name: w.name, version: w.version, file_name: file, sha256: w.sha256, imports: w.imports, depends: [],
    install_dir: 'site', package_type: 'package', unvendored_tests: false,
  };
}
fetched += (await Promise.all(jobs)).filter(Boolean).length;
writeFileSync(join(vendor, 'pyodide/pyodide-lock.json'), JSON.stringify(lockFile));
console.log(`[dem2-vendor] stlite ${version}, Pyodide + ${PACKAGES.length} packages, ${PYPI.length} PyPI wheels (${fetched} downloaded)`);
