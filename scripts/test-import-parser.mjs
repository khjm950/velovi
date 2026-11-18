import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('app.js', 'utf8');
const names = ['normalizeStatementDate', 'parseStatementNumber', 'inferStatementCategory', 'parseStatementLines'];
const snippets = [];

for (let index = 0; index < names.length; index++) {
  const start = source.indexOf('function ' + names[index] + '(');
  assert.notEqual(start, -1, 'Missing parser function: ' + names[index]);
  let end = source.indexOf('\nfunction ', start + 1);
  if (end === -1) end = source.length;
  snippets.push(source.slice(start, end));
}

const context = {};
vm.runInNewContext(snippets.join('\n') + '\nthis.parser = { normalizeStatementDate, parseStatementNumber, parseStatementLines };', context);
const parser = context.parser;

assert.equal(parser.normalizeStatementDate('2026-10-01'), '2026-10-01');
assert.equal(parser.normalizeStatementDate('01.10.2026'), '2026-10-01');
assert.equal(parser.normalizeStatementDate('1/10/26'), '2026-10-01');
assert.equal(parser.normalizeStatementDate('31.13.2026'), '');
assert.equal(parser.normalizeStatementDate('31.02.2026'), '');

assert.equal(parser.parseStatementNumber('1.234,56'), 1234.56);
assert.equal(parser.parseStatementNumber('1,234.56'), 1234.56);
assert.equal(parser.parseStatementNumber('-12,34'), -12.34);
assert.equal(parser.parseStatementNumber('2 500,00'), 2500);

const rows = parser.parseStatementLines([
  '01.10.2026 REWE Markt -12,34',
  '02.10.2026 Gehalt 2.500,00',
  '03.10.2026 Miete 950,00',
  '03.10.2026 Miete 950,00'
].join('\n'));

assert.equal(rows.length, 3, 'Duplicate statement rows should be removed.');
assert.equal(rows[0].date, '2026-10-01');
assert.equal(rows[0].type, 'expense');
assert.equal(rows[0].amount, 12.34);
assert.equal(rows[1].type, 'income');
assert.equal(rows[1].amount, 2500);
assert.equal(rows[2].type, 'expense');

console.log('Statement import parser tests passed.');
