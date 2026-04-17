import test from 'node:test';
import assert from 'node:assert/strict';
import { 掩码敏感信息, 是否跳过非SUB日志KV写入, 获取Pages页面或本地兜底, 生成本地登录页HTML, 生成本地NoADMIN页HTML, 生成本地NoKV页HTML } from '../_worker.js';

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

test('是否跳过非SUB日志KV写入 (Skip Non-Sub Log KV Writes)', async (t) => {
	await t.test('should keep Get_SUB logs on the KV path', () => {
		assert.equal(是否跳过非SUB日志KV写入({ TYPE: 'Get_SUB', IP: '1.2.3.4', URL: 'https://example.com/sub', UA: 'ua', TIME: Date.now() }), false);
	});

	await t.test('should skip repeated non-Get_SUB logs within the cache window', () => {
		const now = Date.now();
		const 日志内容 = { TYPE: 'Admin_Login', IP: '1.2.3.4', URL: 'https://example.com/admin', UA: 'ua', TIME: now };
		assert.equal(是否跳过非SUB日志KV写入(日志内容), false, 'first write should pass through');
		assert.equal(是否跳过非SUB日志KV写入({ ...日志内容, TIME: now + 60_000 }), true, 'repeat within 30 minutes should skip');
		assert.equal(是否跳过非SUB日志KV写入({ ...日志内容, TIME: now + 31 * 60_000 }), false, 'repeat after window should write again');
	});
});

test('Pages fallback helpers (Admin Login / noADMIN / noKV)', async (t) => {
	await t.test('should return remote response when fetch succeeds', async () => {
		const remoteFetch = async () => new Response('remote login', { status: 200, headers: { 'X-Test': '1' } });
		const response = await 获取Pages页面或本地兜底('/login', '<html>fallback</html>', 200, remoteFetch);
		assert.equal(response.status, 200);
		assert.equal(await response.text(), 'remote login');
		assert.equal(response.headers.get('Cache-Control'), 'no-store, no-cache, must-revalidate, proxy-revalidate');
	});

	await t.test('should fall back to local login HTML when fetch fails', async () => {
		const failingFetch = async () => { throw new Error('network down'); };
		const response = await 获取Pages页面或本地兜底('/login', 生成本地登录页HTML('example.com'), 200, failingFetch);
		const body = await response.text();
		assert.equal(response.status, 200);
		assert.match(body, /<form method="post" action="\/login">/);
		assert.match(body, /管理员密码/);
	});

	await t.test('should generate route-specific fallback copy for noADMIN and noKV', () => {
		assert.match(生成本地NoADMIN页HTML('example.com'), /还没有配置 ADMIN/);
		assert.match(生成本地NoKV页HTML('example.com'), /还没有绑定 KV/);
	});
});
