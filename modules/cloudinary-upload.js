// ============================================================
// Cloudinary 이미지 업로드 (완전 무료)
// modules/cloudinary-upload.js
// ============================================================
import { ENV_CONFIG } from "./env.config.js";

const CLOUDINARY_CLOUD_NAME = ENV_CONFIG.CLOUDINARY.cloudName;
const CLOUDINARY_UPLOAD_PRESET = ENV_CONFIG.CLOUDINARY.uploadPreset;

// 이미지 업로드 함수
export async function uploadImageToCloudinary(file) {
  // 파일 크기 체크 (5MB 제한)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("이미지 크기는 5MB 이하여야 합니다.");
  }

  // 이미지 타입 체크
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드 가능합니다.");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "profile_images");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error("이미지 업로드에 실패했습니다.");
    }

    const data = await response.json();
    return data.secure_url; // HTTPS URL 반환
  } catch (error) {
    console.error("Cloudinary 업로드 실패:", error);
    throw error;
  }
}

// 이미지 미리보기 생성
export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 이미지 압축 (선택사항)
export async function compressImage(file, maxWidth = 800) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // 최대 너비로 리사이즈
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.85 // 85% 품질
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
