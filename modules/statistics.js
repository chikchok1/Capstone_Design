// ============================================================
// 통계 관련 함수
// ============================================================
import { db } from './firebase-config.js';
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function getStatistics() {
  // 고유한 강사 수
  const instructorsSnapshot = await getDocs(collection(db, "instructors"));
  const uniqueInstructors = new Set();
  let totalRating = 0;
  let ratingCount = 0;
  
  instructorsSnapshot.forEach((doc) => {
    const data = doc.data();
    uniqueInstructors.add(data.uid);
    
    if (data.averageRating && data.ratingCount > 0) {
      totalRating += data.averageRating * data.ratingCount;
      ratingCount += data.ratingCount;
    }
  });
  
  // 확정된 예약 수
  const bookingsSnapshot = await getDocs(
    query(collection(db, "bookings"), where("status", "==", "confirmed"))
  );
  
  const avgRating = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : "4.8";
  
  return {
    instructorCount: uniqueInstructors.size,
    bookingCount: bookingsSnapshot.size,
    avgRating: avgRating,
  };
}
