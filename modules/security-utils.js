// ============================================================
// 보안 유틸리티 함수
// ============================================================

/**
 * XSS 공격 방지를 위한 HTML 이스케이프
 * @param {string} text - 이스케이프할 텍스트
 * @returns {string} - 이스케이프된 안전한 텍스트
 */
export function escapeHtml(text) {
  if (!text) return "";

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
    "/": "&#x2F;",
  };

  return String(text).replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * 이메일 형식 검증
 * @param {string} email - 검증할 이메일
 * @returns {boolean} - 유효한 이메일 여부
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 전화번호 형식 검증 (한국 형식)
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} - 유효한 전화번호 여부
 */
export function isValidPhone(phone) {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone);
}

/**
 * 안전한 URL 검증 (http, https만 허용)
 * @param {string} url - 검증할 URL
 * @returns {boolean} - 안전한 URL 여부
 */
export function isSafeUrl(url) {
  try {
    const urlObj = new URL(url);
    return ["http:", "https:"].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * 파일 확장자 검증
 * @param {string} filename - 파일명
 * @param {string[]} allowedExtensions - 허용된 확장자 목록
 * @returns {boolean} - 허용된 확장자 여부
 */
export function isAllowedFileExtension(
  filename,
  allowedExtensions = ["jpg", "jpeg", "png", "webp"]
) {
  const ext = filename.split(".").pop()?.toLowerCase();
  return allowedExtensions.includes(ext);
}

/**
 * SQL Injection 방지 - 특수문자 제거
 * @param {string} text - 입력 텍스트
 * @returns {string} - 정제된 텍스트
 */
export function sanitizeInput(text) {
  if (!text) return "";

  // SQL Injection 관련 키워드 제거
  const dangerous = [
    "SELECT",
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "CREATE",
    "ALTER",
    "EXEC",
    "SCRIPT",
  ];
  let sanitized = String(text);

  dangerous.forEach((keyword) => {
    const regex = new RegExp(keyword, "gi");
    sanitized = sanitized.replace(regex, "");
  });

  return sanitized.trim();
}

/**
 * 문자열 길이 검증
 * @param {string} text - 검증할 텍스트
 * @param {number} min - 최소 길이
 * @param {number} max - 최대 길이
 * @returns {boolean} - 길이 유효성 여부
 */
export function isValidLength(text, min = 0, max = Infinity) {
  if (!text) return min === 0;
  const length = String(text).trim().length;
  return length >= min && length <= max;
}

/**
 * 숫자 범위 검증
 * @param {number} value - 검증할 값
 * @param {number} min - 최소값
 * @param {number} max - 최대값
 * @returns {boolean} - 범위 유효성 여부
 */
export function isInRange(value, min, max) {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * 안전한 JSON 파싱
 * @param {string} jsonString - JSON 문자열
 * @param {*} defaultValue - 파싱 실패 시 기본값
 * @returns {*} - 파싱된 객체 또는 기본값
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
}

/**
 * Rate Limiting 체크 (간단한 클라이언트 측 제한)
 * @param {string} key - 제한 키 (예: 'login_attempt')
 * @param {number} maxAttempts - 최대 시도 횟수
 * @param {number} timeWindowMs - 시간 윈도우 (밀리초)
 * @returns {boolean} - 제한 초과 여부
 */
export function checkRateLimit(key, maxAttempts = 5, timeWindowMs = 60000) {
  const now = Date.now();
  const storageKey = `rateLimit_${key}`;

  let attempts = safeJsonParse(localStorage.getItem(storageKey), []);

  // 💥 배열 아닌 값(특히 null) 보정
  if (!Array.isArray(attempts)) {
    attempts = [];
  }

  // 오래된 시도 제거
  attempts = attempts.filter((timestamp) => now - timestamp < timeWindowMs);

  // 제한 초과 확인
  if (attempts.length >= maxAttempts) {
    return false;
  }

  // 새 시도 추가
  attempts.push(now);
  localStorage.setItem(storageKey, JSON.stringify(attempts));

  return true;
}

/**
 * Rate Limit 리셋
 * @param {string} key - 제한 키
 */
export function resetRateLimit(key) {
  const storageKey = `rateLimit_${key}`;
  localStorage.removeItem(storageKey);
}
