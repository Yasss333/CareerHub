# Landing Page Integration TODO

## Follow-up: module CTA hover visibility
- [x] Keep the Explore Modules button visibly distinct on hover

Implementation note: Added a violet-to-teal gradient with a brighter hover state to preserve contrast over the dark landing background. Web production build passes.

## Scope
Integrate the committed CareerHub landing prototype into the main `apps/web` application.

## Implementation
- [x] Replace the existing `/landing` page with the prototype design and shared app components
- [x] Make `/` the public landing page while retaining the authenticated dashboard for signed-in users
- [x] Connect landing calls to the existing login and registration routes
- [x] Add landing-only styles and metadata without changing the shared app theme
- [x] Verify TypeScript and production build
- [x] Remove academic and campus-specific branding and project credits

## Custom brand and developer credit
- [x] Replace CH initials with one custom SVG path-and-arrow mark across active branding surfaces and favicon.
- [x] Add a landing-footer developer credit linking to https://github.com/Yasss333.
- [x] Verify desktop/mobile rendering, asset loading and frontend build.

Design: reuse CareerHub violet with a small teal route, clean silhouette, no motion, readable at favicon size. Keep existing layout and typography.

Verified at 320, 390, 768 and 1440 px: landing, login, registration and dashboard branding; SVG and favicon load; GitHub credit has the exact URL and safe new-tab attributes; no browser runtime exceptions. TypeScript and production build pass.
