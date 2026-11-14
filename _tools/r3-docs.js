'use strict';
// Append one doc line for a REVIEW3 task to both local docs.
// Usage: node _tools/r3-docs.js D1 "notes" [commit]
const fs = require('fs');
const path = require('path');
const [task, notes, commit = 'this commit'] = process.argv.slice(2);
if (!task) { console.error('task required'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..');
const summary = path.join(ROOT, '_tools', 'reports', 'autopilot-summary.md');
const tasks = path.join(ROOT, 'TASKS.local.md');

const clean = String(notes || 'none').replace(/\s+/g, ' ').trim();
fs.appendFileSync(tasks, `\n## ${task} - DONE - ${clean} Commit: ${commit}. Leftover: none.\n`);

let s = '';
const header = '## Review3 task log\n\n| Task | Commit | Status | Notes |\n| --- | --- | --- | --- |\n';
if (fs.existsSync(summary)) {
  s = fs.readFileSync(summary, 'utf8');
}
if (!s.includes('## Review3 task log')) s += `\n${header}`;
s += `| ${task} | ${commit} | DONE | ${clean} |\n`;
fs.writeFileSync(summary, s);
console.log(`${task} logged`);
