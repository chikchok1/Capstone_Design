// ============================================================
// 관리자 권한 관리 모듈
// ============================================================

import { db } from "./firebase-config.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================================
// 관리자 이메일 목록
// ============================================================
const ADMIN_EMAILS = [
  "admin@fitmatch.com",
];

// ============================================================
// 사용자가 관리자인지 확인
// ============================================================
export function isAdmin(userEmail) {
  if (!userEmail) return false;
  return ADMIN_EMAILS.includes(userEmail.toLowerCase());
}

// ============================================================
// 사용자 데이터에 관리자 플래그 추가
// ============================================================
export async function checkAndSetAdminRole(uid, email) {
  try {
    // users 컬렉션에서 해당 uid의 문서 찾기
    const usersQuery = query(collection(db, "users"), where("uid", "==", uid));
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      console.warn("⚠️ users 컬렉션에서 사용자를 찾을 수 없습니다.");
      return false;
    }
    
    const userDocId = usersSnapshot.docs[0].id;
    const userRef = doc(db, "users", userDocId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const shouldBeAdmin = isAdmin(email);
      
      // 관리자 권한이 변경된 경우 업데이트
      if (userData.isAdmin !== shouldBeAdmin) {
        await setDoc(userRef, { isAdmin: shouldBeAdmin }, { merge: true });
        console.log(`✅ 관리자 권한 업데이트: ${email} -> ${shouldBeAdmin}`);
        return shouldBeAdmin;
      }
      
      return userData.isAdmin || false;
    }
    
    return false;
  } catch (error) {
    console.error("❌ 관리자 권한 확인 실패:", error);
    return false;
  }
}

// ============================================================
// 관리자 전용 작업 권한 확인
// ============================================================
export function requireAdmin(userEmail) {
  if (!isAdmin(userEmail)) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  return true;
}
