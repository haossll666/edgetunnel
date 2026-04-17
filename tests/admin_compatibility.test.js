const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

const workerCode = fs.readFileSync(path.join(__dirname, '../_worker.js'), 'utf8');

test('admin QR subscription onboarding contract', () => {
	assert.ok(
		workerCode.includes("访问路径 === 'admin/config.json'"),
		'admin/config.json route must remain available for QR onboarding'
	);
	assert.ok(
		workerCode.includes('config_JSON.LINK ='),
		'config_JSON.LINK assignment must remain available for QR generation'
	);
	assert.ok(
		workerCode.includes("url.protocol + '//' + url.host + '/admin'"),
		'subscription metadata must keep the admin page URL'
	);
	assert.ok(
		workerCode.includes('"Profile-web-page-url": url.protocol + \'//\' + url.host + \'/admin\''),
		'subscription response must continue to emit Profile-web-page-url'
	);
	assert.ok(
		workerCode.includes('"Subscription-Userinfo": `upload=${pagesSum}; download=${workersSum}; total=${total}; expire=${expire}`'),
		'subscription response must continue to emit the userinfo header in the expected format'
	);
});
