
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:CVstomize_Postgres_Schema_2025_0516@localhost:5433/cvstomize_production'
});

async function main() {
  await client.connect();
  console.log('Connected to DB');

  try {
    console.log('Dropping incorrect table...');
    await client.query('DROP TABLE IF EXISTS "uploaded_resumes"');

    console.log('Creating uploaded_resumes table (with UUID user_id)...');
    await client.query(`
      CREATE TABLE "uploaded_resumes" (
          "id" TEXT NOT NULL,
          "user_id" UUID NOT NULL,
          "filename" TEXT NOT NULL,
          "mime_type" TEXT NOT NULL,
          "file_size" INTEGER NOT NULL,
          "raw_text" TEXT NOT NULL,
          "parsed_data" JSONB,
          "storage_path" TEXT,
          "storage_bucket" TEXT,
          "is_primary" BOOLEAN NOT NULL DEFAULT false,
          "label" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "uploaded_resumes_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('Table created.');

    console.log('Adding foreign key...');
    // We wrap this in a try/catch in case the constraint already exists
    try {
        await client.query(`
          ALTER TABLE "uploaded_resumes" ADD CONSTRAINT "uploaded_resumes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        console.log('Foreign key added.');
    } catch (e) {
        console.log('Foreign key might already exist:', e.message);
    }

  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

main();
