const fs = require('fs');
const path = require('path');
const assert = require('assert');
const test = require('node:test');

const workerCode = fs.readFileSync(path.join(__dirname, '../_worker.js'), 'utf8');

test('admin QR subscription onboarding contract', () => {
	assert.ok(workerCode.includes("访问路径 === 'admin/config.json'"), 'admin/config.json route must remain available');
	assert.ok(workerCode.includes('config_JSON.LINK'), 'config_JSON.LINK must remain available for QR generation');
	assert.ok(workerCode.includes('Profile-web-page-url'), 'subscription response must expose admin page URL for clients');
	assert.ok(workerCode.includes('Subscription-Userinfo'), 'subscription response must keep userinfo header for clients');
});
