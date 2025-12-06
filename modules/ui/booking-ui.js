// ============================================================
// 예약 관련 UI 모듈
// ============================================================
import { auth, db } from "../firebase-config.js";
import { getCurrentUserData } from "../auth.js";
import {
  createBooking,
  confirmBooking,
  rejectBooking,
  cancelBooking,
} from "../bookings.js";
import { createNotification } from "../notifications.js";
import {
  openBookingModal as openBookingModalHelper,
  closeBookingModal as closeBookingModalHelper,
} from "../modal-manager.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export let currentBookingInstructorId = null;
export let currentBookingInstructorName = null;
export let currentBookingInstructorUid = null;
export let currentBookingInstructorSport = null; // ✅ 종목 추가

export function initBookingUI() {
  window.openBookingModal = function (instructorId, instructorName, instructorUid, instructorSport) { // ✅ sport 추가
    currentBookingInstructorId = instructorId;
    currentBookingInstructorName = instructorName;
    currentBookingInstructorUid = instructorUid;
    currentBookingInstructorSport = instructorSport; // ✅ 저장
    document.getElementById(
      "bookingInstructorName"
    ).textContent = `${instructorName} 강사님께 레슨을 요청합니다`;
    
    // ✅ 강사 상세 모달 닫기
    const instructorDetailModal = document.getElementById("instructorDetailModal");
    if (instructorDetailModal && instructorDetailModal.classList.contains("active")) {
      instructorDetailModal.classList.remove("active");
    }
    
    openBookingModalHelper();
  };

  window.closeBookingModal = closeBookingModalHelper;

  window.submitBooking = async function () {
    const user = auth.currentUser;
    if (!user) {
      alert("🔒 로그인이 필요합니다!");
      return;
    }

    const date = document.getElementById("bookingDate").value;
    const time = document.getElementById("bookingTime").value;
    const message = document.getElementById("bookingMessage").value.trim();

    if (!date || !time) {
      alert("📅 날짜와 시간을 선택해주세요!");
      return;
    }

    try {
      // ✅ 사용자 정보 가져오기
      const userData = getCurrentUserData();
      const userName = userData?.name || user.email.split("@")[0];
      const userEmail = user.email;

      console.log("✅ 예약 요청 데이터:", {
        instructorId: currentBookingInstructorId,
        instructorUid: currentBookingInstructorUid,
        instructorName: currentBookingInstructorName,
        instructorSport: currentBookingInstructorSport, // ✅ 추가
        userId: user.uid,
        userName,
        userEmail,
        date,
        time,
        message,
      });

      await createBooking({
        instructorId: currentBookingInstructorId,
        instructorUid: currentBookingInstructorUid,
        instructorName: currentBookingInstructorName,
        instructorSport: currentBookingInstructorSport, // ✅ 종목 추가
        userId: user.uid,
        userName,
        userEmail,
        date,
        time,
        message,
        status: "pending",
      });

      // ✅ 이 부분은 bookings.js에서 처리하므로 제거
      // await createNotification({
      //   recipientId: currentBookingInstructorId,
      //   type: "booking_request",
      //   title: "새로운 예약 요청",
      //   message: `${userName}님이 ${date} ${time}에 레슨을 요청했습니다.`,
      //   relatedId: currentBookingInstructorId,
      // });

      alert("✅ 예약 요청이 전송되었습니다!");
      closeBookingModalHelper();

      document.getElementById("bookingDate").value = "";
      document.getElementById("bookingTime").value = "";
      document.getElementById("bookingMessage").value = "";
      
      // ✅ 알림 배지 업데이트 (강사에게 알림이 간 후)
      if (window.updateNotificationBadge) {
        setTimeout(() => window.updateNotificationBadge(), 1000);
      }
    } catch (error) {
      console.error("예약 요청 실패:", error);
      alert("예약 요청 중 오류가 발생했습니다.");
    }
  };

  window.confirmBookingRequest = async function (bookingId) {
    if (!confirm("이 예약을 확정하시겠습니까?")) {
      return;
    }

    try {
      // 1. 예약 정보 먼저 가져오기
      const bookingDoc = await getDoc(doc(db, "bookings", bookingId));

      if (!bookingDoc.exists()) {
        alert("예약 정보를 찾을 수 없습니다.");
        return;
      }

      const booking = { id: bookingDoc.id, ...bookingDoc.data() };

      // 2. 예약 확정 (bookings.js에서 자동으로 알림 생성)
      await confirmBooking(bookingId);

      // 3. 이 부분은 bookings.js에서 처리하므로 제거
      // await createNotification({
      //   recipientId: booking.userId,
      //   type: "booking_confirmed",
      //   title: "예약 확정",
      //   message: `${booking.instructorName} 강사님이 ${booking.date} ${booking.time} 예약을 확정했습니다.`,
      //   relatedId: bookingId,
      // });

      alert("✅ 예약이 확정되었습니다!");

      // 목록 새로고침
      if (window.loadMyBookingRequests) {
        await window.loadMyBookingRequests();
      }
      
      // ✅ 알림 배지 업데이트
      if (window.updateNotificationBadge) {
        await window.updateNotificationBadge();
      }
      
      // ✅ 통계 업데이트 (매칭 완료 숫자 증가)
      if (window.updateStats) {
        await window.updateStats();
      }
    } catch (error) {
      console.error("예약 확정 실패:", error);
      alert("예약 확정 중 오류가 발생했습니다.");
    }
  };

  window.rejectBookingRequest = async function (bookingId) {
    if (!confirm("이 예약을 거절하시겠습니까?")) {
      return;
    }

    try {
      await rejectBooking(bookingId);
      alert("예약이 거절되었습니다.");
      if (window.loadMyBookingRequests) {
        await window.loadMyBookingRequests();
      }
    } catch (error) {
      console.error("예약 거절 실패:", error);
      alert("예약 거절 중 오류가 발생했습니다.");
    }
  };

  window.cancelMyBooking = async function (bookingId, instructorName) {
    const reason = prompt(
      `"${instructorName}" 강사님과의 예약을 취소하시겠습니까?\n\n취소 사유를 입력해주세요:`
    );
    if (!reason) return;

    try {
      await cancelBooking(bookingId, reason, "student"); // ✅ cancelledBy 추가
      alert("✅ 예약이 취소되었습니다.");
      if (window.loadMyBookingsList) {
        await window.loadMyBookingsList();
      }
      // 알림 배지 업데이트
      if (window.updateNotificationBadge) {
        await window.updateNotificationBadge();
      }
    } catch (error) {
      console.error("예약 취소 실패:", error);
      alert("예약 취소 중 오류가 발생했습니다.");
    }
  };
  
  // ✅ 수강생용 취소 함수 (별도로 분리)
  window.cancelStudentBooking = async function (bookingId, instructorName) {
    // ✅ 예쁜 모달 생성
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "cancelBookingModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <button class="modal-close" onclick="closeCancelModal()">×</button>
        <div class="auth-form">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fee2e2, #fecaca); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 3rem;">❌</div>
            <h2 class="form-title" style="margin-bottom: 10px;">예약을 취소하시겠습니까?</h2>
            <p class="form-subtitle">"${instructorName}" 강사님과의 예약을 취소합니다</p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
            <p style="color: #92400e; font-size: 0.9rem; line-height: 1.5; margin: 0;">
              ⚠️ 취소 사유는 강사님에게 전달됩니다.
            </p>
          </div>
          
          <div class="input-group" style="text-align: left;">
            <label for="cancelReason" class="input-label" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">취소 사유 <span style="color: #dc2626;">*</span></label>
            <textarea 
              id="cancelReason" 
              class="input-field" 
              rows="4" 
              placeholder="예: 개인 사정으로 인해 예약을 취소합니다."
              style="resize: vertical;"
            ></textarea>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-outline btn-full" onclick="closeCancelModal()" style="flex: 1;">
              돌아가기
            </button>
            <button class="btn btn-primary btn-full" onclick="confirmCancelBooking('${bookingId}', '${instructorName}')" style="flex: 1; background: linear-gradient(135deg, #dc2626, #ef4444);">
              <span class="btn-icon">✓</span> 취소 확정
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener("click", function(e) {
      if (e.target === modal) {
        window.closeCancelModal();
      }
    });
  };
  
  // 취소 모달 닫기
  window.closeCancelModal = function() {
    const modal = document.getElementById("cancelBookingModal");
    if (modal) modal.remove();
  };
  
  // 취소 확정 처리
  window.confirmCancelBooking = async function(bookingId, instructorName) {
    const reason = document.getElementById("cancelReason").value.trim();
    
    if (!reason || reason === "") {
      alert("취소 사유를 입력해주세요.");
      return;
    }

    try {
      await cancelBooking(bookingId, reason, "student");
      window.closeCancelModal();
      alert("✅ 예약이 취소되었습니다.");
      if (window.loadMyBookingsList) {
        await window.loadMyBookingsList();
      }
      // 알림 배지 업데이트
      if (window.updateNotificationBadge) {
        setTimeout(() => window.updateNotificationBadge(), 1000);
      }
      // ✅ 통계 업데이트 (매칭 완료 숫자 감소)
      if (window.updateStats) {
        await window.updateStats();
      }
    } catch (error) {
      console.error("예약 취소 실패:", error);
      alert("예약 취소 중 오류가 발생했습니다.");
    }
  };
  
  // ✅ 강사용 취소 함수
  window.cancelInstructorBooking = async function (bookingId, userName) {
    // ✅ 예쁜 모달 생성
    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "cancelBookingModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <button class="modal-close" onclick="closeCancelModal()">×</button>
        <div class="auth-form">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #fee2e2, #fecaca); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 3rem;">❌</div>
            <h2 class="form-title" style="margin-bottom: 10px;">예약을 취소하시겠습니까?</h2>
            <p class="form-subtitle">"${userName}"님과의 예약을 취소합니다</p>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 12px; margin-bottom: 20px;">
            <p style="color: #92400e; font-size: 0.9rem; line-height: 1.5; margin: 0;">
              ⚠️ 취소 사유는 수강생에게 전달됩니다.
            </p>
          </div>
          
          <div class="input-group" style="text-align: left;">
            <label for="cancelReason" class="input-label" style="display: block; margin-bottom: 8px; font-weight: 600; color: #374151;">취소 사유 <span style="color: #dc2626;">*</span></label>
            <textarea 
              id="cancelReason" 
              class="input-field" 
              rows="4" 
              placeholder="예: 일정 변경으로 인해 예약을 취소합니다."
              style="resize: vertical;"
            ></textarea>
          </div>
          
          <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-outline btn-full" onclick="closeCancelModal()" style="flex: 1;">
              돌아가기
            </button>
            <button class="btn btn-primary btn-full" onclick="confirmInstructorCancelBooking('${bookingId}', '${userName}')" style="flex: 1; background: linear-gradient(135deg, #dc2626, #ef4444);">
              <span class="btn-icon">✓</span> 취소 확정
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // 모달 외부 클릭 시 닫기
    modal.addEventListener("click", function(e) {
      if (e.target === modal) {
        window.closeCancelModal();
      }
    });
  };
  
  // 강사 취소 확정 처리
  window.confirmInstructorCancelBooking = async function(bookingId, userName) {
    const reason = document.getElementById("cancelReason").value.trim();
    
    if (!reason || reason === "") {
      alert("취소 사유를 입력해주세요.");
      return;
    }

    try {
      await cancelBooking(bookingId, reason, "instructor");
      window.closeCancelModal();
      alert("✅ 예약이 취소되었습니다.");
      if (window.loadInstructorConfirmedBookings) {
        await window.loadInstructorConfirmedBookings();
      }
      // 알림 배지 업데이트
      if (window.updateNotificationBadge) {
        setTimeout(() => window.updateNotificationBadge(), 1000);
      }
      // ✅ 통계 업데이트 (매칭 완료 숫자 감소)
      if (window.updateStats) {
        await window.updateStats();
      }
    } catch (error) {
      console.error("예약 취소 실패:", error);
      alert("예약 취소 중 오류가 발생했습니다.");
    }
  };
}
