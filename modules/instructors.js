// ============================================================
// 강사 관련 함수
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
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { updateSportCounts, loadSportsData } from './sports.js';

// 강사 등록
export async function registerInstructor(uid, instructorData) {
  await addDoc(collection(db, "instructors"), {
    uid: uid,
    ...instructorData,
    averageRating: 0,
    ratingCount: 0,
    lessonCount: 0,
    createdAt: new Date().toISOString(),
  });
  
  // 스포츠별 강사 수 업데이트
  await updateSportCountsAfterChange();
}

// 강사 목록 로드
export async function loadInstructors(filterSport = null, filterRegion = null, searchText = null) {
  // 모든 강사 데이터를 가져온 후 클라이언트에서 필터링 (인덱스 문제 회피)
  let q = query(collection(db, "instructors"), orderBy("averageRating", "desc"));
  
  const querySnapshot = await getDocs(q);
  const instructors = [];
  
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    
    // 종목 필터 체크 (선택된 경우에만)
    if (filterSport && data.sport !== filterSport) {
      return; // 종목이 일치하지 않으면 제외
    }
    
    // 지역 필터 체크 (선택된 경우에만)
    if (filterRegion && data.region !== filterRegion) {
      return; // 지역이 일치하지 않으면 제외
    }
    
    // 검색어 필터 체크 (입력된 경우에만)
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesName = data.name.toLowerCase().includes(searchLower);
      const matchesSport = data.sport.toLowerCase().includes(searchLower);
      const matchesIntro = data.introduction.toLowerCase().includes(searchLower);
      
      if (!matchesName && !matchesSport && !matchesIntro) {
        return; // 검색어와 일치하지 않으면 제외
      }
    }
    
    // 모든 필터를 통과한 강사만 추가
    instructors.push({ id: docSnap.id, ...data });
  });
  
  return instructors;
}

// 강사 상세 정보 가져오기
export async function getInstructorById(instructorId) {
  const instructorDoc = await getDoc(doc(db, "instructors", instructorId));
  if (instructorDoc.exists()) {
    return { id: instructorDoc.id, ...instructorDoc.data() };
  }
  return null;
}

// 강사 프로필 삭제
export async function deleteInstructorProfile(profileId) {
  await deleteDoc(doc(db, "instructors", profileId));
  
  // 스포츠별 강사 수 업데이트
  await updateSportCountsAfterChange();
}

// 강사 프로필 수정
export async function updateInstructorProfile(profileId, updatedData) {
  const instructorRef = doc(db, "instructors", profileId);
  
  // 기존 데이터 가져오기
  const oldData = await getDoc(instructorRef);
  const oldSport = oldData.exists() ? oldData.data().sport : null;
  
  await updateDoc(instructorRef, {
    ...updatedData,
    updatedAt: new Date().toISOString(),
  });
  
  // 종목이 변경된 경우 스포츠별 강사 수 업데이트
  if (updatedData.sport && oldSport !== updatedData.sport) {
    await updateSportCountsAfterChange();
  }
}

// 내 강사 프로필 가져오기 (첫 번째만)
export async function getMyInstructorProfile(uid) {
  const q = query(collection(db, "instructors"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
  }
  return null;
}

// ✅ 내 강사 프로필 모두 가져오기 (여러 개)
export async function getMyInstructorProfiles(uid) {
  const q = query(collection(db, "instructors"), where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  
  const profiles = [];
  querySnapshot.forEach((docSnap) => {
    profiles.push({ id: docSnap.id, ...docSnap.data() });
  });
  
  return profiles;
}

// 스포츠별 강사 수 업데이트 헬퍼 함수
async function updateSportCountsAfterChange() {
  try {
    // 최신 스포츠 데이터 로드
    const sportsData = await loadSportsData();
    
    // 강사 수 업데이트 및 저장
    await updateSportCounts(sportsData);
    
    console.log('✅ 스포츠별 강사 수가 업데이트되었습니다.');
  } catch (error) {
    console.error('❌ 스포츠별 강사 수 업데이트 실패:', error);
  }
}
