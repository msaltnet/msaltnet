# Uniform Project Card Height Design

## Goal

Make every project card in the home sidebar the same height while preserving the current compact editorial layout.

## Design

- Replace the desktop card `min-height: 78px` rule with `height: 78px`.
- Replace the mobile card `min-height: 88px` rule with `height: 88px`.
- Keep the existing one-line truncation for titles and descriptions so content cannot expand a card.
- Keep image widths, spacing, colors, hover behavior, markup, and project data unchanged.

## Verification

- Add a Playwright assertion that all six cards have one identical height at the desktop viewport.
- Add the same assertion at the mobile viewport.
- Rebuild the Jekyll site and run the complete Python and Playwright test suites.
- Review desktop and mobile screenshots for clipping, overlap, and image alignment.
