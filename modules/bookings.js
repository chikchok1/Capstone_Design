// ============================================================
// 예약 관련 함수 (보안 강화 + 통계 자동 업데이트)
// ============================================================
import { db } from "./firebase-config.js";
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
import { createNotification } from "./notifications.js";
import { getCurrentUser } from "./auth.js";

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

async function verifyBookingParty(bookingId, currentUid) {
  const bookingDoc = await getDoc(doc(db, "bookings", bookingId));

  if (!bookingDoc.exists()) {
    throw new Error("예약 정보를 찾을 수 없습니다.");
  }

  const bookingData = bookingDoc.data();

  if (
    bookingData.userId !== currentUid &&
    bookingData.instructorUid !== currentUid
  ) {
    throw new Error("이 예약에 대한 권한이 없습니다.");
  }

  return bookingData;
}

async function verifyInstructor(bookingId, currentUid) {
  const bookingDoc = await getDoc(doc(db, "bookings", bookingId));

  if (!bookingDoc.exists()) {
    throw new Error("예약 정보를 찾을 수 없습니다.");
  }

  const bookingData = bookingDoc.data();

  if (bookingData.instructorUid !== currentUid) {
    throw new Error("강사만 이 작업을 수행할 수 있습니다.");
  }

  return bookingData;
}

async function verifyStudent(bookingId, currentUid) {
  const bookingDoc = await getDoc(doc(db, "bookings", bookingId));

  if (!bookingDoc.exists()) {
    throw new Error("예약 정보를 찾을 수 없습니다.");
  }

  const bookingData = bookingDoc.data();

  if (bookingData.userId !== currentUid) {
    throw new Error("수강생만 이 작업을 수행할 수 있습니다.");
  }

  return bookingData;
}

// ============================================================
// 예약 관련 함수
// ============================================================

export async function createBooking(bookingData) {
  const user = verifyAuthenticated();

  if (bookingData.userId !== user.uid) {
    throw new Error("본인의 예약만 생성할 수 있습니다.");
  }

  const docRef = await addDoc(collection(db, "bookings"), {
    ...bookingData,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  try {
    await createNotification({
      userId: bookingData.instructorUid,
      type: "booking_request",
      title: "새로운 예약 요청",
      message: `${bookingData.userName}님이 ${bookingData.date} ${bookingData.time}에 레슨을 요청했습니다.`,
      relatedId: docRef.id,
      relatedType: "booking",
    });
  } catch (error) {
    // 알림 실패는 무시
  }

  return docRef.id;
}

export async function getMyBookings(userId) {
  const user = verifyAuthenticated();

  if (userId !== user.uid) {
    throw new Error("본인의 예약만 조회할 수 있습니다.");
  }

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

  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getBookingRequests() {
  // 인자(instructorId)를 받지 않아도 됩니다. 로그인한 본인의 UID를 쓰면 됩니다.
  const user = verifyAuthenticated();

  const q = query(
    collection(db, "bookings"),
    where("instructorUid", "==", user.uid) // ⭕ instructorUid 필드와 내 로그인 UID 비교
  );

  const querySnapshot = await getDocs(q);
  const bookings = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    // 쿼리 단계에서 이미 내 UID로 필터링했으므로 추가 검증은 선택사항이지만 안전을 위해 유지 가능
    bookings.push({ id: docSnap.id, ...data });
  });

  // 최신순 정렬
  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function confirmBooking(bookingId) {
  const user = verifyAuthenticated();
  const bookingData = await verifyInstructor(bookingId, user.uid);

  if (bookingData.status !== "pending") {
    throw new Error("이미 처리된 예약입니다.");
  }

  await updateDoc(doc(db, "bookings", bookingId), {
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  });

  // ✅ 예약 카운터 증가
  try {
    const { incrementBookingCount } = await import("./statistics.js");
    await incrementBookingCount();
    console.log("✅ 예약 확정 - 통계 카운터 +1");
  } catch (error) {
    console.warn("⚠️ 통계 업데이트 실패:", error);
  }

  try {
    await createNotification({
      userId: bookingData.userId,
      type: "booking_confirmed",
      title: "예약 확정",
      message: `${bookingData.instructorName}님이 ${bookingData.date} ${bookingData.time} 예약을 확정했습니다.`,
      relatedId: bookingId,
      relatedType: "booking",
    });
  } catch (error) {
    // 알림 실패는 무시
  }
}

export async function rejectBooking(bookingId) {
  const user = verifyAuthenticated();
  const bookingData = await verifyInstructor(bookingId, user.uid);

  if (bookingData.status !== "pending") {
    throw new Error("이미 처리된 예약입니다.");
  }

  await updateDoc(doc(db, "bookings", bookingId), {
    status: "rejected",
    rejectedAt: new Date().toISOString(),
  });

  try {
    await createNotification({
      userId: bookingData.userId,
      type: "booking_rejected",
      title: "예약 거절",
      message: `${bookingData.instructorName}님이 ${bookingData.date} ${bookingData.time} 예약을 거절했습니다.`,
      relatedId: bookingId,
      relatedType: "booking",
    });
  } catch (error) {
    // 알림 실패는 무시
  }
}

export async function cancelBooking(
  bookingId,
  cancelReason = "",
  cancelledBy = "student"
) {
  const user = verifyAuthenticated();
  const bookingData = await verifyBookingParty(bookingId, user.uid);

  if (cancelledBy === "student" && bookingData.userId !== user.uid) {
    throw new Error("수강생만 이 예약을 취소할 수 있습니다.");
  }
  if (cancelledBy === "instructor" && bookingData.instructorUid !== user.uid) {
    throw new Error("강사만 이 예약을 취소할 수 있습니다.");
  }

  if (bookingData.status === "cancelled" || bookingData.status === "rejected") {
    throw new Error("이미 취소된 예약입니다.");
  }

  await updateDoc(doc(db, "bookings", bookingId), {
    status: "cancelled",
    cancelledAt: new Date().toISOString(),
    cancelReason: cancelReason,
    cancelledBy: cancelledBy,
  });

  // ✅ 예약 카운터 감소 (confirmed 예약만)
  if (bookingData.status === "confirmed") {
    try {
      const { decrementBookingCount } = await import("./statistics.js");
      await decrementBookingCount();
      console.log("✅ 예약 취소 - 통계 카운터 -1");
    } catch (error) {
      console.warn("⚠️ 통계 업데이트 실패:", error);
    }
  }

  try {
    if (cancelledBy === "student") {
      await createNotification({
        userId: bookingData.instructorUid,
        type: "booking_cancelled",
        title: "예약 취소",
        message: `${bookingData.userName}님이 ${bookingData.date} ${bookingData.time} 예약을 취소했습니다. 사유: ${cancelReason}`,
        relatedId: bookingId,
        relatedType: "booking",
      });
    } else {
      await createNotification({
        userId: bookingData.userId,
        type: "booking_cancelled",
        title: "예약 취소",
        message: `${bookingData.instructorName}님이 ${bookingData.date} ${bookingData.time} 예약을 취소했습니다. 사유: ${cancelReason}`,
        relatedId: bookingId,
        relatedType: "booking",
      });
    }
  } catch (error) {
    // 알림 실패는 무시
  }
}

export async function hasConfirmedBooking(instructorId, userId) {
  const user = verifyAuthenticated();

  if (userId !== user.uid) {
    throw new Error("본인의 예약만 확인할 수 있습니다.");
  }

  const q = query(
    collection(db, "bookings"),
    where("instructorId", "==", instructorId),
    where("userId", "==", userId),
    where("status", "==", "confirmed")
  );

  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// [수정 후] ✅
export async function getInstructorConfirmedBookings() {
  const user = verifyAuthenticated();

  const q = query(
    collection(db, "bookings"),
    where("instructorUid", "==", user.uid), // ⭕ instructorUid로 변경
    where("status", "==", "confirmed")
  );

  const querySnapshot = await getDocs(q);
  const bookings = [];

  querySnapshot.forEach((docSnap) => {
    bookings.push({ id: docSnap.id, ...docSnap.data() });
  });

  return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
