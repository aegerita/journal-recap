import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

test("release validation rejects mismatched tags and missing compatibility entries", () => {
	const directory = mkdtempSync(join(tmpdir(), "journal-recap-release-"));
	try {
		for (const [file, data] of Object.entries({
			"manifest.json": { version: "1.0.3", minAppVersion: "1.8.7" },
			"package.json": { version: "1.0.3" },
			"package-lock.json": { version: "1.0.3", packages: { "": { version: "1.0.3" } } },
			"versions.json": { "1.0.3": "1.8.7" },
		})) writeFileSync(join(directory, file), JSON.stringify(data));
		const run = (tag) => spawnSync(process.execPath, [
			new URL("../scripts/check-release.mjs", import.meta.url).pathname, tag,
		], { cwd: directory, encoding: "utf8" });
		assert.equal(run("1.0.3").status, 0);
		assert.notEqual(run("v1.0.3").status, 0);
		assert.notEqual(run("1.0.4").status, 0);
		writeFileSync(join(directory, "versions.json"), "{}");
		assert.notEqual(run("1.0.3").status, 0);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
