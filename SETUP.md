# 환경 변수 설정 가이드

## 🔑 API 키 발급 방법

### 1. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: FitMatch)
4. Google 애널리틱스 설정 (선택사항)

#### Authentication 설정
1. 좌측 메뉴에서 "Authentication" 클릭
2. "시작하기" 클릭
3. "이메일/비밀번호" 로그인 제공업체 활성화
4. "저장" 클릭

#### Firestore Database 설정
1. 좌측 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 클릭
3. "테스트 모드에서 시작" 선택 (개발 중)
4. 지역 선택 (asia-northeast3 권장)
5. "사용 설정" 클릭

#### 웹 앱 추가 및 설정 정보 가져오기
1. 프로젝트 설정 (⚙️ 아이콘) 클릭
2. "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
3. 앱 닉네임 입력 (예: FitMatch Web)
4. "앱 등록" 클릭
5. **Firebase 구성 정보 복사** (이 정보를 env.config.js에 입력)

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // 👈 복사
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxx",
  measurementId: "G-XXXXXXXXX"
};
```

### 2. Cloudinary 설정

1. [Cloudinary](https://cloudinary.com/) 접속
2. "Sign Up for Free" 클릭
3. 무료 계정 생성 (GitHub 계정으로 가입 가능)
4. 대시보드에서 **Cloud Name** 확인 (좌측 상단)

#### Upload Preset 생성
1. Settings (⚙️) → Upload 탭 클릭
2. "Upload presets" 섹션에서 "Add upload preset" 클릭
3. 설정:
   - **Preset name**: `fitmatch_profiles`
   - **Signing mode**: `Unsigned` ⚠️ 중요!
   - **Folder**: `profile_images` (선택사항)
4. "Save" 클릭

### 3. env.config.js 파일 생성

`modules/env.config.template.js`를 복사하여 `modules/env.config.js` 생성:

```bash
cp modules/env.config.template.js modules/env.config.js
```

그리고 다음 정보를 입력:

```javascript
export const ENV_CONFIG = {
  FIREBASE: {
    apiKey: "여기에 Firebase API Key 입력",
    authDomain: "여기에 Auth Domain 입력",
    projectId: "여기에 Project ID 입력",
    storageBucket: "여기에 Storage Bucket 입력",
    messagingSenderId: "여기에 Messaging Sender ID 입력",
    appId: "여기에 App ID 입력",
    measurementId: "여기에 Measurement ID 입력",
  },
  CLOUDINARY: {
    cloudName: "여기에 Cloud Name 입력",
    uploadPreset: "fitmatch_profiles",
  },
};
```

## ✅ 설정 확인

1. 브라우저에서 프로젝트 실행
2. 개발자 도구(F12) 콘솔 확인
3. "✅ Firebase 연결 완료" 메시지 확인

## 🔒 보안 체크리스트

- [ ] `modules/env.config.js` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] GitHub에 env.config.js가 푸시되지 않았는지 확인
- [ ] Firebase 보안 규칙 설정 (프로덕션 배포 시)
- [ ] Cloudinary Upload Preset이 Unsigned로 설정되어 있는지 확인

## ⚠️ 주의사항

- **절대 env.config.js를 GitHub에 올리지 마세요!**
- API 키가 노출되면 즉시 Firebase/Cloudinary에서 키를 재발급 받으세요
- 프로덕션 배포 시 Firebase 보안 규칙을 반드시 설정하세요

## 🆘 문제 해결

### Firebase 연결 오류
- API 키가 정확한지 확인
- 브라우저 콘솔에서 에러 메시지 확인
- Firebase Console에서 웹 앱이 제대로 등록되었는지 확인

### Cloudinary 업로드 실패
- Upload Preset이 Unsigned로 설정되었는지 확인
- Cloud Name이 정확한지 확인
- 네트워크 탭에서 업로드 요청 확인

### env.config.js 모듈 에러
- 파일 경로가 정확한지 확인: `modules/env.config.js`
- export 문법이 정확한지 확인
- 브라우저가 ES6 모듈을 지원하는지 확인
