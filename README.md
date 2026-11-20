# Vice Cover Studio

A fast offline cover maker: pick a layout, drop in your photos, crop and
pan each panel, add a bold caption and a sunset/neon grade, and export a
poster-ready PNG.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. Everything runs in the browser; photos
never leave your machine and the app makes no network requests.

## How to use

1. Pick a layout: Hero Split, Triple Strip, Quad, or Single Hero.
2. Click a panel in the preview to select it, then load a photo for it
   (your own file, or one of the built-in samples: Boulevard, Pier, Rider).
3. Zoom and pan the selected panel with the sliders, or drag the photo
   directly on the canvas.
4. Type a title and subtitle, pick a title style and a colour grade.
5. Choose an export size (1080x1080, 1080x1350, or 1920x1080) and press
   **Export PNG**.

## Export sizes

- 1080 x 1080 — square post
- 1080 x 1350 — portrait post
- 1920 x 1080 — landscape / wallpaper

## License

MIT. The two sample photos bundled in `app/samples/` were made with an
image model for make.fun and are free to use.
