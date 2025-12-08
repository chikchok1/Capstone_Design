# 🏋️ FitMatch - 생활체육 매칭 플랫폼

실시간으로 검증된 전문 운동강사와 매칭할 수 있는 웹 플랫폼입니다.

## ✨ 주요 기능

- 🔍 **스마트 검색**: 종목, 지역, 키워드로 강사 검색
- 👨‍🏫 **강사 프로필**: 상세한 강사 정보 및 리뷰 시스템
- 📅 **예약 시스템**: 실시간 레슨 예약 및 확정
- ⭐ **평가 시스템**: 레슨 후 강사 평가 및 리뷰 작성
- 🔔 **알림 기능**: 예약 상태 변경 시 실시간 알림
- 📊 **인기 검색어**: 실제 검색 데이터 기반 인기 검색어 표시
- 📸 **프로필 이미지**: Cloudinary 연동 이미지 업로드

## 🚀 시작하기

### 1. 프로젝트 클론

```bash
git clone https://github.com/YOUR_USERNAME/sportsmatching.git
cd sportsmatching
```

### 2. 환경 변수 설정

1. `modules/env.config.template.js` 파일을 복사하여 `modules/env.config.js` 생성

```bash
cp modules/env.config.template.js modules/env.config.js
```

2. `modules/env.config.js` 파일을 열어 본인의 API 키 입력

```javascript
export const ENV_CONFIG = {
  // Firebase 설정 (Firebase Console에서 확인)
  FIREBASE: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
  },

  // Cloudinary 설정 (Cloudinary Dashboard에서 확인)
  CLOUDINARY: {
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "YOUR_UPLOAD_PRESET",
  },
};
```

### 3. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 새 프로젝트 생성
3. Authentication 활성화 (이메일/비밀번호 로그인)
4. Firestore Database 생성 (테스트 모드로 시작)
5. 프로젝트 설정에서 웹 앱 추가 후 구성 정보 복사

### 4. Cloudinary 설정

1. [Cloudinary](https://cloudinary.com/) 회원가입 (무료)
2. Dashboard에서 Cloud Name 확인
3. Settings → Upload → Upload Presets에서 새 Preset 생성
   - Preset Name: `fitmatch_profiles`
   - Signing Mode: `Unsigned` (중요!)

### 5. 실행

로컬 서버로 실행 (Live Server 등 사용):

```bash
# VSCode Live Server 확장 사용 권장
# 또는 Python 서버
python -m http.server 8000

# 또는 Node.js http-server
npx http-server
```

브라우저에서 `http://localhost:8000` 또는 해당 포트로 접속

## 📁 프로젝트 구조

```
sportsmatching/
├── index.html                      # 메인 HTML
├── style.css                       # 스타일시트
├── script.js                       # 메인 스크립트
├── README.md                       # 프로젝트 설명
├── .gitignore                      # Git 제외 파일 목록
└── modules/
    ├── env.config.js               # 🔒 환경 변수 (Git에서 제외됨)
    ├── env.config.template.js      # 환경 변수 템플릿
    ├── firebase-config.js          # Firebase 초기화
    ├── auth.js                     # 인증 로직
    ├── instructors.js              # 강사 관리
    ├── bookings.js                 # 예약 관리
    ├── ratings.js                  # 평가 시스템
    ├── notifications.js            # 알림 시스템
    ├── search-analytics.js         # 검색 분석
    ├── sports.js                   # 종목 관리
    ├── statistics.js               # 통계
    ├── cloudinary-upload.js        # 이미지 업로드
    ├── modal-manager.js            # 모달 관리
    ├── profile-image.js            # 프로필 이미지 관리
    ├── ui-renderers.js             # UI 렌더링
    └── ui/
        ├── auth-ui.js              # 인증 UI
        ├── booking-ui.js           # 예약 UI
        ├── instructor-ui.js        # 강사 UI
        ├── mypage-ui.js            # 마이페이지 UI
        ├── notification-ui.js      # 알림 UI
        ├── profile-ui.js           # 프로필 UI
        ├── review-ui.js            # 리뷰 UI
        └── sports-ui.js            # 종목 UI
```

## 🔒 보안 주의사항

**⚠️ 중요: 다음 파일들은 절대 GitHub에 올리지 마세요!**

- `modules/env.config.js` - API 키 포함
- `.env` 파일들

`.gitignore`에 이미 추가되어 있지만, 직접 확인하세요:

```gitignore
# 환경 설정 파일
modules/env.config.js
```

## 🛠️ 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Backend**: Firebase (BaaS)
  - Authentication: 사용자 인증
  - Firestore: NoSQL 데이터베이스
  - Storage: 파일 저장소
- **Image CDN**: Cloudinary (무료 플랜)
- **Architecture**: Modular JavaScript

## 📊 데이터베이스 구조

### Firestore Collections

```
users/                          # 사용자 정보
  ├── uid: string
  ├── email: string
  ├── name: string
  ├── type: "student" | "instructor"
  └── createdAt: timestamp

instructors/                    # 강사 프로필
  ├── uid: string               # 사용자 UID (외래키)
  ├── name: string
  ├── sport: string
  ├── region: string
  ├── experience: number
  ├── price: number
  ├── introduction: string
  ├── certificates: string[]
  ├── profileImage: string
  ├── averageRating: number
  ├── ratingCount: number
  └── lessonCount: number

bookings/                       # 예약 정보
  ├── instructorId: string
  ├── userId: string
  ├── date: string
  ├── time: string
  ├── message: string
  ├── status: "pending" | "confirmed" | "rejected"
  └── createdAt: timestamp

ratings/                        # 평가 정보
  ├── instructorId: string
  ├── userId: string
  ├── rating: number (1-5)
  ├── comment: string
  └── createdAt: timestamp

searchLogs/                     # 검색 기록
  ├── searchTerm: string
  ├── userId: string
  └── timestamp: timestamp

sports/                         # 운동 종목
  ├── name: string
  ├── category: string
  ├── icon: string
  ├── count: number
  └── isNew: boolean
```
