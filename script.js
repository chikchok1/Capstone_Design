// ============================================================
// FitMatch - 메인 스크립트 (리팩토링 버전)
// ============================================================

// Firebase & Auth
import { auth, db } from "./modules/firebase-config.js";
import {
  getCurrentUser,
  getCurrentUserData,
  setCurrentUser,
  setCurrentUserData,
  setupAuthListener,
} from "./modules/auth.js";

// UI 모듈
import { initAuthUI } from "./modules/ui/auth-ui.js";
import {
  initInstructorUI,
  setSportsData as setInstructorSportsData,
} from "./modules/ui/instructor-ui.js";
import { initBookingUI } from "./modules/ui/booking-ui.js";
import { initMyPageUI } from "./modules/ui/mypage-ui.js";
import { initProfileUI } from "./modules/ui/profile-ui.js";
import { initReviewUI } from "./modules/ui/review-ui.js";
import { initNotificationUI } from "./modules/ui/notification-ui.js";
import {
  initSportsUI,
  setSportsData,
  getSportsData,
} from "./modules/ui/sports-ui.js";

// Utilities
import { getStatistics } from "./modules/statistics.js";
import { loadSportsData } from "./modules/sports.js";
import {
  openAuthModal,
  closeAuthModal,
  closeInstructorModal,
  closeInstructorDetailModal,
  closeBookingModal,
  closeMyPageModal,
} from "./modules/modal-manager.js";
import {
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ============================================================
// 전역 변수
// ============================================================
let sportsDataGlobal = [];

// ============================================================
// 강사 UI 제어
// ============================================================
function showInstructorUI() {
  const instructorBtn = document.getElementById('instructorAddSportBtn');
  if (instructorBtn) {
    instructorBtn.style.display = 'inline';
    console.log("✅ 강사 UI 표시");
  }
}

function hideInstructorUI() {
  const instructorBtn = document.getElementById('instructorAddSportBtn');
  if (instructorBtn) {
    instructorBtn.style.display = 'none';
  }
}

window.showInstructorUI = showInstructorUI;
window.hideInstructorUI = hideInstructorUI;

// ============================================================
// 🆕 검색 박스 종목 리스트 채우기
// ============================================================
function populateSportSelect(sportsData) {
  console.log("🔍 검색 박스 종목 리스트 채우기...", sportsData.length);
  const sportSelect = document.getElementById("sportSelect");

  if (!sportSelect) {
    console.error("❌ sportSelect 요소를 찾을 수 없습니다!");
    return;
  }

  // 기존 옵션 유지하고 종목 추가
  sportSelect.innerHTML = '<option value="">운동 종목 선택</option>';

  sportsData.forEach((sport) => {
    const option = document.createElement("option");
    option.value = sport.name;
    option.textContent = `${sport.icon} ${sport.name}`;
    sportSelect.appendChild(option);
  });

  console.log(
    "✅ 종목 리스트 채우기 완료! 총",
    sportSelect.options.length - 1,
    "개"
  );
}

// ============================================================
// 즉시 초기화 (HTML 로드 전)
// ============================================================
// UI 모듈 즉시 초기화 (이벤트 핸들러 바인딩용)
initAuthUI();
initInstructorUI();
initBookingUI();
initMyPageUI();
initProfileUI();
initReviewUI();
initNotificationUI();
initSportsUI();

// ============================================================
// 로그인 상태 감지
// ============================================================
setupAuthListener(async (user) => {
  const authButtons = document.getElementById("authButtons");
  const userProfile = document.getElementById("userProfile");
  const userName = document.getElementById("userName");
  const instructorRegisterLink = document.querySelector(
    'a[href="#"][onclick*="openInstructorRegisterModal"]'
  );
  const instructorAddSportBtn = document.getElementById("instructorAddSportBtn");

  if (user) {
    setCurrentUser(user);
    console.log("✅ 로그인 상태:", user.email);

    // UI 먼저 업데이트
    authButtons.style.display = "none";
    userProfile.style.display = "flex";

    // 사용자 정보 로드
    const q = query(collection(db, "users"), where("uid", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      };
      setCurrentUserData(userData);
      userName.textContent = userData.name
        ? userData.name + "님"
        : user.email.split("@")[0] + "님";

      // ✅ 강사인 경우 강사 등록 링크만 표시 (종목 추가 버튼은 숨김)
      if (userData.type === "instructor") {
        if (instructorRegisterLink) {
          instructorRegisterLink.style.display = "inline";
        }
        // ✅ 강사는 종목 추가 불가
        if (instructorAddSportBtn) {
          instructorAddSportBtn.style.display = "none";
          console.log("✅ 강사 로그인: 종목 추가 버튼 숨김");
        }
      } else {
        if (instructorRegisterLink) {
          instructorRegisterLink.style.display = "none";
        }
        if (instructorAddSportBtn) {
          instructorAddSportBtn.style.display = "none";
        }
      }
      
      // ✅ 관리자 권한 체크
      const { isAdmin, checkAndSetAdminRole } = await import('./modules/admin.js');
      const adminStatus = await checkAndSetAdminRole(user.uid, user.email);
      
      if (adminStatus) {
        console.log("🔑 관리자 로그인:", user.email);
        userName.textContent += " [관리자]";
        
        // ✅ 관리자는 강사 등록 버튼 숨기기 (종목 추가 버튼만 표시)
        if (instructorRegisterLink) {
          instructorRegisterLink.style.display = "none";
        }
        // 종목 추가 버튼은 표시 (관리자도 종목 추가 가능)
        if (instructorAddSportBtn) {
          instructorAddSportBtn.style.display = "inline";
        }
        
        // ✅ 관리자는 알림 버튼 숨기기
        const bellIcon = document.getElementById("bellIcon");
        if (bellIcon) {
          bellIcon.style.display = "none";
        }
      }
    }

    // ✅ 관리자가 아닌 경우에만 알림 시스템 시작
    const { isAdmin } = await import('./modules/admin.js');
    if (!isAdmin(user.email) && window.startNotificationCheck) {
      window.startNotificationCheck();
    }

    // 통계 업데이트
    updateStats();
  
  // ✅ 통계 문서 초기화 (최초 1회만)
  try {
    const { initializeStatistics } = await import("./modules/statistics.js");
    await initializeStatistics();
  } catch (error) {
    console.warn("⚠️ 통계 초기화 실패 (무시):", error);
  }
  } else {
    setCurrentUser(null);
    setCurrentUserData(null);
    console.log("❌ 로그아웃 상태");
    authButtons.style.display = "flex";
    userProfile.style.display = "none";

    // 알림 시스템 중지
    if (window.stopNotificationCheck) {
      window.stopNotificationCheck();
    }

    if (instructorRegisterLink) {
      instructorRegisterLink.style.display = "none";
    }
    
    // ✅ 강사 UI 숨기기
    if (instructorAddSportBtn) {
      instructorAddSportBtn.style.display = "none";
    }
    
    // ✅ 비로그인 상태에서도 통계 표시
    updateStats();
  }
});

// ============================================================
// 통계 업데이트
// ============================================================
// ✅ forceRefresh 옵션 추가: true일 때 캐시 무시하고 실시간 계산
async function updateStats(forceRefresh = false) {
  try {
    // ✅ 항상 캐시에서 가져오기 (increment/decrement가 이미 캐시를 업데이트함)
    const stats = await getStatistics(false); // ← 캐시에서 가져오기

    const statInstructors = document.getElementById("statInstructors");
    const statBookings = document.getElementById("statBookings");
    const statRating = document.getElementById("statRating");
    const statSports = document.getElementById("statSports");

    if (statInstructors) statInstructors.textContent = stats.instructorCount;
    if (statBookings) statBookings.textContent = stats.bookingCount;
    if (statRating) statRating.textContent = stats.avgRating + "/5";
    
    // ✅ 운동 종목 수 업데이트
    if (statSports) {
      const sportsData = getSportsData();
      statSports.textContent = sportsData.length > 0 ? sportsData.length : "40";
    }

    console.log("✅ 통계 업데이트 완료:", stats);
  } catch (error) {
    console.error("❌ 통계 로드 실패:", error);

    // 에러 발생 시 기본값 표시
    const statInstructors = document.getElementById("statInstructors");
    const statBookings = document.getElementById("statBookings");
    const statRating = document.getElementById("statRating");
    const statSports = document.getElementById("statSports");

    if (statInstructors) statInstructors.textContent = "0";
    if (statBookings) statBookings.textContent = "0";
    if (statRating) statRating.textContent = "5.0/5";
    if (statSports) statSports.textContent = "40";
  }
}

window.updateStats = updateStats;

// ============================================================
// 강사 전용: 종목 추가 관련 함수
// ============================================================
// 종목 추가 모달 열기
window.openAddSportModal = async function() {
  const user = getCurrentUser();
  
  if (!user) {
    alert('⛔ 로그인이 필요합니다.');
    return;
  }
  
  // ✅ 관리자 체크
  const { isAdmin } = await import('./modules/admin.js');
  if (!isAdmin(user.email)) {
    alert('⛔ 관리자만 종목을 추가할 수 있습니다.');
    return;
  }
  
  const modal = document.getElementById('addSportModal');
  if (modal) {
    modal.classList.add('active');
    // 폼 초기화
    document.getElementById('newSportName').value = '';
    document.getElementById('newSportCategory').value = '';
  }
};

// 종목 추가 모달 닫기
window.closeAddSportModal = function() {
  const modal = document.getElementById('addSportModal');
  if (modal) modal.classList.remove('active');
};

// ✅ 이모지 미리보기 함수
window.previewSportEmoji = async function() {
  const sportName = document.getElementById('newSportName')?.value.trim();
  const category = document.getElementById('newSportCategory')?.value;
  const preview = document.getElementById('emojiPreview');
  
  if (!preview) return;
  
  // 종목명이나 카테고리가 없으면 기본 이모지
  if (!sportName && !category) {
    preview.textContent = '🏃';
    return;
  }
  
  try {
    const { getEmojiForSport } = await import('./modules/sports.js');
    const emoji = getEmojiForSport(sportName, category);
    preview.textContent = emoji;
    
    // ✨ 애니메이션 효과 추가
    preview.style.transform = 'scale(1.2)';
    setTimeout(() => {
      preview.style.transform = 'scale(1)';
    }, 200);
  } catch (error) {
    console.error('❌ 이모지 미리보기 실패:', error);
    preview.textContent = '🏃';
  }
};

// 이모지 자동 추천
window.autoSuggestEmoji = async function() {
  const sportName = document.getElementById('newSportName')?.value || '';
  const iconInput = document.getElementById('newSportIcon');
  const categorySelect = document.getElementById('newSportCategory');
  const preview = document.getElementById('emojiPreview');
  
  if (!sportName || !iconInput || !preview) return;
  
  try {
    const { getEmojiForSport } = await import('./modules/sports.js');
    const category = categorySelect?.value || '';
    const emoji = getEmojiForSport(sportName, category);
    
    iconInput.value = emoji;
    preview.textContent = emoji;
  } catch (error) {
    console.error('❌ 이모지 추천 실패:', error);
  }
};

// 이모지 미리보기 업데이트
window.updateEmojiPreview = function() {
  const iconInput = document.getElementById('newSportIcon');
  const preview = document.getElementById('emojiPreview');
  
  if (iconInput && preview) {
    preview.textContent = iconInput.value || '🏃';
  }
};

// 종목 추가 실행
window.addNewSportFromModal = async function() {
  const user = getCurrentUser();
  
  if (!user) {
    alert('⛔ 로그인이 필요합니다.');
    return;
  }
  
  // ✅ 관리자 체크
  const { isAdmin } = await import('./modules/admin.js');
  if (!isAdmin(user.email)) {
    alert('⛔ 관리자만 종목을 추가할 수 있습니다.');
    return;
  }
  
  const nameInput = document.getElementById('newSportName');
  const categorySelect = document.getElementById('newSportCategory');
  
  const name = nameInput?.value.trim();
  const category = categorySelect?.value;
  
  if (!name || !category) {
    alert('⚠️ 종목 이름과 카테고리를 모두 입력해주세요.');
    return;
  }
  
  try {
    const { addNewSport, refreshSportsWithCounts } = await import('./modules/sports.js');
    
    console.log(`🔍 종목 추가 시작: ${name}, ${category}`);
    
    // ✅ 관리자 권한으로 종목 추가 (이모지는 자동 매칭)
    await addNewSport(name, category);
    
    alert(`✅ "${name}" 종목이 추가되었습니다!`);
    
    // 모달 닫기
    window.closeAddSportModal();
    
    // 종목 데이터 새로고침
    sportsDataGlobal = await refreshSportsWithCounts();
    setSportsData(sportsDataGlobal);
    setInstructorSportsData(sportsDataGlobal);
    
    // UI 업데이트
    if (window.loadAndDisplaySports) {
      await window.loadAndDisplaySports();
    }
    
    // 검색 박스 종목 리스트 업데이트
    populateSportSelect(sportsDataGlobal);
    
    // 통계 업데이트
    await updateStats();
    
  } catch (error) {
    console.error('❌ 종목 추가 실패:', error);
    if (error.message.includes('관리자')) {
      alert('⛔ ' + error.message);
    } else if (error.message.includes('이미 존재')) {
      alert('⚠️ 이미 존재하는 종목입니다.');
    } else {
      alert('❌ 종목 추가 중 오류가 발생했습니다.');
    }
  }
};

// ============================================================
// 모달 이벤트 바인딩
// ============================================================
window.openModal = openAuthModal;
window.closeModal = closeAuthModal;
window.closeInstructorModal = closeInstructorModal;
window.closeInstructorDetailModal = closeInstructorDetailModal;
window.closeBookingModal = closeBookingModal;
window.closeMyPageModal = closeMyPageModal;

document.getElementById("authModal")?.addEventListener("click", function (e) {
  if (e.target === this) window.closeModal();
});

document
  .getElementById("instructorModal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) window.closeInstructorModal();
  });

document
  .getElementById("instructorDetailModal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) window.closeInstructorDetailModal();
  });

document
  .getElementById("bookingModal")
  ?.addEventListener("click", function (e) {
    if (e.target === this) window.closeBookingModal();
  });

document.getElementById("myPageModal")?.addEventListener("click", function (e) {
  if (e.target === this) window.closeMyPageModal();
});

// ============================================================
// 강사 삭제 (프로필 페이지에서 사용)
// ============================================================
window.deleteInstructorProfileById = async function (profileId) {
  if (!confirm("⚠️ 정말로 강사 프로필을 삭제하시겠습니까?")) {
    return;
  }

  try {
    const { deleteInstructorProfile } = await import(
      "./modules/instructors.js"
    );
    await deleteInstructorProfile(profileId);
    alert("✅ 강사 프로필이 삭제되었습니다.");
    window.closeMyPageModal();

    // ✅ 종목 데이터 먼저 새로고침 (Firebase에서 최신 카운트 가져오기)
    const { refreshSportsWithCounts } = await import("./modules/sports.js");
    const updatedSports = await refreshSportsWithCounts();

    // ✅ 종목 UI 업데이트
    if (window.loadAndDisplaySports) {
      const { setSportsData } = await import("./modules/ui/sports-ui.js");
      setSportsData(updatedSports);
      await window.loadAndDisplaySports();
    }

    // ✅ 강사 목록 새로고침
    if (window.loadAndDisplayInstructors) {
      await window.loadAndDisplayInstructors();
    }

    // ✅ 통계 업데이트 (강제 새로고침)
    if (window.updateStats) {
      await window.updateStats(true); // ← forceRefresh = true
    }
  } catch (error) {
    console.error("프로필 삭제 실패:", error);
    alert("프로필 삭제 중 오류가 발생했습니다.");
  }
};

// ============================================================
// 페이지 초기화
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 FitMatch 페이지 로드 시작");

  try {
    // 1. ✅ 종목 데이터 로드 및 강사 수 카운트 업데이트
    const { refreshSportsWithCounts } = await import("./modules/sports.js");
    sportsDataGlobal = await refreshSportsWithCounts();
    setSportsData(sportsDataGlobal);
    setInstructorSportsData(sportsDataGlobal);

    // 2. 종목 카드 표시
    await window.loadAndDisplaySports();

    // 3. 🆕 검색 박스 종목 리스트 채우기
    populateSportSelect(sportsDataGlobal);

    // 4. ✅ 인기 검색어 로드
    if (window.loadPopularSearches) {
      await window.loadPopularSearches();
    }
    
    // 5. ✅ 통계 표시 (비로그인 상태에서도)
    await updateStats();

    console.log("✅ FitMatch 페이지 로드 완료");
  } catch (error) {
    console.error("❌ 페이지 초기화 실패:", error);
  }
});

// ✅ 평점 재계산 함수 (콘솔에서 실행)
window.fixRatings = async function() {
  console.log("🔧 평점 재계산 시작...");
  
  try {
    const { recalculateAllInstructorRatings } = await import("./modules/ratings.js");
    const result = await recalculateAllInstructorRatings();
    
    console.log("✅ 재계산 완료:", result);
    
    // ✅ UI 새로고침
    if (window.updateStats) {
      await window.updateStats(true);
    }
    if (window.loadAndDisplayInstructors) {
      await window.loadAndDisplayInstructors();
    }
    
    alert(`✅ 평점 재계산 완료!\n\n총 ${result.total}명의 강사 중 ${result.updated}명 업데이트되었습니다.`);
  } catch (error) {
    console.error("❌ 평점 재계산 실패:", error);
    alert("❌ 평점 재계산에 실패했습니다.");
  }
};

console.log("✅ 평점 재계산 함수 등록됨: window.fixRatings()");

// ✅ 종목 데이터 초기화 함수 (일솔에서 실행)
window.resetSports = async function() {
  if (!confirm("⚠️ Firebase의 모든 종목 데이터를 기본값(66개)으로 초기화하시겠습니까?")) {
    return;
  }
  
  console.log("🔄 종목 데이터 초기화 시작...");
  
  try {
    const { resetSportsToDefault, refreshSportsWithCounts } = await import("./modules/sports.js");
    
    // 1. Firebase 데이터 초기화
    const resetData = await resetSportsToDefault();
    console.log(`✅ 기본 데이터 저장 완료: ${resetData.length}개`);
    
    // 2. 강사 수 카운트 업데이트
    sportsDataGlobal = await refreshSportsWithCounts();
    setSportsData(sportsDataGlobal);
    setInstructorSportsData(sportsDataGlobal);
    
    // 3. UI 업데이트
    if (window.loadAndDisplaySports) {
      await window.loadAndDisplaySports();
    }
    
    // 4. 검색 박스 업데이트
    populateSportSelect(sportsDataGlobal);
    
    // 5. 통계 업데이트
    await updateStats();
    
    alert(`✅ 종목 데이터 초기화 완료!\n\n촙66개의 종목이 로드되었습니다.`);
  } catch (error) {
    console.error("❌ 종목 데이터 초기화 실패:", error);
    if (error.message.includes('관리자')) {
      alert('⛔ ' + error.message);
    } else {
      alert("❌ 종목 데이터 초기화에 실패했습니다.");
    }
  }
};

console.log("✅ 종목 데이터 초기화 함수 등록됨: window.resetSports()");
console.log("🚀 FitMatch 페이지 로드 완료");
