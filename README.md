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

* `/index.html`: The primary landing page and global entry point.
* `/mobile-jkn.html`: UI/UX case study for the Mobile JKN redesign.
* `/linkaja-competition.html`: UX Strategy case study for MIA 2025 ft. LinkAja.
* `/rucas.html`: Web Design & E-Commerce concept for Rucas.co.
* `/terebistrobar.html` & `/purirestocafe.html`: Front-End engineering showcases.
* `/poster*.html`: Graphic design and creative campaign galleries.
* `/css/style.css`: Global design tokens, layout system, and utilities.
* `/css/portfolio.css`: Project-specific components and case study styling.
* `/js/script.js`: Centralized interaction logic and modal state management.
* `/js/mobile-jkn-prototype.js`: Queue-simulation logic for the Mobile JKN case study.
* `/asset/`: Centralized storage for project assets, documentation (PDFs), and optimized media.
* `/tools/verify.js`: Zero-dependency integrity checks (see below).

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

## Deployment

This portfolio is automatically deployed via GitHub Actions. Any changes pushed to the main
branch are subject to an automated build and deployment process to GitHub Pages.

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
