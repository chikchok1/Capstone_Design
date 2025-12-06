// ============================================================
// 환경 변수 템플릿 (GitHub에 이 파일을 올리세요)
// ============================================================
// 사용법:
// 1. 이 파일을 env.config.js로 복사
// 2. 아래 값들을 본인의 실제 키로 교체
// 3. env.config.js는 .gitignore에 추가

export const ENV_CONFIG = {
  // Firebase 설정
  FIREBASE: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
  },

  // Cloudinary 설정
  CLOUDINARY: {
    cloudName: "YOUR_CLOUD_NAME",
    uploadPreset: "YOUR_UPLOAD_PRESET",
  },
};
