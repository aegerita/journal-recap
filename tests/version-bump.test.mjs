import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("version bump records releases that share a minimum Obsidian version", () => {
	const fixture = mkdtempSync(join(tmpdir(), "journal-recap-version-"));
	try {
		copyFileSync(new URL("../version-bump.mjs", import.meta.url), join(fixture, "version-bump.mjs"));
		writeFileSync(join(fixture, "manifest.json"), JSON.stringify({ version: "1.0.2", minAppVersion: "1.8.7" }));
		writeFileSync(join(fixture, "versions.json"), JSON.stringify({ "1.0.1": "1.8.7" }));
		const result = spawnSync(process.execPath, ["version-bump.mjs"], {
			cwd: fixture,
			env: { ...process.env, npm_package_version: "1.0.3" },
			encoding: "utf8",
		});
		assert.equal(result.status, 0, result.stderr);
		assert.equal(JSON.parse(readFileSync(join(fixture, "manifest.json"), "utf8")).version, "1.0.3");
		assert.deepEqual(JSON.parse(readFileSync(join(fixture, "versions.json"), "utf8")), {
			"1.0.1": "1.8.7",
			"1.0.3": "1.8.7",
		});
	} finally {
		rmSync(fixture, { recursive: true, force: true });
	}
});
