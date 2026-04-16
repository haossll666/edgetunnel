const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');

// Read _worker.js and dynamically extract the function to avoid modifying production code (Zero-Trust separation)
const workerCode = fs.readFileSync(path.join(__dirname, '../_worker.js'), 'utf-8');

// Match the function SS数据转Uint8Array
const functionMatch = workerCode.match(/function SS数据转Uint8Array\(data\) \{[\s\S]*?\n\}/);
if (!functionMatch) {
  throw new Error('Could not find function SS数据转Uint8Array in _worker.js');
}

// Evaluate the function string into an actual callable function
const SS数据转Uint8Array = new Function(`return ${functionMatch[0]}`)();

test('SS数据转Uint8Array - Input is already Uint8Array', () => {
    const input = new Uint8Array([1, 2, 3]);
    const result = SS数据转Uint8Array(input);

    assert.strictEqual(result, input, 'Should return the exact same instance');
    assert.deepStrictEqual(result, new Uint8Array([1, 2, 3]));
});

test('SS数据转Uint8Array - Input is ArrayBuffer', () => {
    const buffer = new ArrayBuffer(4);
    const view = new Uint8Array(buffer);
    view.set([10, 20, 30, 40]);

    const result = SS数据转Uint8Array(buffer);

    assert.ok(result instanceof Uint8Array, 'Should return a Uint8Array');
    assert.deepStrictEqual(result, new Uint8Array([10, 20, 30, 40]));
    assert.strictEqual(result.buffer, buffer, 'Should share the same underlying ArrayBuffer');
});

test('SS数据转Uint8Array - Input is DataView', () => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer, 2, 4); // Offset 2, length 4
    view.setInt8(0, 11);
    view.setInt8(1, 22);
    view.setInt8(2, 33);
    view.setInt8(3, 44);

    const result = SS数据转Uint8Array(view);

    assert.ok(result instanceof Uint8Array, 'Should return a Uint8Array');
    assert.deepStrictEqual(result, new Uint8Array([11, 22, 33, 44]));
    assert.strictEqual(result.buffer, buffer, 'Should share the same underlying ArrayBuffer');
    assert.strictEqual(result.byteOffset, 2, 'Should respect the byteOffset of the view');
    assert.strictEqual(result.byteLength, 4, 'Should respect the byteLength of the view');
});

test('SS数据转Uint8Array - Input is Int32Array', () => {
    const int32Array = new Int32Array([1000, 2000]);
    const result = SS数据转Uint8Array(int32Array);

    assert.ok(result instanceof Uint8Array, 'Should return a Uint8Array');
    // Buffer length of 2 * 4 bytes = 8 bytes
    assert.strictEqual(result.byteLength, 8, 'Length in bytes should be exactly identical to the TypedArray buffer representation length');
    assert.strictEqual(result.buffer, int32Array.buffer, 'Should share the same underlying ArrayBuffer');
});

test('SS数据转Uint8Array - Input is regular Array', () => {
    const input = [5, 10, 15];
    const result = SS数据转Uint8Array(input);

    assert.ok(result instanceof Uint8Array, 'Should return a Uint8Array');
    assert.deepStrictEqual(result, new Uint8Array([5, 10, 15]));
});

test('SS数据转Uint8Array - Input is null or undefined', () => {
    const resultNull = SS数据转Uint8Array(null);
    assert.ok(resultNull instanceof Uint8Array);
    assert.strictEqual(resultNull.length, 0);

    const resultUndefined = SS数据转Uint8Array(undefined);
    assert.ok(resultUndefined instanceof Uint8Array);
    assert.strictEqual(resultUndefined.length, 0);
});

test('SS数据转Uint8Array - Input is 0', () => {
    // According to the code `new Uint8Array(data || 0)`, 0 evaluates to new Uint8Array(0)
    const result = SS数据转Uint8Array(0);
    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(result.length, 0);
});

test('SS数据转Uint8Array - Input is a number greater than 0', () => {
    // If input is 5, `new Uint8Array(5)` generates a Uint8Array of 5 elements of zeroes.
    const result = SS数据转Uint8Array(5);
    assert.ok(result instanceof Uint8Array);
    assert.strictEqual(result.length, 5);
    assert.deepStrictEqual(result, new Uint8Array([0, 0, 0, 0, 0]));
});
