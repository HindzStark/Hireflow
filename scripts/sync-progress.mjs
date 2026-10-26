#!/usr/bin/env node
/**
 * Keeps docs/PROGRESS.md in step with git history.
 * Runs from the Claude Code Stop hook (.claude/settings.json) after every run.
 *
 *  1. TICK     checklist lines (`- [ ] ... HF-n ...`) whose ticket(s) appear in a
 *              `Refs: HF-n` footer of a commit reachable from `develop` or `main`
 *              (i.e. merged work). Lines with several keys tick when all are merged.
 *  2. ADD      merged tickets that no checklist line mentions are appended under
 *              "Other tickets (auto-added from git history)".
 *  3. SUMMARISE rewrites the AUTO-SYNC block: done / remaining / next ticket.
 *
 * Never unticks anything (manual ticks are kept). Idempotent: writes only on change.
 * Usage: node scripts/sync-progress.mjs [--dry]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'docs', 'PROGRESS.md');
const dry = process.argv.includes('--dry');

const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};

if (!existsSync(file) || git(['rev-parse', '--git-dir']) === null) process.exit(0);
const refs = ['develop', 'main'].filter(
  (r) => git(['rev-parse', '--verify', '--quiet', `refs/heads/${r}`]) !== null,
);
if (refs.length === 0) process.exit(0);

// ── 1. merged tickets: key → subject of the most recent commit that references it
const merged = new Map();
const log = git(['log', ...refs, '--no-merges', '--format=%s%x1f%b%x1e']) ?? '';
for (const record of log.split('\x1e')) {
  const [subject = '', body = ''] = record.split('\x1f');
  for (const footer of body.matchAll(/^(?:Refs?|Closes|Fixes|Resolves):[ \t]*(.+)$/gim)) {
    for (const key of footer[1].matchAll(/\bHF-(\d+)\b/g)) {
      if (!merged.has(+key[1])) merged.set(+key[1], subject.trim());
    }
  }
}

// ── 2. walk the checklist
const original = readFileSync(file, 'utf8');
const eol = original.includes('\r\n') ? '\r\n' : '\n';
const lines = original.split(/\r?\n/);
const states = new Map(); // key → [done, done, …] one entry per checklist line that mentions it
const labels = new Map(); // key → text of the first checklist line that mentions it
const ticked = [];
const keysIn = (s) => [...s.matchAll(/\bHF-(\d+)\b/g)].map((m) => +m[1]);

const record = (keys, done, label) => {
  for (const k of keys) {
    if (!states.has(k)) states.set(k, []);
    states.get(k).push(done);
    if (!labels.has(k)) labels.set(k, label);
  }
};

lines.forEach((line, i) => {
  const m = line.match(/^(\s*[-*] )\[( |x|X)\](.*)$/);
  if (!m) return;
  const keys = keysIn(m[3]);
  if (keys.length === 0) return;
  let done = m[2] !== ' ';
  if (!done && keys.every((k) => merged.has(k))) {
    lines[i] = `${m[1]}[x]${m[3]}`;
    ticked.push(...keys);
    done = true;
  }
  record(keys, done, m[3].trim());
});

// ── 3. merged tickets the checklist doesn't mention yet → add them
const added = [...merged.keys()].filter((k) => !states.has(k)).sort((a, b) => a - b);
if (added.length > 0) {
  const newLines = added.map((k) => `- [x] HF-${k} ${merged.get(k)} _(auto-added from git)_`);
  const heading = '### Other tickets (auto-added from git history)';
  const at = lines.findIndex((l) => l.startsWith('### Other tickets'));
  if (at >= 0) {
    let end = at + 1;
    while (end < lines.length && lines[end].startsWith('- [')) end++;
    lines.splice(end, 0, ...newLines);
  } else {
    let target = lines.findIndex((l) => l.startsWith('Later phases'));
    if (target < 0) target = lines.findIndex((l) => l.startsWith('## Session log'));
    if (target < 0) target = lines.length;
    lines.splice(target, 0, heading, ...newLines, '');
  }
  added.forEach((k) => record([k], true, `HF-${k} ${merged.get(k)}`));
}

// ── 4. AUTO-SYNC summary block
const all = [...states.keys()].sort((a, b) => a - b);
const isDone = (k) => states.get(k).every(Boolean);
const doneKeys = all.filter(isDone);
const todoKeys = all.filter((k) => !isDone(k));
const fmt = (ks) => (ks.length ? ks.map((k) => `HF-${k}`).join(', ') : '_none_');
const pct = all.length ? Math.round((doneKeys.length / all.length) * 100) : 0;
const START = '<!-- AUTO-SYNC:START (maintained by scripts/sync-progress.mjs via the Stop hook; do not edit by hand) -->';
const END = '<!-- AUTO-SYNC:END -->';
const block = [
  START,
  `**Tickets: ${doneKeys.length}/${all.length} done (${pct}%)**, counted from \`Refs: HF-n\` footers of commits on \`${refs.join('` / `')}\``,
  `- ✅ **Done:** ${fmt(doneKeys)}`,
  `- ⏳ **Remaining:** ${fmt(todoKeys)}`,
  `- ▶ **Next ticket:** ${todoKeys.length ? labels.get(todoKeys[0]) : '🎉 all listed tickets are merged'}`,
  END,
];
const s = lines.findIndex((l) => l.startsWith('<!-- AUTO-SYNC:START'));
const e = lines.findIndex((l) => l.startsWith('<!-- AUTO-SYNC:END'));
if (s >= 0 && e > s) {
  lines.splice(s, e - s + 1, ...block);
} else {
  const h = lines.findIndex((l) => l.startsWith('## Current status'));
  let at = 1;
  if (h >= 0) {
    at = h + 1;
    while (at < lines.length && !lines[at].startsWith('|')) at++;
    while (at < lines.length && lines[at].startsWith('|')) at++;
  }
  lines.splice(at, 0, '', ...block);
}

// ── 5. write only when something changed; stamp the date only then
let next = lines.join(eol);
if (next === original) process.exit(0);
const today = new Date().toLocaleDateString('en-CA');
next = next.replace(/^(\| \*\*Last updated\*\* \| ).*?( \|)$/m, `$1${today}$2`);

const summary =
  `PROGRESS.md synced: ${doneKeys.length}/${all.length} tickets done` +
  (ticked.length ? ` · ticked ${fmt([...new Set(ticked)])}` : '') +
  (added.length ? ` · added ${fmt(added)}` : '') +
  (todoKeys.length ? ` · next HF-${todoKeys[0]}` : '');

if (dry) {
  console.log(summary);
} else {
  writeFileSync(file, next, 'utf8');
  console.log(JSON.stringify({ systemMessage: summary }));
}
