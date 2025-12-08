// ============================================================
// 강사 관련 함수 (보안 강화 + 통계 자동 업데이트)
// ============================================================
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { refreshSportsWithCounts } from './sports.js';
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

async function verifyProfileOwner(profileId, currentUid) {
  const profileDoc = await getDoc(doc(db, "instructors", profileId));
  
  if (!profileDoc.exists()) {
    throw new Error("강사 프로필을 찾을 수 없습니다.");
  }
  
  const profileData = profileDoc.data();
  
  if (profileData.uid !== currentUid) {
    throw new Error("본인의 프로필만 수정/삭제할 수 있습니다.");
  }
  
  return profileData;
}

// ============================================================
// 강사 관련 함수
// ============================================================

export async function registerInstructor(uid, instructorData) {
  const user = verifyAuthenticated();
  
  if (uid !== user.uid) {
    throw new Error("본인의 프로필만 생성할 수 있습니다.");
  }
  
  await addDoc(collection(db, "instructors"), {
    uid: uid,
    ...instructorData,
    averageRating: 0,
    ratingCount: 0,
    lessonCount: 0,
    createdAt: new Date().toISOString(),
  });
  
  await updateSportCountsAfterChange();
  
  // ✅ 통계 자동 업데이트 (강제 새로고침)
  await updateStatisticsAfterChange();
}

export async function loadInstructors(filterSport = null, filterRegion = null, searchText = null) {
  let q = query(collection(db, "instructors"), orderBy("averageRating", "desc"));
  
  const querySnapshot = await getDocs(q);
  const instructors = [];
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    
    if (filterSport && data.sport !== filterSport) {
      return;
    }
    
    if (filterRegion && data.region !== filterRegion) {
      return;
    }
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesName = data.name.toLowerCase().includes(searchLower);
      const matchesSport = data.sport.toLowerCase().includes(searchLower);
      const matchesIntro = data.introduction.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesSport && !matchesIntro) {
        return;
      }
    }
    
    instructors.push({ id: docSnap.id, ...data });
  });
  
  return instructors;
}

export async function getInstructorById(instructorId) {
  const instructorDoc = await getDoc(doc(db, "instructors", instructorId));
  if (instructorDoc.exists()) {
    return { id: instructorDoc.id, ...instructorDoc.data() };
  }
  return null;
}

export async function deleteInstructorProfile(profileId) {
  const user = verifyAuthenticated();
  await verifyProfileOwner(profileId, user.uid);
  
  await deleteDoc(doc(db, "instructors", profileId));
  await updateSportCountsAfterChange();
  
  // ✅ 통계 자동 업데이트 (강제 새로고침)
  await updateStatisticsAfterChange();
}

export async function updateInstructorProfile(profileId, updatedData) {
  const user = verifyAuthenticated();
  const oldData = await verifyProfileOwner(profileId, user.uid);
  
  const instructorRef = doc(db, "instructors", profileId);
  const oldSport = oldData.sport;
  
  await updateDoc(instructorRef, {
    ...updatedData,
    updatedAt: new Date().toISOString(),
  });
  
  if (updatedData.sport && oldSport !== updatedData.sport) {
    await updateSportCountsAfterChange();
  }
}

export async function getMyInstructorProfile(uid) {
  const user = verifyAuthenticated();
  
  if (uid !== user.uid) {
    throw new Error("본인의 프로필만 조회할 수 있습니다.");
  }
  
  const q = query(collection(db, "instructors"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  }
  return null;
}

export async function getMyInstructorProfiles(uid) {
  const user = verifyAuthenticated();
  
  if (uid !== user.uid) {
    throw new Error("본인의 프로필만 조회할 수 있습니다.");
  }
  
  const q = query(collection(db, "instructors"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  
  const profiles = [];
  querySnapshot.forEach((docSnap) => {
    profiles.push({ id: docSnap.id, ...docSnap.data() });
  });
  
  return profiles;
}

async function updateSportCountsAfterChange() {
  try {
    await refreshSportsWithCounts();
  } catch (error) {
    console.warn("⚠️ 스포츠 카운트 업데이트 실패:", error);
  }
}

// ✅ 통계 업데이트 헬퍼 함수 (강제 새로고침)
async function updateStatisticsAfterChange() {
  try {
    const { updateStatisticsCache } = await import('./statistics.js');
    await updateStatisticsCache();
    console.log("✅ 강사 변경 - 통계 캐시 업데이트 완료");
    
    // ✅ UI 통계 즉시 반영 (강제 새로고침)
    if (window.updateStats) {
      await window.updateStats(true);  // ← forceRefresh = true
    }
  } catch (error) {
    console.warn("⚠️ 통계 업데이트 실패:", error);
  }
}
