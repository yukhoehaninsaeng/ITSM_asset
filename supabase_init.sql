-- ================================================================
-- AssetFlow ITSM — Supabase SQL Editor에 붙여넣고 실행하세요
-- 순서대로 한 번만 실행하면 됩니다
-- ================================================================


-- ── 1. ENUM 타입 ─────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE asset_status AS ENUM (
    'In Use', 'In Stock', 'Maintenance', 'Retired', 'Lost'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_category AS ENUM (
    'Hardware', 'Software', 'Network',
    'Peripheral', 'Furniture', 'Vehicle', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ── 2. users 테이블 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               SERIAL PRIMARY KEY,
  username         VARCHAR(50)  UNIQUE NOT NULL,
  email            VARCHAR(100) UNIQUE NOT NULL,
  full_name        VARCHAR(100),
  hashed_password  VARCHAR(255) NOT NULL,
  is_active        BOOLEAN      DEFAULT true,
  is_admin         BOOLEAN      DEFAULT false,
  department       VARCHAR(100),
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);


-- ── 3. assets 테이블 ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
  id              SERIAL PRIMARY KEY,
  asset_number    VARCHAR(50)    UNIQUE NOT NULL,
  name            VARCHAR(200)   NOT NULL,
  description     TEXT,
  category        asset_category DEFAULT 'Hardware',
  status          asset_status   DEFAULT 'In Stock',
  manufacturer    VARCHAR(100),
  model           VARCHAR(100),
  serial_number   VARCHAR(100),
  purchase_date   TIMESTAMPTZ,
  warranty_expiry TIMESTAMPTZ,
  location        VARCHAR(200),
  department      VARCHAR(100),
  assigned_to     INTEGER        REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ    DEFAULT NOW(),
  updated_at      TIMESTAMPTZ    DEFAULT NOW()
);


-- ── 4. scan_logs 테이블 ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_logs (
  id        SERIAL PRIMARY KEY,
  asset_id  INTEGER     REFERENCES assets(id) ON DELETE CASCADE,
  user_id   INTEGER     REFERENCES users(id)  ON DELETE SET NULL,
  scan_time TIMESTAMPTZ DEFAULT NOW(),
  action    VARCHAR(100) NOT NULL,
  location  VARCHAR(200),
  notes     TEXT
);


-- ── 5. updated_at 자동 갱신 트리거 ───────────────────────────────
CREATE OR REPLACE FUNCTION trg_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assets_updated_at ON assets;
CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE PROCEDURE trg_updated_at();


-- ── 6. 데모 데이터 (선택 — 필요 없으면 아래 블록은 실행 안 해도 됩니다) ──
-- 비밀번호: admin → admin1234 / jdoe → user1234 (bcrypt 해시)

INSERT INTO users (username, email, full_name, hashed_password, is_admin, department)
VALUES (
  'admin', 'admin@company.com', '시스템 관리자',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin1234
  true, 'IT'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, email, full_name, hashed_password, department)
VALUES (
  'jdoe', 'jdoe@company.com', '홍길동',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- user1234 (동일 해시 — 반드시 seed.js로 교체 권장)
  '개발팀'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO assets (asset_number, name, category, status, manufacturer, model, serial_number, location, department)
VALUES
  ('AST-0001', 'Dell XPS 15 노트북',    'Hardware',   'In Use',      'Dell',      'XPS 15 9530',       'SN-DELL-001',   '서울 본사 3층', '개발팀'),
  ('AST-0002', 'MacBook Pro 14인치',    'Hardware',   'In Use',      'Apple',     'MacBook Pro M3',    'SN-APPLE-002',  '서울 본사 2층', '디자인팀'),
  ('AST-0003', 'HP LaserJet Pro',       'Peripheral', 'In Stock',    'HP',        'LaserJet M404n',    'SN-HP-003',     '창고 A',       'IT'),
  ('AST-0004', 'Cisco 스위치 24포트',   'Network',    'In Use',      'Cisco',     'Catalyst 2960',     'SN-CISCO-004',  '서버실',        'IT'),
  ('AST-0005', 'LG 모니터 27인치',      'Peripheral', 'In Use',      'LG',        '27UL500',           'SN-LG-005',     '서울 본사 3층', '개발팀'),
  ('AST-0006', 'ThinkPad X1 Carbon',   'Hardware',   'Maintenance', 'Lenovo',    'X1 Carbon Gen 11',  'SN-LEN-006',    '수리센터',      'IT'),
  ('AST-0007', 'Microsoft Surface Pro','Hardware',   'In Stock',    'Microsoft', 'Surface Pro 9',     'SN-MS-007',     '창고 A',       '영업팀'),
  ('AST-0008', 'iPad Pro 12.9인치',     'Hardware',   'In Use',      'Apple',     'iPad Pro M2',       'SN-APPLE-008',  '회의실 A',     '경영팀')
ON CONFLICT (asset_number) DO NOTHING;


-- ── 완료 확인 쿼리 ────────────────────────────────────────────────
SELECT 'users'     AS tbl, COUNT(*) FROM users
UNION ALL
SELECT 'assets'    AS tbl, COUNT(*) FROM assets
UNION ALL
SELECT 'scan_logs' AS tbl, COUNT(*) FROM scan_logs;
