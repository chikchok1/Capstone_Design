// ============================================================
// 종목 관리 UI 모듈 (디버깅 강화 버전)
// ============================================================
import { loadSportsData, addNewSport, getEmojiForSport } from "../sports.js";
import { renderSportCard, renderAddSportCard } from "../ui-renderers.js";

export let sportsData = [];
export let displayedSportsCount = 12;

export function initSportsUI() {
  window.loadAndDisplaySports = async function () {
    try {
      console.log("🔍 종목 데이터 로드 시작...");
      sportsData = await loadSportsData();
      console.log("✅ 로드된 종목 데이터:", sportsData);
      console.log("📊 종목 개수:", sportsData.length);
      
      if (!sportsData || sportsData.length === 0) {
        console.warn("⚠️ 종목 데이터가 비어있습니다!");
        const grid = document.getElementById("sportsGrid");
        if (grid) {
          grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">종목 데이터를 불러오는 중입니다...</p>';
        }
        return;
      }
      
      displaySports(sportsData.slice(0, displayedSportsCount));
      updateViewMoreButton();
      console.log("✅ 종목 표시 완료");
    } catch (error) {
      console.error("❌ 종목 데이터 로드 실패:", error);
      const grid = document.getElementById("sportsGrid");
      if (grid) {
        grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #ef4444;">종목 데이터 로드 실패. 페이지를 새로고침 해주세요.</p>';
      }
    }
  };

  function displaySports(sports) {
    console.log("🎨 종목 카드 렌더링 시작...", sports.length, "개");
    const grid = document.getElementById("sportsGrid");
    
    if (!grid) {
      console.error("❌ sportsGrid 요소를 찾을 수 없습니다!");
      return;
    }
    
    grid.innerHTML = "";

    if (!sports || sports.length === 0) {
      grid.innerHTML = '<p style="text-align: center; padding: 40px; color: #6b7280;">표시할 종목이 없습니다.</p>';
      return;
    }

    sports.forEach((sport, index) => {
      console.log(`  카드 ${index + 1}:`, sport.name, sport.icon);
      const card = renderSportCard(sport, (sportName) => {
        document.getElementById("sportSelect").value = sportName;
        document.getElementById("searchInput").value = sportName;
        window.handleSearch();
      });
      grid.appendChild(card);
    });

    // ✅ 관리자인 경우에만 종목 추가 카드 표시
    checkAndShowAddSportCard(grid);
    
    console.log("✅ 종목 카드 렌더링 완료");
  }

  // ✅ 관리자 확인 후 종목 추가 카드 표시
  async function checkAndShowAddSportCard(grid) {
    try {
      const { isAdmin } = await import("../admin.js");
      const { auth } = await import("../firebase-config.js");
      const user = auth.currentUser;
      
      // 관리자인 경우에만 종목 추가 카드 표시
      if (user && isAdmin(user.email)) {
        const addCard = renderAddSportCard(window.openAddSportModal);
        grid.appendChild(addCard);
      }
    } catch (error) {
      console.error("❌ 관리자 확인 실패:", error);
    }
  }

  function updateViewMoreButton() {
    const btn = document.getElementById("viewMoreBtn");
    if (sportsData.length <= displayedSportsCount) {
      btn.style.display = "none";
    } else {
      btn.style.display = "block";
      btn.textContent = `더보기 (${
        sportsData.length - displayedSportsCount
      }개 남음) ▼`;
    }
  }

  window.toggleViewMore = function () {
    if (displayedSportsCount >= sportsData.length) {
      displayedSportsCount = 12;
      document.getElementById("viewMoreBtn").textContent = "더보기 ▼";
    } else {
      displayedSportsCount = sportsData.length;
      document.getElementById("viewMoreBtn").textContent = "접기 ▲";
    }
    displaySports(sportsData.slice(0, displayedSportsCount));
    updateViewMoreButton();
  };

  window.filterSports = function (category) {
    const buttons = document.querySelectorAll(".filter-btn");
    buttons.forEach((btn) => btn.classList.remove("active"));
    event.target.classList.add("active");

    let filtered;
    if (category === "all") {
      filtered = sportsData;
    } else {
      filtered = sportsData.filter((sport) => sport.category === category);
    }

    displaySports(filtered.slice(0, displayedSportsCount));
  };

  window.openAddSportModal = function () {
    const modal = document.getElementById("addSportModal");
    if (modal) {
      modal.classList.add("active");
      // 폼 초기화
      document.getElementById("newSportName").value = "";
      document.getElementById("newSportCategory").value = "";
    }
  };

  window.closeAddSportModal = function () {
    const modal = document.getElementById("addSportModal");
    if (modal) {
      modal.classList.remove("active");
    }
  };

  window.submitNewSport = async function () {
    const name = document.getElementById("newSportName").value.trim();
    const category = document.getElementById("newSportCategory").value;

    if (!name || !category) {
      alert("📝 종목명과 카테고리를 모두 입력해주세요!");
      return;
    }

    try {
      const emoji = getEmojiForSport(name, category);
      await addNewSport(name, category, emoji);
      alert(`✅ "${name}" 종목이 추가되었습니다!`);
      window.closeAddSportModal();

      // ✅ 종목 데이터 새로고침 (Firebase에서 최신 데이터 가져오기)
      const { refreshSportsWithCounts } = await import("../sports.js");
      const updatedSports = await refreshSportsWithCounts();
      setSportsData(updatedSports);
      
      // ✅ 종목 UI 업데이트
      await window.loadAndDisplaySports();

      // ✅ 통계 업데이트
      if (window.updateStats) {
        await window.updateStats();
      }
    } catch (error) {
      console.error("종목 추가 실패:", error);
      alert("종목 추가 중 오류가 발생했습니다: " + error.message);
    }
  };
}

export function setSportsData(data) {
  sportsData = data;
}

export function getSportsData() {
  return sportsData;
}
