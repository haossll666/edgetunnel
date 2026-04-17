import test from 'node:test';
import assert from 'node:assert/strict';
import { __读取config_JSONForTests, 掩码敏感信息 } from '../_worker.js';

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

test('读取config_JSON separates hot-path config from admin enrichment', async (t) => {
	const kvReads = [];
	const kvWrites = [];
	const baseConfig = {
		HOST: 'edge.example.com',
		HOSTS: ['edge.example.com'],
		UUID: '90cd4a77-141a-43c9-991b-08263cfe9c10',
		PATH: '/',
		协议类型: 'vless',
		传输协议: 'ws',
		优选订阅生成: { SUBNAME: 'edge', SUBUpdateTime: 3, TOKEN: null, 本地IP库: { 随机数量: 16, 指定端口: -1 } },
		订阅转换配置: { SUBAPI: 'https://example.com', SUBCONFIG: 'https://example.com/config', SUBEMOJI: false },
		反代: { PROXYIP: 'auto', SOCKS5: {}, 路径模板: { PROXYIP: 'proxyip={{IP:PORT}}', SOCKS5: { 全局: 'socks5://{{IP:PORT}}', 标准: 'socks5={{IP:PORT}}' }, HTTP: { 全局: 'http://{{IP:PORT}}', 标准: 'http={{IP:PORT}}' } } }
	};
	const env = {
		KV: {
			async get(key) {
				kvReads.push(key);
				if (key === 'config.json') return JSON.stringify(baseConfig);
				if (key === 'tg.json') return JSON.stringify({ BotToken: '123456:abcdef', ChatID: 'chat-1' });
				if (key === 'cf.json') return JSON.stringify({ Email: 'user@example.com', GlobalAPIKey: 'secret-key', AccountID: null, APIToken: null, UsageAPI: null });
				return null;
			},
			async put(key, value) {
				kvWrites.push([key, value]);
			}
		}
	};

	await t.test('subscription path skips admin-only KV reads', async () => {
		kvReads.length = 0;
		kvWrites.length = 0;
		const config = await __读取config_JSONForTests(env, 'edge.example.com', '90cd4a77-141a-43c9-991b-08263cfe9c10', 'Mozilla/5.0');

		assert.deepEqual(kvReads, ['config.json']);
		assert.equal(kvWrites.length, 0);
		assert.equal(config.TG.启用, false);
		assert.equal(config.CF.Usage.success, false);
	});

	await t.test('admin path still loads admin enrichment', async () => {
		kvReads.length = 0;
		kvWrites.length = 0;
		const config = await __读取config_JSONForTests(env, 'edge.example.com', '90cd4a77-141a-43c9-991b-08263cfe9c10', 'Mozilla/5.0', false, true);

		assert.deepEqual(kvReads, ['config.json', 'tg.json', 'cf.json']);
		assert.equal(config.TG.BotToken, '123********ef');
		assert.equal(config.CF.Email, 'user@example.com');
	});
});
