// ============================================================
// 운동 종목 관련 함수 (네트워크 재시도 로직 추가)
// ============================================================
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getCurrentUser } from "./auth.js";

const defaultSports = [
  // === 구기 종목 (Ball Sports) ===
  { name: "테니스", icon: "🎾", count: 0, category: "ball", isNew: false },
  { name: "배드민턴", icon: "🏸", count: 0, category: "ball", isNew: false },
  { name: "탁구", icon: "🏓", count: 0, category: "ball", isNew: false },
  { name: "골프", icon: "⛳", count: 0, category: "ball", isNew: false },
  { name: "축구", icon: "⚽", count: 0, category: "ball", isNew: false },
  { name: "농구", icon: "🏀", count: 0, category: "ball", isNew: false },
  { name: "배구", icon: "🏐", count: 0, category: "ball", isNew: false },
  { name: "야구", icon: "⚾", count: 0, category: "ball", isNew: false },
  { name: "풋살", icon: "⚽", count: 0, category: "ball", isNew: true },
  { name: "스쿼시", icon: "🎾", count: 0, category: "ball", isNew: true },
  { name: "당구", icon: "🎱", count: 0, category: "ball", isNew: true },
  { name: "볼링", icon: "🎳", count: 0, category: "ball", isNew: true },

  // === 수상 스포츠 (Water Sports) ===
  { name: "수영", icon: "🏊", count: 0, category: "water", isNew: false },
  { name: "서핑", icon: "🏄", count: 0, category: "water", isNew: false },
  { name: "카약", icon: "🛶", count: 0, category: "water", isNew: false },
  { name: "다이빙", icon: "🤿", count: 0, category: "water", isNew: false },
  { name: "수상스키", icon: "🎿", count: 0, category: "water", isNew: true },
  { name: "윈드서핑", icon: "🏄", count: 0, category: "water", isNew: true },
  { name: "패들보드", icon: "🛶", count: 0, category: "water", isNew: true },

  // === 피트니스 (Fitness) ===
  {
    name: "헬스/피트니스",
    icon: "💪",
    count: 0,
    category: "fitness",
    isNew: false,
  },
  { name: "요가", icon: "🧘", count: 0, category: "fitness", isNew: false },
  { name: "필라테스", icon: "🧘‍♀️", count: 0, category: "fitness", isNew: false },
  { name: "크로스핏", icon: "🏋️", count: 0, category: "fitness", isNew: false },
  { name: "줌바", icon: "💃", count: 0, category: "fitness", isNew: false },
  { name: "스피닝", icon: "🚴", count: 0, category: "fitness", isNew: false },
  { name: "에어로빅", icon: "🤸‍♀️", count: 0, category: "fitness", isNew: false },
  {
    name: "웨이트트레이닝",
    icon: "🏋️‍♀️",
    count: 0,
    category: "fitness",
    isNew: true,
  },
  { name: "런닝", icon: "🏃", count: 0, category: "fitness", isNew: true },
  { name: "HIIT", icon: "🔥", count: 0, category: "fitness", isNew: true },
  { name: "TRX", icon: "🔗", count: 0, category: "fitness", isNew: true },

  // === 무술/격투기 (Martial Arts) ===
  { name: "복싱", icon: "🥊", count: 0, category: "martial", isNew: false },
  { name: "태권도", icon: "🥋", count: 0, category: "martial", isNew: false },
  { name: "주짓수", icon: "🤼", count: 0, category: "martial", isNew: false },
  { name: "유도", icon: "🤼‍♂️", count: 0, category: "martial", isNew: false },
  { name: "검도", icon: "⚔️", count: 0, category: "martial", isNew: false },
  { name: "MMA", icon: "🔥", count: 0, category: "martial", isNew: false },
  { name: "킥복싱", icon: "👊", count: 0, category: "martial", isNew: false },
  { name: "합기도", icon: "🥋", count: 0, category: "martial", isNew: true },
  { name: "무에타이", icon: "🇹🇭", count: 0, category: "martial", isNew: true },
  { name: "펜싱", icon: "🤺", count: 0, category: "martial", isNew: true },
  { name: "씨름", icon: "🤼‍♂️", count: 0, category: "martial", isNew: true },

  // === 익스트림 스포츠 (Extreme Sports) ===
  { name: "클라이밍", icon: "🧗", count: 0, category: "extreme", isNew: false },
  {
    name: "스케이트보드",
    icon: "🛹",
    count: 0,
    category: "extreme",
    isNew: false,
  },
  {
    name: "인라인스케이트",
    icon: "🛼",
    count: 0,
    category: "extreme",
    isNew: false,
  },
  { name: "스키", icon: "⛷️", count: 0, category: "extreme", isNew: false },
  { name: "스노보드", icon: "🏂", count: 0, category: "extreme", isNew: false },
  {
    name: "패러글라이딩",
    icon: "🪂",
    count: 0,
    category: "extreme",
    isNew: false,
  },
  { name: "볼더링", icon: "🧗‍♀️", count: 0, category: "extreme", isNew: true },

  // === 댄스 (Dance) ===
  { name: "발레", icon: "🩰", count: 0, category: "dance", isNew: false },
  { name: "방송댄스", icon: "🎤", count: 0, category: "dance", isNew: false },
  { name: "힙합댄스", icon: "🎧", count: 0, category: "dance", isNew: false },
  { name: "라틴댄스", icon: "💃", count: 0, category: "dance", isNew: false },
  { name: "스트릿댄스", icon: "🕺", count: 0, category: "dance", isNew: false },
  { name: "재즈댄스", icon: "🎷", count: 0, category: "dance", isNew: false },
  { name: "K-POP", icon: "⭐", count: 0, category: "dance", isNew: true },
  { name: "브레이킹", icon: "🕺", count: 0, category: "dance", isNew: true },
  { name: "댄스스포츠", icon: "👯", count: 0, category: "dance", isNew: true },
  { name: "벨리댄스", icon: "💎", count: 0, category: "dance", isNew: true },
];

// ✅ 재시도 로직 추가
async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`⚠️ 시도 ${i + 1}/${maxRetries} 실패:`, error.message);

      // 오프라인 에러가 아니면 즉시 실패
      if (
        !error.message.includes("offline") &&
        !error.message.includes("Backend")
      ) {
        throw error;
      }

      // 마지막 시도가 아니면 대기 후 재시도
      if (i < maxRetries - 1) {
        console.log(`🔄 ${delayMs}ms 후 재시도...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // 지수 백오프
      } else {
        throw error;
      }
    }
  }
}

// 운동 종목 로드 (재시도 로직 적용)
export async function loadSportsData() {
  try {
    console.log("📥 Firebase에서 종목 데이터 로드 시도...");

    if (!db) {
      console.error("❌ Firestore DB가 초기화되지 않았습니다!");
      console.log("⚠️ 기본 종목 데이터 반환");
      return defaultSports;
    }

    // ✅ 재시도 로직 적용
    const sportsDoc = await retryOperation(async () => {
      return await getDoc(doc(db, "settings", "sports"));
    });

    console.log("📄 Firebase 문서 존재 여부:", sportsDoc.exists());

    let sportsData;
    if (sportsDoc.exists()) {
      sportsData = sportsDoc.data().list || [];
      console.log("✅ Firebase에서 로드한 종목 수:", sportsData.length);

      // 데이터가 비어있으면 기본 데이터 사용
      if (sportsData.length === 0) {
        console.warn(
          "⚠️ Firebase에 종목 데이터가 없습니다. 기본 데이터로 초기화합니다."
        );
        sportsData = defaultSports;

        // ✅ 로그인된 사용자만 Firebase에 저장
        const user = getCurrentUser();
        if (user) {
          await setDoc(doc(db, "settings", "sports"), { list: sportsData });
          console.log("✅ Firebase에 기본 종목 데이터 저장 완료");
        } else {
          console.log("⚠️ 로그인하지 않아 Firebase에 저장하지 않음");
        }
      }
    } else {
      console.log("📝 Firebase에 문서가 없습니다. 기본 데이터로 초기화합니다.");
      sportsData = defaultSports;

      // ✅ 로그인된 사용자만 Firebase에 저장
      const user = getCurrentUser();
      if (user) {
        await setDoc(doc(db, "settings", "sports"), { list: sportsData });
        console.log("✅ Firebase에 기본 종목 데이터 저장 완료");
      } else {
        console.log("⚠️ 로그인하지 않아 Firebase에 저장하지 않음");
      }
    }

    console.log("✅ 최종 반환 종목 수:", sportsData.length);
    return sportsData;
  } catch (error) {
    console.error("❌ Firebase에서 종목 로드 실패:", error);
    console.log("⚠️ 오류 발생으로 기본 종목 데이터 반환");
    return defaultSports;
  }
}

// ✅ 운동 종목별 강사 수 업데이트 (재시도 로직 적용)
export async function updateSportCounts(sportsData) {
  console.log("🔄 종목별 강사 수 업데이트 시작...");

  try {
    const instructorsSnapshot = await retryOperation(async () => {
      return await getDocs(collection(db, "instructors"));
    });

    const sportCounts = {};

    instructorsSnapshot.forEach((doc) => {
      const sport = doc.data().sport;
      sportCounts[sport] = (sportCounts[sport] || 0) + 1;
    });

    console.log("📊 집계된 종목별 강사 수:", sportCounts);

    sportsData.forEach((sport) => {
      const oldCount = sport.count;
      sport.count = sportCounts[sport.name] || 0;
      if (oldCount !== sport.count) {
        console.log(`  ${sport.name}: ${oldCount} → ${sport.count}명`);
      }
    });

    // ✅ 로그인된 사용자만 Firebase에 저장
    const user = getCurrentUser();
    if (user) {
      await setDoc(doc(db, "settings", "sports"), { list: sportsData });
      console.log("✅ 종목별 강사 수 업데이트 완료 및 Firebase 저장 완료");
    } else {
      console.log(
        "✅ 종목별 강사 수 업데이트 완료 (로그인하지 않아 Firebase에 저장하지 않음)"
      );
    }

    return sportsData;
  } catch (error) {
    console.error("❌ 강사 수 업데이트 실패:", error);
    // 실패해도 기존 데이터 반환
    return sportsData;
  }
}

// ✅ 최신 강사 수로 종목 데이터 새로고침 (재시도 로직 적용)
export async function refreshSportsWithCounts() {
  console.log("🔄 종목 데이터 새로고침 시작...");

  try {
    // 1. Firebase에서 최신 종목 데이터 로드
    const sportsDoc = await retryOperation(async () => {
      return await getDoc(doc(db, "settings", "sports"));
    });

    let sportsData = sportsDoc.exists()
      ? sportsDoc.data().list || []
      : defaultSports;

    // 2. 강사 수 카운트 업데이트
    const updatedSports = await updateSportCounts(sportsData);

    console.log("✅ 종목 데이터 새로고침 완료");
    return updatedSports;
  } catch (error) {
    console.error("❌ 종목 데이터 새로고침 실패:", error);
    console.log("⚠️ 기본 종목 데이터 반환");
    return defaultSports;
  }
}

// 종목 이름에 맞는 아이콘 자동 매칭 (생활체육 강사 레슨 가능 종목만)
export function getEmojiForSport(sportName, category) {
  // ✅ 안전 체크 추가!
  if (!sportName) return "🏃";

  const emojiMap = {
    // === 구기 종목 (강사 레슨 가능) ===
    테니스: "🎾",
    배드민턴: "🏸",
    탁구: "🏓",
    골프: "⛳",
    축구: "⚽",
    농구: "🏀",
    배구: "🏐",
    야구: "⚾",
    풋살: "⚽",
    스쿼시: "🎾",
    당구: "🎱",
    포켓볼: "🎱",
    볼링: "🎳",
    비치발리볼: "🏐",
    소프트볼: "⚾",
    족구: "⚽",
    파크골프: "⛳",

    // === 수상 스포츠 (강사 레슨 가능) ===
    수영: "🏊",
    서핑: "🏄",
    카약: "🛶",
    다이빙: "🤿",
    수상스키: "🎿",
    윈드서핑: "🏄",
    패들보드: "🛶",
    수구: "🏊",
    아쿠아로빅: "💦",
    웨이크보드: "🏄",

    // === 피트니스 (강사 레슨 가능) ===
    헬스: "💪",
    피트니스: "💪",
    "헬스/피트니스": "💪",
    웨이트: "🏋️",
    웨이트트레이닝: "🏋️‍♀️",
    요가: "🧘",
    필라테스: "🧘‍♀️",
    크로스핏: "🏋️",
    줌바: "💃",
    스피닝: "🚴",
    실내사이클: "🚴‍♀️",
    에어로빅: "🤸‍♀️",
    스트레칭: "🙆",
    바디펌프: "🏋️",
    바디컴뱃: "🥋",
    바디밸런스: "⚖️",
    런닝: "🏃",
    조깅: "🏃‍♀️",
    마라톤: "🏃‍♂️",
    기능성운동: "🏋️",
    TRX: "🔗",
    케틀벨: "🏋️",
    플랭크: "⏱️",
    바디빌딩: "💪",
    파워리프팅: "🏋️‍♂️",
    칼리스테닉스: "🤸‍♂️",
    HIIT: "🔥",
    타바타: "⏱️",
    플라잉요가: "🧘‍♀️",
    핫요가: "🔥",
    파워요가: "💪",
    그룹PT: "👥",
    퍼스널트레이닝: "🎯",
    맨몸운동: "🤸",

    // === 무술/격투기 (강사 레슨 가능) ===
    복싱: "🥊",
    태권도: "🥋",
    주짓수: "🤼",
    유도: "🤼‍♂️",
    검도: "⚔️",
    mma: "🔥",
    MMA: "🔥",
    킥복싱: "👊",
    합기도: "🔄",
    카포에라: "🤸",
    무에타이: "🇹🇭",
    가라테: "🥋",
    쿵푸: "🐉",
    펜싱: "🤺",
    에어복싱: "👊",
    씨름: "🤼‍♂️",
    레슬링: "🤼",
    유술: "🤼‍♀️",
    택견: "🇰🇷",
    합도: "🔷",

    // === 익스트림 스포츠 (강사 레슨 가능) ===
    클라이밍: "🧗",
    암벽등반: "🧗‍♀️",
    등산: "🥾",
    스케이트보드: "🛹",
    인라인: "🛼",
    인라인스케이트: "🛼",
    스키: "⛷️",
    스노보드: "🏂",
    패러글라이딩: "🪂",
    서바이벌: "🏹",
    사격: "🎯",
    양궁: "🏹",
    볼더링: "🧗",
    산악자전거: "🚵",
    MTB: "🚵‍♀️",
    파쿠르: "🏃‍♂️",

    // === 댄스 (강사 레슨 가능) ===
    발레: "🩰",
    방송댄스: "🎤",
    힙합댄스: "🎧",
    힙합: "🎤",
    라틴댄스: "🌹",
    라틴: "💃",
    스트릿댄스: "🧢",
    스트릿: "🛹",
    재즈댄스: "🎷",
    재즈: "🎺",
    왈츠: "👗",
    탱고: "🔥",
    살사: "🌶️",
    벨리댄스: "💎",
    폴댄스: "💪",
    현대무용: "🎭",
    한국무용: "🏯",
    브레이크댄스: "🕺",
    브레이킹: "🕺",
    kpop: "⭐",
    "K-POP": "⭐",
    케이팝: "🎵",
    댄스스포츠: "👠",
    사교댄스: "👫",
    플라멩코: "👠",
    스윙댄스: "🎩",
    탭댄스: "👞",
    컨템포러리: "🎭",
    요가댄스: "🧘‍♀️",
    라인댄스: "👗",
    포크댄스: "💃",
    줌바: "💃",

    // === 기타 생활체육 (강사 레슨 가능) ===
    승마: "🏇",
    체조: "🤸",
    리듬체조: "🎀",
    피겨: "⛸️",
    피겨스케이팅: "⛸️",
    스피드스케이팅: "💨",
    쇼트트랙: "💨",
    치어리딩: "📣",
    트램폴린: "🔵",
  };

  // 정확히 일치하는 이름이 있으면 반환
  if (emojiMap[sportName]) {
    return emojiMap[sportName];
  }

  // 대소문자 구분 없이 검색
  const lowerSportName = sportName.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (key.toLowerCase() === lowerSportName) {
      return emoji;
    }
  }

  // 부분 일치 검색 (키워드 포함)
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (sportName.includes(key) || key.includes(sportName)) {
      return emoji;
    }
  }

  // ✅ 카테고리별 기본 이모지
  const categoryDefaults = {
    ball: "⚽", // 구기 종목
    water: "🏊", // 수상 스포츠
    fitness: "💪", // 피트니스
    martial: "🥊", // 무술/격투기
    extreme: "🧗", // 익스트림 스포츠
    dance: "💃", // 댄스
    other: "🏃", // 기타 생활체육
  };

  return categoryDefaults[category] || "🏃";
}

// ✅ 새 운동 종목 추가 (관리자 전용)
export async function addNewSport(name, category, icon = null) {
  const user = getCurrentUser();

  if (!user) {
    throw new Error("⛔ 로그인이 필요합니다.");
  }

  // ✅ 관리자 체크
  const { isAdmin } = await import("./admin.js");
  if (!isAdmin(user.email)) {
    throw new Error("⛔ 관리자만 종목을 추가할 수 있습니다.");
  }

  const sportsDoc = await getDoc(doc(db, "settings", "sports"));
  let sportsData = sportsDoc.exists() ? sportsDoc.data().list || [] : [];

  // 중복 체크
  if (sportsData.some((sport) => sport.name === name)) {
    throw new Error("이미 존재하는 종목입니다.");
  }

  // 이모지가 없으면 자동 매칭
  if (!icon) {
    icon = getEmojiForSport(name, category);
  }

  const newSport = {
    name,
    category,
    icon,
    count: 0,
    isNew: true,
  };

  sportsData.push(newSport);
  await setDoc(doc(db, "settings", "sports"), { list: sportsData });

  console.log(`✅ 관리자 ${user.email}가 종목 추가: ${name} ${icon}`);
  return sportsData;
}

// ✅ Firebase 종목 데이터 강제 초기화 (관리자 전용)
export async function resetSportsToDefault() {
  const user = getCurrentUser();

  if (!user) {
    throw new Error("⛔ 로그인이 필요합니다.");
  }

  // ✅ 관리자 체크
  const { isAdmin } = await import("./admin.js");
  if (!isAdmin(user.email)) {
    throw new Error("⛔ 관리자만 종목 데이터를 초기화할 수 있습니다.");
  }

  try {
    console.log("🔄 Firebase 종목 데이터 초기화 시작...");
    console.log("📝 기본 종목 수:", defaultSports.length);

    // Firebase에 기본 데이터 강제 저장
    await setDoc(doc(db, "settings", "sports"), { list: defaultSports });

    console.log("✅ Firebase 종목 데이터 초기화 완료!");
    console.log(
      `✅ 관리자 ${user.email}가 종목 데이터 초기화: ${defaultSports.length}개`
    );

    return defaultSports;
  } catch (error) {
    console.error("❌ Firebase 종목 데이터 초기화 실패:", error);
    throw error;
  }
}
