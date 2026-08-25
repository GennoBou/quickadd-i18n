import fs from "fs";
import path from "path";

function findFiles(dir, exts, list = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name !== "node_modules" && entry.name !== ".git" && entry.name !== "build" && entry.name !== "dist") {
				findFiles(full, exts, list);
			}
		} else if (exts.includes(path.extname(entry.name))) {
			list.push(full);
		}
	}
	return list;
}

const files = findFiles(path.resolve("src"), [".ts", ".svelte", ".js", ".mjs"]);
const keys = new Set();

// Match t("...") or t('...') or t(`...`)
// Handles escaped quotes inside
const tRegex = /\bt\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;

for (const file of files) {
	const content = fs.readFileSync(file, "utf-8");
	let match;
	while ((match = tRegex.exec(content)) !== null) {
		let key = match[2];
		// unescape quotes
		key = key.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\`/g, '`');
		if (key.trim()) {
			keys.add(key);
		}
	}
}

console.log(`Extracted ${keys.size} distinct keys from ${files.length} files.`);

const sortedKeys = Array.from(keys).sort((a, b) => a.localeCompare(b));
const enDict = {};
for (const k of sortedKeys) {
	enDict[k] = k;
}

const localesDir = path.resolve("src", "locales");
if (!fs.existsSync(localesDir)) {
	fs.mkdirSync(localesDir, { recursive: true });
}

const enPath = path.join(localesDir, "en.json");
fs.writeFileSync(enPath, JSON.stringify(enDict, null, 2) + "\n", "utf-8");
console.log(`Written base en.json to ${enPath}`);
