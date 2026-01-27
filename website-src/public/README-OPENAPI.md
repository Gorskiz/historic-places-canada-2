# OpenAPI Specification Files

This folder contains the OpenAPI specification files for the API documentation:

- `openapi.yaml` - Source specification (human-readable, editable)
- `openapi.json` - JSON version (used by ReDoc for rendering)

## Updating the Specification

1. Edit `openapi.yaml` with your changes
2. Regenerate the JSON version:
   ```bash
   npx js-yaml openapi.yaml > openapi.json
   ```
3. Copy both files to `website-src/public/`:
   ```bash
   cp openapi.yaml website-src/public/
   cp openapi.json website-src/public/
   ```

## Note

These files MUST be in `website-src/public/` (not the root `public/` folder) so they are:
- Served by Vite dev server during development
- Included in the build output (`dist/`)
- Automatically copied to the final `public/` folder by `build.js`

The root `public/` folder is deleted and recreated during builds!
