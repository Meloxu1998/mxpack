# MXPACKPRO site v3

This directory is the maintainable source for the MXPACKPRO static site.

## Build

```powershell
node build.mjs
```

The generated site is written to `dist/`. Production files are published from
`../mxpack_website_with_section_images/`.

## Quality checks

```powershell
node qa.mjs
```

To verify the production directory:

```powershell
node qa.mjs ../mxpack_website_with_section_images
```

The check covers page metadata, JSON-LD, local links, images, and heading
structure. Visual checks should still be run at desktop and mobile sizes before
publishing.

## Editing rules

- Shared content, products, navigation, and contact details live in `src/data.mjs`.
- Shared layouts and page templates live in `build.mjs`.
- Shared visual rules live in `src/styles.css`.
- Shared browser behavior and analytics events live in `src/site.js`.
- Do not edit generated production pages without applying the same change here.
