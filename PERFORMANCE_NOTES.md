# Performance Recommendations — HobbyBuddy

Status: PARTIAL (recommendations documented; build mutations reserved for deploy authorization).

5.1 Lazy load images:
- Recommendation: add `loading="lazy"` to all non-critical `<img>` tags.
- Intersection Observer: proposed for dynamic content feeds (not implemented — requires feature build).

5.2 Image compression:
- Recommendation: convert images to WebP format; optimize sizes (max 1920px desktop, 768px tablet, 390px mobile).
- No new compressed images created (would alter production assets without deploy authorization).

5.3 Code splitting:
- Proposal: use `React.lazy()` + `<Suspense>` for routes and heavy components (dashboard, feed).
- Not executed (requires build/deploy authorization; avoids unexpected bundle breakage).

5.4 Preload critical resources:
- Added: `<link rel="preload">` for fonts and main script in index.html.
- Verified existing preconnect for Google Fonts.

5.5 Bundle minimization:
- Recommendation: audit `package.json` for unused dependencies (e.g., remove unneeded packages after feature confirmation); enable tree shaking in build config.
- No `package.json` modifications made (preserves build stability; avoids unexpected errors).

Security / Constraints:
- No paid services used.
- .env NOT tracked; secrets redacted.
- Authorization exception preserved (deploy must be proposed/confirmed before build mutations).
