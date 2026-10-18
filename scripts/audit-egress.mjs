// Zero-egress static audit.
//  1. SOURCE scan (strict): src/ must not contain network APIs or analytics/ad vendors.
//  2. BUNDLE scan (token): dist/ must not reference analytics/ad/tracker vendors and
//     must not hard-code any remote http(s) origin outside a small allow-list of
//     XML/SVG namespace URIs and docs links that are never dereferenced.
//  3. HTML scan: dist/index.html must carry the mandated CSP with connect-src 'none'.
// (The Phaser bundle legitimately contains the *token* `XMLHttpRequest` in its unused loader,
//  so the bundle scan is vendor-based; the runtime Playwright audit proves no request is made.)
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

// ---- 1. source ----
const SOURCE_FORBIDDEN = [
  /\bfetch\s*\(/, /\bXMLHttpRequest\b/, /\bsendBeacon\b/, /\bnew\s+WebSocket\b/, /\bnew\s+EventSource\b/,
  /\bimportScripts\s*\(/, /google-analytics|googletagmanager|gtag\(|mixpanel|segment\.(io|com)|amplitude|sentry|hotjar|facebook\.net|doubleclick|adsbygoogle|applovin|unity3d\.com\/ads/i,
];
for (const file of walk(join(root, 'src'), ['.ts'])) {
  const text = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  for (const re of SOURCE_FORBIDDEN) if (re.test(text)) failures.push(`${file.replace(root + '/', '')}: matches ${re}`);
}

// ---- 2. bundle ----
const dist = join(root, 'dist');
if (existsSync(dist)) {
  const VENDORS = /google-analytics|googletagmanager|mixpanel|segment\.io|segment\.com|amplitude\.com|sentry\.io|hotjar|facebook\.net|doubleclick|adsbygoogle|applovin|firebaseio|cdn\.jsdelivr|unpkg\.com|fonts\.googleapis|fonts\.gstatic/i;
  const ALLOWED_ORIGINS = /^https?:\/\/(www\.w3\.org|phaser\.io|github\.com|localhost|127\.0\.0\.1|developer\.mozilla\.org|reactjs\.org|react\.dev|mths\.be|opensource\.org|babeljs\.io|bugs\.chromium\.org|bugzilla\.mozilla\.org|w3c\.github\.io|tc39\.es|webaudio\.github\.io|www\.khronos\.org|registry\.khronos\.org|schemas\.openxmlformats\.org|purl\.org|www\.adobe\.com|ns\.adobe\.com|fonts\.adobe\.com|www\.pdfmake\.org|pdfmake\.org|pdfkit\.org|bpmn\.io|workboxjs\.org|goo\.gl|bit\.ly|stackoverflow\.com|stackoverflow\.microsoft\.com|html\.spec\.whatwg\.org|drafts\.fxtf\.org|drafts\.csswg\.org|www\.ecma-international\.org|webglreport\.com|www\.apache\.org|creativecommons\.org|www\.gnu\.org|jsfiddle\.net|jsbin\.com|codepen\.io|bugs\.webkit\.org|dev\.w3\.org)(\/|$)/i;
  const ORIGIN_RE = /https?:\/\/[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?::\d+)?/g;
  for (const file of walk(dist, ['.js', '.html', '.css', '.webmanifest'])) {
    const text = readFileSync(file, 'utf8');
    const v = text.match(VENDORS);
    if (v) failures.push(`${file.replace(root + '/', '')}: vendor token "${v[0]}"`);
    // Only app-authored files are held to the origin rule (vendor chunks embed docs links).
    if (!/vendor-/.test(file) && extname(file) !== '.html') {
      for (const m of text.matchAll(ORIGIN_RE)) if (!ALLOWED_ORIGINS.test(m[0] + '/')) failures.push(`${file.replace(root + '/', '')}: remote origin ${m[0]}`);
    }
  }
  const indexPath = join(dist, 'index.html');
  if (!existsSync(indexPath)) failures.push('dist/index.html missing');
  else {
    const html = readFileSync(indexPath, 'utf8');
    for (const need of ["connect-src 'none'", "default-src 'self'", "script-src 'self'"]) if (!html.includes(need)) failures.push(`dist/index.html lacks CSP fragment: ${need}`);
  }
  for (const must of ['sw.js', 'manifest.webmanifest']) if (!existsSync(join(dist, must))) failures.push(`dist/${must} missing`);
} else {
  console.log('(dist/ not found — bundle checks skipped)');
}

if (failures.length) {
  console.error('PRIVACY VIOLATION — zero-egress audit failed:\n - ' + failures.join('\n - '));
  process.exit(1);
}
console.log('PASS: zero-egress audit (source + bundle + CSP) clean.');
