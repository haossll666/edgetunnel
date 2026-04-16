const assert = require('assert');

// Simulate the sanitizer from _worker.js
function sanitizePath(pathname) {
    let 安全路径 = pathname;
    if (安全路径) {
        安全路径 = 安全路径.split('\\').join('/');
        while (安全路径.startsWith('//')) {
            安全路径 = 安全路径.slice(1);
        }
    }
    return 安全路径;
}

console.log("Starting SSRF Path Sanitizer tests...");

let passed = 0;
let failed = 0;

const testCases = [
    { input: '/normal/path', expected: '/normal/path' },
    { input: '//evil.com', expected: '/evil.com' },
    { input: '///evil.com', expected: '/evil.com' },
    { input: '/\\evil.com', expected: '/evil.com' },
    { input: '\\/evil.com', expected: '/evil.com' },
    { input: '\\\\evil.com', expected: '/evil.com' },
    { input: '//evil.com//foo', expected: '/evil.com//foo' }, // Internal double slashes are preserved
    { input: '', expected: '' },
    { input: '/', expected: '/' },
    { input: null, expected: null },
    { input: undefined, expected: undefined },
];

testCases.forEach((tc, idx) => {
    try {
        const result = sanitizePath(tc.input);
        assert.strictEqual(result, tc.expected, `Test Case ${idx + 1} Failed: Input '${tc.input}', Expected '${tc.expected}', got '${result}'`);
        passed++;
    } catch (e) {
        console.error(e.message);
        failed++;
    }
});

if (failed === 0) {
    console.log(`✅ All ${passed} tests passed successfully.`);
} else {
    console.error(`❌ ${failed} tests failed.`);
    process.exit(1);
}
