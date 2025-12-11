# 🏋️ FitMatch - 생활체육 매칭 플랫폼

생활체육 강사와 수강생을 연결하는 웹 기반 매칭 플랫폼

## 🎯 주요 기능

### 회원 시스템

- **수강생**: 강사 검색, 레슨 예약, 리뷰 작성
- **강사**: 프로필 등록, 레슨 관리, 예약 확인
- **관리자**: 종목 추가/관리 (admin@fitmatch.com)

### 핵심 기능

- 다양한 생활체육 종목 (구기, 수상, 피트니스, 무술, 익스트림, 댄스 등 50개 이상)
- 관리자를 통한 종목 추가 및 확장 가능
- 실시간 검색 및 필터링
- 강사 평점 및 리뷰 시스템
- 레슨 예약 및 알림
- 프로필 이미지 업로드 (Cloudinary)

## 🚀 시작하기

### 필수 조건

- 웹 브라우저
- Firebase 프로젝트 설정

### 설치 및 실행

1. **저장소 클론**

```bash
git clone <repository-url>
cd sportsmatching
```

2. **Firebase 설정**

```javascript
// modules/env.config.js 생성
export default {
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
  cloudinary: {
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "YOUR_UPLOAD_PRESET",
  },
};
```

3. **Firebase 보안 규칙 배포**

```bash
firebase deploy --only firestore:rules
```

4. **로컬 실행**

```bash
# 간단한 HTTP 서버 실행
python -m http.server 8000
# 또는
npx http-server
```

브라우저에서 `http://localhost:8000` 접속

## 📂 프로젝트 구조

```
sportsmatching/
├── index.html              # 메인 페이지
├── style.css              # 스타일시트
├── script.js              # 메인 스크립트
├── firestore.rules        # Firebase 보안 규칙
├── modules/
│   ├── firebase-config.js     # Firebase 초기화
│   ├── env.config.js          # 환경 설정 (생성 필요)
│   ├── auth.js                # 인증 관리
│   ├── admin.js               # 관리자 권한
│   ├── sports.js              # 종목 관리
│   ├── instructors.js         # 강사 관리
│   ├── bookings.js            # 예약 관리
│   ├── ratings.js             # 평점/리뷰 관리
│   ├── notifications.js       # 알림 시스템
│   ├── statistics.js          # 통계 처리
│   ├── cloudinary-upload.js   # 이미지 업로드
│   ├── search-analytics.js    # 검색 분석
│   └── ui/                    # UI 컴포넌트들
│       ├── auth-ui.js
│       ├── instructor-ui.js
│       ├── booking-ui.js
│       ├── mypage-ui.js
│       └── ...
└── README.md
```

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Firebase
  - Authentication: 사용자 인증
  - Firestore: 실시간 데이터베이스
  - Storage: 파일 저장
- **이미지 처리**: Cloudinary
- **배포**: Firebase Hosting

## 📊 데이터베이스 구조

### Firestore Collections

```
users/
  - uid, email, name, type, joinedAt

instructors/
  - uid, sport, category, location, price, bio, imageUrl, avgRating

bookings/
  - userId, instructorUid, instructorId, date, time, status

ratings/
  - instructorId, userId, rating, comment, createdAt

notifications/
  - userId, type, message, read, createdAt

settings/
  - sports: { list: [...] }

statistics/
  - instructorCount, bookingCount, avgRating (캐시)
```

## 🎨 주요 UI 컴포넌트

- **종목 카드**: 생활체육 종목 표시 및 필터링 (관리자가 추가 가능)
- **강사 프로필**: 강사 정보, 평점, 리뷰 표시
- **예약 시스템**: 날짜/시간 선택 및 예약 관리
- **마이페이지**: 사용자 예약/리뷰 관리
- **알림 센터**: 실시간 예약 알림

## 🔐 보안 기능

- 이메일/비밀번호 인증
- Firestore 보안 규칙
- XSS 방지 (입력값 정제)
- Rate Limiting (로그인/회원가입)
- 권한 기반 접근 제어

## 📱 반응형 디자인

- 데스크톱, 태블릿, 모바일 최적화
- 터치 인터페이스 지원
- 미디어 쿼리 기반 레이아웃

## 🛠️ 개발자 도구

### 콘솔 명령어

```javascript
// 평점 재계산
window.fixRatings();

// 종목 데이터 초기화
window.resetSports();

// 통계 새로고침
window.updateStats(true);
```

## 🚨 문제 해결

### 관리자 계정 생성

**Firebase Console 사용 (권장)**

1. Firebase Console → Authentication → Users
2. Add user 클릭
3. Email: `admin@fitmatch.com`, Password: `111111`
4. 로그인 시 자동으로 관리자 권한 부여

### 종목 추가 버튼이 보이지 않음

- 관리자 계정(`admin@fitmatch.com`)으로 로그인 확인
- 브라우저 캐시 삭제 후 재로그인

### 이미지 업로드 실패

- Cloudinary 설정 확인 (`env.config.js`)
- 업로드 프리셋이 unsigned인지 확인

### Firebase 연결 오류

- `env.config.js` 파일 존재 여부 확인
- Firebase 프로젝트 설정값 정확성 확인
- 브라우저 콘솔에서 에러 메시지 확인


