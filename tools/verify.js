#!/usr/bin/env node
/**
 * PORTFOLIO VERIFICATION
 * Zero-dependency static checks for the hand-written static site.
 *
 *   node tools/verify.js
 *
 * Errors fail the run (and the deploy pipeline); warnings are advisory.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://firmanchrstn.github.io/my-portfolio';
const TEXT_EXT = /\.(html|css|js|json|xml|md|yml|svg)$/i;

/** Pages that intentionally ship without the site shell (header/nav/footer). */
const SHELL_EXEMPT = new Set(['404.html']);

const errors = [];
const warnings = [];

const fail = (scope, message) => errors.push(`${scope}: ${message}`);
const warn = (scope, message) => warnings.push(`${scope}: ${message}`);

const listFiles = () => fs.readdirSync(ROOT).filter(n => n.endsWith('.html')).sort();
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

/* ------------------------------------------------------------------ *
 * 1. ENCODING & WHITESPACE
 * ------------------------------------------------------------------ */
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
});

const checkEncoding = () => {
    for (const full of walk(ROOT)) {
        const file = path.relative(ROOT, full).split(path.sep).join('/');
        if (!TEXT_EXT.test(file)) continue;

        const buf = fs.readFileSync(full);
        const text = buf.toString('utf8');

        if (Buffer.compare(Buffer.from(text, 'utf8'), buf) !== 0) {
            fail(file, 'is not valid UTF-8');
            continue;
        }
        if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
            fail(file, 'starts with a UTF-8 BOM');
        }
        if (text.includes('\u00a0')) {
            fail(file, 'contains non-breaking spaces (breaks search, copy and grep)');
        }
        if (text.includes('\t')) {
            fail(file, 'contains tab characters');
        }
        if (/[ \t]+\r?\n/.test(text)) {
            fail(file, 'has trailing whitespace');
        }
        const crlf = (text.match(/\r\n/g) || []).length;
        const lf = (text.match(/\n/g) || []).length;
        if (crlf > 0 && crlf !== lf) {
            fail(file, `mixes line endings (${crlf} CRLF / ${lf} LF)`);
        }
    }
};

/* ------------------------------------------------------------------ *
 * 2. LINKS & ASSETS
 * ------------------------------------------------------------------ */
const idsIn = (file) => new Set([...read(file).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

const checkLinks = () => {
    const pages = listFiles();
    const idCache = new Map();
    const idsFor = (file) => {
        if (!idCache.has(file)) idCache.set(file, idsIn(file));
        return idCache.get(file);
    };

    for (const file of pages) {
        for (const match of read(file).matchAll(/(?:src|href)="([^"]+)"/g)) {
            const url = match[1];
            if (/^(https?:|mailto:|tel:|data:|javascript:|#!)/i.test(url)) continue;

            const [rawTarget, hash] = url.split('#');
            const target = decodeURIComponent(rawTarget || '');
            const owner = target ? path.basename(target) : file;

            if (target && !fs.existsSync(path.join(ROOT, target))) {
                fail(file, `links to missing file "${url}"`);
                continue;
            }
            if (target && !/\.html?$/i.test(owner)) continue;
            if (!hash) continue;
            if (target && !pages.includes(owner)) continue;

            if (!idsFor(owner).has(hash)) {
                fail(file, `anchor "#${hash}" has no target in ${owner}`);
            }
        }
    }
};

/* ------------------------------------------------------------------ *
 * 3. IDENTIFIERS
 * ------------------------------------------------------------------ */
const checkIds = () => {
    for (const file of listFiles()) {
        const seen = new Map();
        for (const match of read(file).matchAll(/\sid="([^"]+)"/g)) {
            const id = match[1];
            seen.set(id, (seen.get(id) || 0) + 1);
        }
        for (const [id, count] of seen) {
            if (count > 1) fail(file, `duplicate id "${id}" (${count}×)`);
        }
    }
};

/* ------------------------------------------------------------------ *
 * 4. MARKUP & ACCESSIBILITY
 * ------------------------------------------------------------------ */
const checkMarkup = () => {
    for (const file of listFiles()) {
        const text = read(file);
        const ids = idsIn(file);

        if (!/<html[^>]+lang="[a-z-]+"/i.test(text)) fail(file, 'missing <html lang>');
        if (!/<title>[^<]+<\/title>/.test(text)) fail(file, 'missing <title>');
        if (!/<meta name="description"[^>]+content="[^"]+"/.test(text)) fail(file, 'missing meta description');
        if (!/<link rel="canonical"/.test(text)) fail(file, 'missing canonical URL');

        const h1 = (text.match(/<h1[\s>]/g) || []).length;
        if (h1 !== 1) fail(file, `expected exactly one <h1>, found ${h1}`);

        // Images without a src are populated at runtime (the shared lightbox), so
        // only statically sourced images can be checked for dimensions.
        const imgs = [...text.matchAll(/<img\b[^>]*>/g)]
            .map((m) => m[0])
            .filter((tag) => /\bsrc=/.test(tag));
        imgs.forEach((tag, i) => {
            if (!/\balt=/.test(tag)) fail(file, `image #${i + 1} has no alt attribute`);
            if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag)) {
                warn(file, `image #${i + 1} has no width/height (layout-shift hint)`);
            }
            if (!/\bdecoding=/.test(tag)) warn(file, `image #${i + 1} has no decoding attribute`);
        });

        for (const match of text.matchAll(/<label[^>]*\bfor="([^"]+)"/g)) {
            if (!ids.has(match[1])) fail(file, `<label for="${match[1]}"> has no matching control`);
        }

        if (!SHELL_EXEMPT.has(file) && !/class="skip-to-content"/.test(text)) {
            fail(file, 'missing skip link');
        }
        if (!ids.has('main-content')) fail(file, 'missing #main-content landmark');
    }
};

/* ------------------------------------------------------------------ *
 * 5. SHARED SHELL CONSISTENCY
 * ------------------------------------------------------------------ */
const HEAD_INVARIANTS = [
    ['viewport meta', /<meta name="viewport" content="width=device-width, initial-scale=1\.0">/],
    ['light theme-color', /<meta name="theme-color" content="#fafafa" media="\(prefers-color-scheme: light\)">/],
    ['dark theme-color', /<meta name="theme-color" content="#09090b" media="\(prefers-color-scheme: dark\)">/],
    ['favicon', /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/],
    ['apple-touch-icon', /<link rel="apple-touch-icon" href="asset\/pp\.jpeg">/],
    ['preconnect to fonts.googleapis.com', /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/],
    ['preconnect to fonts.gstatic.com', /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>/],
    ['Inter webfont', /family=Inter:wght@300;400;500;600;700;800/],
    ['Material Symbols webfont', /family=Material\+Symbols\+Rounded/],
    ['design-system stylesheet', /href="(?:\.\/)?css\/style\.css"/],
    ['pre-paint theme bootstrap', /document\.documentElement\.classList\.remove\('no-js'\)/],
    ['deferred site script', /<script src="(?:\.\/)?js\/script\.js" defer><\/script>/],
    ['author meta', /<meta name="author" content="Firman Christian Purba">/],
];

const SHELL_INVARIANTS = [
    ['header', /<header class="header" id="header" role="banner">/],
    ['navigation landmark', /<nav class="nav container" aria-label="Main Navigation">/],
    ['nav menu', /<div class="nav__menu" id="nav-menu">/],
    ['nav close button', /<button class="nav__close" id="nav-close"/],
    ['mobile nav toggle', /<button class="nav__toggle" id="nav-toggle"/],
    ['theme toggle', /<button class="theme-toggle" id="theme-toggle"/],
    ['footer', /<footer class="footer" role="contentinfo">/],
    ['footer case-study nav', /<nav class="footer__links" aria-label="Case studies">/],
];

const checkShell = () => {
    const year = String(new Date().getFullYear());
    for (const file of listFiles()) {
        const text = read(file);
        for (const [label, pattern] of HEAD_INVARIANTS) {
            if (!pattern.test(text)) fail(file, `head is missing the shared ${label}`);
        }
        if (SHELL_EXEMPT.has(file)) continue;

        for (const [label, pattern] of SHELL_INVARIANTS) {
            if (!pattern.test(text)) fail(file, `shell is missing the shared ${label}`);
        }

        const copy = text.match(/&copy;\s*(\d{4})/);
        if (!copy) fail(file, 'footer has no copyright line');
        else if (copy[1] !== year) warn(file, `copyright year is ${copy[1]}, current year is ${year}`);

        if (file !== 'index.html') {
            const links = [...text.matchAll(/<nav class="footer__links"[^>]*>([\s\S]*?)<\/nav>/g)];
            const targets = links[0] ? [...links[0][1].matchAll(/href="([^"]+)"/g)].map((m) => m[1]) : [];
            if (targets[0] !== 'index.html') fail(file, 'footer should link back to index.html first');
            if (targets[1] !== 'index.html#work') fail(file, 'footer should link to All Work second');
        }
    }
};

/* ------------------------------------------------------------------ *
 * 6. SITEMAP
 * ------------------------------------------------------------------ */
const checkSitemap = () => {
    const sitemapPath = path.join(ROOT, 'sitemap.xml');
    if (!fs.existsSync(sitemapPath)) {
        fail('sitemap.xml', 'is missing');
        return;
    }
    const xml = read('sitemap.xml');
    const entries = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)];

    if (!entries.length) {
        fail('sitemap.xml', 'has no <loc>/<lastmod> pairs');
        return;
    }

    // A sitemap may list each URL exactly once. A duplicate is invalid XML per
    // the protocol, and because the pair scan above stores into a Map it would
    // also silently shadow a page from the staleness check.
    const seenLocs = new Set();
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        if (seenLocs.has(loc)) fail('sitemap.xml', `lists "${loc}" more than once`);
        seenLocs.add(loc);
    }

    // The pair regex only matches a <lastmod> that immediately follows its <loc>,
    // so a <url> block missing one would be skipped rather than reported.
    const urlBlocks = (xml.match(/<url>/g) || []).length;
    if (urlBlocks !== entries.length) {
        fail('sitemap.xml', `has ${urlBlocks} <url> block(s) but ${entries.length} <loc>/<lastmod> pair(s)`);
    }

    const listed = new Map();
    for (const [, loc, lastmod] of entries) {
        const rel = loc.replace(BASE_URL, '');
        const name = rel === '' || rel === '/' ? 'index.html' : path.basename(rel);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
            fail('sitemap.xml', `lastmod "${lastmod}" is not an ISO date`);
        }
        if (!loc.startsWith(BASE_URL)) {
            fail('sitemap.xml', `URL "${loc}" is outside ${BASE_URL}`);
        }
        listed.set(name, lastmod);
    }

    const publicPages = listFiles().filter((f) => !SHELL_EXEMPT.has(f));
    for (const file of publicPages) {
        if (!listed.has(file)) {
            fail('sitemap.xml', `does not list ${file}`);
            continue;
        }
        const mtime = fs.statSync(path.join(ROOT, file)).mtime;
        const stamp = `${mtime.getFullYear()}-${String(mtime.getMonth() + 1).padStart(2, '0')}-${String(mtime.getDate()).padStart(2, '0')}`;
        if (stamp > listed.get(file)) {
            warn('sitemap.xml', `lastmod for ${file} (${listed.get(file)}) is older than the file (${stamp})`);
        }
    }
    for (const file of listed.keys()) {
        if (!publicPages.includes(file)) fail('sitemap.xml', `lists ${file}, which is not a public page`);
    }
};

/* ------------------------------------------------------------------ *
 * RUN
 * ------------------------------------------------------------------ */
checkEncoding();
checkLinks();
checkIds();
checkMarkup();
checkShell();
checkSitemap();

for (const message of warnings) console.log(`  warn  ${message}`);
for (const message of errors) console.log(`  FAIL  ${message}`);

const pages = listFiles().length;
if (errors.length) {
    console.log(`\nverify: ${errors.length} error(s), ${warnings.length} warning(s) across ${pages} pages`);
    process.exit(1);
}
console.log(`\nverify: OK - ${pages} pages, ${warnings.length} warning(s)`);
