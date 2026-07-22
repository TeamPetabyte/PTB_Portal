import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const tables = await prisma.$queryRaw`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
`;

console.log(`Connected to: ${process.env.DATABASE_URL.split("@")[1]}`);
console.log(`Tables in public schema: ${tables.length}\n`);

for (const { table_name } of tables) {
  const [{ count }] = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int AS count FROM "${table_name}";`
  );
  console.log(`  ${table_name.padEnd(20)} ${count} rows`);
}

await prisma.$disconnect();
