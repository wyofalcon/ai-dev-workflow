
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CVstomize_Postgres_Schema_2025_0516@localhost:5433/cvstomize_production'
});

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users';
  `);
  console.table(res.rows);
  await client.end();
}

main();
