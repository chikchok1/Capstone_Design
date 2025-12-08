// ============================================================
// 인증 관련 함수 (보안 강화 + 데이터 정합성 개선)
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
import { isValidEmail, isValidLength, sanitizeInput, checkRateLimit, resetRateLimit } from "./security-utils.js";

let currentUser = null;
let currentUserData = null;

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

// ============================================================
// Getter/Setter 함수들
// ============================================================

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

// ============================================================
// 회원가입
// ============================================================

export async function processSignup(name, email, password, userType) {
  // 🔒 Rate Limiting (1분에 3번)
  if (!checkRateLimit('signup', 3, 60000)) {
    throw new Error("너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.");
  }
  
  // 🔒 입력값 검증
  if (!name || !email || !password || !userType) {
    throw new Error("모든 항목을 입력해주세요.");
  }
  
  // 🔒 이메일 형식 검증
  if (!isValidEmail(email)) {
    throw new Error("올바른 이메일 형식이 아닙니다.");
  }
  
  // 🔒 이름 길이 검증 (2-50자)
  if (!isValidLength(name, 2, 50)) {
    throw new Error("이름은 2자 이상 50자 이하여야 합니다.");
  }
  
  // 🔒 비밀번호 강도 검증
  if (password.length < 6) {
    throw new Error("비밀번호는 6자 이상이어야 합니다.");
  }
  
  if (password.length > 128) {
    throw new Error("비밀번호가 너무 깁니다.");
  }
  
  // 🔒 userType 검증
  if (!["student", "instructor"].includes(userType)) {
    throw new Error("잘못된 회원 유형입니다.");
  }
  
  // 🔒 입력값 정제
  const sanitizedName = sanitizeInput(name.trim());
  const sanitizedEmail = email.trim().toLowerCase();

  const userCredential = await createUserWithEmailAndPassword(
    auth,
    sanitizedEmail,
    password
  );
  const user = userCredential.user;

  await addDoc(collection(db, "users"), {
    uid: user.uid,
    name: sanitizedName,
    email: sanitizedEmail,
    type: userType,
    joinedAt: new Date().toISOString(),
  });
  
  // 성공 시 Rate Limit 리셋
  resetRateLimit('signup');

  return user;
}

// ============================================================
// 로그인
// ============================================================

export async function processLogin(email, password) {
  // 🔒 Rate Limiting (1분에 5번)
  if (!checkRateLimit('login', 5, 60000)) {
    throw new Error("너무 많은 로그인 시도가 있었습니다. 1분 후 다시 시도해주세요.");
  }
  
  // 🔒 입력값 검증
  if (!email || !password) {
    throw new Error("이메일과 비밀번호를 입력해주세요.");
  }
  
  // 🔒 이메일 형식 검증
  if (!isValidEmail(email)) {
    throw new Error("올바른 이메일 형식이 아닙니다.");
  }

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );
  
  // 성공 시 Rate Limit 리셋
  resetRateLimit('login');
  
  return userCredential.user;
}

// ============================================================
// 로그아웃
// ============================================================

export async function handleLogout() {
  await signOut(auth);
  location.reload();
}

// ============================================================
// 회원 탈퇴 (데이터 정합성 개선)
// ============================================================

export async function deleteAccount(user) {
  // 🔒 로그인 확인
  verifyAuthenticated();
  
  const uid = user.uid;

  // 1. users 삭제
  const userQuery = query(collection(db, "users"), where("uid", "==", uid));
  const userSnapshot = await getDocs(userQuery);
  for (const docSnap of userSnapshot.docs) {
    await deleteDoc(doc(db, "users", docSnap.id));
  }

  // 2. instructors 삭제 (먼저 ID 수집)
  const instructorQuery = query(
    collection(db, "instructors"),
    where("uid", "==", uid)
  );
  const instructorSnapshot = await getDocs(instructorQuery);
  const myInstructorIds = [];
  
  for (const docSnap of instructorSnapshot.docs) {
    myInstructorIds.push(docSnap.id);
    await deleteDoc(doc(db, "instructors", docSnap.id));
  }

  // 3. 수강생으로서의 예약 삭제
  const studentBookingQuery = query(
    collection(db, "bookings"),
    where("userId", "==", uid)
  );
  const studentBookingSnapshot = await getDocs(studentBookingQuery);
  for (const docSnap of studentBookingSnapshot.docs) {
    await deleteDoc(doc(db, "bookings", docSnap.id));
  }
  
  // 4. 강사로서의 예약 삭제
  const instructorBookingQuery = query(
    collection(db, "bookings"),
    where("instructorUid", "==", uid)
  );
  const instructorBookingSnapshot = await getDocs(instructorBookingQuery);
  for (const docSnap of instructorBookingSnapshot.docs) {
    await deleteDoc(doc(db, "bookings", docSnap.id));
  }

  // 5. 작성한 리뷰 삭제
  const myRatingQuery = query(
    collection(db, "ratings"),
    where("userId", "==", uid)
  );
  const myRatingSnapshot = await getDocs(myRatingQuery);
  for (const docSnap of myRatingSnapshot.docs) {
    await deleteDoc(doc(db, "ratings", docSnap.id));
  }
  
  // 6. 받은 리뷰 삭제 (강사 프로필에 달린 리뷰)
  for (const instructorId of myInstructorIds) {
    const instructorRatingQuery = query(
      collection(db, "ratings"),
      where("instructorId", "==", instructorId)
    );
    const instructorRatingSnapshot = await getDocs(instructorRatingQuery);
    for (const docSnap of instructorRatingSnapshot.docs) {
      await deleteDoc(doc(db, "ratings", docSnap.id));
    }
  }
  
  // 7. 알림 삭제
  const notificationQuery = query(
    collection(db, "notifications"),
    where("userId", "==", uid)
  );
  const notificationSnapshot = await getDocs(notificationQuery);
  for (const docSnap of notificationSnapshot.docs) {
    await deleteDoc(doc(db, "notifications", docSnap.id));
  }

  // 8. Firebase Auth 삭제
  await deleteUser(user);
}

// ============================================================
// 로그인 상태 감지
// ============================================================

export function setupAuthListener(onAuthChange) {
  onAuthStateChanged(auth, onAuthChange);
}

// ============================================================
// 사용자 프로필 업데이트 (수강생용)
// ============================================================

export async function updateUserProfile(userId, updates) {
  // 🔒 로그인 확인
  const user = verifyAuthenticated();
  
  // 🔒 본인의 프로필만 수정 가능
  if (userId !== user.uid) {
    throw new Error("본인의 프로필만 수정할 수 있습니다.");
  }
  
  // 🔒 입력값 검증
  if (updates.name) {
    if (!isValidLength(updates.name, 2, 50)) {
      throw new Error("이름은 2자 이상 50자 이하여야 합니다.");
    }
    updates.name = sanitizeInput(updates.name.trim());
  }
  
  if (updates.email) {
    if (!isValidEmail(updates.email)) {
      throw new Error("올바른 이메일 형식이 아닙니다.");
    }
    updates.email = updates.email.trim().toLowerCase();
  }
  
  const userQuery = query(collection(db, "users"), where("uid", "==", userId));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    const userDocRef = doc(db, "users", userSnapshot.docs[0].id);
    await updateDoc(userDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } else {
    throw new Error("사용자 정보를 찾을 수 없습니다.");
  }
}
