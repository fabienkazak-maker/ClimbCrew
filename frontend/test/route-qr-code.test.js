import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/components/RouteQrCode.jsx", import.meta.url), "utf8");

test("les QR codes sont générés localement sans service externe", () => {
  assert.match(source, /from "\.\.\/vendor\/qrcode\.mjs"/);
  assert.match(source, /qrcode\(0, "M"\)/);
  assert.match(source, /data:image\/svg\+xml/);
  assert.doesNotMatch(source, /quickchart|googleapis|chart\.google/i);
});
