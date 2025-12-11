// ============================================================
// 마이페이지 UI 모듈 (관리자 기능 추가)
// ============================================================
import { auth } from "../firebase-config.js";
import { getCurrentUserData } from "../auth.js";
import { getMyBookings, getBookingRequests, getInstructorConfirmedBookings } from "../bookings.js";
import { getMyInstructorProfile } from "../instructors.js";
import { hasRated } from "../ratings.js";
import { openMyPageModal as openMyPageModalHelper, closeMyPageModal as closeMyPageModalHelper, showMyPageTab as showMyPageTabHelper } from "../modal-manager.js";
import { renderBookingCard, renderBookingRequestCard, renderInstructorProfile, renderStudentProfile } from "../ui-renderers.js";
import { isAdmin } from "../admin.js";

export let myBookingsCache = null;
export let myRequestsCache = null;
export let myProfileCache = null;

export function initMyPageUI() {
  window.openMyPage = async function () {
    const user = auth.currentUser;
    const userData = getCurrentUserData();
    
    if (!user) {
      alert("🔒 로그인이 필요합니다!");
      return;
    }

    // ✅ userData가 null인 경우 체크
    if (!userData) {
      alert("⚠️ 사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    openMyPageModalHelper();

    const tabsContainer = document.getElementById("mypageTabs");
    
    // ✅ 관리자인 경우 특별한 UI 표시
    if (isAdmin(user.email)) {
      tabsContainer.innerHTML = `
        <button class="mypage-tab-btn active" onclick="showMyPageTab('admin')">🔑 강사 관리</button>
      `;
      
      document.getElementById("myBookingsTab").style.display = "none";
      document.getElementById("bookingRequestsTab").style.display = "none";
      document.getElementById("confirmedBookingsTab").style.display = "none";
      document.getElementById("myProfileTab").style.display = "none";
      document.getElementById("adminTab").style.display = "block";
      
      setTimeout(() => window.loadAdminInstructorManagement(), 0);
      
    } else if (userData.type === "instructor") {
      tabsContainer.innerHTML = `
        <button class="mypage-tab-btn active" onclick="showMyPageTab('requests')">예약 요청</button>
        <button class="mypage-tab-btn" onclick="showMyPageTab('confirmed')">확정된 예약</button>
        <button class="mypage-tab-btn" onclick="showMyPageTab('profile')">내 프로필</button>
      `;
      
      document.getElementById("myBookingsTab").style.display = "none";
      document.getElementById("bookingRequestsTab").style.display = "block";
      document.getElementById("confirmedBookingsTab").style.display = "none";
      document.getElementById("myProfileTab").style.display = "none";
      document.getElementById("adminTab").style.display = "none";
      
      setTimeout(() => window.loadMyBookingRequests(), 0);
      
    } else {
      tabsContainer.innerHTML = `
        <button class="mypage-tab-btn active" onclick="showMyPageTab('bookings')">내 예약</button>
        <button class="mypage-tab-btn" onclick="showMyPageTab('profile')">내 프로필</button>
      `;
      
      document.getElementById("myBookingsTab").style.display = "block";
      document.getElementById("bookingRequestsTab").style.display = "none";
      document.getElementById("confirmedBookingsTab").style.display = "none";
      document.getElementById("myProfileTab").style.display = "none";
      document.getElementById("adminTab").style.display = "none";
      
      setTimeout(() => window.loadMyBookingsList(), 0);
    }
  };

  window.closeMyPageModal = closeMyPageModalHelper;

  window.showMyPageTab = function (tabName) {
    showMyPageTabHelper(tabName);
    
    // ✅ 모든 탭 버튼에서 active 클래스 제거
    document.querySelectorAll(".mypage-tab-btn").forEach(btn => {
      btn.classList.remove("active");
    });
    
    // ✅ 클릭한 버튼에 active 클래스 추가
    event.target.classList.add("active");
    
    const tabs = {
      bookings: { tab: document.getElementById("myBookingsTab"), load: window.loadMyBookingsList },
      requests: { tab: document.getElementById("bookingRequestsTab"), load: window.loadMyBookingRequests },
      confirmed: { tab: document.getElementById("confirmedBookingsTab"), load: window.loadInstructorConfirmedBookings },
      profile: { tab: document.getElementById("myProfileTab"), load: window.loadMyProfileContent },
      admin: { tab: document.getElementById("adminTab"), load: window.loadAdminInstructorManagement },
    };

    Object.values(tabs).forEach(t => {
      if (t.tab) t.tab.style.display = "none";
    });
    
    if (tabs[tabName] && tabs[tabName].tab) {
      tabs[tabName].tab.style.display = "block";
      if (tabs[tabName].load && !tabs[tabName].loaded) {
        tabs[tabName].load();
        tabs[tabName].loaded = true;
      }
    }
  };

  // ✅ 관리자 전용: 모든 강사 관리
  window.loadAdminInstructorManagement = async function () {
    const adminContent = document.getElementById("adminContent");
    
    adminContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">📦 로딩 중...</p>';
    
    try {
      const { getAllInstructors } = await import("../instructors.js");
      const instructors = await getAllInstructors();

      if (instructors.length === 0) {
        adminContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">등록된 강사가 없습니다.</p>';
        return;
      }

      adminContent.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 1.2rem; color: #1f2937;">
            🔑 등록된 강사 목록 (${instructors.length}명)
          </h3>
          <p style="color: #6b7280; font-size: 0.9rem; margin-top: 5px;">
            관리자는 모든 강사 프로필을 삭제할 수 있습니다.
          </p>
        </div>
        <div id="adminInstructorsList"></div>
      `;

      const instructorsList = document.getElementById("adminInstructorsList");

      instructors.forEach((instructor) => {
        const card = document.createElement("div");
        card.className = "booking-card";
        card.style.borderLeft = "4px solid #ef4444";
        card.innerHTML = `
          <div style="display: flex; gap: 15px; align-items: start;">
            <img 
              src="${instructor.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(instructor.name) + '&size=80&background=3b82f6&color=fff'}" 
              alt="${instructor.name}"
              style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid #e5e7eb;"
            />
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                  <h4 style="font-size: 1.1rem; margin-bottom: 3px;">${instructor.name} 강사</h4>
                  <p style="color: #6b7280; font-size: 0.9rem;">${instructor.sport} · ${instructor.region}</p>
                </div>
                <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem;">
                  ⭐ ${instructor.averageRating || 5.0}점
                </span>
              </div>
              
              <div style="display: flex; gap: 10px; margin-bottom: 10px; font-size: 0.85rem; color: #6b7280;">
                <span>💼 경력 ${instructor.experience}년</span>
                <span>💰 ${instructor.price?.toLocaleString()}원/회</span>
                <span>📊 ${instructor.ratingCount || 0}개 리뷰</span>
              </div>

              ${instructor.introduction ? `
                <p style="color: #6b7280; font-size: 0.9rem; line-height: 1.4; margin-bottom: 10px; padding: 10px; background: #f9fafb; border-radius: 8px;">
                  ${instructor.introduction.length > 100 ? instructor.introduction.substring(0, 100) + '...' : instructor.introduction}
                </p>
              ` : ''}

              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button 
                  class="btn btn-outline" 
                  onclick="viewInstructorDetail('${instructor.id}')"
                  style="flex: 1;"
                >
                  👁️ 상세보기
                </button>
                <button 
                  class="btn btn-outline" 
                  onclick="adminDeleteInstructor('${instructor.id}', '${instructor.name}')"
                  style="flex: 1; border-color: #ef4444; color: #ef4444;"
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
          </div>
        `;
        instructorsList.appendChild(card);
      });
    } catch (error) {
      console.error("❌ 강사 목록 로드 실패:", error);
      adminContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #dc2626;">❌ 로드 실패</p>';
    }
  };

  // ✅ 강사 상세 보기 함수 추가
  window.viewInstructorDetail = async function (instructorId) {
    try {
      // 마이페이지 모달 먼저 닫기
      closeMyPageModalHelper();
      
      // instructors.js에서 가져오기
      const { getInstructorById } = await import("../instructors.js");
      const instructor = await getInstructorById(instructorId);
      
      if (!instructor) {
        alert("강사 정보를 찾을 수 없습니다.");
        return;
      }
      
      // showInstructorDetail 호출
      if (window.showInstructorDetail) {
        await window.showInstructorDetail(instructor);
      } else {
        alert("강사 상세 보기 기능을 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("❌ 강사 상세 로드 실패:", error);
      alert("강사 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  // ✅ 관리자 전용: 강사 삭제
  window.adminDeleteInstructor = async function (instructorId, instructorName) {
    const user = auth.currentUser;
    
    if (!user || !isAdmin(user.email)) {
      alert("⛔ 관리자만 삭제할 수 있습니다.");
      return;
    }

    if (!confirm(`⚠️ 정말로 "${instructorName}" 강사를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 예약 및 리뷰도 모두 삭제됩니다.`)) {
      return;
    }

    try {
      const { deleteInstructorProfile } = await import("../instructors.js");
      await deleteInstructorProfile(instructorId);
      
      alert(`✅ "${instructorName}" 강사가 삭제되었습니다.`);
      
      // ✅ 강사 목록 새로고침
      await window.loadAdminInstructorManagement();
      
      // ✅ 종목 데이터 새로고침
      const { refreshSportsWithCounts } = await import("../sports.js");
      await refreshSportsWithCounts();
      
      // ✅ 통계 업데이트
      if (window.updateStats) {
        await window.updateStats(true);
      }
      
      // ✅ 메인 페이지 강사 목록 새로고침
      if (window.loadAndDisplayInstructors) {
        await window.loadAndDisplayInstructors();
      }
      
    } catch (error) {
      console.error("❌ 강사 삭제 실패:", error);
      alert("❌ 강사 삭제 중 오류가 발생했습니다.");
    }
  };

  window.loadMyBookingsList = async function () {
    const user = auth.currentUser;
    const bookingsList = document.getElementById("myBookingsList");
    
    bookingsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">📦 로딩 중...</p>';
    
    try {
      const bookings = await getMyBookings(user.uid);
      myBookingsCache = bookings;
      
      if (bookings.length === 0) {
        bookingsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">확정된 예약이 없습니다.</p>';
        return;
      }

      bookingsList.innerHTML = "";

      const ratingChecks = bookings.map(booking => 
        hasRated(booking.instructorId, user.uid)
          .then(hasRatedAlready => ({ booking, hasRatedAlready }))
      );
      
      const results = await Promise.all(ratingChecks);
      
      results.forEach(({ booking, hasRatedAlready }) => {
        const card = renderBookingCard(booking, hasRatedAlready);
        bookingsList.appendChild(card);
      });
    } catch (error) {
      console.error("예약 내역 로드 실패:", error);
      bookingsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #dc2626;">❌ 로드 실패</p>';
    }
  };

  window.loadMyBookingRequests = async function () {
    const user = auth.currentUser;
    const requestsList = document.getElementById("bookingRequestsList");
    
    requestsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">📦 로딩 중...</p>';
    
    try {
      const instructorProfile = await getMyInstructorProfile(user.uid);
      
      if (!instructorProfile) {
        requestsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">강사 프로필을 먼저 등록해주세요.</p>';
        return;
      }

      const bookings = await getBookingRequests(instructorProfile.id);
      myRequestsCache = bookings;

      if (bookings.length === 0) {
        requestsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">받은 예약 요청이 없습니다.</p>';
        return;
      }

      requestsList.innerHTML = "";

      for (const booking of bookings) {
        const card = renderBookingRequestCard(booking);
        requestsList.appendChild(card);
      }
    } catch (error) {
      console.error("예약 요청 로드 실패:", error);
      requestsList.innerHTML = '<p style="text-align: center; padding: 40px; color: #dc2626;">❌ 로드 실패</p>';
    }
  };

  // ✅ 강사의 확정된 예약 목록 (새로 추가)
  window.loadInstructorConfirmedBookings = async function () {
    const user = auth.currentUser;
    const confirmedList = document.getElementById("confirmedBookingsList");
    
    confirmedList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">📦 로딩 중...</p>';
    
    try {
      const instructorProfile = await getMyInstructorProfile(user.uid);
      
      if (!instructorProfile) {
        confirmedList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">강사 프로필을 먼저 등록해주세요.</p>';
        return;
      }

      const bookings = await getInstructorConfirmedBookings(instructorProfile.id);

      if (bookings.length === 0) {
        confirmedList.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">확정된 예약이 없습니다.</p>';
        return;
      }

      confirmedList.innerHTML = "";

      for (const booking of bookings) {
        const card = document.createElement("div");
        card.className = "booking-card";
        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <h4 style="font-size: 1.1rem; margin-bottom: 5px;">${booking.userName} 님</h4>
              <p style="color: #6b7280; font-size: 0.9rem;">${booking.date} ${booking.time}</p>
              <p style="color: #6b7280; font-size: 0.85rem; margin-top: 3px;">${booking.userEmail}</p>
            </div>
            <span class="status-badge confirmed">확정</span>
          </div>
          ${booking.message ? `<p style="color: #6b7280; font-size: 0.9rem; padding: 10px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px;">메시지: ${booking.message}</p>` : ''}
          <button class="btn btn-outline btn-full" style="border-color: #dc2626; color: #dc2626;" onclick="cancelInstructorBooking('${booking.id}', '${booking.userName}')">
            ❌ 예약 취소
          </button>
        `;
        confirmedList.appendChild(card);
      }
    } catch (error) {
      console.error("확정된 예약 로드 실패:", error);
      confirmedList.innerHTML = '<p style="text-align: center; padding: 40px; color: #dc2626;">❌ 로드 실패</p>';
    }
  };

  window.loadMyProfileContent = async function () {
    const user = auth.currentUser;
    const userData = getCurrentUserData();
    const profileContent = document.getElementById("myProfileContent");
    
    profileContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">📦 로딩 중...</p>';
    
    try {
      if (userData && userData.type === "student") {
        profileContent.innerHTML = renderStudentProfile(userData);
        return;
      }

      // ✅ 여러 프로필 가져오기
      const { getMyInstructorProfiles } = await import("../instructors.js");
      const profiles = await getMyInstructorProfiles(user.uid);
      myProfileCache = profiles;

      if (!profiles || profiles.length === 0) {
        if (userData && userData.type === "instructor") {
          profileContent.innerHTML = `
            <p style="text-align: center; padding: 40px; color: #6b7280;">아직 강사 프로필이 없습니다.</p>
            <button class="btn btn-primary btn-full" onclick="window.closeMyPageModal(); window.openInstructorRegisterModal();">
              <span class="btn-icon">✨</span> 강사 프로필 등록하기
            </button>
          `;
        }
        return;
      }

      // ✅ 여러 프로필 표시
      profileContent.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 1.2rem;">내 강사 프로필 (${profiles.length}개)</h3>
          <button class="btn btn-primary" onclick="window.closeMyPageModal(); window.openInstructorRegisterModal();">
            <span class="btn-icon">➕</span> 새 프로필 추가
          </button>
        </div>
        <div id="profilesList"></div>
      `;
      
      const profilesList = document.getElementById("profilesList");
      
      profiles.forEach((profile, index) => {
        const profileCard = document.createElement("div");
        profileCard.style.marginBottom = "20px";
        profileCard.innerHTML = renderInstructorProfile(profile);
        profilesList.appendChild(profileCard);
      });
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      profileContent.innerHTML = '<p style="text-align: center; padding: 40px; color: #dc2626;">❌ 로드 실패</p>';
    }
  };
}
