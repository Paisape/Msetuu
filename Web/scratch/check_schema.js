const fs = require('fs');
const content = fs.readFileSync('src/prisma/schema.prisma', 'utf8');
const lines = content.split('\n');
console.log('--- Models in schema.prisma ---');
lines.forEach((l, idx) => {
  if (l.trim().startsWith('model ')) {
    console.log(`${idx + 1}: ${l.trim()}`);
  }
});
