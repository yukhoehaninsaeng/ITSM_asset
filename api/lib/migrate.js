require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL, full_name VARCHAR(100),
        hashed_password VARCHAR(255) NOT NULL, is_active BOOLEAN DEFAULT true,
        is_admin BOOLEAN DEFAULT false, department VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`);
    await client.query(`DO $$ BEGIN CREATE TYPE asset_status AS ENUM ('In Use','In Stock','Maintenance','Retired','Lost'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`DO $$ BEGIN CREATE TYPE asset_category AS ENUM ('Hardware','Software','Network','Peripheral','Furniture','Vehicle','Other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY, asset_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL, description TEXT,
        category asset_category DEFAULT 'Hardware', status asset_status DEFAULT 'In Stock',
        manufacturer VARCHAR(100), model VARCHAR(100), serial_number VARCHAR(100),
        purchase_date TIMESTAMPTZ, warranty_expiry TIMESTAMPTZ,
        location VARCHAR(200), department VARCHAR(100),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
      );`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY, asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        scan_time TIMESTAMPTZ DEFAULT NOW(), action VARCHAR(100) NOT NULL,
        location VARCHAR(200), notes TEXT
      );`);
    await client.query(`CREATE OR REPLACE FUNCTION trg_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at=NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;`);
    await client.query(`DROP TRIGGER IF EXISTS assets_updated_at ON assets; CREATE TRIGGER assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE PROCEDURE trg_updated_at();`);
    await client.query('COMMIT');
    console.log('✅ Migration complete');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message); throw err;
  } finally { client.release(); pool.end(); }
}
migrate();
