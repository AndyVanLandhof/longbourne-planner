# Longbourne Pool House Planner

A to-scale planner for the ground floor of the Longbourne pool house, shared between Andy and Anna.

Live: https://longbourne-planner.vercel.app (passcode protected)

## What's here

| Path | What it does |
| --- | --- |
| `index.html` | The whole app: the traced shell, item catalogue, drawing, measuring and design management. Plain HTML, CSS and JavaScript, no build step. |
| `api/data.js` | `GET` returns every saved design and every custom item. |
| `api/designs.js` | `PUT ?id=` saves a design, `DELETE ?id=` removes one. |
| `api/catalog.js` | Same for custom item types ("My items"). |
| `api/_store.js` | Storage helpers on Vercel Blob. Keeps the last 20 versions of each design; deletes are soft. |
| `api/app.js` | Legacy: served the page from Blob before this repo existed. Not used now that `index.html` is served directly. |

## Data

Designs and custom items live in the project's Vercel Blob store, not in this repo, so deploying code never touches saved work.

## Settings (Vercel environment variables)

- `APP_PASSCODE`: the shared passcode everyone types to open the planner.
- `ADMIN_KEY`: only used by the legacy `api/app.js` upload route.
- `BLOB_STORE_ID`: set automatically when the Blob store was connected.

## Shell geometry

Traced from Stedman Blower drawing 5702-PH-A-102 rev T2 at 1:50. Coordinates are in millimetres with the origin at grid A / grid 1 and y running south. The hall's clear width (8,168 mm) matches the drawing. Treat faces as accurate to about ±100 mm.

## Making changes

Edit `index.html` and push to `main`. Vercel deploys automatically.
