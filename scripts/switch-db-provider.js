const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const provider = process.argv[2];

if (!['sqlite', 'postgresql'].includes(provider)) {
  console.error('Usage: node scripts/switch-db-provider.js <sqlite|postgresql>');
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (provider === 'postgresql') {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('✅ Switched Prisma provider to "postgresql" for Vercel deployment.');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('✅ Switched Prisma provider to "sqlite" for local development.');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
