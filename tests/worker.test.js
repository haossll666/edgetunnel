import test from 'node:test';
import assert from 'node:assert/strict';
import { 掩码敏感信息, 是否启用日志记录, 是否跳过GetSUB日志KV写入, 是否跳过非SUB日志KV写入, 获取Pages页面或本地兜底, 生成本地登录页HTML, 生成本地Admin页HTML, 生成本地NoADMIN页HTML, 生成本地NoKV页HTML, 生成订阅稳定首项, 生成管理诊断视图, 读取TG配置, 读取CF配置, 清理配置缓存, 读取config_JSON } from '../_worker.js';

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
		assert.match(body, /href="\/admin\/diagnostics"/);
		assert.match(body, /href="\/logout"/);
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
		const result = await 读取config_JSON({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0', false, false);
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
			const result = await 读取config_JSON({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0', false, true);
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
});

test('生成订阅稳定首项 (Stable Subscription First Entry)', async (t) => {
	await t.test('should prepend the stable LINK once', () => {
		const result = 生成订阅稳定首项({ LINK: 'vless://example@xsy2026.dpdns.org:443?security=tls#stable' });
		assert.equal(result, 'vless://example@xsy2026.dpdns.org:443?security=tls#stable\n');
	});

	await t.test('should return empty string when LINK is missing', () => {
		assert.equal(生成订阅稳定首项({}), '');
		assert.equal(生成订阅稳定首项({ LINK: '   ' }), '');
	});
});

test('是否启用日志记录 (Log Recording Gate)', async (t) => {
	await t.test('should disable logging when OFF_LOG is enabled', () => {
		assert.equal(是否启用日志记录({ OFF_LOG: '1' }), false);
		assert.equal(是否启用日志记录({ OFF_LOG: 'true' }), false);
	});

	await t.test('should keep logging enabled by default', () => {
		assert.equal(是否启用日志记录({}), true);
		assert.equal(是否启用日志记录({ OFF_LOG: '0' }), true);
	});
});

test('读取TG配置 cache (TG Config KV Cache)', async (t) => {
	await t.test('should reuse tg.json from memory within the cache window', async () => {
		清理配置缓存();
		let getCount = 0;
		const env = {
			KV: {
				get: async (key) => {
					getCount += 1;
					assert.equal(key, 'tg.json');
					return JSON.stringify({ BotToken: 'bot-token', ChatID: 'chat-id' });
				},
			},
		};

		const originalNow = Date.now;
		try {
			Date.now = () => 1_000_000;
			const first = await 读取TG配置(env);
			Date.now = () => 1_000_000 + 60_000;
			const second = await 读取TG配置(env);
			assert.equal(getCount, 1);
			assert.deepEqual(first, { BotToken: 'bot-token', ChatID: 'chat-id' });
			assert.deepEqual(second, { BotToken: 'bot-token', ChatID: 'chat-id' });
		} finally {
			Date.now = originalNow;
		}
	});
});

test('读取CF配置 cache (CF Config KV Cache)', async (t) => {
	await t.test('should reuse cf.json from memory within the cache window', async () => {
		清理配置缓存();
		let getCount = 0;
		const env = {
			KV: {
				get: async (key) => {
					getCount += 1;
					assert.equal(key, 'cf.json');
					return JSON.stringify({ Email: 'a@example.com', GlobalAPIKey: 'k', AccountID: 'a', APIToken: 't' });
				},
			},
		};

		const originalNow = Date.now;
		try {
			Date.now = () => 2_000_000;
			const first = await 读取CF配置(env);
			Date.now = () => 2_000_000 + 60_000;
			const second = await 读取CF配置(env);
			assert.equal(getCount, 1);
			assert.deepEqual(first, { Email: 'a@example.com', GlobalAPIKey: 'k', AccountID: 'a', APIToken: 't' });
			assert.deepEqual(second, { Email: 'a@example.com', GlobalAPIKey: 'k', AccountID: 'a', APIToken: 't' });
		} finally {
			Date.now = originalNow;
		}
	});
});

test('生成管理诊断视图 (Admin Diagnostics View)', async (t) => {
	await t.test('should expose recovery routes without secrets', () => {
		const view = 生成管理诊断视图(new URL('https://example.com/admin/diagnostics'), {
			LINK: 'vless://stable-entry',
			优选订阅生成: { SUBUpdateTime: 3 },
		}, { OFF_LOG: '1' });

		assert.equal(view.route, '/admin/diagnostics');
		assert.equal(view.host, 'example.com');
		assert.equal(view.subscription.stableFirstEntry, true);
		assert.equal(view.subscription.updateHours, 3);
		assert.equal(view.logging.offLog, true);
		assert.ok(Array.isArray(view.recovery));
		assert.equal(view.recovery[0], '先确认 /admin 可打开');
	});
});

test('清理配置缓存 (Config Cache Reset)', async (t) => {
	await t.test('should clear both TG and CF caches', async () => {
		清理配置缓存();
		let tgGets = 0;
		let cfGets = 0;
		const env = {
			KV: {
				get: async (key) => {
					if (key === 'tg.json') {
						tgGets += 1;
						return JSON.stringify({ BotToken: 'bot', ChatID: 'chat' });
					}
					if (key === 'cf.json') {
						cfGets += 1;
						return JSON.stringify({ Email: 'a@example.com' });
					}
					return null;
				},
				put: async () => {},
			},
		};
		await 读取TG配置(env);
		await 读取CF配置(env);
		清理配置缓存();
		await 读取TG配置(env);
		await 读取CF配置(env);
		assert.equal(tgGets, 2);
		assert.equal(cfGets, 2);
	});
});
