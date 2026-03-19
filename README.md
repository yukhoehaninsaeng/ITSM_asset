# AssetFlow — ITSM 자산관리 시스템

ServiceNow 스타일의 웹 기반 자산관리 시스템입니다.  
**Vercel(프론트엔드 + Serverless API) + Supabase(PostgreSQL)** 로 구동됩니다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 18 + React Router 6 |
| 백엔드 | Vercel Serverless Functions (Node.js) |
| 데이터베이스 | Supabase (PostgreSQL 15) |
| 인증 | JWT (bcryptjs + jsonwebtoken) |
| QR 생성 | qrcode (서버 PNG) |
| QR 스캔 | html5-qrcode (카메라) |
| 차트 | Recharts |

---

## 🚀 배포 절차

### 1단계 — Supabase 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트 생성
2. **Settings → Database → Connection string → Transaction pooler** 복사
3. 로컬에서 DB 테이블 생성:

```bash
# .env.local 파일 생성
cp .env.local.example .env.local
# DATABASE_URL, JWT_SECRET 값 채우기

npm install
npm run migrate   # 테이블 생성
npm run seed      # 데모 데이터 삽입 (선택)
```

### 2단계 — GitHub 업로드

```bash
git init
git add .
git commit -m "feat: AssetFlow 초기 커밋"
git remote add origin https://github.com/YOUR_USERNAME/ITSM_WEB.git
git push -u origin main
```

### 3단계 — Vercel 배포

1. [vercel.com](https://vercel.com) → **Add New Project** → GitHub 저장소 연결
2. **Environment Variables** 에 아래 두 값 설정:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Supabase Transaction pooler URL |
   | `JWT_SECRET` | 랜덤 비밀 문자열 (최소 32자) |

3. **Deploy** 클릭 → 완료!

---

## 로컬 개발

```bash
# Vercel CLI 설치 (최초 1회)
npm install -g vercel

# 로컬 실행 (API + 프론트엔드 동시)
npm install
cd frontend && npm install && cd ..
vercel dev
```
브라우저: `http://localhost:3000`

---

## 기본 계정 (seed 데이터)

| 계정 | 비밀번호 | 권한 |
|------|----------|------|
| `admin` | `admin1234` | 관리자 |
| `jdoe` | `user1234` | 일반 |

---

## QR 스캔 흐름

```
QR 코드 출력  (자산 목록 → ◫ 버튼 → 다운로드/인쇄)
      ↓
휴대폰 카메라로 스캔
      ↓
/scan/:assetNumber  (공개 랜딩 — 로그인 불필요)
      ↓
자산 현황 즉시 확인
      ↓
[로그인하여 상세 관리] → 스캔 기록 자동 저장
```

---

## 프로젝트 구조

```
ITSM_WEB/
├── vercel.json              # 빌드·라우팅 설정
├── package.json             # 루트 (API 의존성)
├── .env.local.example       # 환경변수 템플릿
│
├── api/                     # Vercel Serverless Functions
│   ├── lib/
│   │   ├── db.js            # Supabase 연결 (pg Pool)
│   │   ├── helpers.js       # JWT 인증 + CORS
│   │   ├── migrate.js       # DB 테이블 생성
│   │   └── seed.js          # 데모 데이터
│   ├── auth/
│   │   ├── login.js         POST /api/auth/login
│   │   ├── register.js      POST /api/auth/register
│   │   ├── me.js            GET  /api/auth/me
│   │   └── users.js         GET  /api/auth/users
│   ├── assets/
│   │   ├── index.js         GET(목록) / POST(생성)
│   │   ├── [assetNumber].js GET / PUT / DELETE
│   │   └── [assetNumber]/
│   │       └── scans.js     GET(이력) / POST(기록)
│   ├── qr/
│   │   ├── [assetNumber].js GET QR PNG
│   │   └── info/
│   │       └── [assetNumber].js  GET 공개 조회 (인증 불필요)
│   └── dashboard/
│       └── stats.js         GET 통계
│
└── frontend/                # React 앱
    ├── public/index.html
    └── src/
        ├── App.js           # 라우팅
        ├── index.css        # 디자인 시스템
        ├── context/AuthContext.js
        ├── utils/api.js     # Axios 인스턴스
        ├── components/
        │   ├── layout/Layout.js    # 사이드바 + 모바일 드로어
        │   └── common/
        │       ├── AssetModal.js   # 자산 등록/수정
        │       └── QRModal.js      # QR 코드 뷰어
        └── pages/
            ├── Login.js
            ├── Dashboard.js
            ├── Assets.js
            ├── AssetDetail.js
            ├── Scan.js         # 카메라 QR 스캔
            ├── ScanLanding.js  # 공개 스캔 랜딩
            └── Users.js
```

---

## API 요약

```
POST  /api/auth/login          로그인
POST  /api/auth/register       회원가입
GET   /api/auth/me             내 정보
GET   /api/auth/users          전체 사용자

GET   /api/assets              자산 목록 (검색/필터/페이지)
POST  /api/assets              자산 등록
GET   /api/assets/:num         자산 상세
PUT   /api/assets/:num         자산 수정
DELETE /api/assets/:num        자산 삭제 (관리자)
POST  /api/assets/:num/scans   스캔 기록
GET   /api/assets/:num/scans   스캔 이력

GET   /api/qr/:num             QR PNG 생성
GET   /api/qr/info/:num        공개 자산 조회 (인증 불필요)

GET   /api/dashboard/stats     대시보드 통계
```
