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
