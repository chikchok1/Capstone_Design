// ============================================================
// 모달 관리 함수들
// ============================================================

// 인증 모달
export function openAuthModal(mode = "login") {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.add("active");
    switchAuthTab(mode);
  }
}

export function closeAuthModal() {
  const modal = document.getElementById("authModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

export function switchAuthTab(mode) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabLogin = document.getElementById("tabLogin");
  const tabSignup = document.getElementById("tabSignup");

  if (mode === "login") {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
  } else {
    loginForm.style.display = "none";
    signupForm.style.display = "block";
    tabLogin.classList.remove("active");
    tabSignup.classList.add("active");
  }
}

// 강사 등록 모달
export function openInstructorModal() {
  const modal = document.getElementById("instructorModal");
  if (modal) {
    modal.classList.add("active");
  }
}

export function closeInstructorModal() {
  const modal = document.getElementById("instructorModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// 강사 상세 모달
export function openInstructorDetailModal() {
  const modal = document.getElementById("instructorDetailModal");
  if (modal) {
    modal.classList.add("active");
  }
}

export function closeInstructorDetailModal() {
  const modal = document.getElementById("instructorDetailModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// 예약 모달
export function openBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.classList.add("active");
  }
}

export function closeBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// 마이페이지 모달
export function openMyPageModal() {
  const modal = document.getElementById("myPageModal");
  if (modal) {
    modal.classList.add("active");
  }
}

export function closeMyPageModal() {
  const modal = document.getElementById("myPageModal");
  if (modal) {
    modal.classList.remove("active");
  }
}

// 마이페이지 탭 전환
export function showMyPageTab(tab) {
  document.getElementById("myBookingsTab").style.display = "none";
  document.getElementById("bookingRequestsTab").style.display = "none";
  document.getElementById("myProfileTab").style.display = "none";

  if (tab === "bookings") {
    document.getElementById("myBookingsTab").style.display = "block";
  } else if (tab === "requests") {
    document.getElementById("bookingRequestsTab").style.display = "block";
  } else if (tab === "profile") {
    document.getElementById("myProfileTab").style.display = "block";
  }
}

// 종목 추가 모달
export function createAddSportModal() {
  const modal = document.createElement("div");
  modal.className = "modal active";
  modal.id = "addSportModal";
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <button class="modal-close" onclick="closeAddSportModal()">×</button>
      <div class="auth-form">
        <h2 class="form-title">새로운 운동 종목 추가 ➕</h2>
        <p class="form-subtitle">종목 이름을 입력하면 이모지가 자동으로 추천됩니다</p>
        
        <input type="text" id="newSportName" class="input-field" placeholder="종목 이름 (예: 크로스핏)" oninput="autoSuggestEmoji()" />
        
        <div style="display: flex; gap: 10px; align-items: center;">
          <input type="text" id="newSportIcon" class="input-field" placeholder="이모지 아이콘" maxlength="2" style="flex: 1;" />
          <div id="emojiPreview" style="font-size: 32px; width: 50px; text-align: center; background: #f3f4f6; border-radius: 8px; padding: 5px;">🏃</div>
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: -10px; margin-bottom: 15px;">💡 이모지는 자동으로 추천됩니다. 직접 수정도 가능해요!</p>
        
        <select id="newSportCategory" class="input-field">
          <option value="">카테고리 선택</option>
          <option value="ball">구기종목</option>
          <option value="water">수상스포츠</option>
          <option value="fitness">피트니스</option>
          <option value="martial">격투기</option>
          <option value="extreme">익스트림</option>
          <option value="dance">댄스</option>
        </select>
        
        <button class="btn btn-primary btn-full" onclick="addNewSportFromModal()">
          <span class="btn-icon">✨</span> 종목 추가하기
        </button>
      </div>
    </div>
  `;

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeAddSportModal();
    }
  });

  return modal;
}

export function closeAddSportModal() {
  const modal = document.getElementById("addSportModal");
  if (modal) {
    modal.remove();
  }
}
