import { test } from 'node:test';
import assert from 'node:assert';
import { SS拼接字节 } from './_worker.js';

test('SS拼接字节 tests', async (t) => {
    await t.test('handles no arguments', () => {
        const result = SS拼接字节();
        assert.ok(result instanceof Uint8Array);
        assert.strictEqual(result.length, 0);
    });

    await t.test('handles empty chunkList', () => {
        const result = SS拼接字节(new Uint8Array(0));
        assert.strictEqual(result.length, 0);
    });

    await t.test('handles a single Uint8Array', () => {
        const a = new Uint8Array([1, 2, 3]);
        const result = SS拼接字节(a);
        assert.deepStrictEqual(result, new Uint8Array([1, 2, 3]));
    });

    await t.test('handles multiple Uint8Arrays', () => {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4, 5]);
        const c = new Uint8Array([6]);
        const result = SS拼接字节(a, b, c);
        assert.deepStrictEqual(result, new Uint8Array([1, 2, 3, 4, 5, 6]));
    });

    await t.test('handles ArrayBuffer inputs', () => {
        const a = new Uint8Array([1, 2]).buffer;
        const b = new Uint8Array([3, 4]).buffer;
        const result = SS拼接字节(a, b);
        assert.deepStrictEqual(result, new Uint8Array([1, 2, 3, 4]));
    });

    await t.test('handles DataView (ArrayBuffer.isView)', () => {
        const a = new Uint8Array([1, 2, 3, 4]);
        const view = new DataView(a.buffer, 1, 2); // Should be [2, 3]
        const result = SS拼接字节(view);
        assert.deepStrictEqual(result, new Uint8Array([2, 3]));
    });

    await t.test('handles mix of data types', () => {
        const a = new Uint8Array([1]);
        const b = new Uint8Array([2, 3]).buffer;
        const c = new DataView(new Uint8Array([4, 5, 6]).buffer, 1, 1); // Should be [5]
        const result = SS拼接字节(a, b, c);
        assert.deepStrictEqual(result, new Uint8Array([1, 2, 3, 5]));
    });

    await t.test('handles falsy or invalid inputs gracefully', () => {
        const result = SS拼接字节(null, undefined, 0, false);
        assert.deepStrictEqual(result, new Uint8Array(0));
    });

    await t.test('handles numbers (interpreted as length of empty arrays)', () => {
        const result = SS拼接字节(3);
        assert.deepStrictEqual(result, new Uint8Array([0, 0, 0]));
    });
});
