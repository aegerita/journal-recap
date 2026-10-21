import { build } from "esbuild";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "journal-recap-tests-"));
try {
	const files = await readdir("tests");
	const sources = files.filter((file) => file.endsWith(".test.ts"));
	await build({
		entryPoints: sources.map((file) => join("tests", file)),
		bundle: true,
		platform: "node",
		format: "esm",
		outdir: directory,
		outExtension: { ".js": ".mjs" },
		alias: { obsidian: resolve("tests/mocks/obsidian.ts") },
	});
	const result = spawnSync(process.execPath, [
		"--test",
		...sources.map((file) => join(directory, file.replace(/\.ts$/, ".mjs"))),
		...files.filter((file) => file.endsWith(".test.mjs")).map((file) => join("tests", file)),
	], { stdio: "inherit" });
	if (result.error) throw result.error;
	process.exitCode = result.status ?? 1;
} finally {
	await rm(directory, { recursive: true, force: true });
}
