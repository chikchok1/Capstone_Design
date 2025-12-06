// ============================================================
// 마이페이지 UI 모듈
// ============================================================
import { auth } from "../firebase-config.js";
import { getCurrentUserData } from "../auth.js";
import { getMyBookings, getBookingRequests, getInstructorConfirmedBookings } from "../bookings.js";
import { getMyInstructorProfile } from "../instructors.js";
import { hasRated } from "../ratings.js";
import { openMyPageModal as openMyPageModalHelper, closeMyPageModal as closeMyPageModalHelper, showMyPageTab as showMyPageTabHelper } from "../modal-manager.js";
import { renderBookingCard, renderBookingRequestCard, renderInstructorProfile, renderStudentProfile } from "../ui-renderers.js";

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

    openMyPageModalHelper();

    const tabsContainer = document.getElementById("mypageTabs");
    
    if (userData.type === "instructor") {
      tabsContainer.innerHTML = `
        <button class="mypage-tab-btn active" onclick="showMyPageTab('requests')">예약 요청</button>
        <button class="mypage-tab-btn" onclick="showMyPageTab('confirmed')">확정된 예약</button>
        <button class="mypage-tab-btn" onclick="showMyPageTab('profile')">내 프로필</button>
      `;
      
      document.getElementById("myBookingsTab").style.display = "none";
      document.getElementById("bookingRequestsTab").style.display = "block";
      document.getElementById("confirmedBookingsTab").style.display = "none";
      document.getElementById("myProfileTab").style.display = "none";
      
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
    };

    Object.values(tabs).forEach(t => t.tab.style.display = "none");
    
    if (tabs[tabName]) {
      tabs[tabName].tab.style.display = "block";
      if (tabs[tabName].load && !tabs[tabName].loaded) {
        tabs[tabName].load();
        tabs[tabName].loaded = true;
      }
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
      if (userData.type === "student") {
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
