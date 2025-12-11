// ============================================================
// UI 렌더링 함수들
// ============================================================

// 강사 카드 렌더링
export function renderInstructorCard(instructor, onClick) {
  const card = document.createElement("div");
  card.className = "instructor-card";
  
  const rating = instructor.averageRating || 0;
  const ratingCount = instructor.ratingCount || 0;
  // ✅ 별 표시: rating이 0이면 회색 별 5개, 있으면 노란 별
  const stars = rating > 0 ? "⭐".repeat(Math.round(rating)) : "☆☆☆☆☆";
  const ratingText =
    rating > 0
      ? `${stars} ${rating.toFixed(1)} (${ratingCount}명 평가)`
      : `${stars} 아직 평가 없음`;

  const certBadges =
    instructor.certificates && instructor.certificates.length > 0
      ? instructor.certificates
          .map((cert) => `<span class="cert-badge">${cert}</span>`)
          .join(" ")
      : "";

  // 프로필 이미지 또는 이니셜
  const avatarContent = instructor.profileImage
    ? `<img src="${instructor.profileImage}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${instructor.name}" />`
    : instructor.name.charAt(0);

  card.innerHTML = `
    <div class="instructor-header" onclick="event.stopPropagation(); window.location.href='#instructors'; window.openInstructorDetail('${instructor.id}');">
<div class="instructor-avatar">${avatarContent}</div>     
 <div class="instructor-info">
        <h3>${instructor.name}</h3>
        <span class="specialty-badge">${instructor.sport}</span>
        <span class="specialty-badge" style="background: #fef3c7; color: #d97706;">${
          instructor.region
        }</span>
      </div>
    </div>
    <div class="rating" style="cursor: pointer;" onclick="event.stopPropagation(); showReviewsModal('${instructor.id}', '${instructor.name}');" title="클릭하여 리뷰 보기">${ratingText}</div>
    <p>${instructor.introduction.substring(0, 80)}${
    instructor.introduction.length > 80 ? "..." : ""
  }</p>
    <p style="margin-top: 10px; color: #6b7280;" onclick="event.stopPropagation(); window.location.href='#instructors'; window.openInstructorDetail('${instructor.id}');">경력: ${
      instructor.experience
    }년 | 레슨 완료: ${instructor.lessonCount}회</p>
    <p style="margin-top: 5px; color: #2563eb; font-weight: 600;" onclick="event.stopPropagation(); window.location.href='#instructors'; window.openInstructorDetail('${instructor.id}');">1회 ${instructor.price.toLocaleString()}원</p>
    ${certBadges ? `<div style="margin-top: 10px;" onclick="event.stopPropagation(); window.location.href='#instructors'; window.openInstructorDetail('${instructor.id}');">${certBadges}</div>` : ""}
  `;
  
  // 카드 전체 클릭 이벤트
  card.onclick = () => onClick(instructor);

  return card;
}

// 강사 상세 정보 HTML 생성
export function renderInstructorDetail(
  instructor,
  hasConfirmed,
  hasRatedAlready,
  isStudent,
  isLoggedIn,
  isOwner = false // 이 줄만 추가!
) {
  const rating = instructor.averageRating || 0;
  const ratingCount = instructor.ratingCount || 0;
  const stars = rating > 0 ? "⭐".repeat(Math.round(rating)) : "⭐".repeat(0);
  const ratingText =
    rating > 0
      ? `${stars} ${rating.toFixed(1)} (${ratingCount}명 평가)`
      : "아직 평가 없음";

  const certBadges =
    instructor.certificates && instructor.certificates.length > 0
      ? instructor.certificates
          .map((cert) => `<span class="cert-badge">${cert}</span>`)
          .join(" ")
      : "<p style='color: #6b7280;'>등록된 자격증이 없습니다</p>";

  // 프로필 이미지 또는 이니셜
  const avatarContent = instructor.profileImage
    ? `<img src="${instructor.profileImage}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${instructor.name}" />`
    : instructor.name.charAt(0);

  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div class="instructor-avatar" style="width: 100px; height: 100px; font-size: 2rem; margin: 0 auto 15px;">${avatarContent}</div>
      <h2 class="form-title" style="margin-bottom: 5px;">${
        instructor.name
      } 강사</h2>
      <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 10px;">
        <span class="specialty-badge">${instructor.sport}</span>
        <span class="specialty-badge" style="background: #fef3c7; color: #d97706;">${
          instructor.region
        }</span>
      </div>
      <div class="rating" style="margin: 10px 0; cursor: pointer;" onclick="showReviewsModal('${instructor.id}', '${instructor.name}')" title="클릭하여 리뷰 보기">${ratingText}</div>
      
      ${
        isOwner
          ? `
        <button class="btn btn-outline" onclick="openEditProfileModal('${instructor.id}')" style="margin-top: 10px;">
          <span class="btn-icon">✏️</span> 프로필 수정
        </button>
      `
          : ""
      }
    </div>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
      <p style="color: #374151; line-height: 1.6;">${
        instructor.introduction
      }</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
        <p style="color: #6b7280; font-size: 0.9rem;">경력</p>
        <p style="font-size: 1.3rem; font-weight: 600; color: #2563eb;">${
          instructor.experience
        }년</p>
      </div>
      <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
        <p style="color: #6b7280; font-size: 0.9rem;">레슨 완료</p>
        <p style="font-size: 1.3rem; font-weight: 600; color: #2563eb;">${
          instructor.lessonCount
        }회</p>
      </div>
    </div>
    
    <div style="background: #f9fafb; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
      <h4 style="margin-bottom: 10px;">💼 보유 자격증</h4>
      ${certBadges}
    </div>
    
    <div style="background: #eff6ff; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
      <p style="color: #6b7280; font-size: 0.9rem; margin-bottom: 5px;">1회 레슨 비용</p>
      <p style="font-size: 1.8rem; font-weight: 700; color: #2563eb;">${instructor.price.toLocaleString()}원</p>
    </div>
    
    ${
      isLoggedIn && isStudent
        ? hasConfirmed
          ? !hasRatedAlready
            ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 12px; margin-bottom: 15px;">
          <h4 style="margin-bottom: 10px; text-align: center;">⭐ 이 강사님을 평가해주세요</h4>
          <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;" id="ratingStars">
            <span class="rating-star" data-rating="1" onclick="selectRatingForInstructor(1, '${instructor.id}')" style="cursor: pointer;">⭐</span>
            <span class="rating-star" data-rating="2" onclick="selectRatingForInstructor(2, '${instructor.id}')" style="cursor: pointer;">⭐</span>
            <span class="rating-star" data-rating="3" onclick="selectRatingForInstructor(3, '${instructor.id}')" style="cursor: pointer;">⭐</span>
            <span class="rating-star" data-rating="4" onclick="selectRatingForInstructor(4, '${instructor.id}')" style="cursor: pointer;">⭐</span>
            <span class="rating-star" data-rating="5" onclick="selectRatingForInstructor(5, '${instructor.id}')" style="cursor: pointer;">⭐</span>
          </div>
          <textarea id="ratingComment" class="input-field" rows="2" placeholder="한줄평을 남겨주세요 (선택)"></textarea>
          <button class="btn btn-primary btn-full" onclick="submitRatingFromModal('${instructor.id}')">
            평가 제출하기
          </button>
        </div>
      `
            : `
        <div style="background: #d1fae5; padding: 15px; border-radius: 12px; margin-bottom: 15px; text-align: center;">
          <p style="color: #059669; font-weight: 600;">✅ 이미 평가하셨습니다</p>
        </div>
      `
          : `
      <div style="background: #fef3c7; padding: 15px; border-radius: 12px; margin-bottom: 15px; text-align: center;">
        <p style="color: #92400e; font-weight: 600;">ℹ️ 레슨을 받은 후 평가할 수 있습니다</p>
      </div>
    `
        : !isLoggedIn
        ? `
    <div style="background: #fee2e2; padding: 15px; border-radius: 12px; margin-bottom: 15px; text-align: center;">
      <p style="color: #dc2626; font-weight: 600;">🔒 로그인 후 평가할 수 있습니다</p>
    </div>
  `
        : ""
    }
    
    ${!isOwner && isLoggedIn && isStudent ? `
      <button class="btn btn-primary btn-full" onclick="openBookingModal('${
        instructor.id
      }', '${instructor.name}', '${instructor.uid}', '${instructor.sport}')">
        <span class="btn-icon">📅</span> 레슨 예약 요청하기
      </button>
    ` : !isOwner && !isLoggedIn ? `
      <div style="background: #fee2e2; padding: 15px; border-radius: 12px; text-align: center;">
        <p style="color: #dc2626; font-weight: 600; margin: 0;">🔒 로그인 후 예약할 수 있습니다</p>
      </div>
    ` : !isOwner && !isStudent ? `
      <div style="background: #fef3c7; padding: 15px; border-radius: 12px; text-align: center;">
        <p style="color: #92400e; font-weight: 600; margin: 0;">⚠️ 수강생만 예약할 수 있습니다</p>
      </div>
    ` : ''}
  `;
}

// 예약 카드 렌더링 (수강생용)
export function renderBookingCard(booking, hasRatedAlready) {
  const card = document.createElement("div");
  card.className = "booking-card";
  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
      <div>
        <h4 style="font-size: 1.1rem; margin-bottom: 5px;">${
          booking.instructorName || "강사"
        } (${booking.instructorSport || "종목 미정"})</h4>
        <p style="color: #6b7280; font-size: 0.9rem;">${booking.date} ${
    booking.time
  }</p>
      </div>
      <span class="status-badge confirmed">확정</span>
    </div>
    ${
      booking.message
        ? `<p style="color: #6b7280; font-size: 0.9rem; padding: 10px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px;">메시지: ${booking.message}</p>`
        : ""
    }
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      ${
        !hasRatedAlready
          ? `<button class="btn btn-primary" style="flex: 1;" onclick='openRatingModal(${JSON.stringify(booking)})'>
          <span class="btn-icon">⭐</span> 강사 평가하기
        </button>`
          : `<div style="text-align: center; padding: 10px; background: #d1fae5; border-radius: 8px; flex: 1;">
          <p style="color: #059669; font-weight: 600; margin: 0;">✅ 평가 완료</p>
        </div>`
      }
      <button class="btn btn-outline" style="border-color: #dc2626; color: #dc2626;" onclick="cancelStudentBooking('${booking.id}', '${booking.instructorName}')">
        ❌ 취소
      </button>
    </div>
  `;
  return card;
}

// 예약 요청 카드 렌더링 (강사용)
export function renderBookingRequestCard(booking) {
  const statusBadge =
    booking.status === "pending"
      ? '<span class="status-badge pending">대기중</span>'
      : booking.status === "confirmed"
      ? '<span class="status-badge confirmed">확정</span>'
      : '<span class="status-badge cancelled">거절</span>';

  const card = document.createElement("div");
  card.className = "booking-card";
  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
      <div>
        <h4 style="font-size: 1.1rem; margin-bottom: 5px;">${
          booking.userName
        } 님</h4>
        <p style="color: #6b7280; font-size: 0.9rem;">${booking.date} ${
    booking.time
  }</p>
        <p style="color: #6b7280; font-size: 0.85rem; margin-top: 3px;">${
          booking.userEmail
        }</p>
      </div>
      ${statusBadge}
    </div>
    ${
      booking.message
        ? `<p style="color: #6b7280; font-size: 0.9rem; padding: 10px; background: #f9fafb; border-radius: 8px; margin-bottom: 12px;">메시지: ${booking.message}</p>`
        : ""
    }
    ${
      booking.status === "pending"
        ? `<div style="display: flex; gap: 8px;">
        <button class="btn-small btn-primary" onclick="confirmBookingRequest('${booking.id}')">예약 확정</button>
        <button class="btn-small btn-outline" style="border-color: #dc2626; color: #dc2626;" onclick="rejectBookingRequest('${booking.id}')">거절</button>
      </div>`
        : ""
    }
  `;
  return card;
}

// 내 프로필 HTML 생성 (강사)
// 내 프로필 HTML 생성 (강사)
export function renderInstructorProfile(profile) {
  const rating = profile.averageRating || 0;
  const ratingCount = profile.ratingCount || 0;
  const stars = rating > 0 ? "⭐".repeat(Math.round(rating)) : "⭐".repeat(0);
  const ratingText =
    rating > 0
      ? `${stars} ${rating.toFixed(1)} (${ratingCount}명)`
      : "평가 없음";

  const certBadges =
    profile.certificates && profile.certificates.length > 0
      ? profile.certificates
          .map((cert) => `<span class="cert-badge">${cert}</span>`)
          .join(" ")
      : "<p style='color: #6b7280; font-size: 0.9rem;'>등록된 자격증이 없습니다</p>";

  // 프로필 이미지 또는 이니셜
  const avatarContent = profile.profileImage
    ? `<img src="${profile.profileImage}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="${profile.name}" />`
    : profile.name.charAt(0);

  return `
    <div class="profile-card">
      <div style="display: flex; align-items: start; gap: 15px; margin-bottom: 15px;">
        <div class="instructor-avatar">${avatarContent}</div>
        <div style="flex: 1;">
          <h3 style="margin-bottom: 5px;">${profile.name}</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <span class="specialty-badge">${profile.sport}</span>
            <span class="specialty-badge" style="background: #fef3c7; color: #d97706;">${
              profile.region
            }</span>
          </div>
          <div class="rating">${ratingText}</div>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <p style="color: #374151; font-size: 0.95rem; line-height: 1.5;">${
          profile.introduction
        }</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px;">
        <div style="background: #f9fafb; padding: 10px; border-radius: 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 0.85rem;">경력</p>
          <p style="font-weight: 600; color: #2563eb;">${
            profile.experience
          }년</p>
        </div>
        <div style="background: #f9fafb; padding: 10px; border-radius: 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 0.85rem;">레슨 완료</p>
          <p style="font-weight: 600; color: #2563eb;">${
            profile.lessonCount
          }회</p>
        </div>
        <div style="background: #f9fafb; padding: 10px; border-radius: 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 0.85rem;">1회 가격</p>
          <p style="font-weight: 600; color: #2563eb;">${profile.price.toLocaleString()}원</p>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <h4 style="font-size: 0.95rem; margin-bottom: 8px;">💼 보유 자격증</h4>
        ${certBadges}
      </div>
      
      <button class="btn btn-outline btn-full" onclick="openEditProfileModal('${
        profile.id
      }')" style="margin-bottom: 12px;">
        <span class="btn-icon">✏️</span> 프로필 수정
      </button>
      
      <button class="btn btn-outline btn-full" onclick="deleteInstructorProfileById('${
        profile.id
      }')">
        프로필 삭제
      </button>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
        <button class="btn btn-outline btn-full" style="border-color: #dc2626; color: #dc2626;" onclick="deleteAccount()">
          회원 탈퇴
        </button>
      </div>
    </div>
  `;
}

// 운동 종목 카드 렌더링
export function renderSportCard(sport, onClick) {
  const card = document.createElement("div");
  card.className = `sport-card ${sport.isNew ? "new-badge" : ""}`;
  card.onclick = () => onClick(sport.name);

  card.innerHTML = `
    <div class="sport-icon">${sport.icon}</div>
    <h3>${sport.name}</h3>
    <p>${sport.count}명의 강사</p>
  `;
  
  return card;
}

// 종목 추가 카드 렌더링
export function renderAddSportCard(onClick) {
  const card = document.createElement("div");
  card.className = "sport-card add-sport-card";
  card.onclick = onClick;
  card.innerHTML = `
    <div class="sport-icon">➕</div>
    <h3>종목 추가</h3>
    <p>새로운 종목</p>
  `;
  return card;
}

// ============================================================
// 수강생 프로필 렌더링 함수
// ui-renderers.js에 추가할 함수
// ============================================================

// 수강생 프로필 렌더링
export function renderStudentProfile(userData) {
  return `
    <div style="text-align: center; padding: 30px 20px;">
      <!-- 프로필 이미지 -->
      <img 
        src="${
          userData.profileImage ||
          "https://ui-avatars.com/api/?name=User&size=150&background=3b82f6&color=fff"
        }" 
        alt="프로필" 
        style="
          width: 150px; 
          height: 150px; 
          border-radius: 50%; 
          object-fit: cover; 
          border: 4px solid #3b82f6;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        "
      />
      
      <!-- 이름 -->
      <h3 style="margin: 0 0 5px 0; font-size: 1.5rem; color: #1f2937;">
        ${userData.name}
      </h3>
      
      <!-- 이메일 -->
      <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 0.9rem;">
        ${userData.email || ""}
      </p>
      
      <!-- 자기소개 -->
      ${
        userData.bio
          ? `
        <div style="
          background: #f9fafb; 
          padding: 20px; 
          border-radius: 12px; 
          margin: 20px 0;
          text-align: left;
          border-left: 4px solid #3b82f6;
        ">
          <h4 style="margin: 0 0 10px 0; color: #374151; font-size: 1rem;">
            💬 자기소개
          </h4>
          <p style="margin: 0; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">
            ${userData.bio}
          </p>
        </div>
      `
          : `
        <div style="
          background: #fef3c7; 
          padding: 20px; 
          border-radius: 12px; 
          margin: 20px 0;
          text-align: center;
        ">
          <p style="margin: 0; color: #92400e;">
            💡 자기소개를 작성해보세요!
          </p>
        </div>
      `
      }
      
      <!-- 수정 버튼 -->
      <button class="btn btn-primary btn-full" onclick="openStudentProfileEdit()" style="margin-top: 20px;">
        <span class="btn-icon">✏️</span> 프로필 수정
      </button>
      
      <!-- 회원 탈퇴 -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <button class="btn btn-outline btn-full" style="border-color: #dc2626; color: #dc2626;" onclick="deleteAccount()">
          회원 탈퇴
        </button>
      </div>
    </div>
  `;
}
