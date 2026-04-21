import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { 掩码敏感信息, 是否启用日志记录, 是否跳过GetSUB日志KV写入, 是否跳过非SUB日志KV写入, 获取Pages页面或本地兜底, 生成本地登录页HTML, 生成本地Admin页HTML, 生成本地NoADMIN页HTML, 生成本地NoKV页HTML, 生成订阅稳定首项, 生成管理诊断视图, 请求日志记录, 读取TG配置, 读取CF配置, 清理配置缓存, 清理基础配置缓存, 清理Cloudflare使用量缓存, 读取config_JSON, 管理员IP绑定模式, 严格模式IP绑定材料, 管理员会话Cookie值, 登录退避_测试重置内存, 登录退避_测试置日写次数, 登录退避_计算锁定时长毫秒, 登录退避_当日KV写次数, 选择反代策略, 清理自动反代池缓存, 清理自动反代健康缓存, 记录自动反代健康结果, 读取自动反代健康分, 设置自动反代策略测试状态, 是否允许记录自动反代健康结果, 过滤自动反代候选, 读取自动反代过滤诊断, 读取自动反代健康摘要 } from '../_worker.js';
import { createKvMock } from './_kv-mock.mjs';

test('管理员会话 Cookie — IP/ASN 绑定 (C1)', async (t) => {
	await t.test('管理员IP绑定模式 默认 relaxed', () => {
		assert.equal(管理员IP绑定模式({}), 'relaxed');
		assert.equal(管理员IP绑定模式({ ADMIN_IP_BIND: 'STRICT' }), 'strict');
		assert.equal(管理员IP绑定模式({ ADMIN_IP_BIND: 'off' }), 'off');
	});

	await t.test('strict：IPv4 /24 材料', () => {
		assert.equal(严格模式IP绑定材料('192.168.1.10'), 'v4:192.168.1.0/24');
	});

	await t.test('strict：IPv6 /64 材料', () => {
		assert.match(严格模式IP绑定材料('2001:db8::1'), /^v6:2001:0db8:0000:0000::\/64$/i);
	});

	await t.test('strict：同网段同 cookie，跨网段不同', async () => {
		const env = { ADMIN_IP_BIND: 'strict', KEY: 'k', ADMIN: 'p' };
		const a = await 管理员会话Cookie值(new Request('https://h/'), env, 'ua', 'k', 'p', '10.0.0.1');
		const b = await 管理员会话Cookie值(new Request('https://h/'), env, 'ua', 'k', 'p', '10.0.0.200');
		const c = await 管理员会话Cookie值(new Request('https://h/'), env, 'ua', 'k', 'p', '10.0.1.1');
		assert.equal(a, b);
		assert.notEqual(a, c);
	});

	await t.test('relaxed：同 ASN 同 cookie', async () => {
		const env = { ADMIN_IP_BIND: 'relaxed', KEY: 'k', ADMIN: 'p' };
		const mk = (ip) => {
			const base = new Request('https://h/', { headers: { 'CF-Connecting-IP': ip } });
			return new Proxy(base, {
				get(target, prop, receiver) {
					if (prop === 'cf') return { asn: 13335 };
					return Reflect.get(target, prop, receiver);
				},
			});
		};
		const a = await 管理员会话Cookie值(mk('1.1.1.1'), env, 'ua', 'k', 'p', '1.1.1.1');
		const b = await 管理员会话Cookie值(mk('8.8.8.8'), env, 'ua', 'k', 'p', '8.8.8.8');
		assert.equal(a, b);
	});

	await t.test('off：与无绑定材料时哈希一致', async () => {
		const env = { ADMIN_IP_BIND: 'off', KEY: 'k', ADMIN: 'p' };
		const r = new Request('https://h/', { headers: { 'CF-Connecting-IP': '9.9.9.9' }, cf: { asn: 1 } });
		const withBind = await 管理员会话Cookie值(r, env, 'ua', 'k', 'p', '9.9.9.9');
		const noBind = await 管理员会话Cookie值(r, { ...env, ADMIN_IP_BIND: 'off' }, 'ua', 'k', 'p', '1.1.1.1');
		assert.equal(withBind, noBind);
	});
});

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

	await t.test('本地 Admin 兜底应含构建标识（E3）', () => {
		const body = 生成本地Admin页HTML('example.com');
		assert.match(body, /构建标识/);
		assert.match(body, /build\.gitDescribe/);
	});
});

test('反代策略选择 (ProxyIP Policy)', async (t) => {
	await t.test('should prefer env.PROXYIP over automatic pool', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const { kv } = createKvMock({ 'ADD.txt': '198.51.100.1:443,198.51.100.2:443' });
		const originalRandom = Math.random;
		try {
			Math.random = () => 0.75;
			const 策略 = await 选择反代策略({ PROXYIP: '203.0.113.10:8443,203.0.113.11:9443', KV: kv });
			assert.equal(策略.来源, 'env.PROXYIP');
			assert.equal(策略.反代IP, '203.0.113.11:9443');
			assert.equal(策略.启用反代兜底, false);
		} finally {
			Math.random = originalRandom;
		}
	});

	await t.test('should use ADD.txt as automatic proxy pool when PROXYIP is absent', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({ 'ADD.txt': '198.51.100.1:443\n198.51.100.2:8443' });
		const 策略 = await 选择反代策略({ KV: m.kv });
		assert.equal(策略.来源, 'kv.ADD.txt');
		assert.deepEqual(new Set(策略.反代IP.split(',')), new Set(['198.51.100.1:443', '198.51.100.2:8443']));
		assert.equal(策略.启用反代兜底, false);
		assert.deepEqual(m.getCalls, ['ADD.txt']);
	});

	await t.test('should filter malformed or unsafe automatic candidates before pool selection', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({
			'ADD.txt': '198.51.100.1:443#ok\nbad-host@:443\n203.0.113.2:22\nexample.com:8443\n[2606:4700::1111]:2053\n198.51.100.999:443'
		});
		const 策略 = await 选择反代策略({ KV: m.kv, AUTO_PROXY_POOL_SIZE: '8' }, { host: 'example.com', colo: 'HKG' });
		assert.equal(策略.来源, 'kv.ADD.txt');
		assert.deepEqual(new Set(策略.候选数组), new Set([
			'198.51.100.1:443',
			'example.com:8443',
			'[2606:4700::1111]:2053'
		]));
	});

	await t.test('should disable proxy fallback when neither PROXYIP nor ADD.txt exists', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const { kv } = createKvMock({});
		const 策略 = await 选择反代策略({ KV: kv });
		assert.equal(策略.来源, 'disabled');
		assert.equal(策略.反代IP, '');
		assert.equal(策略.启用反代兜底, false);
	});

	await t.test('should dedupe and cap automatic pool size deterministically', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({
			'ADD.txt': '198.51.100.1:443\n198.51.100.2:443\n198.51.100.2:443\n198.51.100.3:443\n198.51.100.4:443'
		});
		const env = { KV: m.kv, AUTO_PROXY_POOL_SIZE: '3' };
		const a = await 选择反代策略(env, { host: 'example.com', colo: 'HKG' });
		const b = await 选择反代策略(env, { host: 'example.com', colo: 'HKG' });
		const 池A = a.反代IP.split(',');
		const 池B = b.反代IP.split(',');
		assert.equal(池A.length, 3);
		assert.deepEqual(池A, 池B);
		assert.equal(new Set(池A).size, 3);
	});

	await t.test('should vary automatic pool ordering when seed changes', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({
			'ADD.txt': '198.51.100.1:443\n198.51.100.2:443\n198.51.100.3:443\n198.51.100.4:443'
		});
		const env = { KV: m.kv, AUTO_PROXY_POOL_SIZE: '4' };
		const hkg = await 选择反代策略(env, { host: 'example.com', colo: 'HKG' });
		清理自动反代池缓存();
		const lax = await 选择反代策略(env, { host: 'example.com', colo: 'LAX' });
		assert.notEqual(hkg.反代IP, lax.反代IP);
	});

	await t.test('should promote healthy candidates and demote failing candidates', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({
			'ADD.txt': '198.51.100.1:443\n198.51.100.2:443\n198.51.100.3:443\n198.51.100.4:443'
		});
		const env = { KV: m.kv, AUTO_PROXY_POOL_SIZE: '4' };
		const before = await 选择反代策略(env, { host: 'example.com', colo: 'HKG' });
		const beforePool = before.反代IP.split(',');
		const winner = beforePool[3];
		const loser = beforePool[0];
		记录自动反代健康结果(winner, true, 'target.example.com');
		记录自动反代健康结果(winner, true, 'target.example.com');
		记录自动反代健康结果(loser, false, 'target.example.com');
		记录自动反代健康结果(loser, false, 'target.example.com');
		assert.equal(读取自动反代健康分(winner, 'target.example.com'), 3);
		assert.equal(读取自动反代健康分(loser, 'target.example.com'), -4);
		const after = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'target.example.com' });
		const afterPool = after.反代IP.split(',');
		assert.equal(afterPool[0], winner);
		assert.equal(afterPool[afterPool.length - 1], loser);
	});

	await t.test('should apply health ordering even when candidate list is served from cache', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({
			'ADD.txt': '198.51.100.1:443\n198.51.100.2:443\n198.51.100.3:443'
		});
		const env = { KV: m.kv, AUTO_PROXY_POOL_SIZE: '3' };
		const first = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'target.example.com' });
		const firstPool = first.反代IP.split(',');
		记录自动反代健康结果(firstPool[2], true, 'target.example.com');
		const second = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'target.example.com' });
		assert.equal(second.反代IP.split(',')[0], firstPool[2]);
		assert.deepEqual(m.getCalls, ['ADD.txt']);
	});

	await t.test('should decay positive and negative health scores toward zero over time', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const originalNow = Date.now;
		try {
			Date.now = () => 1_000_000;
			记录自动反代健康结果('198.51.100.9:443', true, 'target.example.com');
			记录自动反代健康结果('198.51.100.8:443', false, 'target.example.com');
			assert.equal(读取自动反代健康分('198.51.100.9:443', 'target.example.com'), 2);
			assert.equal(读取自动反代健康分('198.51.100.8:443', 'target.example.com'), -3);
			Date.now = () => 1_000_000 + 2 * 60 * 1000;
			assert.equal(读取自动反代健康分('198.51.100.9:443', 'target.example.com'), 1);
			assert.equal(读取自动反代健康分('198.51.100.8:443', 'target.example.com'), -2);
			Date.now = () => 1_000_000 + 8 * 60 * 1000;
			assert.equal(读取自动反代健康分('198.51.100.9:443', 'target.example.com'), 0);
			assert.equal(读取自动反代健康分('198.51.100.8:443', 'target.example.com'), 0);
		} finally {
			Date.now = originalNow;
		}
	});

	await t.test('should cool down repeated same-direction updates', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const originalNow = Date.now;
		try {
			Date.now = () => 2_000_000;
			记录自动反代健康结果('198.51.100.7:443', true, 'target.example.com');
			assert.equal(读取自动反代健康分('198.51.100.7:443', 'target.example.com'), 2);
			Date.now = () => 2_000_000 + 10_000;
			记录自动反代健康结果('198.51.100.7:443', true, 'target.example.com');
			assert.equal(读取自动反代健康分('198.51.100.7:443', 'target.example.com'), 3);
			Date.now = () => 2_000_000 + 15_000;
			记录自动反代健康结果('198.51.100.6:443', false, 'target.example.com');
			assert.equal(读取自动反代健康分('198.51.100.6:443', 'target.example.com'), -3);
			Date.now = () => 2_000_000 + 20_000;
			记录自动反代健康结果('198.51.100.6:443', false, 'target.example.com');
			assert.equal(读取自动反代健康分('198.51.100.6:443', 'target.example.com'), -4);
		} finally {
			Date.now = originalNow;
		}
	});

	await t.test('should isolate health scores by target site', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		const m = createKvMock({
			'ADD.txt': '198.51.100.1:443\n198.51.100.2:443\n198.51.100.3:443'
		});
		const env = { KV: m.kv, AUTO_PROXY_POOL_SIZE: '3' };
		const baseA = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'alpha.example.com' });
		const baseB = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'beta.example.com' });
		const alphaWinner = baseA.反代IP.split(',')[2];
		记录自动反代健康结果(alphaWinner, true, 'alpha.example.com');
		记录自动反代健康结果(alphaWinner, true, 'alpha.example.com');
		const alphaAfter = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'alpha.example.com' });
		const betaAfter = await 选择反代策略(env, { host: 'example.com', colo: 'HKG', 目标站点: 'beta.example.com' });
		assert.equal(alphaAfter.反代IP.split(',')[0], alphaWinner);
		assert.equal(betaAfter.反代IP, baseB.反代IP);
		assert.equal(读取自动反代健康分(alphaWinner, 'alpha.example.com'), 3);
		assert.equal(读取自动反代健康分(alphaWinner, 'beta.example.com'), 0);
	});

	await t.test('should only record health for automatic pool candidates', () => {
		清理自动反代健康缓存();
		设置自动反代策略测试状态({
			候选集合: new Set(['198.51.100.1:443', '198.51.100.2:443'])
		});
		assert.equal(是否允许记录自动反代健康结果('198.51.100.1:443'), true);
		assert.equal(是否允许记录自动反代健康结果('203.0.113.10:8443'), false);
		记录自动反代健康结果('198.51.100.1:443', true, 'target.example.com');
		assert.equal(读取自动反代健康分('198.51.100.1:443', 'target.example.com'), 2);
		设置自动反代策略测试状态(null);
		assert.equal(是否允许记录自动反代健康结果('198.51.100.1:443'), false);
	});

	await t.test('should summarize recent health bands without exposing candidates', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		await 选择反代策略({ KV: { get: async () => '198.51.100.1:443\n198.51.100.2:443\n198.51.100.3:443' }, AUTO_PROXY_POOL_SIZE: '3' }, {
			host: 'example.com',
			colo: 'HKG',
			目标站点: 'alpha.example.com'
		});
		记录自动反代健康结果('198.51.100.1:443', true, 'alpha.example.com');
		记录自动反代健康结果('198.51.100.1:443', true, 'alpha.example.com');
		记录自动反代健康结果('198.51.100.2:443', false, 'alpha.example.com');
		const 摘要 = 读取自动反代健康摘要();
		assert.deepEqual(摘要, {
			recentHealthyCandidates: 1,
			recentUnhealthyCandidates: 1,
			topScoreBand: 'warm',
			healthStatus: 'stable',
		});
		assert.equal(摘要.rawCandidates, undefined);
	});
});

test('过滤自动反代候选 (Automatic Proxy Candidate Filter)', () => {
	const 结果 = 过滤自动反代候选([
		'198.51.100.1:443#primary',
		'example.com:8443',
		'[2606:4700::1111]:2053',
		'198.51.100.2:9999',
		'bad host:443',
		'198.51.100.999:443',
		'198.51.100.3',
		''
	]);
	const 诊断 = 读取自动反代过滤诊断();
	assert.deepEqual(结果, ['198.51.100.1:443', 'example.com:8443', '[2606:4700::1111]:2053']);
	assert.deepEqual(诊断, {
		updatedAt: 诊断.updatedAt,
		totalCandidates: 8,
		acceptedCandidates: 3,
		filteredCandidates: 5,
		acceptanceRate: 37.5,
		reasons: {
			empty: 1,
			malformed: 1,
			disallowed_port: 1,
			invalid_host: 2,
		},
	});
});

test('读取config_JSON contract split (Base Config / Admin Extensions)', async (t) => {
	await t.test('should keep base config loading on config.json only', async () => {
		const m = createKvMock({});
		const result = await 读取config_JSON({ KV: m.kv }, 'example.com', 'uuid-123', 'UA/1.0', false, false);
		assert.deepEqual(m.getCalls, ['config.json']);
		assert.deepEqual(m.putCalls.length, 1);
		assert.equal(m.putCalls[0][0], 'config.json');
		assert.equal(result.HOST, 'example.com');
		assert.equal(result.UUID, 'uuid-123');
		assert.equal(result.TG.启用, false);
		assert.equal(result.CF.Usage.success, false);
	});

	await t.test('should load tg.json and cf.json only when admin extensions are requested', async () => {
		清理基础配置缓存();
		const m = createKvMock({
			'tg.json': JSON.stringify({ BotToken: 'bot-secret', ChatID: 'chat-id' }),
			'cf.json': JSON.stringify({ UsageAPI: 'https://example.com/usage' }),
		});
		const kv = m.kv;
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
			assert.deepEqual(m.getCalls, ['config.json', 'tg.json', 'cf.json']);
			assert.equal(m.putCalls.length, 1);
			assert.equal(m.putCalls[0][0], 'config.json');
			assert.equal(result.TG.ChatID, 'chat-id');
			assert.notEqual(result.TG.BotToken, 'bot-secret');
			assert.equal(result.CF.Usage.success, true);
			assert.equal(result.CF.Usage.pages, 1);
		} finally {
			global.fetch = originalFetch;
		}
	});

	await t.test('should resolve Cloudflare usage credentials when admin extensions use account keys', async () => {
		清理基础配置缓存();
		清理配置缓存();
		const m = createKvMock({
			'tg.json': JSON.stringify({ BotToken: 'bot-secret', ChatID: 'chat-id' }),
			'cf.json': JSON.stringify({ Email: 'ops@example.com', GlobalAPIKey: 'global-key' }),
		});
		const kv = m.kv;
		const originalFetch = global.fetch;
		global.fetch = async (input, init) => {
			const url = String(input);
			if (url.endsWith('/accounts')) {
				assert.equal(init.headers['X-AUTH-EMAIL'], 'ops@example.com');
				assert.equal(init.headers['X-AUTH-KEY'], 'global-key');
				return new Response(JSON.stringify({ result: [{ id: 'account-1', name: 'ops@example.com' }] }), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			if (url.endsWith('/graphql')) {
				assert.equal(init.headers['X-AUTH-EMAIL'], 'ops@example.com');
				assert.equal(init.headers['X-AUTH-KEY'], 'global-key');
				return new Response(JSON.stringify({
					data: {
						viewer: {
							accounts: [{
								pagesFunctionsInvocationsAdaptiveGroups: [{ sum: { requests: 11 } }],
								workersInvocationsAdaptive: [{ sum: { requests: 7 } }],
							}],
						},
					},
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			throw new Error(`unexpected fetch: ${url}`);
		};

		try {
			清理基础配置缓存();
			const result = await 读取config_JSON({ KV: kv }, 'example.com', 'uuid-123', 'UA/1.0', false, true);
			assert.equal(result.CF.Usage.success, true);
			assert.equal(result.CF.Usage.pages, 11);
			assert.equal(result.CF.Usage.workers, 7);
			assert.equal(result.CF.Usage.total, 18);
		} finally {
			global.fetch = originalFetch;
		}
	});

	await t.test('should reuse base config from memory within the cache window', async () => {
		清理基础配置缓存();
		const configJson = {
			HOST: 'cached.example.com',
			UUID: 'uuid-abc',
			gRPCUserAgent: 'UA',
			优选订阅生成: {
				local: true,
				本地IP库: { 随机IP: true, 随机数量: 16, 指定端口: -1 },
				SUB: null,
				SUBNAME: 'edge tunnel',
				SUBUpdateTime: 3,
				TOKEN: 'token',
			},
			订阅转换配置: { SUBAPI: 'https://example.com', SUBCONFIG: 'x', SUBEMOJI: false },
			反代: {
				auto: 'auto',
				SOCKS5: { 启用: null, 全局: false, 账号: null, 白名单: [] },
				路径模板: {
					auto: 'proxyip={{IP:PORT}}',
					SOCKS5: { 全局: 'socks5://{{IP:PORT}}', 标准: 'socks5={{IP:PORT}}' },
					HTTP: { 全局: 'http://{{IP:PORT}}', 标准: 'http={{IP:PORT}}' },
				},
			},
			TG: { 启用: false, BotToken: null, ChatID: null },
			CF: {
				Email: null,
				GlobalAPIKey: null,
				AccountID: null,
				APIToken: null,
				UsageAPI: null,
				Usage: { success: false, pages: 0, workers: 0, total: 0, max: 100000 },
			},
		};
		const m = createKvMock({
			'config.json': JSON.stringify(configJson),
		});
		const kv = m.kv;
		const originalNow = Date.now;
		try {
			Date.now = () => 3_000_000;
			await 读取config_JSON({ KV: kv }, 'cached.example.com', 'uuid-abc', 'UA/1.0', false, false);
			Date.now = () => 3_000_000 + 60_000;
			await 读取config_JSON({ KV: kv }, 'cached.example.com', 'uuid-abc', 'UA/1.0', false, false);
			assert.equal(m.getCalls.filter(key => key === 'config.json').length, 1);
		} finally {
			Date.now = originalNow;
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
	await t.test('should expose recovery routes without secrets', async () => {
		清理自动反代池缓存();
		清理自动反代健康缓存();
		await 选择反代策略({ KV: { get: async () => '198.51.100.1:443\n203.0.113.2:22\nbad host:443' }, AUTO_PROXY_POOL_SIZE: '4' }, {
			host: 'example.com',
			colo: 'HKG',
			目标站点: 'target.example.com'
		});
		const view = 生成管理诊断视图(new URL('https://example.com/admin/diagnostics'), {
			LINK: 'vless://stable-entry',
			优选订阅生成: { SUBUpdateTime: 3 },
		}, { OFF_LOG: '1' });

		assert.equal(view.route, '/admin/diagnostics');
		assert.equal(view.host, 'example.com');
		assert.equal(view.subscription.stableFirstEntry, true);
		assert.equal(view.subscription.updateHours, 3);
		assert.equal(view.logging.offLog, true);
		assert.equal(view.autoProxyPool.filtering.totalCandidates, 3);
		assert.equal(view.autoProxyPool.filtering.acceptedCandidates, 1);
		assert.equal(view.autoProxyPool.filtering.filteredCandidates, 2);
		assert.equal(view.autoProxyPool.filtering.acceptanceRate, 33.3);
		assert.equal(view.autoProxyPool.filtering.lastPoolSize, 1);
		assert.equal(view.autoProxyPool.filtering.lastPoolLimit, 4);
		assert.equal(view.autoProxyPool.filtering.status, 'constrained');
		assert.deepEqual(view.autoProxyPool.filtering.reasons, { disallowed_port: 1, invalid_host: 1 });
		assert.deepEqual(view.autoProxyPool.health, {
			recentHealthyCandidates: 0,
			recentUnhealthyCandidates: 0,
			topScoreBand: 'none',
			healthStatus: 'unknown',
		});
		assert.equal(view.autoProxyPool.filtering.rawCandidates, undefined);
		assert.ok(Array.isArray(view.recovery));
		assert.equal(view.recovery[0], '先确认 /admin 可打开');
		assert.equal(typeof view.build.gitDescribe, 'string');
		assert.ok(view.build.gitDescribe.length > 0);
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

test('请求日志记录 — KV 写入 log.json (D3)', async (t) => {
	await t.test('非 Get_SUB 首次写入应落盘 log.json', async () => {
		const m = createKvMock({});
		const env = { KV: m.kv };
		const url = `https://example.com/admin?t=${Date.now()}`;
		const base = new Request(url, { headers: { 'User-Agent': 'D3-kv-test' } });
		const request = new Proxy(base, {
			get(target, prop, receiver) {
				if (prop === 'cf') return { asn: 13335, asOrganization: 'TestNet', country: 'US', city: 'Test' };
				return Reflect.get(target, prop, receiver);
			},
		});
		const config_JSON = {
			TG: { 启用: false },
			优选订阅生成: { SUBNAME: 'edge', SUBUpdateTime: 3 },
			CF: { Usage: { success: false, total: 0, max: 100000 } },
		};
		await 请求日志记录(env, request, '198.51.100.2', 'D3_KV_Test', config_JSON, true);
		assert.ok(m.getCalls.includes('log.json'));
		const put = m.putCalls.find((p) => p[0] === 'log.json');
		assert.ok(put);
		const 日志数组 = JSON.parse(put[1]);
		assert.ok(Array.isArray(日志数组));
		assert.equal(日志数组[0].TYPE, 'D3_KV_Test');
		assert.equal(日志数组[0].IP, '198.51.100.2');
	});
});

test('C2 — 登录失败指数退避（KV 仅状态跃迁 + 日写熔断）', async (t) => {
	const reqLogin = (ip, bodyStr) => {
		const base = new Request('https://et.example/login', {
			method: 'POST',
			headers: { 'CF-Connecting-IP': ip, 'Content-Type': 'application/x-www-form-urlencoded' },
			body: bodyStr,
		});
		return new Proxy(base, {
			get(target, prop, receiver) {
				if (prop === 'cf') return { colo: 'TST', asn: 13335 };
				return Reflect.get(target, prop, receiver);
			},
		});
	};

	await t.test('锁定时长：5min → 10min → 封顶 24h', () => {
		assert.equal(登录退避_计算锁定时长毫秒(0), 300000);
		assert.equal(登录退避_计算锁定时长毫秒(1), 600000);
		assert.equal(登录退避_计算锁定时长毫秒(12), 86400000);
		assert.equal(登录退避_计算锁定时长毫秒(99), 86400000);
	});

	await t.test('前四次错误不落 KV put；第五次写入一次', async () => {
		登录退避_测试重置内存();
		const { kv, putCalls } = createKvMock({});
		const env = { KEY: 'k', ADMIN: 'goodpw', KV: kv };
		const ip = '203.0.113.10';
		for (let i = 0; i < 4; i++) {
			const res = await worker.fetch(reqLogin(ip, 'password=bad'), env, {});
			assert.equal(res.status, 401, `round ${i + 1}`);
		}
		assert.equal(putCalls.length, 0);
		const res5 = await worker.fetch(reqLogin(ip, 'password=bad'), env, {});
		assert.equal(res5.status, 401);
		assert.equal(putCalls.length, 1);
		const stored = JSON.parse(putCalls[0][1]);
		assert.ok(stored.锁定且直到 > Date.now());
		assert.equal(stored.下一档锁梯级, 1);
		const res6 = await worker.fetch(reqLogin(ip, 'password=bad'), env, {});
		assert.equal(res6.status, 429);
		assert.equal(putCalls.length, 1);
	});

	await t.test('日写 ≥800 时第五次不再 put（内存锁定）', async () => {
		登录退避_测试重置内存();
		登录退避_测试置日写次数(800);
		const { kv, putCalls } = createKvMock({});
		const env = { KEY: 'k', ADMIN: 'goodpw', KV: kv };
		const ip = '203.0.113.20';
		for (let i = 0; i < 5; i++) {
			await worker.fetch(reqLogin(ip, 'password=bad'), env, {});
		}
		assert.equal(putCalls.length, 0);
		assert.equal(登录退避_当日KV写次数(), 800);
	});

	await t.test('登录成功 delete 计一次日写', async () => {
		登录退避_测试重置内存();
		const { kv, putCalls, deleteCalls } = createKvMock({
			[`login_attempts_203.0.113.30`]: JSON.stringify({ 锁定且直到: Date.now() - 5000, 下一档锁梯级: 1 }),
		});
		const env = { KEY: 'k', ADMIN: 'goodpw', KV: kv };
		const before = 登录退避_当日KV写次数();
		const res = await worker.fetch(reqLogin('203.0.113.30', 'password=goodpw'), env, {});
		assert.equal(res.status, 200);
		assert.ok(deleteCalls.includes('login_attempts_203.0.113.30'));
		assert.equal(登录退避_当日KV写次数(), before + 1);
	});
});

test('清理Cloudflare使用量缓存 (Cloudflare Usage Cache Reset)', async () => {
	清理Cloudflare使用量缓存();
	// 先占位写入，确保清理会同时移除两个缓存层。
	const usageCache = globalThis.__edgetunnelUsageCacheForTest;
	if (usageCache && typeof usageCache.set === 'function') {
		usageCache.set('x', { promise: Promise.resolve({ success: true }), expiresAt: Date.now() + 1000 });
	}
	const cfUsageCache = globalThis.__edgetunnelCfUsageCacheForTest;
	if (cfUsageCache && typeof cfUsageCache.set === 'function') {
		cfUsageCache.set('x', { promise: Promise.resolve({ success: true }), timestamp: Date.now(), data: { success: true } });
	}
	清理Cloudflare使用量缓存();
	assert.equal(usageCache ? usageCache.size : 0, 0);
	assert.equal(cfUsageCache ? cfUsageCache.size : 0, 0);
});
