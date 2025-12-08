// ============================================================
// 알림 관련 함수 (보안 강화 버전 - Production Ready)
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
  getDoc,
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

async function verifyNotificationOwner(notificationId, currentUid) {
  const notificationDoc = await getDoc(doc(db, "notifications", notificationId));
  
  if (!notificationDoc.exists()) {
    throw new Error("알림을 찾을 수 없습니다.");
  }
  
  const notificationData = notificationDoc.data();
  
  if (notificationData.userId !== currentUid) {
    throw new Error("본인의 알림만 접근할 수 있습니다.");
  }
  
  return notificationData;
}

// ============================================================
// 알림 관련 함수
// ============================================================

export async function createNotification(notificationData) {
  await addDoc(collection(db, "notifications"), {
    ...notificationData,
    isRead: false,
    createdAt: new Date().toISOString(),
  });
}

export async function getMyNotifications(userId) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 알림만 조회할 수 있습니다.");
  }
  
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  const notifications = [];
  
  querySnapshot.forEach((doc) => {
    notifications.push({ id: doc.id, ...doc.data() });
  });
  
  return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getUnreadNotificationCount(userId) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 알림만 조회할 수 있습니다.");
  }
  
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function markNotificationAsRead(notificationId) {
  const user = verifyAuthenticated();
  await verifyNotificationOwner(notificationId, user.uid);
  
  await updateDoc(doc(db, "notifications", notificationId), {
    isRead: true,
    readAt: new Date().toISOString(),
  });
}

export async function markAllNotificationsAsRead(userId) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 알림만 처리할 수 있습니다.");
  }
  
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId),
    where("isRead", "==", false)
  );
  
  const querySnapshot = await getDocs(q);
  const updatePromises = [];
  
  querySnapshot.forEach((docSnap) => {
    updatePromises.push(
      updateDoc(docSnap.ref, {
        isRead: true,
        readAt: new Date().toISOString(),
      })
    );
  });
  
  await Promise.all(updatePromises);
}

export async function deleteNotification(notificationId) {
  const user = verifyAuthenticated();
  await verifyNotificationOwner(notificationId, user.uid);
  
  await deleteDoc(doc(db, "notifications", notificationId));
}

export async function deleteOldNotifications(userId) {
  const user = verifyAuthenticated();
  
  if (userId !== user.uid) {
    throw new Error("본인의 알림만 삭제할 수 있습니다.");
  }
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const q = query(
    collection(db, "notifications"),
    where("userId", "==", userId)
  );
  
  const querySnapshot = await getDocs(q);
  const deletePromises = [];
  
  querySnapshot.forEach((docSnap) => {
    const createdAt = new Date(docSnap.data().createdAt);
    if (createdAt < thirtyDaysAgo) {
      deletePromises.push(deleteDoc(docSnap.ref));
    }
  });
  
  await Promise.all(deletePromises);
}
