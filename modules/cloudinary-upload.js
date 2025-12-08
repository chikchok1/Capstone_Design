// ============================================================
// Cloudinary 이미지 업로드 (보안 강화)
// ============================================================
import { ENV_CONFIG } from "./env.config.js";
import { isAllowedFileExtension } from "./security-utils.js";

const CLOUDINARY_CLOUD_NAME = ENV_CONFIG.CLOUDINARY.cloudName;
const CLOUDINARY_UPLOAD_PRESET = ENV_CONFIG.CLOUDINARY.uploadPreset;

// 허용된 이미지 형식
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 이미지 업로드 함수
export async function uploadImageToCloudinary(file) {
  // 🔒 파일 존재 확인
  if (!file) {
    throw new Error("파일을 선택해주세요.");
  }
  
  // 🔒 파일 크기 체크 (5MB 제한)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("이미지 크기는 5MB 이하여야 합니다.");
  }
  
  // 🔒 파일 크기 최소 체크 (너무 작은 파일 방지)
  if (file.size < 100) {
    throw new Error("올바른 이미지 파일이 아닙니다.");
  }

  // 🔒 이미지 타입 체크 (MIME type)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.");
  }
  
  // 🔒 파일 확장자 체크
  if (!isAllowedFileExtension(file.name, ALLOWED_EXTENSIONS)) {
    throw new Error("JPG, PNG, WEBP 형식의 이미지만 업로드 가능합니다.");
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || "이미지 업로드에 실패했습니다.");
    }

    const data = await response.json();
    
    // 🔒 응답 검증
    if (!data.secure_url) {
      throw new Error("이미지 URL을 받아오지 못했습니다.");
    }
    
    return data.secure_url; // HTTPS URL 반환
  } catch (error) {
    if (error.message.includes("Failed to fetch")) {
      throw new Error("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
    }
    throw error;
  }
}

// 이미지 미리보기 생성
export function createImagePreview(file) {
  return new Promise((resolve, reject) => {
    // 🔒 파일 검증
    if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error("올바른 이미지 파일이 아닙니다."));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      // 🔒 결과 검증
      if (!e.target.result) {
        reject(new Error("이미지를 읽을 수 없습니다."));
        return;
      }
      resolve(e.target.result);
    };
    
    reader.onerror = () => {
      reject(new Error("이미지 미리보기 생성에 실패했습니다."));
    };
    
    reader.readAsDataURL(file);
  });
}

// 이미지 압축
export async function compressImage(file, maxWidth = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    // 🔒 파일 검증
    if (!file || !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error("올바른 이미지 파일이 아닙니다."));
      return;
    }
    
    // 🔒 파라미터 검증
    if (maxWidth < 100 || maxWidth > 4000) {
      reject(new Error("올바른 압축 크기가 아닙니다."));
      return;
    }
    
    if (quality < 0.1 || quality > 1) {
      reject(new Error("올바른 품질 값이 아닙니다."));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        try {
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
              if (!blob) {
                reject(new Error("이미지 압축에 실패했습니다."));
                return;
              }
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            quality
          );
        } catch (error) {
          reject(new Error("이미지 처리 중 오류가 발생했습니다."));
        }
      };
      
      img.onerror = () => {
        reject(new Error("이미지를 로드할 수 없습니다."));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = () => {
      reject(new Error("파일을 읽을 수 없습니다."));
    };
    
    reader.readAsDataURL(file);
  });
}
