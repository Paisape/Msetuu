const fs = require('fs');
const content = fs.readFileSync('src/prisma/seed.ts', 'utf8');
if (content.toLowerCase().includes('darshan')) {
  console.log('Found darshan in seed.ts');
  const lines = content.split('\n');
  lines.forEach((l, idx) => {
    if (l.toLowerCase().includes('darshan')) {
      console.log(`${idx + 1}: ${l}`);
    }
  });
} else {
  console.log('Darshan not found in seed.ts');
}
