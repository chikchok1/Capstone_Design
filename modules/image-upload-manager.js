// ============================================================
// 이미지 업로드 상태 관리자
// ============================================================
import { uploadImageToCloudinary, compressImage } from "./cloudinary-upload.js";

// ✅ 이미지 업로드 상태를 관리하는 클래스
class ImageUploadManager {
  constructor(id, previewElementId, statusElementId) {
    this.id = id; // 고유 식별자 (예: "newInstructor", "editInstructor")
    this.previewElementId = previewElementId; // 미리보기 이미지 요소 ID
    this.statusElementId = statusElementId; // 상태 텍스트 요소 ID
    this.imageUrl = null; // 업로드된 이미지 URL
    this.isUploading = false; // 업로드 진행 중 여부
  }

  // 이미지 업로드
  async uploadImage(file) {
    if (!file) {
      throw new Error("파일이 선택되지 않았습니다.");
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("이미지 크기는 5MB 이하여야 합니다.");
    }

    // 파일 타입 체크
    if (!file.type.startsWith("image/")) {
      throw new Error("이미지 파일만 업로드 가능합니다.");
    }

    this.isUploading = true;
    this.updateStatus("📤 업로드 중...", "#3b82f6");

    try {
      // 이미지 압축
      const compressedFile = await compressImage(file, 800);
      
      // Cloudinary에 업로드
      this.imageUrl = await uploadImageToCloudinary(compressedFile);
      
      // 미리보기 업데이트
      this.updatePreview(this.imageUrl);
      
      // 상태 업데이트
      this.updateStatus("✅ 업로드 완료!", "#10b981");
      
      console.log(`✅ [${this.id}] 이미지 업로드 성공:`, this.imageUrl);
      
      return this.imageUrl;
    } catch (error) {
      this.imageUrl = null;
      this.updateStatus("❌ 업로드 실패", "#dc2626");
      console.error(`❌ [${this.id}] 이미지 업로드 실패:`, error);
      throw error;
    } finally {
      this.isUploading = false;
    }
  }

  // 미리보기 업데이트
  updatePreview(imageUrl) {
    const previewElement = document.getElementById(this.previewElementId);
    if (previewElement) {
      previewElement.src = imageUrl;
    }
  }

  // 상태 텍스트 업데이트
  updateStatus(text, color) {
    const statusElement = document.getElementById(this.statusElementId);
    if (statusElement) {
      statusElement.textContent = text;
      statusElement.style.color = color;
    }
  }

  // 업로드된 이미지 URL 가져오기
  getImageUrl() {
    return this.imageUrl;
  }

  // 업로드 진행 중 여부
  isUploadInProgress() {
    return this.isUploading;
  }

  // 상태 초기화
  reset() {
    this.imageUrl = null;
    this.isUploading = false;
    this.updateStatus("", "#6b7280");
    console.log(`🔄 [${this.id}] 이미지 업로드 상태 초기화`);
  }

  // 기본 이미지로 리셋
  resetToDefault(defaultImageUrl) {
    this.reset();
    this.updatePreview(defaultImageUrl);
  }
}

// ✅ 관리자 인스턴스 저장소
const uploadManagers = new Map();

// ✅ 이미지 업로드 관리자 가져오기 (싱글톤 패턴)
export function getImageUploadManager(id, previewElementId, statusElementId) {
  if (!uploadManagers.has(id)) {
    uploadManagers.set(id, new ImageUploadManager(id, previewElementId, statusElementId));
    console.log(`📦 [${id}] 새 이미지 업로드 관리자 생성`);
  }
  return uploadManagers.get(id);
}

// ✅ 관리자 초기화
export function resetImageUploadManager(id) {
  const manager = uploadManagers.get(id);
  if (manager) {
    manager.reset();
  }
}

// ✅ 관리자 삭제
export function deleteImageUploadManager(id) {
  if (uploadManagers.has(id)) {
    uploadManagers.delete(id);
    console.log(`🗑️ [${id}] 이미지 업로드 관리자 삭제`);
  }
}

// ✅ 모든 관리자 초기화
export function resetAllImageUploadManagers() {
  uploadManagers.forEach((manager, id) => {
    manager.reset();
    console.log(`🔄 [${id}] 초기화`);
  });
}
