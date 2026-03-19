# AssetFlow — ITSM 자산관리 시스템

Vercel(Serverless Functions) + Supabase(PostgreSQL) 기반의 웹 자산관리 시스템입니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18 + React Router 6 |
| 백엔드 | Vercel Serverless Functions (Node.js) — **4개** |
| 데이터베이스 | Supabase (PostgreSQL) |
| 인증 | JWT (bcryptjs + jsonwebtoken) |
| QR 생성 | qrcode (서버 PNG) |
| QR 스캔 | html5-qrcode (카메라) |
| 차트 | Recharts |

---

## 배포 절차

### 1. Supabase DB 초기화 (로컬에서 1회만)
```bash
cp .env.local.example .env.local
# .env.local 에 DATABASE_URL, JWT_SECRET 채우기

npm install
npm run migrate   # 테이블 생성
npm run seed      # 데모 데이터 (선택)
```

### 2. GitHub push
```bash
git init
git add -A
git commit -m "feat: AssetFlow ITSM"
git branch -M main
git remote add origin https://github.com/yukhoehaninsaeng/ITSM_WEB.git
git push -u origin main --force
```

### 3. Vercel 환경변수 설정
Vercel 대시보드 → 프로젝트 → Settings → Environment Variables

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Supabase Transaction pooler URI |
| `JWT_SECRET` | 랜덤 비밀 문자열 (32자 이상) |

---

## 기본 계정 (seed 데이터)

| 계정 | 비밀번호 | 권한 |
|------|----------|------|
| `admin` | `admin1234` | 관리자 |
| `jdoe` | `user1234` | 일반 |

---

## API 구조 (Serverless Functions 4개)

```
api/auth.js       → POST ?action=login / register   GET ?action=me / users
api/assets.js     → GET/POST /api/assets
                    GET/PUT/DELETE /api/assets/:num
                    GET/POST /api/assets/:num/scans
api/qr.js         → GET /api/qr?asset=:num           (QR PNG, 인증 필요)
                    GET /api/qr?asset=:num&action=info (공개 조회)
api/dashboard.js  → GET /api/dashboard               (통계)
```

---

## 프로젝트 구조

```
assetflow/
├── vercel.json
├── package.json
├── .env.local.example
├── api/
│   ├── auth.js
│   ├── assets.js
│   ├── qr.js
│   ├── dashboard.js
│   └── lib/
│       ├── db.js
│       ├── helpers.js
│       ├── migrate.js
│       └── seed.js
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js
        ├── index.css
        ├── index.js
        ├── context/AuthContext.js
        ├── utils/api.js
        ├── components/
        │   ├── layout/Layout.js
        │   └── common/
        │       ├── AssetModal.js
        │       └── QRModal.js
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── Assets.js
            ├── AssetDetail.js
            ├── Scan.js
            ├── ScanLanding.js
            └── Users.js
```
