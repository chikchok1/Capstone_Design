// ============================================================
// 강사 관련 UI 모듈
// ============================================================
import { auth } from "../firebase-config.js";
import { getCurrentUserData } from "../auth.js";
import {
  registerInstructor as registerInstructorAPI,
  loadInstructors,
  getInstructorById,
  deleteInstructorProfile,
  updateInstructorProfile,
} from "../instructors.js";
import { hasConfirmedBooking } from "../bookings.js";
import { hasRated } from "../ratings.js";
import {
  openAuthModal,
  openInstructorModal,
  closeInstructorModal,
  openInstructorDetailModal,
} from "../modal-manager.js";
import {
  renderInstructorCard,
  renderInstructorDetail,
} from "../ui-renderers.js";
import {
  getImageUploadManager,
  resetImageUploadManager,
} from "../image-upload-manager.js";

// 전역 변수
export let sportsData = [];
export let allInstructors = [];
export let selectedRating = 0;
// ✅ 이미지 업로드 관리자 사용 (전역 변수 제거)

export function setSportsData(data) {
  sportsData = data;
}

// 강사 등록 모달 열기
export function initInstructorRegisterModal() {
  window.openInstructorRegisterModal = async function () {
    const user = auth.currentUser;
    const userData = getCurrentUserData();

    if (!user) {
      alert("🔒 로그인이 필요합니다!");
      openAuthModal("login");
      return;
    }

    if (userData && userData.type !== "instructor") {
      alert("⚠️ 강사로 가입한 회원만 강사 등록이 가능합니다.");
      return;
    }

    await loadSportsForSelect();
    openInstructorModal();

    // ✅ 이미지 업로드 관리자 초기화
    resetImageUploadManager("newInstructor");
    
    // 기본 이미지로 초기화
    const preview = document.getElementById("newInstructorProfilePreview");
    if (preview) {
      preview.src =
        "https://ui-avatars.com/api/?name=Profile&size=150&background=3b82f6&color=fff";
    }
    const status = document.getElementById("newInstructorUploadStatus");
    if (status) {
      status.textContent = "";
    }
  };

  window.closeInstructorModal = closeInstructorModal;
}

// ✅ 신규 강사 이미지 업로드 핸들러 (개선 버전)
async function handleNewInstructorImageChangeFunc(event) {
  const file = event.target.files[0];
  if (!file) return;

  const manager = getImageUploadManager(
    "newInstructor",
    "newInstructorProfilePreview",
    "newInstructorUploadStatus"
  );

  try {
    await manager.uploadImage(file);
    console.log("✅ 신규 강사 이미지 업로드 성공");
  } catch (error) {
    console.error("❌ 신규 강사 이미지 업로드 실패:", error);
    alert("❌ 이미지 업로드에 실패했습니다.");
  }
}

export function initNewInstructorImageHandler() {
  // window에 즉시 바인딩
  window.handleNewInstructorImageChange = handleNewInstructorImageChangeFunc;
}

// 종목 select 로드
async function loadSportsForSelect() {
  const select = document.getElementById("instructorSport");
  select.innerHTML = '<option value="">전문 종목 선택</option>';

  sportsData.forEach((sport) => {
    const option = document.createElement("option");
    option.value = sport.name;
    option.textContent = sport.name;
    select.appendChild(option);
  });
}

// 강사 등록
export function initRegisterInstructorHandler() {
  window.registerInstructor = async function () {
    const user = auth.currentUser;
    const userData = getCurrentUserData();

    if (!user) {
      alert("🔒 로그인이 필요합니다!");
      return;
    }

    if (userData && userData.type !== "instructor") {
      alert("⚠️ 강사로 가입한 회원만 강사 등록이 가능합니다.");
      return;
    }

    const name = document.getElementById("instructorName").value.trim();
    const sport = document.getElementById("instructorSport").value;
    const region = document.getElementById("instructorRegion").value;
    const experience = parseInt(
      document.getElementById("instructorExperience").value
    );
    const price = parseInt(document.getElementById("instructorPrice").value);
    const intro = document.getElementById("instructorIntro").value.trim();
    const certificates = document
      .getElementById("instructorCertificates")
      .value.trim();

    if (!name || !sport || !region || !experience || !price || !intro) {
      alert("📝 필수 항목을 모두 입력해주세요!");
      return;
    }

    try {
      // 프로필 데이터 준비
      const profileData = {
        name,
        sport,
        region,
        experience,
        price,
        introduction: intro,
        certificates: certificates
          ? certificates.split(",").map((c) => c.trim())
          : [],
      };

      // ✅ 이미지 URL 가져오기
      const manager = getImageUploadManager(
        "newInstructor",
        "newInstructorProfilePreview",
        "newInstructorUploadStatus"
      );
      const uploadedUrl = manager.getImageUrl();
      if (uploadedUrl) {
        profileData.profileImage = uploadedUrl;
        console.log("✅ 프로필 이미지 포함:", uploadedUrl);
      }

      await registerInstructorAPI(user.uid, profileData);

      alert("🎉 강사 프로필이 등록되었습니다!");
      closeInstructorModal();

      // 폼 초기화
      document.getElementById("instructorName").value = "";
      document.getElementById("instructorSport").value = "";
      document.getElementById("instructorRegion").value = "";
      document.getElementById("instructorExperience").value = "";
      document.getElementById("instructorPrice").value = "";
      document.getElementById("instructorIntro").value = "";
      document.getElementById("instructorCertificates").value = "";

      // ✅ 이미지 업로드 관리자 초기화
      resetImageUploadManager("newInstructor");

      // ✅ 종목 데이터 먼저 새로고침 (Firebase에서 최신 카운트 가져오기)
      const { refreshSportsWithCounts } = await import("../sports.js");
      const updatedSports = await refreshSportsWithCounts();
      
      // ✅ 종목 UI 업데이트
      if (window.loadAndDisplaySports) {
        const { setSportsData } = await import("./sports-ui.js");
        setSportsData(updatedSports);
        await window.loadAndDisplaySports();
      }
      
      // ✅ 강사 목록 새로고침
      await window.loadAndDisplayInstructors();
      
      // ✅ 통계 업데이트
      if (window.updateStats) {
        await window.updateStats();
      }
    } catch (error) {
      console.error("❌ 강사 등록 실패:", error);
      alert("강사 등록 중 오류가 발생했습니다: " + error.message);
    }
  };
}

// 강사 목록 표시
export function initInstructorList() {
  window.loadAndDisplayInstructors = async function (
    filterSport = null,
    filterRegion = null,
    searchText = null
  ) {
    try {
      const instructors = await loadInstructors(
        filterSport,
        filterRegion,
        searchText
      );
      allInstructors = instructors;
      displayInstructors(instructors);
    } catch (error) {
      console.error("강사 목록 로드 실패:", error);
    }
  };

  function displayInstructors(instructors) {
    const grid = document.getElementById("instructorsGrid");
    grid.innerHTML = "";

    if (instructors.length === 0) {
      grid.innerHTML =
        '<p style="text-align: center; padding: 40px; color: #6b7280; grid-column: 1/-1;">등록된 강사가 없습니다. 첫 강사로 등록해보세요! 💪</p>';
      return;
    }

    instructors.forEach((instructor) => {
      const card = renderInstructorCard(
        instructor,
        window.showInstructorDetail
      );
      grid.appendChild(card);
    });
  }
}

// ✅ 강사 상세 보기 - isOwner 체크 추가!
export function initInstructorDetail() {
  window.openInstructorDetail = async function (instructorId) {
    try {
      const instructor = await getInstructorById(instructorId);
      if (!instructor) {
        alert("강사 정보를 찾을 수 없습니다.");
        return;
      }
      await window.showInstructorDetail(instructor);
    } catch (error) {
      console.error("강사 상세 로드 실패:", error);
      alert("강사 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };
  
  window.showInstructorDetail = async function (instructor) {
    const user = auth.currentUser;
    const userData = getCurrentUserData();

    let hasConfirmed = false;
    let hasRatedAlready = false;
    let isOwner = false; // ✅ 추가!

    // ✅ 본인 여부 체크 - uid로 비교
    if (user && userData && userData.type === "instructor") {
      isOwner = instructor.uid === user.uid;
      console.log("🔍 본인 여부 체크:", {
        instructorUid: instructor.uid,
        currentUserUid: user.uid,
        isOwner: isOwner
      });
    }

    if (user && userData && userData.type === "student") {
      hasConfirmed = await hasConfirmedBooking(instructor.id, user.uid);
      if (hasConfirmed) {
        hasRatedAlready = await hasRated(instructor.id, user.uid);
      }
    }

    const content = document.getElementById("instructorDetailContent");
    content.innerHTML = renderInstructorDetail(
      instructor,
      hasConfirmed,
      hasRatedAlready,
      userData?.type === "student",
      !!user,
      isOwner // ✅ 추가!
    );

    openInstructorDetailModal();
  };
}

// 검색 핸들러
export function initSearchHandler() {
  window.handleSearch = async function () {
    const sportValue = document.getElementById("sportSelect").value;
    const regionValue = document.getElementById("regionSelect").value;
    const searchValue = document.getElementById("searchInput").value.trim();

    // ✅ 검색 기록 저장
    if (sportValue || searchValue) {
      const { logSearch } = await import("../search-analytics.js");
      const user = auth.currentUser;
      const searchTerm = searchValue || sportValue;
      await logSearch(searchTerm, user?.uid || null);
      
      // ✅ 검색 후 즉시 인기 검색어 업데이트
      if (window.loadPopularSearches) {
        await window.loadPopularSearches();
      }
    }

    await window.loadAndDisplayInstructors(
      sportValue || null,
      regionValue || null,
      searchValue || null
    );

    document.querySelector("#instructors")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  window.setSearch = function (sport) {
    document.getElementById("sportSelect").value = sport;
    document.getElementById("searchInput").value = sport;
    window.handleSearch();
  };
  
  // ✅ 인기 검색어 로드 및 표시
  window.loadPopularSearches = async function() {
    try {
      const { getPopularSearches } = await import("../search-analytics.js");
      const popularSearches = await getPopularSearches(4);
      
      const container = document.querySelector(".popular-searches");
      if (!container) return;
      
      // 기존 버튼들 제거
      const buttons = container.querySelectorAll(".popular-tag");
      buttons.forEach(btn => btn.remove());
      
      // 새 버튼 추가
      popularSearches.forEach(search => {
        const button = document.createElement("button");
        button.className = "popular-tag";
        button.textContent = search.term;
        button.onclick = () => window.setSearch(search.term);
        container.appendChild(button);
      });
      
      console.log("✅ 인기 검색어 업데이트:", popularSearches.map(s => `${s.term}(${s.count}회)`));
    } catch (error) {
      console.error("인기 검색어 로드 실패:", error);
    }
  };
}

// 강사 UI 초기화
export function initInstructorUI() {
  initInstructorRegisterModal();
  initNewInstructorImageHandler();
  initRegisterInstructorHandler();
  initInstructorList();
  initInstructorDetail();
  initSearchHandler();
}
