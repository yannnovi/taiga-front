#!/usr/bin/env node
/**
 * `ng build` (this project runs it with sourceMap disabled - see MIGRATION.md, the
 * source-map-loader crash on Angular's own precompiled packages) still emits the
 * `//# sourceMappingURL=...` comments that ship inside the original published packages
 * (rxjs, @angular/*, zone.js...), since nothing strips them when sourcemap processing is
 * off. Those files don't exist in dist-ng/, so a browser with devtools open tries to fetch
 * them, hits the app's SPA catch-all route, and logs a "not JSON" source-map parse error.
 * Harmless (source maps are dev-only tooling), but noisy - strip the leftover comments
 * from the built output so devtools has nothing to try to fetch.
 */
const fs = require("fs");
const path = require("path");

const distNg = path.join(__dirname, "..", "dist-ng");
const sourceMappingUrlComment = /^\/\/# sourceMappingURL=.*$/gm;

for (const file of fs.readdirSync(distNg)) {
    if (!file.endsWith(".js")) continue;

    const filePath = path.join(distNg, file);
    const contents = fs.readFileSync(filePath, "utf8");
    const stripped = contents.replace(sourceMappingUrlComment, "");

    if (stripped !== contents) {
        fs.writeFileSync(filePath, stripped);
    }
}
