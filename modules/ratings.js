// ============================================================
// 평가 관련 함수 (보안 강화 버전 - Production Ready)
// ============================================================
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getCurrentUser } from './auth.js';

// ============================================================
// 🔒 권한 검증 헬퍼 함수
// ============================================================

function verifyAuthenticated() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("로그인이 필요합니다.");
  }
  return user;
}

async function verifyReviewOwner(reviewId, currentUid) {
  const reviewDoc = await getDoc(doc(db, "ratings", reviewId));
  
  if (!reviewDoc.exists()) {
    throw new Error("리뷰를 찾을 수 없습니다.");
  }
  
  const reviewData = reviewDoc.data();
  
  if (reviewData.userId !== currentUid) {
    throw new Error("본인의 리뷰만 수정/삭제할 수 있습니다.");
  }
  
  return reviewData;
}

// ✅ 예약 확정 여부 검증 (instructorId로 확인)
async function verifyConfirmedBooking(instructorId, userId) {
  console.log("🔍 예약 확인 중:", { instructorId, userId });
  
  const q = query(
    collection(db, "bookings"),
    where("instructorId", "==", instructorId),  // ✅ instructorId 필드 사용
    where("userId", "==", userId),
    where("status", "==", "confirmed")
  );
  
  const querySnapshot = await getDocs(q);
  const hasBooking = !querySnapshot.empty;
  
  console.log("📊 예약 확인 결과:", hasBooking ? "확정된 예약 있음" : "확정된 예약 없음");
  
  if (!querySnapshot.empty) {
    querySnapshot.forEach(doc => {
      console.log("  예약 정보:", doc.data());
    });
  }
  
  return hasBooking;
}

// ============================================================
// 평가 관련 함수
// ============================================================

export async function submitRating({ instructorId, userId, userName, rating, comment, bookingId }) {
  const user = verifyAuthenticated();
  
  console.log("📝 평가 제출 시작:", { instructorId, userId, rating, bookingId });
  
  if (userId !== user.uid) {
    throw new Error("본인의 리뷰만 작성할 수 있습니다.");
  }
  
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error("평점은 1~5 사이의 정수여야 합니다.");
  }
  
  // ✅ 예약 확정 여부 확인 (필수)
  const hasConfirmed = await verifyConfirmedBooking(instructorId, userId);
  if (!hasConfirmed) {
    throw new Error("확정된 예약이 있어야 평가를 작성할 수 있습니다.");
  }
  
  // ✅ bookingId가 있으면 특정 예약에 대한 중복 체크
  // bookingId가 없으면 강사에 대한 전체 평가 중복 체크
  let q;
  if (bookingId) {
    q = query(
      collection(db, "ratings"),
      where("instructorId", "==", instructorId),
      where("userId", "==", userId),
      where("bookingId", "==", bookingId)
    );
  } else {
    q = query(
      collection(db, "ratings"),
      where("instructorId", "==", instructorId),
      where("userId", "==", userId)
    );
  }
  
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    throw new Error(bookingId ? "이미 이 예약에 대한 평가를 작성하셨습니다." : "이미 이 강사에 대한 평가를 작성하셨습니다.");
  }
  
  console.log("✅ 평가 데이터 저장 중...");
  
  await addDoc(collection(db, "ratings"), {
    instructorId: instructorId,
    userId: userId,
    userName: userName || "익명",
    rating: rating,
    comment: comment || "",
    bookingId: bookingId || null,
    createdAt: new Date().toISOString(),
  });
  
  console.log("✅ 평가 저장 완료, 강사 평점 업데이트 중...");
  
  // ✅ 강사 평점 업데이트
  await updateInstructorRating(instructorId);
  console.log("✅ 강사 평점 업데이트 완료");
  
  // ✅ 평균 만족도 업데이트
  try {
    const { updateAverageRating } = await import('./statistics.js');
    await updateAverageRating();
    console.log("✅ 평균 만족도 업데이트 완료");
  } catch (error) {
    console.warn("⚠️ 평균 만족도 업데이트 실패:", error);
  }
  
  console.log("✅ 평가 제출 완료!");
}

async function updateInstructorRating(instructorId) {
  console.log("🔄 강사 평점 계산 시작:", instructorId);
  
  const reviews = await getInstructorReviews(instructorId);
  console.log(`📊 리뷰 수: ${reviews.length}`);
  
  if (reviews.length === 0) {
    console.log("⚠️ 리뷰 없음 - 0으로 초기화");
    await updateDoc(doc(db, "instructors", instructorId), {
      averageRating: 0,
      ratingCount: 0,
    });
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  console.log(`📊 평점 계산: 총점 ${totalRating} / ${reviews.length} = ${averageRating.toFixed(1)}`);
  
  await updateDoc(doc(db, "instructors", instructorId), {
    averageRating: parseFloat(averageRating.toFixed(1)),
    ratingCount: reviews.length,
    lastRatingUpdate: new Date().toISOString(),
  });
  
  console.log(`✅ 강사 문서 업데이트 완료: averageRating=${averageRating.toFixed(1)}, ratingCount=${reviews.length}`);
}

export async function hasRated(instructorId, userId, bookingId = null) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 리뷰만 확인할 수 있습니다.");
  }
  
  // ✅ bookingId가 있으면 특정 예약에 대한 평가 여부 확인
  // bookingId가 없으면 강사에 대한 평가 존재 여부만 확인
  let q;
  if (bookingId) {
    q = query(
      collection(db, "ratings"),
      where("instructorId", "==", instructorId),
      where("userId", "==", userId),
      where("bookingId", "==", bookingId)
    );
  } else {
    q = query(
      collection(db, "ratings"),
      where("instructorId", "==", instructorId),
      where("userId", "==", userId)
    );
  }
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// ✅ 예약 확정 여부 확인 함수 (외부에서도 사용 가능하도록 export)
export async function hasConfirmedBooking(instructorId, userId) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 예약만 확인할 수 있습니다.");
  }
  
  return await verifyConfirmedBooking(instructorId, userId);
}

export async function getInstructorReviews(instructorId, sortBy = "latest") {
  const q = query(
    collection(db, "ratings"),
    where("instructorId", "==", instructorId)
  );
  
  const querySnapshot = await getDocs(q);
  const reviews = [];
  
  querySnapshot.forEach((doc) => {
    reviews.push({ id: doc.id, ...doc.data() });
  });
  
  if (sortBy === "latest") {
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === "highest") {
    return reviews.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "lowest") {
    return reviews.sort((a, b) => a.rating - b.rating);
  }
  
  return reviews;
}

export async function getReviewStats(instructorId) {
  const reviews = await getInstructorReviews(instructorId);
  
  const stats = {
    total: reviews.length,
    average: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
  
  if (reviews.length === 0) return stats;
  
  let sum = 0;
  reviews.forEach(review => {
    sum += review.rating;
    stats.distribution[review.rating]++;
  });
  
  stats.average = (sum / reviews.length).toFixed(1);
  
  return stats;
}

export async function updateReview(reviewId, updatedData) {
  const user = verifyAuthenticated();
  const reviewData = await verifyReviewOwner(reviewId, user.uid);
  
  if (updatedData.rating && (updatedData.rating < 1 || updatedData.rating > 5 || !Number.isInteger(updatedData.rating))) {
    throw new Error("평점은 1~5 사이의 정수여야 합니다.");
  }
  
  await updateDoc(doc(db, "ratings", reviewId), {
    ...updatedData,
    updatedAt: new Date().toISOString(),
  });
  
  if (updatedData.rating) {
    await updateInstructorRating(reviewData.instructorId);
  }
}

export async function deleteReview(reviewId) {
  const user = verifyAuthenticated();
  const reviewData = await verifyReviewOwner(reviewId, user.uid);
  
  await deleteDoc(doc(db, "ratings", reviewId));
  await updateInstructorRating(reviewData.instructorId);
}

// ✅ 모든 강사의 평점 재계산 (데이터 불일치 수정용)
export async function recalculateAllInstructorRatings() {
  console.log("🔄 모든 강사 평점 재계산 시작...");
  
  try {
    // 모든 강사 가져오기
    const instructorsSnapshot = await getDocs(collection(db, "instructors"));
    console.log(`📊 총 강사 수: ${instructorsSnapshot.size}`);
    
    let updatedCount = 0;
    
    for (const instructorDoc of instructorsSnapshot.docs) {
      const instructorId = instructorDoc.id;
      const instructorData = instructorDoc.data();
      
      console.log(`
🔄 강사: ${instructorData.name} (${instructorId})`);
      
      // 해당 강사의 모든 리뷰 가져오기
      const reviews = await getInstructorReviews(instructorId);
      console.log(`  리뷰 수: ${reviews.length}`);
      
      if (reviews.length === 0) {
        // 리뷰가 없으면 0으로 초기화
        await updateDoc(doc(db, "instructors", instructorId), {
          averageRating: 0,
          ratingCount: 0,
          lastRatingUpdate: new Date().toISOString(),
        });
        console.log(`  ✅ 0으로 초기화`);
      } else {
        // 평점 계산
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        await updateDoc(doc(db, "instructors", instructorId), {
          averageRating: parseFloat(averageRating.toFixed(1)),
          ratingCount: reviews.length,
          lastRatingUpdate: new Date().toISOString(),
        });
        
        console.log(`  ✅ 업데이트: ${averageRating.toFixed(1)} (${reviews.length}개 리뷰)`);
        updatedCount++;
      }
    }
    
    console.log(`
✅ 재계산 완료: ${updatedCount}/${instructorsSnapshot.size}명 갱신됨`);
    
    // ✅ 통계 업데이트
    try {
      const { updateStatisticsCache } = await import('./statistics.js');
      await updateStatisticsCache();
      console.log("✅ 통계 캐시 업데이트 완료");
    } catch (error) {
      console.warn("⚠️ 통계 업데이트 실패:", error);
    }
    
    return { total: instructorsSnapshot.size, updated: updatedCount };
  } catch (error) {
    console.error("❌ 평점 재계산 실패:", error);
    throw error;
  }
}
