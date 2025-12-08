// ============================================================
// 프로필 편집 UI 모듈 (개선 버전)
// ============================================================
import { auth } from "../firebase-config.js";
import {
  getCurrentUserData,
  setCurrentUserData,
  updateUserProfile,
} from "../auth.js";
import { getInstructorById, updateInstructorProfile } from "../instructors.js";
import {
  getImageUploadManager,
  resetImageUploadManager,
  deleteImageUploadManager,
} from "../image-upload-manager.js";

export function initProfileUI() {
  // ============================================================
  // 수강생 프로필 편집
  // ============================================================
  window.openStudentProfileEdit = function () {
    const user = auth.currentUser;
    const userData = getCurrentUserData();

    if (!user) return;

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "studentProfileEditModal";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px">
        <button class="modal-close" onclick="closeStudentProfileEdit()">×</button>
        <div class="auth-form">
          <h2 class="form-title">프로필 편집 ✏️</h2>
          <p class="form-subtitle">나를 소개해보세요</p>

          <div style="text-align: center; margin-bottom: 20px;">
            <div style="position: relative; display: inline-block;">
              <img id="studentProfilePreview" src="${
                userData.profileImage ||
                "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(userData.name) +
                  "&size=150&background=3b82f6&color=fff"
              }" alt="프로필" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid #3b82f6;"/>
              <label for="studentProfileImageInput" style="position: absolute; bottom: 5px; right: 5px; background: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">📷</label>
              <input type="file" id="studentProfileImageInput" accept="image/*" style="display: none;" onchange="handleStudentImageChange(event)"/>
            </div>
            <p style="font-size: 0.85rem; color: #6b7280; margin-top: 10px;">📸 이미지를 클릭하여 변경</p>
            <p id="studentUploadStatus" style="font-size: 0.85rem; color: #3b82f6; margin-top: 5px;"></p>
          </div>

          <textarea id="studentBio" class="input-field" rows="5" placeholder="자기소개를 입력하세요">${
            userData.bio || ""
          }</textarea>

          <button class="btn btn-primary btn-full" onclick="saveStudentProfile()">
            <span class="btn-icon">💾</span> 저장하기
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // ✅ 이미지 업로드 관리자 초기화
    resetImageUploadManager("studentProfile");

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        window.closeStudentProfileEdit();
      }
    });
  };

  window.closeStudentProfileEdit = function () {
    const modal = document.getElementById("studentProfileEditModal");
    if (modal) {
      modal.remove();
      // ✅ 이미지 업로드 관리자 제거
      deleteImageUploadManager("studentProfile");
    }
  };

  window.handleStudentImageChange = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const manager = getImageUploadManager(
      "studentProfile",
      "studentProfilePreview",
      "studentUploadStatus"
    );

    try {
      await manager.uploadImage(file);
      console.log("✅ 수강생 프로필 이미지 업로드 성공:", manager.getImageUrl());
    } catch (error) {
      console.error("❌ 수강생 프로필 이미지 업로드 실패:", error);
      alert("❌ 이미지 업로드에 실패했습니다.");
    }
  };

  window.saveStudentProfile = async function () {
    const user = auth.currentUser;
    if (!user) return;

    const bio = document.getElementById("studentBio").value.trim();

    try {
      const updates = { bio };

      // ✅ 이미지 업로드 관리자에서 URL 가져오기
      const manager = getImageUploadManager(
        "studentProfile",
        "studentProfilePreview",
        "studentUploadStatus"
      );
      const uploadedImageUrl = manager.getImageUrl();

      if (uploadedImageUrl) {
        updates.profileImage = uploadedImageUrl;
        console.log("✅ 프로필 이미지 포함:", uploadedImageUrl);
      }

      await updateUserProfile(user.uid, updates);

      const userData = getCurrentUserData();
      Object.assign(userData, updates);
      setCurrentUserData(userData);

      alert("✅ 프로필이 저장되었습니다!");
      window.closeStudentProfileEdit();

      if (document.getElementById("myPageModal")?.classList.contains("active")) {
        if (window.loadMyProfileContent) {
          await window.loadMyProfileContent();
        }
      }

      // ✅ 이미지 업로드 관리자 제거
      deleteImageUploadManager("studentProfile");
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("❌ 프로필 저장 중 오류가 발생했습니다.");
    }
  };

  // ============================================================
  // 강사 프로필 편집
  // ============================================================
  window.openEditProfileModal = async function (profileId) {
    try {
      const profile = await getInstructorById(profileId);
      if (!profile) {
        alert("❌ 프로필을 찾을 수 없습니다.");
        return;
      }

      const modal = document.createElement("div");
      modal.className = "modal active";
      modal.id = "editProfileModal";
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <button class="modal-close" onclick="closeEditProfileModal()">×</button>
          <div class="auth-form">
            <h2 class="form-title">프로필 수정 ✏️</h2>
            <p class="form-subtitle">강사 정보를 수정하세요</p>

            <div style="text-align: center; margin-bottom: 30px;">
              <div style="position: relative; display: inline-block;">
                <img id="instructorProfilePreview" src="${
                  profile.profileImage ||
                  "https://ui-avatars.com/api/?name=" +
                    encodeURIComponent(profile.name) +
                    "&size=150&background=3b82f6&color=fff"
                }" alt="프로필" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #3b82f6; box-shadow: 0 4px 12px rgba(0,0,0,0.1);"/>
                <label for="instructorProfileImageInput" style="position: absolute; bottom: 5px; right: 5px; background: #3b82f6; color: white; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">📷</label>
                <input type="file" id="instructorProfileImageInput" accept="image/*" style="display: none;" onchange="handleInstructorImageChange(event)"/>
              </div>
              <p style="font-size: 0.85rem; color: #6b7280; margin-top: 10px;">📸 카메라 아이콘을 클릭하여 이미지 변경</p>
              <p id="instructorUploadStatus" style="font-size: 0.85rem; color: #3b82f6; margin-top: 5px;"></p>
            </div>

            <input type="text" id="editInstructorName" class="input-field" placeholder="강사명" value="${
              profile.name
            }"/>
            <select id="editInstructorSport" class="input-field">
              <!-- 종목은 동적으로 채워짐 -->
            </select>
            <select id="editInstructorRegion" class="input-field">
              <option value="">활동 지역 선택</option>
              <option>서울</option>
              <option>경기</option>
              <option>인천</option>
              <option>부산</option>
              <option>대구</option>
              <option>대전</option>
              <option>광주</option>
              <option>울산</option>
            </select>
            <input type="number" id="editInstructorExperience" class="input-field" placeholder="경력 (년)" value="${
              profile.experience
            }" min="0"/>
            <input type="number" id="editInstructorPrice" class="input-field" placeholder="1회 레슨 비용 (원)" value="${
              profile.price
            }" min="0"/>
            <textarea id="editInstructorIntro" class="input-field" rows="4" placeholder="자기소개">${
              profile.introduction
            }</textarea>
            <textarea id="editInstructorCertificates" class="input-field" rows="2" placeholder="자격증 (쉼표로 구분)">${
              profile.certificates ? profile.certificates.join(", ") : ""
            }</textarea>

            <button class="btn btn-primary btn-full" onclick="saveProfileEdit('${profileId}')">
              <span class="btn-icon">💾</span> 저장하기
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // ✅ 이미지 업로드 관리자 초기화
      resetImageUploadManager("instructorProfile");

      // 종목 select 채우기
      await loadSportsForEditSelect(profile.sport);

      // 지역 select 기본값 설정
      document.getElementById("editInstructorRegion").value = profile.region;

      modal.addEventListener("click", function (e) {
        if (e.target === modal) {
          window.closeEditProfileModal();
        }
      });
    } catch (error) {
      console.error("프로필 로드 실패:", error);
      alert("❌ 프로필을 불러오는 중 오류가 발생했습니다.");
    }
  };

  window.closeEditProfileModal = function () {
    const modal = document.getElementById("editProfileModal");
    if (modal) {
      modal.remove();
      // ✅ 이미지 업로드 관리자 제거
      deleteImageUploadManager("instructorProfile");
    }
  };

  window.handleInstructorImageChange = async function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const manager = getImageUploadManager(
      "instructorProfile",
      "instructorProfilePreview",
      "instructorUploadStatus"
    );

    try {
      await manager.uploadImage(file);
      console.log("✅ 강사 프로필 이미지 업로드 성공:", manager.getImageUrl());
    } catch (error) {
      console.error("❌ 강사 프로필 이미지 업로드 실패:", error);
      alert("❌ 이미지 업로드에 실패했습니다.");
    }
  };

  window.saveProfileEdit = async function (profileId) {
    const name = document.getElementById("editInstructorName").value.trim();
    const sport = document.getElementById("editInstructorSport").value;
    const region = document.getElementById("editInstructorRegion").value;
    const experience = parseInt(
      document.getElementById("editInstructorExperience").value
    );
    const price = parseInt(document.getElementById("editInstructorPrice").value);
    const intro = document.getElementById("editInstructorIntro").value.trim();
    const certificates = document
      .getElementById("editInstructorCertificates")
      .value.trim();

    if (!name || !sport || !region || !experience || !price || !intro) {
      alert("📝 필수 항목을 모두 입력해주세요!");
      return;
    }

    try {
      const updates = {
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

      // ✅ 이미지 업로드 관리자에서 URL 가져오기
      const manager = getImageUploadManager(
        "instructorProfile",
        "instructorProfilePreview",
        "instructorUploadStatus"
      );
      const uploadedImageUrl = manager.getImageUrl();

      if (uploadedImageUrl) {
        updates.profileImage = uploadedImageUrl;
        console.log("✅ 프로필 이미지 포함:", uploadedImageUrl);
      }

      await updateInstructorProfile(profileId, updates);

      alert("✅ 프로필이 수정되었습니다!");
      window.closeEditProfileModal();

      // 마이페이지가 열려있으면 새로고침
      if (document.getElementById("myPageModal")?.classList.contains("active")) {
        if (window.loadMyProfileContent) {
          await window.loadMyProfileContent();
        }
      }

      // 강사 목록 새로고침
      if (window.loadAndDisplayInstructors) {
        await window.loadAndDisplayInstructors();
      }

      // ✅ 종목 데이터 새로고침 (종목이 변경된 경우 카운트 업데이트)
      const { refreshSportsWithCounts } = await import("../sports.js");
      const updatedSports = await refreshSportsWithCounts();

      if (window.loadAndDisplaySports) {
        const { setSportsData } = await import("./sports-ui.js");
        setSportsData(updatedSports);
        await window.loadAndDisplaySports();
      }

      // ✅ 이미지 업로드 관리자 제거
      deleteImageUploadManager("instructorProfile");
    } catch (error) {
      console.error("❌ 프로필 수정 실패:", error);
      alert("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  // 종목 select 채우기 (편집용)
  async function loadSportsForEditSelect(currentSport) {
    const { getSportsData } = await import("./sports-ui.js");
    const sportsData = getSportsData();

    const select = document.getElementById("editInstructorSport");
    select.innerHTML = '<option value="">전문 종목 선택</option>';

    sportsData.forEach((sport) => {
      const option = document.createElement("option");
      option.value = sport.name;
      option.textContent = sport.name;
      if (sport.name === currentSport) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }
}
