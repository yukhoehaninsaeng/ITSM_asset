require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Admin
    const adminHash = await bcrypt.hash('admin1234', 10);
    await client.query(`
      INSERT INTO users (username,email,full_name,hashed_password,is_admin,department)
      VALUES ('admin','admin@company.com','시스템 관리자',$1,true,'IT')
      ON CONFLICT (username) DO NOTHING
    `, [adminHash]);

    // Regular user
    const userHash = await bcrypt.hash('user1234', 10);
    await client.query(`
      INSERT INTO users (username,email,full_name,hashed_password,department)
      VALUES ('jdoe','jdoe@company.com','홍길동',$1,'개발팀')
      ON CONFLICT (username) DO NOTHING
    `, [userHash]);

    const assets = [
      ['AST-0001','Dell XPS 15 노트북','Hardware','In Use','Dell','XPS 15 9530','SN-DELL-001','서울 본사 3층','개발팀'],
      ['AST-0002','MacBook Pro 14인치','Hardware','In Use','Apple','MacBook Pro M3','SN-APPLE-002','서울 본사 2층','디자인팀'],
      ['AST-0003','HP LaserJet Pro','Peripheral','In Stock','HP','LaserJet M404n','SN-HP-003','창고 A','IT'],
      ['AST-0004','Cisco 스위치 24포트','Network','In Use','Cisco','Catalyst 2960','SN-CISCO-004','서버실','IT'],
      ['AST-0005','LG 모니터 27인치','Peripheral','In Use','LG','27UL500','SN-LG-005','서울 본사 3층','개발팀'],
      ['AST-0006','ThinkPad X1 Carbon','Hardware','Maintenance','Lenovo','X1 Carbon Gen 11','SN-LEN-006','수리센터','IT'],
      ['AST-0007','Microsoft Surface Pro','Hardware','In Stock','Microsoft','Surface Pro 9','SN-MS-007','창고 A','영업팀'],
      ['AST-0008','iPad Pro 12.9인치','Hardware','In Use','Apple','iPad Pro M2','SN-APPLE-008','회의실 A','경영팀'],
    ];

    for (const [num,name,cat,status,mfr,model,sn,loc,dept] of assets) {
      await client.query(`
        INSERT INTO assets
          (asset_number,name,category,status,manufacturer,model,serial_number,location,department)
        VALUES ($1,$2,$3::asset_category,$4::asset_status,$5,$6,$7,$8,$9)
        ON CONFLICT (asset_number) DO NOTHING
      `, [num,name,cat,status,mfr,model,sn,loc,dept]);
    }

    await client.query('COMMIT');
    console.log('✅  Seed complete  →  admin/admin1234  |  jdoe/user1234');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', err.message);
  } finally {
    client.release();
    pool.end();
  }
}

seed();
