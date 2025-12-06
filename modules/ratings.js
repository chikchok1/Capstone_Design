// ============================================================
// 평가 관련 함수
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
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 평가 제출
export async function submitRating({ instructorId, userId, userName, rating, comment, bookingId }) {
  // 평가 저장
  await addDoc(collection(db, "ratings"), {
    instructorId: instructorId,
    userId: userId,
    userName: userName || "익명",
    rating: rating,
    comment: comment || "",
    bookingId: bookingId || null,
    createdAt: new Date().toISOString(),
  });
  
  // 강사의 평균 평점 업데이트
  const instructorRef = doc(db, "instructors", instructorId);
  const instructorDoc = await getDoc(instructorRef);
  const instructorData = instructorDoc.data();
  
  const currentAvg = instructorData.averageRating || 0;
  const currentCount = instructorData.ratingCount || 0;
  const newCount = currentCount + 1;
  const newAvg = ((currentAvg * currentCount) + rating) / newCount;
  
  await updateDoc(instructorRef, {
    averageRating: newAvg,
    ratingCount: newCount,
  });
  
  console.log(`✅ 평가 저장 완료: 강사 ${instructorId}, 평점 ${rating}, 새 평균 ${newAvg.toFixed(1)} (${newCount}개)`);
}

// 이미 평가했는지 확인
export async function hasRated(instructorId, userId) {
  const q = query(
    collection(db, "ratings"),
    where("instructorId", "==", instructorId),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// 강사의 모든 리뷰 가져오기
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
  
  // 정렬
  if (sortBy === "latest") {
    return reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === "highest") {
    return reviews.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === "lowest") {
    return reviews.sort((a, b) => a.rating - b.rating);
  }
  
  return reviews;
}

// 리뷰 통계 가져오기
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
