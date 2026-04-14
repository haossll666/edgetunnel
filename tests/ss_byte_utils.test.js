import test from 'node:test';
import assert from 'node:assert';
import { SS数据转Uint8Array, SS拼接字节 } from '../_worker.js';

test('SS拼接字节 - should concatenate multiple Uint8Arrays', () => {
	const chunk1 = new Uint8Array([1, 2, 3]);
	const chunk2 = new Uint8Array([4, 5]);
	const chunk3 = new Uint8Array([6]);
	const result = SS拼接字节(chunk1, chunk2, chunk3);

	assert.strictEqual(result.length, 6);
	assert.deepStrictEqual(Array.from(result), [1, 2, 3, 4, 5, 6]);
});

test('SS拼接字节 - should handle empty input', () => {
	const result = SS拼接字节();
	assert.strictEqual(result.length, 0);
	assert.ok(result instanceof Uint8Array);
});

test('SS拼接字节 - should handle ArrayBuffer and ArrayBufferView', () => {
	const buffer = new ArrayBuffer(2);
	const view = new Uint8Array(buffer);
	view[0] = 10;
	view[1] = 20;

	const uint16 = new Uint16Array([258]); // [2, 1] in little endian

	const result = SS拼接字节(buffer, uint16);

	// Uint16Array([258]) is 2 bytes: 0x02 0x01
	assert.strictEqual(result.length, 4);
	assert.deepStrictEqual(Array.from(result), [10, 20, 2, 1]);
});

test('SS拼接字节 - should handle mixed types and single input', () => {
	const result = SS拼接字节(new Uint8Array([1]), [2, 3]);

	assert.deepStrictEqual(Array.from(result), [1, 2, 3]);
});

test('SS数据转Uint8Array - should handle various data types', () => {
    const ua = new Uint8Array([1, 2]);
    assert.strictEqual(SS数据转Uint8Array(ua), ua);

    const ab = new ArrayBuffer(2);
    const convertedAb = SS数据转Uint8Array(ab);
    assert.ok(convertedAb instanceof Uint8Array);
    assert.strictEqual(convertedAb.byteLength, 2);

    const dv = new DataView(new ArrayBuffer(4));
    const convertedDv = SS数据转Uint8Array(dv);
    assert.ok(convertedDv instanceof Uint8Array);
    assert.strictEqual(convertedDv.byteLength, 4);
});
