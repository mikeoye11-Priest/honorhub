import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);

if (!match) {
  throw new Error('No inline script found in index.html');
}

new Function(match[1]);
console.log('embedded script syntax ok');
