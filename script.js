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

      if (userData.type === "instructor") {
        instructorRegisterLink.style.display = "inline";
      } else {
        instructorRegisterLink.style.display = "none";
      }
    }

    // 알림 시스템 시작
    if (window.startNotificationCheck) {
      window.startNotificationCheck();
    }

    // 통계 업데이트
    updateStats();
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
  }
});

// ============================================================
// 통계 업데이트
// ============================================================
// ✅ forceRefresh 옵션 추가: true일 때 캐시 무시하고 실시간 계산
async function updateStats(forceRefresh = false) {
  try {
    const stats = await getStatistics(forceRefresh);

    const statInstructors = document.getElementById("statInstructors");
    const statBookings = document.getElementById("statBookings");
    const statRating = document.querySelector(
      ".stats-grid .stat-item:nth-child(3) h3"
    );

    if (statInstructors) statInstructors.textContent = stats.instructorCount;
    if (statBookings) statBookings.textContent = stats.bookingCount;
    if (statRating) statRating.textContent = stats.avgRating + "/5";

    console.log("✅ 통계 업데이트 완료:", stats);
  } catch (error) {
    console.error("❌ 통계 로드 실패:", error);

    // 에러 발생 시 기본값 표시
    const statInstructors = document.getElementById("statInstructors");
    const statBookings = document.getElementById("statBookings");
    const statRating = document.querySelector(
      ".stats-grid .stat-item:nth-child(3) h3"
    );

    if (statInstructors) statInstructors.textContent = "0";
    if (statBookings) statBookings.textContent = "0";
    if (statRating) statRating.textContent = "4.8/5";
  }
}

window.updateStats = updateStats;

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

    console.log("✅ FitMatch 페이지 로드 완료");
  } catch (error) {
    console.error("❌ 페이지 초기화 실패:", error);
  }
});

console.log("🚀 FitMatch 페이지 로드 완료");
