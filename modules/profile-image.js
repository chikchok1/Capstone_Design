// ============================================================
// 프로필 이미지 업로드 관련 함수
// ============================================================
import { storage, db } from './firebase-config.js';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import {
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 프로필 이미지 업로드
export async function uploadProfileImage(userId, file, userType) {
  // 이미지 크기 체크 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("이미지 크기는 5MB 이하여야 합니다.");
  }

  // 이미지 타입 체크
  if (!file.type.startsWith('image/')) {
    throw new Error("이미지 파일만 업로드 가능합니다.");
  }

  try {
    // Storage 경로 설정
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `profile_images/${userId}/${fileName}`);

    // 이미지 업로드
    await uploadBytes(storageRef, file);

    // 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(storageRef);

    // Firestore에 URL 저장
    if (userType === 'instructor') {
      // 강사는 instructors 컬렉션에서 uid로 찾아서 업데이트
      // 이 부분은 instructors.js에서 처리
      return downloadURL;
    } else {
      // 수강생은 users 컬렉션 업데이트
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        profileImage: downloadURL,
        updatedAt: new Date().toISOString(),
      });
      return downloadURL;
    }
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }
}

// 프로필 이미지 삭제
export async function deleteProfileImage(userId, imageUrl) {
  try {
    // URL에서 파일 경로 추출
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("이미지 삭제 실패:", error);
    // 에러가 나도 계속 진행 (이미 삭제된 경우 등)
  }
}

// 이미지 미리보기 생성
export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
