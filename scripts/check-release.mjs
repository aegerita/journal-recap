import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = readJson("manifest.json");
const pkg = readJson("package.json");
const lock = readJson("package-lock.json");
const versions = readJson("versions.json");
const tag = process.argv[2] ?? manifest.version;

assert.match(tag, /^\d+\.\d+\.\d+$/, "Release tag must be x.y.z, without a v prefix");
assert.equal(manifest.version, tag, "Tag and manifest version differ");
assert.equal(pkg.version, tag, "Package and manifest version differ");
assert.equal(lock.version, tag, "Lockfile and manifest version differ");
assert.equal(lock.packages[""].version, tag, "Lockfile root package version differs");
assert.equal(versions[tag], manifest.minAppVersion, "Release is missing from versions.json");
console.log(`Release ${tag} metadata is consistent.`);
