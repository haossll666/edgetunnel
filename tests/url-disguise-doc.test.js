import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('A2a — URL_DISGUISE_OPTIONS 文档契约', () => {
	const p = join(__dirname, '../docs/URL_DISGUISE_OPTIONS.md');
	const s = readFileSync(p, 'utf8');
	assert.match(s, /挑选原则/);
	assert.match(s, /候选列表/);
});
