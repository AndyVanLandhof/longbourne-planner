# Longbourne Pool House Planner

A to-scale planner for the ground floor of the Longbourne pool house, shared between Andy and Anna.

Live: https://longbourne-planner.vercel.app (passcode protected)

## What's here

| Path | What it does |
| --- | --- |
| `index.html` | The whole app: the traced shell, item catalogue, drawing, measuring, design management and the 3D view. Plain HTML, CSS and JavaScript, no build step. The 3D view loads three.js r128 from cdnjs the first time the 3D tab is opened. |
| `api/data.js` | `GET` returns every saved design and every custom item. |
| `api/designs.js` | `PUT ?id=` saves a design, `DELETE ?id=` removes one. |
| `api/catalog.js` | Same for custom item types ("My items"). |
| `api/textures.js` | Finishes. `PUT ?id=` saves a finish (an uploaded image is stored as its own blob), `DELETE ?id=` removes it, `GET ?id=` returns the image. |
| `api/_store.js` | Storage helpers on Vercel Blob. Keeps the last 20 versions of each design; deletes are soft. |
| `api/app.js` | Legacy: served the page from Blob before this repo existed. Not used now that `index.html` is served directly. |

## 3D view

The 3D tab builds a model from the current design: shell walls with the approved door and window openings, the hall's clipped-gable roof (eaves 2.45 m, 4.2 m across the middle, ridge 7.23 m, read off 5702-PH-A-201/202 T2), the stair void, user walls at 2.4 m, and every item at a typical height. Each item's height can be changed in the inspector, and custom items have a height field.

## Finishes

Twelve built-in finishes are drawn procedurally in the browser (oak, walnut, limestone flags, concrete, terrazzo, tiles, plaster, sandstone, brick, cladding, carpet). Uploaded photos are shrunk to 1024 px JPEGs in the browser before saving. A design stores its defaults in `finishes` (`floor`, `wallsIn`, `wallsOut`, `walls`); a zone can override the floor (`floor`) and a drawn wall its finish (`finish`).

## Data

Designs and custom items live in the project's Vercel Blob store, not in this repo, so deploying code never touches saved work.

## Settings (Vercel environment variables)

- `APP_PASSCODE`: the shared passcode everyone types to open the planner.
- `ADMIN_KEY`: only used by the legacy `api/app.js` upload route.
- `BLOB_STORE_ID`: set automatically when the Blob store was connected.

## Shell geometry

Traced from Stedman Blower drawing 5702-PH-A-102 rev T2 at 1:50. Coordinates are in millimetres with the origin at grid A / grid 1 and y running south. The hall's clear width (8,168 mm) matches the drawing. Treat faces as accurate to about ±100 mm.

## Making changes

Edit `index.html` and push to `main`. The repo is connected to the Vercel project, so every push to `main` deploys to production automatically, and other branches get preview deployments.
