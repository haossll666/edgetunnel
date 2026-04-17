const fs = require('fs');

let content = fs.readFileSync('_worker.js', 'utf8');

const search = `		const 反代IP数组 = await 整理成数组(proxyIP);
		let 所有反代数组 = [];

		// 遍历数组中的每个IP元素进行处理
		for (const singleProxyIP of 反代IP数组) {
			if (singleProxyIP.includes('.william')) {
				try {
					let txtRecords = await DoH查询(singleProxyIP, 'TXT');
					let txtData = txtRecords.filter(r => r.type === 16).map(r => /** @type {string} */(r.data));
					if (txtData.length === 0) {
						log(\`[反代解析] 默认DoH未获取到TXT记录，切换Google DoH重试 \${singleProxyIP}\`);
						txtRecords = await DoH查询(singleProxyIP, 'TXT', 'https://dns.google/dns-query');
						txtData = txtRecords.filter(r => r.type === 16).map(r => /** @type {string} */(r.data));
					}
					if (txtData.length > 0) {
						let data = txtData[0];
						if (data.startsWith('"') && data.endsWith('"')) data = data.slice(1, -1);
						const prefixes = data.replace(/\\\\010/g, ',').replace(/\\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
						所有反代数组.push(...prefixes.map(prefix => 解析地址端口字符串(prefix)));
					}
				} catch (error) {
					console.error('解析William域名失败:', error);
				}
			} else {
				let [地址, 端口] = 解析地址端口字符串(singleProxyIP);

				if (singleProxyIP.includes('.tp')) {
					const tpMatch = singleProxyIP.match(/\\.tp(\\d+)/);
					if (tpMatch) 端口 = parseInt(tpMatch[1], 10);
				}

				// 判断是否是域名（非IP地址）
				const ipv4Regex = /^(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/;
				const ipv6Regex = /^\\[?([a-fA-F0-9:]+)\\]?$/;

				if (!ipv4Regex.test(地址) && !ipv6Regex.test(地址)) {
					// 并行查询 A 和 AAAA 记录
					let [aRecords, aaaaRecords] = await Promise.all([
						DoH查询(地址, 'A'),
						DoH查询(地址, 'AAAA')
					]);

					let ipv4List = aRecords.filter(r => r.type === 1).map(r => r.data);
					let ipv6List = aaaaRecords.filter(r => r.type === 28).map(r => \`[\${r.data}]\`);
					let ipAddresses = [...ipv4List, ...ipv6List];

					// 默认DoH无结果时，切换Google DoH重试
					if (ipAddresses.length === 0) {
						log(\`[反代解析] 默认DoH未获取到解析结果，切换Google DoH重试 \${地址}\`);
						[aRecords, aaaaRecords] = await Promise.all([
							DoH查询(地址, 'A', 'https://dns.google/dns-query'),
							DoH查询(地址, 'AAAA', 'https://dns.google/dns-query')
						]);
						ipv4List = aRecords.filter(r => r.type === 1).map(r => r.data);
						ipv6List = aaaaRecords.filter(r => r.type === 28).map(r => \`[\${r.data}]\`);
						ipAddresses = [...ipv4List, ...ipv6List];
					}

					if (ipAddresses.length > 0) {
						所有反代数组.push(...ipAddresses.map(ip => [ip, 端口]));
					} else {
						所有反代数组.push([地址, 端口]);
					}
				} else {
					所有反代数组.push([地址, 端口]);
				}
			}
		}`;

const replace = `		const 反代IP数组 = await 整理成数组(proxyIP);
		let 所有反代数组 = [];

		// 将数组分块，避免并发请求过多导致Cloudflare Worker达到子请求限制 (最大50个)
		const chunkSize = 5;
		for (let i = 0; i < 反代IP数组.length; i += chunkSize) {
			const chunk = 反代IP数组.slice(i, i + chunkSize);

			const chunkResults = await Promise.all(chunk.map(async (singleProxyIP) => {
				const resultGroup = [];
				if (singleProxyIP.includes('.william')) {
					try {
						let txtRecords = await DoH查询(singleProxyIP, 'TXT');
						let txtData = txtRecords.filter(r => r.type === 16).map(r => /** @type {string} */(r.data));
						if (txtData.length === 0) {
							log(\`[反代解析] 默认DoH未获取到TXT记录，切换Google DoH重试 \${singleProxyIP}\`);
							txtRecords = await DoH查询(singleProxyIP, 'TXT', 'https://dns.google/dns-query');
							txtData = txtRecords.filter(r => r.type === 16).map(r => /** @type {string} */(r.data));
						}
						if (txtData.length > 0) {
							let data = txtData[0];
							if (data.startsWith('"') && data.endsWith('"')) data = data.slice(1, -1);
							const prefixes = data.replace(/\\\\010/g, ',').replace(/\\n/g, ',').split(',').map(s => s.trim()).filter(Boolean);
							resultGroup.push(...prefixes.map(prefix => 解析地址端口字符串(prefix)));
						}
					} catch (error) {
						console.error('解析William域名失败:', error);
					}
				} else {
					let [地址, 端口] = 解析地址端口字符串(singleProxyIP);

					if (singleProxyIP.includes('.tp')) {
						const tpMatch = singleProxyIP.match(/\\.tp(\\d+)/);
						if (tpMatch) 端口 = parseInt(tpMatch[1], 10);
					}

					// 判断是否是域名（非IP地址）
					const ipv4Regex = /^(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$/;
					const ipv6Regex = /^\\[?([a-fA-F0-9:]+)\\]?$/;

					if (!ipv4Regex.test(地址) && !ipv6Regex.test(地址)) {
						// 并行查询 A 和 AAAA 记录
						let [aRecords, aaaaRecords] = await Promise.all([
							DoH查询(地址, 'A'),
							DoH查询(地址, 'AAAA')
						]);

						let ipv4List = aRecords.filter(r => r.type === 1).map(r => r.data);
						let ipv6List = aaaaRecords.filter(r => r.type === 28).map(r => \`[\${r.data}]\`);
						let ipAddresses = [...ipv4List, ...ipv6List];

						// 默认DoH无结果时，切换Google DoH重试
						if (ipAddresses.length === 0) {
							log(\`[反代解析] 默认DoH未获取到解析结果，切换Google DoH重试 \${地址}\`);
							[aRecords, aaaaRecords] = await Promise.all([
								DoH查询(地址, 'A', 'https://dns.google/dns-query'),
								DoH查询(地址, 'AAAA', 'https://dns.google/dns-query')
							]);
							ipv4List = aRecords.filter(r => r.type === 1).map(r => r.data);
							ipv6List = aaaaRecords.filter(r => r.type === 28).map(r => \`[\${r.data}]\`);
							ipAddresses = [...ipv4List, ...ipv6List];
						}

						if (ipAddresses.length > 0) {
							resultGroup.push(...ipAddresses.map(ip => [ip, 端口]));
						} else {
							resultGroup.push([地址, 端口]);
						}
					} else {
						resultGroup.push([地址, 端口]);
					}
				}
				return resultGroup;
			}));

			for (const group of chunkResults) {
				所有反代数组.push(...group);
			}
		}`;

// Since the search string uses single quotes instead of template literals, replace CRLF just in case.
const searchRegEx = new RegExp(search.replace(/\r?\n/g, '\\r?\\n').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

if (content.match(searchRegEx)) {
    content = content.replace(searchRegEx, replace.replace(/\n/g, '\r\n'));
    fs.writeFileSync('_worker.js', content, 'utf8');
    console.log("Successfully patched _worker.js");
} else {
    console.log("Failed to find search string in _worker.js");
}
