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

// ============================================================
// 평가 관련 함수
// ============================================================

export async function submitRating({ instructorId, userId, userName, rating, comment, bookingId }) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 리뷰만 작성할 수 있습니다.");
  }
  
  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error("평점은 1~5 사이의 정수여야 합니다.");
  }
  
  const existingReview = await hasRated(instructorId, userId);
  if (existingReview) {
    throw new Error("이미 이 강사에 대한 평가를 작성하셨습니다.");
  }
  
  await addDoc(collection(db, "ratings"), {
    instructorId: instructorId,
    userId: userId,
    userName: userName || "익명",
    rating: rating,
    comment: comment || "",
    bookingId: bookingId || null,
    createdAt: new Date().toISOString(),
  });
  
  await updateInstructorRating(instructorId);
}

async function updateInstructorRating(instructorId) {
  const reviews = await getInstructorReviews(instructorId);
  
  if (reviews.length === 0) {
    await updateDoc(doc(db, "instructors", instructorId), {
      averageRating: 0,
      ratingCount: 0,
    });
    return;
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  await updateDoc(doc(db, "instructors", instructorId), {
    averageRating: parseFloat(averageRating.toFixed(1)),
    ratingCount: reviews.length,
  });
}

export async function hasRated(instructorId, userId) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 리뷰만 확인할 수 있습니다.");
  }
  
  const q = query(
    collection(db, "ratings"),
    where("instructorId", "==", instructorId),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
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
