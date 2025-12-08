// ============================================================
// 통계 관련 함수
// ============================================================
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ 통계를 실시간 계산하는 함수 (권한 필요)
export async function calculateStatistics() {
  try {
    console.log("📊 통계 실시간 계산 시작...");
    
    // ✅ 등록된 강사 프로필 수 (uid가 아닌 전체 프로필 수)
    const instructorsSnapshot = await getDocs(collection(db, "instructors"));
    const instructorCount = instructorsSnapshot.size;  // ← 전체 프로필 수
    
    let totalRating = 0;
    let ratingCount = 0;
    
    instructorsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      if (data.averageRating && data.ratingCount > 0) {
        totalRating += data.averageRating * data.ratingCount;
        ratingCount += data.ratingCount;
      }
    });
    
    // 확정된 예약 수 (권한 문제로 실패할 수 있음)
    let bookingCount = 0;
    try {
      const bookingsSnapshot = await getDocs(
        query(collection(db, "bookings"), where("status", "==", "confirmed"))
      );
      bookingCount = bookingsSnapshot.size;
    } catch (error) {
      console.warn("⚠️ 예약 수 조회 권한 없음, 0으로 설정");
      bookingCount = 0;
    }
    
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "4.8";
    
    const stats = {
      instructorCount: instructorCount,  // ← 프로필 수
      bookingCount: bookingCount,
      avgRating: avgRating,
      lastUpdated: new Date().toISOString(),
    };
    
    console.log("✅ 계산된 통계:", stats);
    return stats;
  } catch (error) {
    console.error("❌ 통계 계산 실패:", error);
    throw error;
  }
}

// ✅ 캐시된 통계를 가져오는 함수 (모두 접근 가능)
// forceRefresh = true 일 때는 캐시 무시하고 실시간 계산
export async function getStatistics(forceRefresh = false) {
  try {
    // ✅ 강제 새로고침이면 캐시 무시하고 실시간 계산
    if (forceRefresh) {
      console.log("🔄 강제 새로고침: 실시간 계산...");
      const stats = await calculateStatistics();
      
      // 계산한 통계를 캐시에 저장
      try {
        await setDoc(doc(db, "statistics", "summary"), stats);
        console.log("✅ 통계 캐시 업데이트 완료");
      } catch (error) {
        console.warn("⚠️ 통계 캐시 저장 실패:", error.message);
      }
      
      return stats;
    }
    
    // 1. 먼저 캐시된 통계 시도
    const statsDoc = await getDoc(doc(db, "statistics", "summary"));
    
    if (statsDoc.exists()) {
      console.log("✅ 캐시된 통계 로드 성공");
      return statsDoc.data();
    }
    
    // 2. 캐시가 없으면 실시간 계산
    console.log("⚠️ 캐시된 통계 없음, 실시간 계산...");
    const stats = await calculateStatistics();
    
    // 3. 계산한 통계를 캐시에 저장
    try {
      await setDoc(doc(db, "statistics", "summary"), stats);
      console.log("✅ 통계 캐시 저장 완료");
    } catch (error) {
      console.warn("⚠️ 통계 캐시 저장 실패:", error.message);
    }
    
    return stats;
    
  } catch (error) {
    console.error("❌ 통계 로드 실패:", error);
    
    // 4. 모든 시도 실패 시 기본값 반환
    console.log("⚠️ 기본 통계 값 반환");
    return {
      instructorCount: 0,
      bookingCount: 0,
      avgRating: "4.8",
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ✅ 통계 캐시를 업데이트하는 함수 (강사/예약 생성/삭제 시 호출)
export async function updateStatisticsCache() {
  try {
    console.log("🔄 통계 캐시 업데이트 시작...");
    const stats = await calculateStatistics();
    await setDoc(doc(db, "statistics", "summary"), stats);
    console.log("✅ 통계 캐시 업데이트 완료:", stats);
    return stats;
  } catch (error) {
    console.error("❌ 통계 캐시 업데이트 실패:", error);
    throw error;
  }
}
