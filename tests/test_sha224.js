const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

// Debate Mode: Developer vs. Security vs. Zero-Trust Reviewer
// Dev: We need to test the sha224 function in _worker.js.
// Sec: Node.js fails to dynamically import `_worker.js` because of `import { connect } from 'cloudflare:sockets'` which throws `ERR_UNSUPPORTED_ESM_URL_SCHEME`.
// Zero-Trust: We must extract the `sha224` function string securely and accurately. A naive regex failed on nested braces. We can reliably isolate it by finding its start and balancing braces.

const workerCode = fs.readFileSync(path.join(__dirname, '../_worker.js'), 'utf8');

const startIndex = workerCode.indexOf('function sha224(s) {');
if (startIndex === -1) {
    console.error("Zero-Trust Alert: Could not find sha224 function in _worker.js");
    process.exit(1);
}

let braceCount = 0;
let endIndex = startIndex;
let started = false;

for (let i = startIndex; i < workerCode.length; i++) {
    if (workerCode[i] === '{') {
        braceCount++;
        started = true;
    } else if (workerCode[i] === '}') {
        braceCount--;
    }

    if (started && braceCount === 0) {
        endIndex = i;
        break;
    }
}

const sha224Code = workerCode.substring(startIndex, endIndex + 1);

// Securely evaluate the function in this module's scope
let sha224;
try {
    // eslint-disable-next-line no-eval
    eval(`sha224 = ${sha224Code.replace(/^function sha224/, 'function')}`);
} catch (e) {
    console.error("Zero-Trust Alert: Failed to evaluate sha224 function", e);
    process.exit(1);
}

console.log("Starting tests for sha224...");

// Helper to generate expected SHA224 hash natively to ensure correctness
const getExpectedHash = (input) => crypto.createHash('sha224').update(input, 'utf8').digest('hex');

// Test vectors from known standards (e.g. NIST, hash generators) and some edge cases
const testCases = [
    {
        input: "",
        expected: getExpectedHash(""),
        desc: "Empty string"
    },
    {
        input: "abc",
        expected: getExpectedHash("abc"),
        desc: "Short string 'abc'"
    },
    {
        input: "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq",
        expected: getExpectedHash("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"),
        desc: "Long string (multi-block)"
    },
    {
        input: "The quick brown fox jumps over the lazy dog",
        expected: getExpectedHash("The quick brown fox jumps over the lazy dog"),
        desc: "Standard sentence"
    },
    {
        input: "测试",
        expected: getExpectedHash("测试"),
        desc: "UTF-8 string (Multi-byte characters)"
    },
    {
        input: "A".repeat(1000),
        expected: getExpectedHash("A".repeat(1000)),
        desc: "Very long string to trigger multiple chunks"
    }
];

let failed = 0;

testCases.forEach((tc, idx) => {
    try {
        const result = sha224(tc.input);
        assert.strictEqual(result, tc.expected, `Test Case [${tc.desc}] Failed: Expected ${tc.expected}, but got ${result}`);
        console.log(`✅ Test ${idx + 1} Passed: [${tc.desc}]`);
    } catch (e) {
        console.error(`❌ Test ${idx + 1} Failed: [${tc.desc}]`);
        console.error(`   ${e.message}`);
        failed++;
    }
});

if (failed > 0) {
    console.error(`\n🚨 ${failed} test(s) failed.`);
    process.exit(1);
} else {
    console.log(`\n🎉 All ${testCases.length} tests passed successfully.`);
}
