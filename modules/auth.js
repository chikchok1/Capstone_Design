// ============================================================
// 인증 관련 함수
// ============================================================
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

let currentUser = null;
let currentUserData = null;

// Getter 함수들
export function getCurrentUser() {
  return currentUser;
}

export function getCurrentUserData() {
  return currentUserData;
}

export function setCurrentUser(user) {
  currentUser = user;
}

export function setCurrentUserData(data) {
  currentUserData = data;
}

// 회원가입
export async function processSignup(name, email, password, userType) {
  if (!name || !email || !password || !userType) {
    throw new Error("모든 항목을 입력해주세요.");
  }

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;

  await addDoc(collection(db, "users"), {
    uid: user.uid,
    name: name,
    email: email,
    type: userType,
    joinedAt: new Date().toISOString(),
  });

  return user;
}

// 로그인
export async function processLogin(email, password) {
  if (!email || !password) {
    throw new Error("이메일과 비밀번호를 입력해주세요.");
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// 로그아웃
export async function handleLogout() {
  await signOut(auth);
  location.reload();
}

// 회원 탈퇴
export async function deleteAccount(user) {
  const uid = user.uid;

  // 1. users 삭제
  const userQuery = query(collection(db, "users"), where("uid", "==", uid));
  const userSnapshot = await getDocs(userQuery);
  for (const docSnap of userSnapshot.docs) {
    await deleteDoc(doc(db, "users", docSnap.id));
  }

  // 2. instructors 삭제
  const instructorQuery = query(
    collection(db, "instructors"),
    where("uid", "==", uid)
  );
  const instructorSnapshot = await getDocs(instructorQuery);
  for (const docSnap of instructorSnapshot.docs) {
    await deleteDoc(doc(db, "instructors", docSnap.id));
  }

  // 3. bookings 삭제
  const bookingQuery = query(
    collection(db, "bookings"),
    where("userId", "==", uid)
  );
  const bookingSnapshot = await getDocs(bookingQuery);
  for (const docSnap of bookingSnapshot.docs) {
    await deleteDoc(doc(db, "bookings", docSnap.id));
  }

  // 4. ratings 삭제
  const ratingQuery = query(
    collection(db, "ratings"),
    where("userId", "==", uid)
  );
  const ratingSnapshot = await getDocs(ratingQuery);
  for (const docSnap of ratingSnapshot.docs) {
    await deleteDoc(doc(db, "ratings", docSnap.id));
  }

  // 5. Firebase Auth 삭제
  await deleteUser(user);
}

// 로그인 상태 감지
export function setupAuthListener(onAuthChange) {
  onAuthStateChanged(auth, onAuthChange);
}

// 사용자 프로필 업데이트 (수강생용)
export async function updateUserProfile(userId, updates) {
  const userQuery = query(collection(db, "users"), where("uid", "==", userId));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    const userDocRef = doc(db, "users", userSnapshot.docs[0].id);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
}
