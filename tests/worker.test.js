import test from 'node:test';
import assert from 'node:assert/strict';
import { 掩码敏感信息 } from '../_worker.js';

test('掩码敏感信息 (Mask Sensitive Info)', async (t) => {

	await t.test('Happy Path: should mask strings longer than prefix + suffix', () => {
		assert.equal(掩码敏感信息('1234567890'), '123*****90', 'Default prefix 3, suffix 2');
		assert.equal(掩码敏感信息('abcdefghij', 2, 3), 'ab*****hij', 'Custom prefix 2, suffix 3');
		assert.equal(掩码敏感信息('hello_world', 4, 4), 'hell***orld', 'Custom prefix 4, suffix 4');
	});

	await t.test('Edge Case: should return original string if length is exactly prefix + suffix', () => {
		assert.equal(掩码敏感信息('12345'), '12345', 'Length 5, default prefix 3, suffix 2');
		assert.equal(掩码敏感信息('abcd', 2, 2), 'abcd', 'Length 4, custom prefix 2, suffix 2');
	});

	await t.test('Edge Case: should return original string if length is less than prefix + suffix', () => {
		assert.equal(掩码敏感信息('1234'), '1234', 'Length 4, default prefix 3, suffix 2');
		assert.equal(掩码敏感信息('1', 3, 2), '1', 'Very short string');
		assert.equal(掩码敏感信息('', 3, 2), '', 'Empty string');
	});

	await t.test('Error Condition/Zero-Trust: should handle invalid inputs gracefully', () => {
		assert.equal(掩码敏感信息(null), null, 'Null input');
		assert.equal(掩码敏感信息(undefined), undefined, 'Undefined input');
		assert.equal(掩码敏感信息(1234567890), 1234567890, 'Number input (non-string)');
		const obj = {};
		assert.equal(掩码敏感信息(obj), obj, 'Object input');
	});

});
