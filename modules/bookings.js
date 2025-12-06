// ============================================================
// 예약 관련 함수
// ============================================================
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { createNotification } from './notifications.js';

// 예약 요청 생성
export async function createBooking(bookingData) {
  const docRef = await addDoc(collection(db, "bookings"), {
    ...bookingData,
    status: "pending",
    createdAt: new Date().toISOString(),
  });
  
  // 강사에게 알림 생성
  try {
    await createNotification({
      userId: bookingData.instructorUid, // 강사의 uid
      type: "booking_request",
      title: "새로운 예약 요청",
      message: `${bookingData.userName}님이 ${bookingData.date} ${bookingData.time}에 레슨을 요청했습니다.`,
      relatedId: docRef.id,
      relatedType: "booking",
    });
    console.log("✅ 강사에게 예약 요청 알림 전송 완료");
  } catch (error) {
    console.error("❌ 알림 생성 실패:", error);
  }
  
  return docRef.id;
}

// 내 예약 내역 (수강생 - 확정된 것만)
export async function getMyBookings(userId) {
  const q = query(
    collection(db, "bookings"),
    where("userId", "==", userId),
    where("status", "==", "confirmed")
  );
  
  const querySnapshot = await getDocs(q);
  const bookings = [];
  
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  
  // 클라이언트에서 정렬
  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 예약 요청 목록 (강사) - orderBy 제거하여 인덱스 문제 해결
export async function getBookingRequests(instructorId) {
  console.log("🔍 예약 요청 조회 시작, instructorId:", instructorId);
  
  const q = query(
    collection(db, "bookings"),
    where("instructorId", "==", instructorId)
  );
  
  const querySnapshot = await getDocs(q);
  const bookings = [];
  
  querySnapshot.forEach((doc) => {
    console.log("📄 문서 발견:", doc.id, doc.data());
    bookings.push({ id: doc.id, ...doc.data() });
  });
  
  console.log("✅ 총", bookings.length, "개의 예약 요청 발견");
  
  // 클라이언트에서 정렬
  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 예약 확정
export async function confirmBooking(bookingId) {
  // 예약 정보 가져오기
  const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
  const bookingData = bookingDoc.data();
  
  await updateDoc(doc(db, "bookings", bookingId), {
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  });
  
  // 수강생에게 알림 생성
  try {
    await createNotification({
      userId: bookingData.userId, // 수강생의 uid
      type: "booking_confirmed",
      title: "예약 확정",
      message: `${bookingData.instructorName}님이 ${bookingData.date} ${bookingData.time} 예약을 확정했습니다.`,
      relatedId: bookingId,
      relatedType: "booking",
    });
    console.log("✅ 수강생에게 예약 확정 알림 전송 완료");
  } catch (error) {
    console.error("❌ 알림 생성 실패:", error);
  }
}

// 예약 거절
export async function rejectBooking(bookingId) {
  // 예약 정보 가져오기
  const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
  const bookingData = bookingDoc.data();
  
  await updateDoc(doc(db, "bookings", bookingId), {
    status: "cancelled",
    rejectedAt: new Date().toISOString(),
  });
  
  // 수강생에게 알림 생성
  try {
    await createNotification({
      userId: bookingData.userId, // 수강생의 uid
      type: "booking_rejected",
      title: "예약 거절",
      message: `${bookingData.instructorName}님이 ${bookingData.date} ${bookingData.time} 예약을 거절했습니다.`,
      relatedId: bookingId,
      relatedType: "booking",
    });
    console.log("✅ 수강생에게 예약 거절 알림 전송 완료");
  } catch (error) {
    console.error("❌ 알림 생성 실패:", error);
  }
}

// 예약 취소 (수강생 또는 강사)
export async function cancelBooking(bookingId, cancelReason = "", cancelledBy = "student") {
  // 예약 정보 가져오기
  const bookingDoc = await getDoc(doc(db, "bookings", bookingId));
  const bookingData = bookingDoc.data();
  
  await updateDoc(doc(db, "bookings", bookingId), {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelReason: cancelReason,
    cancelledBy: cancelledBy, // "student" 또는 "instructor"
  });
  
  // 상대방에게 알림 생성
  try {
    if (cancelledBy === "student") {
      // 수강생이 취소 → 강사에게 알림
      await createNotification({
        userId: bookingData.instructorUid,
        type: "booking_cancelled",
        title: "예약 취소",
        message: `${bookingData.userName}님이 ${bookingData.date} ${bookingData.time} 예약을 취소했습니다. 사유: ${cancelReason}`,
        relatedId: bookingId,
        relatedType: "booking",
      });
      console.log("✅ 강사에게 예약 취소 알림 전송 완료");
    } else {
      // 강사가 취소 → 수강생에게 알림
      await createNotification({
        userId: bookingData.userId,
        type: "booking_cancelled",
        title: "예약 취소",
        message: `${bookingData.instructorName}님이 ${bookingData.date} ${bookingData.time} 예약을 취소했습니다. 사유: ${cancelReason}`,
        relatedId: bookingId,
        relatedType: "booking",
      });
      console.log("✅ 수강생에게 예약 취소 알림 전송 완료");
    }
  } catch (error) {
    console.error("❌ 알림 생성 실패:", error);
  }
}

// 확정된 예약 확인
export async function hasConfirmedBooking(instructorId, userId) {
  const q = query(
    collection(db, "bookings"),
    where("instructorId", "==", instructorId),
    where("userId", "==", userId),
    where("status", "==", "confirmed")
  );
  
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// 강사의 확정된 예약 목록 가져오기 (새로 추가)
export async function getInstructorConfirmedBookings(instructorId) {
  const q = query(
    collection(db, "bookings"),
    where("instructorId", "==", instructorId),
    where("status", "==", "confirmed")
  );
  
  const querySnapshot = await getDocs(q);
  const bookings = [];
  
  querySnapshot.forEach((doc) => {
    bookings.push({ id: doc.id, ...doc.data() });
  });
  
  // 최신순으로 정렬
  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
