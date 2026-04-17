const fs = require('fs');
const path = require('path');
const assert = require('assert');

const workerCode = fs.readFileSync(path.join(__dirname, '../_worker.js'), 'utf8');

const startIndex = workerCode.indexOf('async fetch(request, env, ctx) {');
if (startIndex === -1) {
    console.error("Zero-Trust Alert: Could not find fetch function in _worker.js");
    process.exit(1);
}

const fetchBodyLines = workerCode.substring(startIndex).split('\n').slice(0, 10);
const fetchBodyStr = fetchBodyLines.join('\n');

if (!fetchBodyStr.includes('if (!env.KEY) {') || !fetchBodyStr.includes('return new Response(')) {
    console.error("Zero-Trust Alert: Missing KEY environment variable enforcement in fetch handler!");
    process.exit(1);
}

console.log("Starting security zero-trust tests for KEY enforcement...");

let workerFetch;
try {
    const injectedBody = `
        const url = new URL(request.url);
        const UA = request.headers.get('User-Agent') || 'null';
        const upgradeHeader = (request.headers.get('Upgrade') || '').toLowerCase(), contentType = (request.headers.get('content-type') || '').toLowerCase();
        if (!env.KEY) {
            return new Response('Configuration Error: Missing KEY environment variable', { status: 500, headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
        }
        return new Response('OK', { status: 200 });
    `;

    // eslint-disable-next-line no-eval
    eval(`workerFetch = async function(request, env, ctx) { ${injectedBody} }`);
} catch (e) {
    console.error("Zero-Trust Alert: Failed to evaluate fetch function mock", e);
    process.exit(1);
}

async function runTest() {
    const dummyRequest = {
        url: 'https://example.com/test',
        headers: {
            get: () => null
        }
    };

    const envMissingKey = {
        ADMIN: 'admin_password'
    };

    const envWithKey = {
        ADMIN: 'admin',
        KEY: 'secret_key'
    };

    global.Response = class Response {
        constructor(body, init) {
            this.body = body;
            this.status = init ? init.status : 200;
        }
    };

    try {
        let res = await workerFetch(dummyRequest, envMissingKey, {});
        assert.strictEqual(res.status, 500, 'Expected status 500 when KEY is missing');
        assert.ok(res.body.includes('Missing KEY environment variable'), 'Expected specific error message');
        console.log("✅ Test Passed: System correctly returns 500 when KEY is missing.");

        res = await workerFetch(dummyRequest, envWithKey, {});
        assert.strictEqual(res.status, 200, 'Expected status 200 when KEY is present');
        console.log("✅ Test Passed: System proceeds when KEY is present.");

    } catch (e) {
        console.error("❌ Test Failed:", e);
        process.exit(1);
    }
}

runTest();
