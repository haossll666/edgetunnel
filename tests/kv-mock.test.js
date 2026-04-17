import test from 'node:test';
import assert from 'node:assert/strict';
import { createKvMock } from './_kv-mock.mjs';

test('createKvMock — KV 子集行为', async (t) => {
	await t.test('get/put/delete 与 list 前缀', async () => {
		const { kv, getCalls, putCalls, deleteCalls, listCalls } = createKvMock({ a: '1' });
		assert.equal(await kv.get('a'), '1');
		assert.deepEqual(getCalls, ['a']);
		await kv.put('b', '2');
		assert.equal(putCalls.length, 1);
		await kv.delete('a');
		assert.deepEqual(deleteCalls, ['a']);
		const listed = await kv.list({ prefix: 'b' });
		assert.equal(listed.keys.length, 1);
		assert.equal(listCalls.length, 1);
	});

	await t.test('put 带 expirationTtl 后到期不可见', async () => {
		const { kv } = createKvMock();
		const original = Date.now;
		const t0 = 1_000_000_000_000;
		try {
			Date.now = () => t0;
			await kv.put('k', 'v', { expirationTtl: 60 });
			assert.equal(await kv.get('k'), 'v');
			Date.now = () => t0 + 61_000;
			assert.equal(await kv.get('k'), null);
		} finally {
			Date.now = original;
		}
	});
});
