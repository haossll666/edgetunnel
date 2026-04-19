#!/usr/bin/env node
/**
 * 将 `git describe --tags --dirty --always` 写入 `_worker.js` 的 `WorkerGitDescribe` 常量。
 * 供 CI 在跑测试/部署前调用；仓库默认保留占位符 GIT_DESCRIBE_NOT_SET。
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const workerPath = path.join(repoRoot, '_worker.js');

const describe = execSync('git describe --tags --dirty --always', { cwd: repoRoot, encoding: 'utf8' }).trim();

let src = fs.readFileSync(workerPath, 'utf8');
const re = /^const WorkerGitDescribe = [^;]+;/m;
if (!re.test(src)) {
	console.error('stamp-git-describe: 未找到 const WorkerGitDescribe 行');
	process.exit(1);
}
src = src.replace(re, `const WorkerGitDescribe = ${JSON.stringify(describe)};`);
fs.writeFileSync(workerPath, src);
console.log('WorkerGitDescribe <=', describe);
