/**
 * 极简内存 KV namespace mock，对齐 Workers KV 常用子集：
 * get / put / delete / list，put 支持 { expirationTtl: seconds }。
 * 过期在 get/list 时惰性剔除（与真实 KV「到期不可见」足够接近）。
 */

/** @typedef {{ value: string, expiresAt: number | null }} KvEntry */

/**
 * @param {Record<string, string | null | undefined>} [initialEntries]  key -> 初始字符串值
 * @returns {{
 *   kv: { get: Function, put: Function, delete: Function, list: Function },
 *   getCalls: string[],
 *   putCalls: [string, string, { expirationTtl?: number }?][],
 *   deleteCalls: string[],
 *   listCalls: unknown[],
 *   _entries: Map<string, KvEntry>,
 * }}
 */
export function createKvMock(initialEntries = {}) {
	/** @type {Map<string, KvEntry>} */
	const store = new Map();
	const getCalls = [];
	const putCalls = [];
	const deleteCalls = [];
	const listCalls = [];

	for (const [k, v] of Object.entries(initialEntries)) {
		if (v != null) store.set(k, { value: String(v), expiresAt: null });
	}

	function isExpired(entry) {
		return entry.expiresAt != null && Date.now() >= entry.expiresAt;
	}

	const kv = {
		async get(key) {
			getCalls.push(key);
			const entry = store.get(key);
			if (!entry) return null;
			if (isExpired(entry)) {
				store.delete(key);
				return null;
			}
			return entry.value;
		},
		async put(key, value, options) {
			putCalls.push([key, value, options]);
			let expiresAt = null;
			if (options && typeof options.expirationTtl === 'number') {
				expiresAt = Date.now() + options.expirationTtl * 1000;
			}
			store.set(key, { value: String(value), expiresAt });
		},
		async delete(key) {
			deleteCalls.push(key);
			return store.delete(key);
		},
		async list(options = {}) {
			listCalls.push(options);
			const prefix = options.prefix ?? '';
			const keys = [];
			for (const name of store.keys()) {
				if (!name.startsWith(prefix)) continue;
				const entry = store.get(name);
				if (entry && !isExpired(entry)) keys.push({ name });
			}
			return { keys, list_complete: true };
		},
	};

	return { kv, getCalls, putCalls, deleteCalls, listCalls, _entries: store };
}
