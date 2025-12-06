// ============================================================
// 프로필 편집 UI 모듈
// ============================================================
import { auth, storage } from "../firebase-config.js";
import {
  getCurrentUserData,
  setCurrentUserData,
  updateUserProfile,
} from "../auth.js";
import { getInstructorById, updateInstructorProfile } from "../instructors.js";
import {
  uploadImageToCloudinary,
  compressImage,
} from "../cloudinary-upload.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export let selectedStudentImage = null;
export let uploadedImageUrl = null;
export let selectedInstructorImage = null;
export let uploadedInstructorImageUrl = null;

export function initProfileUI() {
  // 수강생 프로필 편집
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
            <p id="uploadStatus" style="font-size: 0.85rem; color: #3b82f6; margin-top: 5px;"></p>
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

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        window.closeStudentProfileEdit();
      }
    });
  };

  window.closeStudentProfileEdit = function () {
    const modal = document.getElementById("studentProfileEditModal");
    if (modal) modal.remove();
  };

  window.handleStudentImageChange = async function (event) {
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

    const statusElement = document.getElementById("uploadStatus");

    try {
      statusElement.textContent = "📤 업로드 중...";
      statusElement.style.color = "#3b82f6";

      const compressedFile = await compressImage(file, 800);
      uploadedImageUrl = await uploadImageToCloudinary(compressedFile);

      const preview = document.getElementById("studentProfilePreview");
      preview.src = uploadedImageUrl;

      statusElement.textContent = "✅ 업로드 완료!";
      statusElement.style.color = "#10b981";

      selectedStudentImage = file;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      statusElement.textContent = "❌ 업로드 실패";
      statusElement.style.color = "#dc2626";
      alert("❌ 이미지 업로드에 실패했습니다.");
    }
  };

  window.saveStudentProfile = async function () {
    const user = auth.currentUser;
    if (!user) return;

    const bio = document.getElementById("studentBio").value.trim();

    try {
      const updates = { bio };

      if (uploadedImageUrl) {
        updates.profileImage = uploadedImageUrl;
      }

      await updateUserProfile(user.uid, updates);

      const userData = getCurrentUserData();
      Object.assign(userData, updates);
      setCurrentUserData(userData);

      alert("✅ 프로필이 저장되었습니다!");
      window.closeStudentProfileEdit();

      if (document.getElementById("myPageModal").classList.contains("active")) {
        window.loadMyProfileContent();
      }

      selectedStudentImage = null;
      uploadedImageUrl = null;
    } catch (error) {
      console.error("프로필 저장 실패:", error);
      alert("❌ 프로필 저장 중 오류가 발생했습니다.");
    }
  };

  // 강사 프로필 편집 (window.openEditProfileModal, saveProfileEdit 등은 script.js에 그대로 유지)
}

// ============================================================
// 강사 프로필 편집
// ============================================================
window.openEditProfileModal = async function (profileId) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const profile = await getInstructorById(profileId);

    if (!profile) {
      alert("프로필을 찾을 수 없습니다.");
      return;
    }

    // 종목 select 동적 생성
    const sportsData = await import("../sports.js").then((m) =>
      m.loadSportsData()
    );
    const sportOptions = sportsData
      .map(
        (sport) =>
          `<option value="${sport.name}" ${
            profile.sport === sport.name ? "selected" : ""
          }>${sport.name}</option>`
      )
      .join("");

    const modal = document.createElement("div");
    modal.className = "modal active";
    modal.id = "editProfileModal";
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
          <button class="modal-close" onclick="closeEditProfileModal()">×</button>
          <div class="auth-form">
            <h2 class="form-title">프로필 수정 ✏️</h2>
            
            <!-- 프로필 이미지 -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h3 style="margin-bottom: 15px; font-size: 1rem; color: #374151;">📸 프로필 이미지</h3>
              <div style="position: relative; display: inline-block;">
                <img 
                  id="instructorProfilePreview" 
                  src="${
                    profile.profileImage ||
                    "https://ui-avatars.com/api/?name=" +
                      encodeURIComponent(profile.name) +
                      "&size=150&background=3b82f6&color=fff"
                  }" 
                  alt="프로필" 
                  style="
                    width: 150px; 
                    height: 150px; 
                    border-radius: 50%; 
                    object-fit: cover; 
                    border: 4px solid #3b82f6;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                  "
                />
                <label 
                  for="instructorProfileImageInput" 
                  style="
                    position: absolute; 
                    bottom: 5px; 
                    right: 5px; 
                    background: #3b82f6; 
                    color: white; 
                    width: 40px; 
                    height: 40px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    cursor: pointer; 
                    font-size: 20px; 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                  "
                >
                  📷
                </label>
                <input 
                  type="file" 
                  id="instructorProfileImageInput" 
                  accept="image/*" 
                  style="display: none;" 
                  onchange="handleInstructorImageChange(event)"
                />
              </div>
              <p style="font-size: 0.85rem; color: #6b7280; margin-top: 10px;">📸 카메라 아이콘을 클릭하여 이미지 변경</p>
              <p id="instructorUploadStatus" style="font-size: 0.85rem; color: #3b82f6; margin-top: 5px;"></p>
            </div>

            <div class="input-group">
              <label for="editInstructorName" class="input-label">이름</label>
              <input type="text" id="editInstructorName" class="input-field" value="${
                profile.name
              }" required>
            </div>

            <div class="input-group">
              <label for="editInstructorSport" class="input-label">전문 종목</label>
              <select id="editInstructorSport" class="input-field" required>
                <option value="">전문 종목 선택</option>
                ${sportOptions}
              </select>
            </div>

            <div class="input-group">
              <label for="editInstructorRegion" class="input-label">활동 지역</label>
              <select id="editInstructorRegion" class="input-field" required>
                <option value="${profile.region}" selected>${
      profile.region
    }</option>
                <option value="서울">서울</option>
                <option value="경기">경기</option>
                <option value="인천">인천</option>
                <option value="부산">부산</option>
                <option value="대구">대구</option>
                <option value="광주">광주</option>
                <option value="대전">대전</option>
                <option value="울산">울산</option>
                <option value="세종">세종</option>
                <option value="강원">강원</option>
                <option value="충북">충북</option>
                <option value="충남">충남</option>
                <option value="전북">전북</option>
                <option value="전남">전남</option>
                <option value="경북">경북</option>
                <option value="경남">경남</option>
                <option value="제주">제주</option>
              </select>
            </div>

            <div class="input-group">
              <label for="editInstructorExperience" class="input-label">경력 (년)</label>
              <input type="number" id="editInstructorExperience" class="input-field" min="0" value="${
                profile.experience
              }" required>
            </div>

            <div class="input-group">
              <label for="editInstructorPrice" class="input-label">1회 레슨 가격 (원)</label>
              <input type="number" id="editInstructorPrice" class="input-field" min="0" step="1000" value="${
                profile.price
              }" required>
            </div>

            <div class="input-group">
              <label for="editInstructorIntro" class="input-label">소개글</label>
              <textarea id="editInstructorIntro" class="input-field" rows="4" required>${
                profile.introduction
              }</textarea>
            </div>

            <div class="input-group">
              <label for="editInstructorCertificates" class="input-label">자격증 (쉼표로 구분)</label>
              <textarea id="editInstructorCertificates" class="input-field" rows="2" placeholder="예: 생활스포츠지도사 2급, 요가강사 자격증">${
                profile.certificates ? profile.certificates.join(", ") : ""
              }</textarea>
            </div>

            <button class="btn btn-primary btn-full" onclick="saveProfileEdit('${profileId}')">
              <span class="btn-icon">💾</span> 저장하기
            </button>
          </div>
        </div>
      `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        window.closeEditProfileModal();
      }
    });
  } catch (error) {
    console.error("프로필 로드 실패:", error);
    alert("프로필을 불러오는 중 오류가 발생했습니다.");
  }
};

window.closeEditProfileModal = function () {
  const modal = document.getElementById("editProfileModal");
  if (modal) modal.remove();
  selectedInstructorImage = null;
  uploadedInstructorImageUrl = null;
};

window.handleInstructorImageChange = async function (event) {
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

  const statusElement = document.getElementById("instructorUploadStatus");

  try {
    statusElement.textContent = "📤 업로드 중...";
    statusElement.style.color = "#3b82f6";

    const compressedFile = await compressImage(file, 800);
    uploadedInstructorImageUrl = await uploadImageToCloudinary(compressedFile);

    const preview = document.getElementById("instructorProfilePreview");
    preview.src = uploadedInstructorImageUrl;

    statusElement.textContent = "✅ 업로드 완료!";
    statusElement.style.color = "#10b981";

    selectedInstructorImage = file;
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    statusElement.textContent = "❌ 업로드 실패";
    statusElement.style.color = "#dc2626";
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

    // 업로드된 이미지가 있으면 URL 저장
    if (uploadedInstructorImageUrl) {
      updates.profileImage = uploadedInstructorImageUrl;
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

    selectedInstructorImage = null;
    uploadedInstructorImageUrl = null;
  } catch (error) {
    console.error("❌ 프로필 수정 실패:", error);
    alert("프로필 수정 중 오류가 발생했습니다.");
  }
};
