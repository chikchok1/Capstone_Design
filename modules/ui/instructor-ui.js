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
  uploadImageToCloudinary,
  compressImage,
} from "../cloudinary-upload.js";

// 전역 변수
export let sportsData = [];
export let allInstructors = [];
export let selectedRating = 0;
export let newInstructorImageUrl = null; // 신규 강사 등록용

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

    // 이미지 초기화
    newInstructorImageUrl = null;
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

// 신규 강사 이미지 업로드 핸들러 (즉시 바인딩)
async function handleNewInstructorImageChangeFunc(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("⚠️ 이미지 크기는 5MB 이하여야 합니다.");
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("⚠️ 이미지 파일만 업로드 가능합니다.");
    return;
  }

  const statusElement = document.getElementById("newInstructorUploadStatus");

  try {
    statusElement.textContent = "📤 업로드 중...";
    statusElement.style.color = "#3b82f6";

    const compressedFile = await compressImage(file, 800);
    newInstructorImageUrl = await uploadImageToCloudinary(compressedFile);

    const preview = document.getElementById("newInstructorProfilePreview");
    preview.src = newInstructorImageUrl;

    statusElement.textContent = "✅ 업로드 완료!";
    statusElement.style.color = "#10b981";
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    statusElement.textContent = "❌ 업로드 실패";
    statusElement.style.color = "#dc2626";
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

      // 프로필 이미지가 있으면 추가
      if (newInstructorImageUrl) {
        profileData.profileImage = newInstructorImageUrl;
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

      // 이미지 초기화
      newInstructorImageUrl = null;

      await window.loadAndDisplayInstructors();
      
      // ✅ 통계 업데이트
      if (window.updateStats) {
        await window.updateStats();
      }

      // ✅ 종목 카운트 업데이트 (종목 카드의 숫자가 즉시 업데이트됨)
      if (window.loadAndDisplaySports) {
        await window.loadAndDisplaySports();
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
