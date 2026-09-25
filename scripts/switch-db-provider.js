const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let provider = process.argv[2];

if (!provider || provider === 'auto' || provider === 'detect') {
  if (process.env.VERCEL === '1' || (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:'))) {
    provider = 'postgresql';
  } else {
    provider = 'sqlite';
  }
}

if (!['sqlite', 'postgresql'].includes(provider)) {
  console.error('Usage: node scripts/switch-db-provider.js <sqlite|postgresql|auto>');
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

if (provider === 'postgresql') {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  console.log('✅ Switched Prisma provider to "postgresql" (Vercel/Production mode).');
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  console.log('✅ Switched Prisma provider to "sqlite" (Local development mode).');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
