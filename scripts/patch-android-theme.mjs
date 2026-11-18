import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve('android/app/src/main/res/values/styles.xml');
let xml = readFileSync(path, 'utf8');

function addItems(styleName, items) {
  const pattern = new RegExp('(<style name="' + styleName + '"[^>]*>)([\\s\\S]*?)(</style>)');
  const match = xml.match(pattern);
  if (!match) throw new Error('Android theme not found: ' + styleName);
  let body = match[2];
  for (const [name, value] of items) {
    const itemPattern = new RegExp('<item name="' + name + '">[\\s\\S]*?</item>');
    const item = '<item name="' + name + '">' + value + '</item>';
    if (itemPattern.test(body)) body = body.replace(itemPattern, item);
    else body += '\n        ' + item;
  }
  xml = xml.replace(match[0], match[1] + body + '\n    ' + match[3]);
}

addItems('AppTheme.NoActionBar', [
  ['android:statusBarColor', '#10241b'],
  ['android:navigationBarColor', '#10241b'],
  ['android:windowLightStatusBar', 'false'],
  ['android:windowLightNavigationBar', 'false']
]);
addItems('AppTheme.NoActionBarLaunch', [
  ['android:statusBarColor', '#10241b'],
  ['android:navigationBarColor', '#10241b'],
  ['android:windowLightStatusBar', 'false'],
  ['android:windowLightNavigationBar', 'false']
]);

writeFileSync(path, xml);
console.log('Android status and navigation bars themed to match Velovi.');
