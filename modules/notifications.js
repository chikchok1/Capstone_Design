// ============================================================
// 알림 관련 함수
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
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 알림 생성
export async function createNotification(notificationData) {
  await addDoc(collection(db, "notifications"), {
    ...notificationData,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

// 내 알림 가져오기
export async function getMyNotifications(userId) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  const notifications = [];
  
  querySnapshot.forEach((doc) => {
    notifications.push({ id: doc.id, ...doc.data() });
  });
  
  // 최신순으로 정렬
  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// 읽지 않은 알림 개수
export async function getUnreadNotificationCount(userId) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId) {
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
    readAt: new Date().toISOString(),
  });
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead(userId) {
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false)
  );
  
  const querySnapshot = await getDocs(q);
  const updatePromises = [];
  
  querySnapshot.forEach((doc) => {
    updatePromises.push(
      updateDoc(doc.ref, {
        isRead: true,
        readAt: new Date().toISOString(),
      })
    );
  });
  
  await Promise.all(updatePromises);
}

// 알림 삭제
export async function deleteNotification(notificationId) {
  await deleteDoc(doc(db, "notifications", notificationId));
}

// 오래된 알림 일괄 삭제 (30일 이상)
export async function deleteOldNotifications(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  const deletePromises = [];
  
  querySnapshot.forEach((doc) => {
    const createdAt = new Date(doc.data().createdAt);
    if (createdAt < thirtyDaysAgo) {
      deletePromises.push(deleteDoc(doc.ref));
    }
  });
  
  await Promise.all(deletePromises);
}
