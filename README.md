# Personal Portfolio 2.0 - Firman Christian Purba

![Performance: Core Web Vitals Focused](https://img.shields.io/badge/Performance-Core%20Web%20Vitals%20Optimized-blue.svg)
![Tech Stack: Vanilla](https://img.shields.io/badge/Tech-Vanilla%20HTML%2FJS%2FCSS-blue.svg)
![Status: Production](https://img.shields.io/badge/Status-Production-success.svg)

## Overview

This repository contains the source code for my professional portfolio website (v2.0). The project is engineered to showcase my expertise in bridging **Information Systems**, **UI/UX Design**, and **Front-End Engineering**.

It serves as a comprehensive digital ecosystem highlighting academic projects, professional case studies, and technical competencies, built with a strict focus on system architecture, user experience, and web performance.

## Technical Architecture

The website is completely custom-built from the ground up without heavy JavaScript frameworks, demonstrating a deep understanding of native web capabilities and Core Web Vitals optimization:

* **Markup (HTML5):**
  * Strict Semantic HTML for superior SEO and accessibility.
  * Utilization of the native HTML5 `<dialog>` API for accessible, focus-trapped modals.
  * Implementation of `<template>` tags for efficient, zero-duplication DOM rendering.
* **Styling (CSS3):**
  * Fluid typography and fluid layouts utilizing `clamp()`, `min()`, and `max()`.
  * Modern CSS Grid (Auto-fit/Bento Grid patterns) and Flexbox architecture.
  * Comprehensive CSS Custom Properties (Design Tokens) for theming and dark mode.
* **Scripting (Vanilla JS):**
  * Modular IIFE (Immediately Invoked Function Expression) architecture.
  * High-performance `IntersectionObserver` for scroll-spy and scroll-reveal animations.
  * Strict event delegation to minimize memory footprint.
* **Deployment:** GitHub Pages for continuous integration and hosting.

## Key Features & Engineering Highlights

* **Core Web Vitals Optimized:** Explicit dimensions (`width`/`height`) and `loading="lazy"` attributes on media to strictly prevent Cumulative Layout Shift (CLS) and optimize Largest Contentful Paint (LCP).
* **Accessibility-First (A11y):** Built with `prefers-reduced-motion` support, visible keyboard focus states, proper ARIA labeling, and native browser focus-trapping.
* **Progressive Disclosure:** Case studies utilize a seamless modal/lightbox architecture to deliver deep project context without forcing page reloads.
* **Technical SEO:** Fully structured `<head>` metadata, Open Graph integration, and semantic landmarks.

## Project Structure

The project is organized with a clear separation of concerns to maintain long-term scalability:

Pages (each is a standalone, independently deployable document):

* `/index.html`: The primary landing page and global entry point.
* `/mobile-jkn.html`: UI/UX case study for the Mobile JKN redesign, including an
  interactive queue-number simulation.
* `/linkaja-competition.html`: UX Strategy case study for MIA 2025 ft. LinkAja.
* `/inDrive.html`: Product/UX case study for the inDrive rider app.
* `/rucas.html`: Web Design & E-Commerce concept for Rucas.co.
* `/terebistrobar.html` & `/purirestocafe.html`: Front-End engineering showcases.
* `/wisata-app-flutter.html`: Flutter travel app case study.
* `/poster1.html` – `/poster3.html`: Graphic design and creative campaign galleries.
* `/404.html`: Not-found page. Skipped by the sitemap, exempt from the shared
  shell check, and excluded from the "every public page is listed" rule.

Shared code, tooling and site files:

* `/css/style.css`: Global design tokens, layout system, and utilities.
* `/css/portfolio.css`: Project-specific components and case study styling.
* `/css/mobile-jkn-prototype.css`: Styling for the Mobile JKN AI panel (intro, milestone progress bars, tags).
* `/js/script.js`: Theme, navigation, scroll-spy, tabs, and shared dialog state.
* `/css/mobile-jkn-prototype.css` is retained for the AI panel; the interactive
  queue simulation it was written for has been removed.
* `/asset/`: Centralized storage for project assets, documentation (PDFs), and optimized media.
* `/tools/verify.js`: Zero-dependency integrity checks (see below).
* `/favicon.svg`, `/robots.txt`, `/sitemap.xml`: Standard site metadata.
* `/.github/workflows/deploy.yml`: Verification and GitHub Pages deployment.

The site is intentionally build-free: every page is a plain, hand-maintained HTML file, so
the repository *is* the deployed artifact and there is no toolchain to keep in sync.

## Local Development

Open `index.html` directly, or serve the folder (Live Server is preconfigured on port 5502
in `.vscode/settings.json`).

```bash
npm run verify
```

`verify` performs static integrity checks with no dependencies:

| Group | Checks |
| --- | --- |
| Encoding | valid UTF-8, no BOM, no non-breaking spaces, no tabs, no trailing whitespace, no mixed line endings |
| Links | every local `href`/`src` resolves, every `#anchor` has a matching `id` |
| Identifiers | no duplicate `id` within a page |
| Markup | `lang`, `title`, description, canonical, a single `<h1>`, image `alt`, `label[for]` targets |
| Shell | the shared `<head>`, header/nav and footer invariants are present on every page |
| Sitemap | every public page is listed, `lastmod` values are valid and not stale |

`verify` is static analysis only. It cannot tell you that a click handler still
behaves, so the interaction paths below still need a human pass.

## Manual QA

Run through this before publishing a change to `script.js` or the shared shell.
Serve over Live Server rather than `file://` so asset and PDF links behave as
they do in production.

**Mobile menu (viewport ≤768px)**

* On load, `Tab` skips the closed off-canvas links (they must be `inert`) and
  reaches the theme toggle instead.
* Opening the menu moves focus to the first link, and `Tab` / `Shift+Tab` cycle
  within the menu only, never into the page behind the overlay.
* `Esc`, the close button, and a nav link each close it, returning focus to the
  toggle. Resizing to a wider viewport while it is open collapses it inline and
  releases the scroll lock.
* `Ctrl+F` finds every nav label. This is what the old non-breaking-space
  indentation silently broke on one page.

**Study modal and lightbox (any case-study page)**

* A `.open-detail` trigger opens the modal with the close button focused and the
  background unable to scroll; `Esc`, the ×, and a backdrop click all dismiss it.
* Open the lightbox from *inside* the study modal, then close only the lightbox:
  the page must stay scroll-locked. This is the reference-counted scroll lock, and
  the most likely thing to regress.
* Clicking an image, or focusing it and pressing `Enter` / `Space`, shows the full
  uncropped image in the lightbox.

**Tabs (`mobile-jkn.html`)**

* Only one panel is visible at a time, and the active tab carries `is-active`,
  `aria-selected="true"` and `tabindex="0"` while the other is `tabindex="-1"`.
* `←` and `→` move between tabs, wrap around at both ends, and move focus with
  them.
* Switching to a panel reveals its scroll-reveal blocks rather than leaving them
  stuck at opacity 0.
* The tab module lives in `script.js` and no-ops on pages without a tablist, so
  adding a tablist to any other page works with no extra wiring.

**Any page**

* The theme toggle's `aria-label` tracks the active theme and the choice survives
  reload without a flash of the wrong theme.
* Scroll-spy and anchor links on the landing page land correctly.
* The contact form is `novalidate` with `action="#"` by design: it has no backend
  and submits nowhere.
* From 320px to 1920px there is no horizontal scroll and native modals fit.

## Deployment

This portfolio is deployed to GitHub Pages by GitHub Actions. There is no build
step — the checked-in HTML is what gets published — so `main` pushes are gated
only by verification, not by compilation.

The workflow runs `npm run verify` before publishing, so a broken link, a duplicated `id` or
a page that drifts from the shared shell blocks the deploy instead of shipping. It then
stages only the publishable files (`*.html`, `css/`, `js/`, `asset/`, `favicon.svg`,
`robots.txt`, `sitemap.xml`) into `_site/`, so tooling and repository metadata are never
published.

## Contact and Professional Links

I am currently open to new opportunities, collaborations, or simply a chat about design, technology, and systems. Feel free to reach out via:

* **Email:** <firmanchristianp@gmail.com>
* **LinkedIn:** <https://www.linkedin.com/in/firmanchristianpurba/>
* **GitHub:** <https://github.com/firmanchrstn>

---
*Systematic Design. Flawless Code.*
Copyright © 2026 Firman Christian Purba. All rights reserved.
