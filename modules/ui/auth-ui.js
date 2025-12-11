// ============================================================
// 회원가입/로그인 UI 모듈 (디버깅 강화 버전)
// ============================================================
import { auth } from "../firebase-config.js";
import {
  processSignup as authProcessSignup,
  processLogin as authProcessLogin,
  handleLogout as authLogout,
  deleteAccount as authDeleteAccount,
} from "../auth.js";
import { closeAuthModal, switchAuthTab } from "../modal-manager.js";

// 탭 전환 함수
export function initTabSwitcher() {
  window.switchTab = function (mode) {
    switchAuthTab(mode);
  };
}

// 회원가입 Enter 키 이벤트
function setupSignupEnterKey() {
  const signupName = document.getElementById('signupName');
  const signupEmail = document.getElementById('signupEmail');
  const signupPw = document.getElementById('signupPw');
  
  if (signupName) {
    signupName.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.processSignup();
      }
    });
  }
  
  if (signupEmail) {
    signupEmail.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.processSignup();
      }
    });
  }
  
  if (signupPw) {
    signupPw.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.processSignup();
      }
    });
  }
}

// 회원가입 처리
export function initSignupHandler() {
  // Enter 키 이벤트 설정
  setupSignupEnterKey();
  
  window.processSignup = async function () {
    console.log("🔍 회원가입 버튼 클릭됨");

    const nameEl = document.getElementById("signupName");
    const emailEl = document.getElementById("signupEmail");
    const pwEl = document.getElementById("signupPw");
    const userTypeEl = document.querySelector('input[name="userType"]:checked');

    // 🔍 디버깅: 요소 확인
    console.log("요소 확인:", { nameEl, emailEl, pwEl, userTypeEl });

    if (!nameEl || !emailEl || !pwEl) {
      alert("⚠️ 폼 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const pw = pwEl.value;
    const userType = userTypeEl?.value;

    // 🔍 디버깅: 입력값 확인
    console.log("입력값:", { name, email, pw: pw ? "***" : "", userType });

    if (!name || !email || !pw || !userType) {
      alert("📝 모든 항목을 입력해주세요!");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("⚠️ 올바른 이메일 형식을 입력해주세요.\n예: user@example.com");
      return;
    }

    // 비밀번호 길이 검증
    if (pw.length < 6) {
      alert("⚠️ 비밀번호는 6자리 이상이어야 합니다.");
      return;
    }

    console.log("✅ 유효성 검증 통과, 회원가입 진행 중...");

    try {
      // 회원가입 처리
      await authProcessSignup(name, email, pw, userType);

      console.log("✅ 회원가입 성공!");

      // 모달 닫기
      closeAuthModal();

      // 폼 초기화
      nameEl.value = "";
      emailEl.value = "";
      pwEl.value = "";

      alert("🎉 회원가입이 완료되었습니다!");
    } catch (error) {
      console.error("❌ 회원가입 실패:", error);
      let msg = "가입 실패: ";
      if (error.code === "auth/email-already-in-use") {
        msg += "이미 사용 중인 이메일입니다.";
      } else if (error.code === "auth/weak-password") {
        msg += "비밀번호는 6자리 이상이어야 합니다.";
      } else if (error.code === "auth/invalid-email") {
        msg += "유효하지 않은 이메일 형식입니다.";
      } else {
        msg += error.message;
      }
      alert(msg);
    }
  };
}

// 로그인 Enter 키 이벤트
function setupLoginEnterKey() {
  const loginEmail = document.getElementById('loginEmail');
  const loginPw = document.getElementById('loginPw');
  
  if (loginEmail) {
    loginEmail.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.processLogin();
      }
    });
  }
  
  if (loginPw) {
    loginPw.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.processLogin();
      }
    });
  }
}

// 로그인 처리
export function initLoginHandler() {
  // Enter 키 이벤트 설정
  setupLoginEnterKey();
  
  window.processLogin = async function () {
    console.log("🔍 로그인 버튼 클릭됨");

    const emailEl = document.getElementById("loginEmail");
    const pwEl = document.getElementById("loginPw");

    if (!emailEl || !pwEl) {
      alert("⚠️ 폼 요소를 찾을 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    const email = emailEl.value.trim();
    const pw = pwEl.value;

    console.log("입력값:", { email, pw: pw ? "***" : "" });

    if (!email || !pw) {
      alert("📝 이메일과 비밀번호를 입력해주세요!");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("⚠️ 올바른 이메일 형식을 입력해주세요.");
      return;
    }

    console.log("✅ 유효성 검증 통과, 로그인 진행 중...");

    try {
      await authProcessLogin(email, pw);

      console.log("✅ 로그인 성공!");

      // 모달 닫기
      closeAuthModal();

      // 폼 초기화
      emailEl.value = "";
      pwEl.value = "";
    } catch (error) {
      console.error("❌ 로그인 실패:", error);
      let msg = "로그인 실패: ";
      if (error.code === "auth/user-not-found") {
        msg += "존재하지 않는 계정입니다.";
      } else if (error.code === "auth/wrong-password") {
        msg += "비밀번호가 일치하지 않습니다.";
      } else if (error.code === "auth/invalid-credential") {
        msg += "이메일 또는 비밀번호를 확인해주세요.";
      } else {
        msg += error.message;
      }
      alert(msg);
    }
  };
}

// 로그아웃 처리
export function initLogoutHandler() {
  window.handleLogout = async function () {
    try {
      await authLogout();
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
      alert("로그아웃 중 오류가 발생했습니다.");
    }
  };
}

// 회원 탈퇴 처리
export function initDeleteAccountHandler() {
  window.deleteAccount = async function () {
    const user = auth.currentUser;
    if (!user) {
      alert("🔒 로그인이 필요합니다!");
      return;
    }

    const confirmText = prompt(
      "⚠️ 정말로 회원 탈퇴하시겠습니까?\n" +
        "모든 데이터(프로필, 예약내역, 평가 등)가 삭제되며 복구할 수 없습니다.\n\n" +
        "탈퇴하시려면 '회원탈퇴'를 입력해주세요."
    );

    if (confirmText !== "회원탈퇴") {
      if (confirmText !== null) {
        alert("입력이 일치하지 않아 탈퇴가 취소되었습니다.");
      }
      return;
    }

    try {
      await authDeleteAccount(user);
      alert("✅ 회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");
      location.reload();
    } catch (error) {
      console.error("❌ 회원 탈퇴 실패:", error);
      if (error.code === "auth/requires-recent-login") {
        alert(
          "⚠️ 보안을 위해 최근에 로그인한 사용자만 탈퇴할 수 있습니다.\n로그아웃 후 다시 로그인하여 시도해주세요."
        );
      } else {
        alert("회원 탈퇴 중 오류가 발생했습니다: " + error.message);
      }
    }
  };
}

// 모든 Auth UI 핸들러 초기화
export function initAuthUI() {
  initTabSwitcher();
  initSignupHandler();
  initLoginHandler();
  initLogoutHandler();
  initDeleteAccountHandler();
  console.log("✅ Auth UI 초기화 완료");
}
