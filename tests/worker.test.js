import test from 'node:test';
import assert from 'node:assert/strict';
import {
	掩码敏感信息,
	是否跳过GetSUB日志KV写入,
	是否跳过非SUB日志KV写入,
	获取Pages页面或本地兜底,
	生成本地登录页HTML,
	生成本地Admin页HTML,
	生成本地NoADMIN页HTML,
	生成本地NoKV页HTML,
	读取订阅基础配置,
	读取管理配置,
	重置并读取管理配置,
	提取订阅配置快照,
	构建稳定订阅入口优先列表,
	读取config_JSON
} from '../_worker.js';

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

test('是否跳过Get_SUB日志KV写入 (Skip Get_SUB Log KV Writes)', async (t) => {
	await t.test('should keep first Get_SUB log on the KV path', () => {
		assert.equal(是否跳过GetSUB日志KV写入({ TYPE: 'Get_SUB', IP: '1.2.3.4', URL: 'https://example.com/sub-a', UA: 'ua', TIME: Date.now() }), false);
	});

	await t.test('should skip repeated Get_SUB logs within the cache window', () => {
		const now = Date.now();
		const 日志内容 = { TYPE: 'Get_SUB', IP: '5.6.7.8', URL: 'https://example.com/sub-b', UA: 'ua', TIME: now };
		assert.equal(是否跳过GetSUB日志KV写入(日志内容), false, 'first write should pass through');
		assert.equal(是否跳过GetSUB日志KV写入({ ...日志内容, TIME: now + 60_000 }), true, 'repeat within 30 minutes should skip');
		assert.equal(是否跳过GetSUB日志KV写入({ ...日志内容, TIME: now + 31 * 60_000 }), false, 'repeat after window should write again');
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

	await t.test('should generate a usable local admin shell when Pages is unavailable', () => {
		const body = 生成本地Admin页HTML('example.com');
		assert.match(body, /后台可用，但外部 Pages 暂时不可达/);
		assert.match(body, /href="\/admin\/config\.json"/);
		assert.match(body, /href="\/logout"/);
	});
});

test('构建稳定订阅入口优先列表 (Prefer Stable Host Entry First)', async (t) => {
	await t.test('should prepend the stable host entry ahead of IP candidates', () => {
		const result = 构建稳定订阅入口优先列表('example.com', '443', ['1.2.3.4:443#A', '2.3.4.5:443#B']);
		assert.equal(result[0], 'example.com:443#example.com 稳定入口');
		assert.deepEqual(result.slice(1), ['1.2.3.4:443#A', '2.3.4.5:443#B']);
	});

	await t.test('should not duplicate the stable host entry when it already exists', () => {
		const result = 构建稳定订阅入口优先列表('example.com', '443', ['example.com:443#old', '1.2.3.4:443#A']);
		assert.equal(result.length, 2);
		assert.equal(result[0], 'example.com:443#example.com 稳定入口');
		assert.equal(result[1], '1.2.3.4:443#A');
	});
});

test('读取config_JSON contract split (Base Config / Admin Extensions)', async (t) => {
	const createMockKV = (values) => {
		const gets = [];
		const puts = [];
		return {
			gets,
			puts,
			get: async (key) => {
				gets.push(key);
				return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null;
			},
			put: async (key, value) => {
				puts.push([key, value]);
			},
		};
	};

	await t.test('should keep base config loading on config.json only', async () => {
		const kv = createMockKV({});
		const result = await 读取订阅基础配置({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0');
		assert.deepEqual(kv.gets, ['config.json']);
		assert.deepEqual(kv.puts.length, 1);
		assert.equal(kv.puts[0][0], 'config.json');
		assert.equal(result.HOST, 'example.com');
		assert.equal(result.UUID, 'uuid-123');
		assert.equal(result.TG.启用, false);
		assert.equal(result.CF.Usage.success, false);
	});

	await t.test('should load tg.json and cf.json only when admin extensions are requested', async () => {
		const kv = createMockKV({
			'tg.json': JSON.stringify({ BotToken: 'bot-secret', ChatID: 'chat-id' }),
			'cf.json': JSON.stringify({ UsageAPI: 'https://example.com/usage' }),
		});
		const originalFetch = global.fetch;
		global.fetch = async (input) => {
			assert.equal(String(input), 'https://example.com/usage');
			return new Response(JSON.stringify({ success: true, pages: 1, workers: 2, total: 3, max: 4 }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		};

		try {
			const result = await 读取管理配置({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0');
			assert.deepEqual(kv.gets, ['config.json', 'tg.json', 'cf.json']);
			assert.equal(kv.puts.length, 1);
			assert.equal(kv.puts[0][0], 'config.json');
			assert.equal(result.TG.ChatID, 'chat-id');
			assert.notEqual(result.TG.BotToken, 'bot-secret');
			assert.equal(result.CF.Usage.success, true);
			assert.equal(result.CF.Usage.pages, 1);
		} finally {
			global.fetch = originalFetch;
		}
	});

	await t.test('should keep admin reset path on the admin contract while rewriting config.json', async () => {
		const kv = createMockKV({
			'config.json': JSON.stringify({ HOST: 'stale.example', UUID: 'stale-uuid' }),
		});
		const result = await 重置并读取管理配置({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0');
		assert.deepEqual(kv.gets, ['config.json', 'tg.json', 'cf.json']);
		assert.deepEqual(kv.puts.map(([key]) => key), ['config.json', 'tg.json', 'cf.json']);
		assert.equal(result.HOST, 'example.com');
		assert.equal(result.UUID, 'uuid-123');
		assert.equal(result.TG.启用, false);
		assert.equal(result.CF.Usage.success, false);
	});

	await t.test('should preserve direct boolean contract for the internal loader', async () => {
		const kv = createMockKV({});
		const result = await 读取config_JSON({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0', false, false);
		assert.deepEqual(kv.gets, ['config.json']);
		assert.equal(result.HOST, 'example.com');
	});

	await t.test('should keep the subscription snapshot focused on /sub fields only', () => {
		const snapshot = 提取订阅配置快照({
			HOST: 'example.com',
			HOSTS: ['example.com', 'sub.example.com'],
			UUID: 'uuid-123',
			PATH: '/edge',
			协议类型: 'vless',
			传输协议: 'ws',
			gRPC模式: 'gun',
			gRPCUserAgent: 'UA/1.0',
			跳过证书验证: false,
			启用0RTT: true,
			TLS分片: 'Happ',
			随机路径: true,
			ECH: true,
			ECHConfig: { DNS: 'https://dns.example.com', SNI: 'sni.example.com' },
			SS: { 加密方式: 'aes-128-gcm', TLS: true },
			Fingerprint: 'chrome',
			优选订阅生成: {
				local: false,
				本地IP库: { 随机IP: false, 随机数量: 8, 指定端口: 443 },
				SUB: 'sub://example.com',
				SUBNAME: 'edgetunnel',
				SUBUpdateTime: 3,
				TOKEN: 'token',
			},
			订阅转换配置: { SUBAPI: 'https://example.com', SUBCONFIG: 'cfg', SUBEMOJI: false },
			TG: { 启用: true, BotToken: 'bot-secret', ChatID: 'chat-id' },
			CF: {
				Usage: { success: true, pages: 1, workers: 2, total: 3, max: 4 },
				Email: 'ops@example.com',
				GlobalAPIKey: 'api-key',
				AccountID: 'account-id',
				APIToken: 'token-secret',
				UsageAPI: 'https://usage.example.com',
			},
			完整节点路径: '/edge?foo=bar',
			反代: { 账号: 'should-not-be-needed' },
		});

		assert.equal(snapshot.HOST, 'example.com');
		assert.deepEqual(snapshot.HOSTS, ['example.com', 'sub.example.com']);
		assert.equal(snapshot.UUID, 'uuid-123');
		assert.equal(snapshot.TG.启用, true);
		assert.deepEqual(snapshot.CF.Usage, { success: true, pages: 1, workers: 2, total: 3, max: 4 });
		assert.equal(Object.hasOwn(snapshot.TG, 'BotToken'), false);
		assert.equal(Object.hasOwn(snapshot.CF, 'Email'), false);
		assert.equal(Object.hasOwn(snapshot, '反代'), false);
		assert.equal(Object.hasOwn(snapshot, 'config_JSON'), false);
	});

	await t.test('should backfill missing 反代 config so older KV entries still load', async () => {
		const kv = createMockKV({
			'config.json': JSON.stringify({
				HOST: 'example.com',
				HOSTS: ['example.com'],
				UUID: 'uuid-123',
				PATH: '/',
				协议类型: 'vless',
				传输协议: 'ws',
				gRPC模式: 'gun',
				gRPCUserAgent: 'UA/1.0',
				跳过证书验证: false,
				启用0RTT: false,
				TLS分片: null,
				随机路径: false,
				ECH: false,
				ECHConfig: { DNS: 'https://dns.alidns.com/dns-query', SNI: 'cloudflare-ech.com' },
				SS: { 加密方式: 'aes-128-gcm', TLS: true },
				Fingerprint: 'chrome',
				优选订阅生成: {
					local: true,
					本地IP库: { 随机IP: false, 随机数量: 16, 指定端口: -1 },
					SUB: null,
					SUBNAME: 'edgetunnel',
					SUBUpdateTime: 3,
					TOKEN: 'token',
				},
				订阅转换配置: { SUBAPI: 'https://SUBAPI.cmliussss.net', SUBCONFIG: 'cfg', SUBEMOJI: false },
				TG: { 启用: false },
				CF: { Usage: { success: false, pages: 0, workers: 0, total: 0, max: 100000 } },
				完整节点路径: '/',
			}),
			'ADD.txt': '1.2.3.4:443#note\n',
		});

		const result = await 读取订阅基础配置({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0');
		assert.equal(result.HOST, 'example.com');
		assert.equal(typeof result.反代, 'object');
		assert.equal(result.反代.SOCKS5.白名单.length > 0, true);
		assert.equal(result.反代.路径模板.SOCKS5.全局.includes('socks5://'), true);
		assert.equal(result.完整节点路径, '/');
	});
});
