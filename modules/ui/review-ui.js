// ============================================================
// 리뷰 UI 모듈
// ============================================================
import { auth } from "../firebase-config.js";
import { submitRating, getInstructorReviews, getReviewStats } from "../ratings.js";

export let selectedRating = 0;
export let currentRatingBooking = null;
export let selectedRatingForModal = 0;
export let currentInstructorIdForModal = null;

export function initReviewUI() {
  window.selectRating = function (rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll(".rating-star");
    stars.forEach((star, index) => {
      if (index < rating) {
        star.style.fontSize = "2rem";
        star.style.opacity = "1";
      } else {
        star.style.fontSize = "1.5rem";
        star.style.opacity = "0.3";
      }
    });
  };

  window.openRatingModal = function (booking) {
    currentRatingBooking = booking;
    selectedRating = 0;

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "ratingModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px">
        <button class="modal-close" onclick="closeRatingModal()">×</button>
        <div class="auth-form">
          <h2 class="form-title">레슨 평가하기 ⭐</h2>
          <p class="form-subtitle">${booking.instructorName} 강사님과의 레슨은 어떠셨나요?</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div class="rating-stars">
              ${[1, 2, 3, 4, 5].map(i => `<span class="rating-star" onclick="selectRating(${i})">⭐</span>`).join('')}
            </div>
          </div>

          <textarea id="ratingComment" class="input-field" rows="4" placeholder="레슨에 대한 솔직한 평가를 남겨주세요 (선택)"></textarea>

          <button class="btn btn-primary btn-full" onclick="submitRatingForm()">
            <span class="btn-icon">✅</span> 평가 제출
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        window.closeRatingModal();
      }
    });
  };

  window.closeRatingModal = function () {
    const modal = document.getElementById("ratingModal");
    if (modal) modal.remove();
    selectedRating = 0;
    currentRatingBooking = null;
  };

  window.submitRatingForm = async function () {
    if (selectedRating === 0) {
      alert("⭐ 별점을 선택해주세요!");
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    const comment = document.getElementById("ratingComment").value.trim();

    try {
      await submitRating({
        instructorId: currentRatingBooking.instructorId,
        userId: user.uid,
        rating: selectedRating,
        comment,
        bookingId: currentRatingBooking.id,
      });

      alert("✅ 평가가 등록되었습니다!");
      window.closeRatingModal();

      if (window.loadMyBookingsList) {
        await window.loadMyBookingsList();
      }
      if (window.loadAndDisplayInstructors) {
        await window.loadAndDisplayInstructors();
      }
    } catch (error) {
      console.error("평가 등록 실패:", error);
      alert("평가 등록 중 오류가 발생했습니다.");
    }
  };

  window.showReviewsModal = async function(instructorId, instructorName) {
    const reviews = await getInstructorReviews(instructorId, "latest");
    const stats = await getReviewStats(instructorId);

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "reviewsModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
        <button class="modal-close" onclick="closeReviewsModal()">×</button>
        <div class="auth-form">
          <h2 class="form-title">${instructorName} 강사님의 리뷰</h2>
          
          <div style="text-align: center; padding: 30px; background: #f9fafb; border-radius: 12px; margin-bottom: 20px;">
            <h1 style="font-size: 3rem; margin: 0; color: #3b82f6;">⭐ ${stats.average}</h1>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 1.1rem;">총 ${stats.total}개의 리뷰</p>
          </div>

          <div style="margin-bottom: 20px;">
            ${[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star] || 0;
              const percent = stats.total > 0 ? (count / stats.total * 100).toFixed(0) : 0;
              return `
                <div style="display: flex; align-items: center; margin: 8px 0;">
                  <span style="width: 60px; color: #6b7280;">⭐ ${star}점</span>
                  <div style="flex: 1; background: #e5e7eb; height: 8px; border-radius: 4px; margin: 0 10px; overflow: hidden;">
                    <div style="width: ${percent}%; height: 100%; background: #3b82f6;"></div>
                  </div>
                  <span style="width: 60px; text-align: right; color: #6b7280;">${count}개 (${percent}%)</span>
                </div>
              `;
            }).join('')}
          </div>

          <select id="reviewSortSelect" class="input-field" onchange="changeReviewSort('${instructorId}', '${instructorName}')">
            <option value="latest">최신순</option>
            <option value="highest">평점 높은순</option>
            <option value="lowest">평점 낮은순</option>
          </select>

          <div id="reviewsList">
            ${reviews.length === 0 ? '<p style="text-align: center; padding: 40px; color: #6b7280;">아직 리뷰가 없습니다.</p>' : reviews.map(review => `
              <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 1.2rem;">${'⭐'.repeat(review.rating)}</span>
                  <span style="color: #6b7280; font-size: 0.9rem;">${new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                ${review.comment ? `<p style="margin: 0; line-height: 1.6; color: #374151;">${review.comment}</p>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.closeReviewsModal = function() {
    const modal = document.getElementById("reviewsModal");
    if (modal) modal.remove();
  };

  window.changeReviewSort = async function(instructorId, instructorName) {
    const sortBy = document.getElementById("reviewSortSelect").value;
    window.closeReviewsModal();
    await window.showReviewsModal(instructorId, instructorName);
  };

  // ✅ 강사 상세 모달에서 별점 선택
  window.selectRating = function(rating, instructorId) {
    selectedRatingForModal = rating;
    currentInstructorIdForModal = instructorId;
    const stars = document.querySelectorAll(`#ratingStars .rating-star`);
    stars.forEach((star, index) => {
      if (index < rating) {
        star.style.fontSize = "2rem";
        star.style.opacity = "1";
      } else {
        star.style.fontSize = "1.5rem";
        star.style.opacity = "0.3";
      }
    });
  };

  // ✅ 강사 상세 모달에서 평가 제출
  window.submitRatingFromModal = async function(instructorId) {
    if (selectedRatingForModal === 0) {
      alert("⭐ 별점을 선택해주세요!");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("🔒 로그인이 필요합니다!");
      return;
    }

    const comment = document.getElementById("ratingComment")?.value.trim() || "";

    try {
      await submitRating({
        instructorId: instructorId,
        userId: user.uid,
        rating: selectedRatingForModal,
        comment,
      });

      alert("✅ 평가가 등록되었습니다!");
      selectedRatingForModal = 0;
      currentInstructorIdForModal = null;

      // 강사 상세 모달 닫기
      if (window.closeInstructorDetailModal) {
        window.closeInstructorDetailModal();
      }

      // 강사 목록 새로고침
      if (window.loadAndDisplayInstructors) {
        await window.loadAndDisplayInstructors();
      }

      // 통계 업데이트 (평균 만족도 반영)
      if (window.updateStats) {
        await window.updateStats();
      }
    } catch (error) {
      console.error("평가 등록 실패:", error);
      alert("평가 등록 중 오류가 발생했습니다.");
    }
  };

  // ✅ 예약 카드에서 평가 모달 열기
  window.openRatingFromBooking = function(instructorId, instructorName) {
    currentRatingBooking = { instructorId, instructorName };
    window.openRatingModal({ instructorId, instructorName });
  };
}
