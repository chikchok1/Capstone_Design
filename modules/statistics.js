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
  updateDoc,
  increment,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ✅ 통계를 실시간 계산하는 함수 (권한 필요)
export async function calculateStatistics() {
  try {
    console.log("📊 통계 실시간 계산 시작...");
    
    // ✅ 등록된 강사 프로필 수 (uid가 아닌 전체 프로필 수)
    const instructorsSnapshot = await getDocs(collection(db, "instructors"));
    const instructorCount = instructorsSnapshot.size;
    
    // ✅ 전체 평가의 평균 계산 (ratings 컬렉션에서 직접 계산)
    const ratingsSnapshot = await getDocs(collection(db, "ratings"));
    let totalRating = 0;
    let ratingCount = 0;
    
    ratingsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
      }
    });
    
    console.log(`📊 평가 통계: 총 ${ratingCount}개 평가, 합계 ${totalRating}`);
    
    // 확정된 예약 수 (권한 문제로 실패할 수 있음)
    let bookingCount = 0;
    try {
      const bookingsSnapshot = await getDocs(
        query(collection(db, "bookings"), where("status", "==", "confirmed"))
      );
      bookingCount = bookingsSnapshot.size;
      console.log(`📊 예약 통계: ${bookingCount}개 확정됨`);
    } catch (error) {
      console.warn("⚠️ 예약 수 조회 권한 없음 - 기존 값 유지");
      // ✅ 기존 통계에서 bookingCount 가져오기
      const statsDoc = await getDoc(doc(db, "statistics", "summary"));
      if (statsDoc.exists()) {
        bookingCount = statsDoc.data().bookingCount || 0;
        console.log(`📊 기존 예약 수 유지: ${bookingCount}`);
      }
    }
    
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "4.8";
    
    const stats = {
      instructorCount: instructorCount,
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

// ✅ 예약 카운터 증가 (예약 확정 시)
export async function incrementBookingCount() {
  try {
    const statsRef = doc(db, "statistics", "summary");
    await updateDoc(statsRef, {
      bookingCount: increment(1),
      lastUpdated: new Date().toISOString(),
    });
    console.log("✅ 예약 카운터 +1");
  } catch (error) {
    console.error("❌ 예약 카운터 증가 실패:", error);
    // 카운터 문서가 없는 경우 초기화
    try {
      const stats = await calculateStatistics();
      await setDoc(doc(db, "statistics", "summary"), stats);
      console.log("✅ 통계 초기화 완료");
    } catch (initError) {
      console.error("❌ 통계 초기화 실패:", initError);
    }
  }
}

// ✅ 예약 카운터 감소 (예약 취소 시)
export async function decrementBookingCount() {
  try {
    const statsRef = doc(db, "statistics", "summary");
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists() && statsDoc.data().bookingCount > 0) {
      await updateDoc(statsRef, {
        bookingCount: increment(-1),
        lastUpdated: new Date().toISOString(),
      });
      console.log("✅ 예약 카운터 -1");
    }
  } catch (error) {
    console.error("❌ 예약 카운터 감소 실패:", error);
  }
}

// ✅ 강사 수 업데이트 (강사 등록/삭제 시)
export async function updateInstructorCount() {
  try {
    console.log("📊 강사 수 업데이트 시작...");
    
    // 등록된 강사 프로필 수 계산
    const instructorsSnapshot = await getDocs(collection(db, "instructors"));
    const instructorCount = instructorsSnapshot.size;
    
    // 통계 문서 가져오기
    const statsRef = doc(db, "statistics", "summary");
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      // 기존 통계가 있으면 강사 수만 업데이트
      await updateDoc(statsRef, {
        instructorCount: instructorCount,
        lastUpdated: new Date().toISOString(),
      });
      console.log("✅ 강사 수 업데이트 완료:", instructorCount);
    } else {
      // 통계 문서가 없으면 전체 통계 초기화
      console.log("⚠️ 통계 문서 없음, 전체 통계 계산...");
      const stats = await calculateStatistics();
      await setDoc(statsRef, stats);
      console.log("✅ 통계 초기화 완료:", stats);
    }
  } catch (error) {
    console.error("❌ 강사 수 업데이트 실패:", error);
  }
}

// ✅ 평균 만족도 업데이트 (평가 제출 시 호출)
export async function updateAverageRating() {
  try {
    console.log("📊 평균 만족도 업데이트 시작...");
    
    // ratings 컬렉션에서 모든 평가 가져오기
    const ratingsSnapshot = await getDocs(collection(db, "ratings"));
    let totalRating = 0;
    let ratingCount = 0;
    
    ratingsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating) {
        totalRating += data.rating;
        ratingCount++;
      }
    });
    
    const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "4.8";
    
    console.log(`📊 평균 만족도: ${avgRating} (총 ${ratingCount}개 평가)`);
    
    // 통계 문서 업데이트
    const statsRef = doc(db, "statistics", "summary");
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      await updateDoc(statsRef, {
        avgRating: avgRating,
        lastUpdated: new Date().toISOString(),
      });
      console.log("✅ 평균 만족도 업데이트 완료:", avgRating);
    } else {
      // 통계 문서가 없으면 전체 통계 초기화
      const stats = await calculateStatistics();
      await setDoc(statsRef, stats);
      console.log("✅ 통계 초기화 완료:", stats);
    }
  } catch (error) {
    console.error("❌ 평균 만족도 업데이트 실패:", error);
  }
}

// ✅ 통계 초기화 (최초 1회만 실행)
export async function initializeStatistics() {
  try {
    console.log("📊 통계 초기화 확인...");
    const statsRef = doc(db, "statistics", "summary");
    const statsDoc = await getDoc(statsRef);
    
    if (!statsDoc.exists()) {
      console.log("⚠️ 통계 문서 없음 - 초기화 실행...");
      const stats = await calculateStatistics();
      await setDoc(statsRef, stats);
      console.log("✅ 통계 초기화 완료:", stats);
      return stats;
    } else {
      console.log("✅ 통계 문서 존재 - 초기화 생략");
      return statsDoc.data();
    }
  } catch (error) {
    console.warn("⚠️ 통계 초기화 실패 (무시):", error);
    return null;
  }
}
