// ============================================================
// 운동 종목 관련 함수 (디버깅 강화 버전)
// ============================================================
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const defaultSports = [
  { name: "테니스", icon: "🎾", count: 0, category: "ball", isNew: false },
  { name: "배드민턴", icon: "🏸", count: 0, category: "ball", isNew: false },
  { name: "탁구", icon: "🏓", count: 0, category: "ball", isNew: false },
  { name: "골프", icon: "⛳", count: 0, category: "ball", isNew: false },
  { name: "축구", icon: "⚽", count: 0, category: "ball", isNew: false },
  { name: "농구", icon: "🏀", count: 0, category: "ball", isNew: false },
  { name: "배구", icon: "🏐", count: 0, category: "ball", isNew: false },
  { name: "야구", icon: "⚾", count: 0, category: "ball", isNew: false },
  { name: "수영", icon: "🏊", count: 0, category: "water", isNew: false },
  { name: "서핑", icon: "🏄", count: 0, category: "water", isNew: false },
  { name: "카약", icon: "🛶", count: 0, category: "water", isNew: true },
  { name: "다이빙", icon: "🤿", count: 0, category: "water", isNew: false },
  {
    name: "헬스/피트니스",
    icon: "💪",
    count: 0,
    category: "fitness",
    isNew: false,
  },
  { name: "요가", icon: "🧘", count: 0, category: "fitness", isNew: false },
  { name: "필라테스", icon: "🤸", count: 0, category: "fitness", isNew: false },
  { name: "크로스핏", icon: "⚡", count: 0, category: "fitness", isNew: false },
  { name: "줌바", icon: "💃", count: 0, category: "fitness", isNew: false },
  { name: "스피닝", icon: "🚴", count: 0, category: "fitness", isNew: false },
  { name: "에어로빅", icon: "🤾", count: 0, category: "fitness", isNew: false },
  { name: "복싱", icon: "🥊", count: 0, category: "martial", isNew: false },
  { name: "태권도", icon: "🥋", count: 0, category: "martial", isNew: false },
  { name: "주짓수", icon: "🤼", count: 0, category: "martial", isNew: false },
  { name: "유도", icon: "🥋", count: 0, category: "martial", isNew: false },
  { name: "검도", icon: "⚔️", count: 0, category: "martial", isNew: false },
  { name: "MMA", icon: "🥊", count: 0, category: "martial", isNew: true },
  { name: "킥복싱", icon: "🦵", count: 0, category: "martial", isNew: false },
  { name: "클라이밍", icon: "🧗", count: 0, category: "extreme", isNew: false },
  {
    name: "스케이트보드",
    icon: "🛹",
    count: 0,
    category: "extreme",
    isNew: false,
  },
  { name: "인라인", icon: "⛸️", count: 0, category: "extreme", isNew: false },
  { name: "스키", icon: "⛷️", count: 0, category: "extreme", isNew: false },
  { name: "스노보드", icon: "🏂", count: 0, category: "extreme", isNew: false },
  {
    name: "패러글라이딩",
    icon: "🪂",
    count: 0,
    category: "extreme",
    isNew: true,
  },
  { name: "발레", icon: "🩰", count: 0, category: "dance", isNew: false },
  { name: "방송댄스", icon: "🎤", count: 0, category: "dance", isNew: false },
  { name: "힙합댄스", icon: "🎧", count: 0, category: "dance", isNew: false },
  { name: "라틴댄스", icon: "🌹", count: 0, category: "dance", isNew: false },
  { name: "스트릿댄스", icon: "🧢", count: 0, category: "dance", isNew: true },
  { name: "재즈댄스", icon: "🎷", count: 0, category: "dance", isNew: false },
];

// 운동 종목 로드 (디버깅 강화)
export async function loadSportsData() {
  try {
    console.log("📥 Firebase에서 종목 데이터 로드 시도...");
    
    if (!db) {
      console.error("❌ Firestore DB가 초기화되지 않았습니다!");
      console.log("⚠️ 기본 종목 데이터 반환");
      return defaultSports;
    }
    
    const sportsDoc = await getDoc(doc(db, "settings", "sports"));
    console.log("📄 Firebase 문서 존재 여부:", sportsDoc.exists());

    let sportsData;
    if (sportsDoc.exists()) {
      sportsData = sportsDoc.data().list || [];
      console.log("✅ Firebase에서 로드한 종목 수:", sportsData.length);
      
      // 데이터가 비어있으면 기본 데이터 사용
      if (sportsData.length === 0) {
        console.warn("⚠️ Firebase에 종목 데이터가 없습니다. 기본 데이터로 초기화합니다.");
        sportsData = defaultSports;
        await setDoc(doc(db, "settings", "sports"), { list: sportsData });
        console.log("✅ Firebase에 기본 종목 데이터 저장 완료");
      }
    } else {
      console.log("📝 Firebase에 문서가 없습니다. 기본 데이터로 초기화합니다.");
      sportsData = defaultSports;
      await setDoc(doc(db, "settings", "sports"), { list: sportsData });
      console.log("✅ Firebase에 기본 종목 데이터 저장 완료");
    }

    console.log("✅ 최종 반환 종목 수:", sportsData.length);
    return sportsData;
  } catch (error) {
    console.error("❌ Firebase에서 종목 로드 실패:", error);
    console.log("⚠️ 오류 발생으로 기본 종목 데이터 반환");
    return defaultSports;
  }
}

// 운동 종목별 강사 수 업데이트
export async function updateSportCounts(sportsData) {
  const instructorsSnapshot = await getDocs(collection(db, "instructors"));
  const sportCounts = {};

  instructorsSnapshot.forEach((doc) => {
    const sport = doc.data().sport;
    sportCounts[sport] = (sportCounts[sport] || 0) + 1;
  });

  sportsData.forEach((sport) => {
    sport.count = sportCounts[sport.name] || 0;
  });

  await setDoc(doc(db, "settings", "sports"), { list: sportsData });

  return sportsData;
}

// 종목 이름에 맞는 이모지 자동 매칭
export function getEmojiForSport(sportName, category) {
  // ✅ 안전 체크 추가!
  if (!sportName) return "🏃";

  const emojiMap = {
    // 구기 종목
    테니스: "🎾",
    배드민턴: "🏸",
    탁구: "🏓",
    골프: "⛳",
    축구: "⚽",
    농구: "🏀",
    배구: "🏐",
    야구: "⚾",
    풋살: "⚽",
    스쿼시: "🟨",
    라켓볼: "🔴",
    핸드볼: "🤾",
    럭비: "🏉",
    미식축구: "🏈",
    당구: "🎱",
    포켓볼: "🎱",
    볼링: "🎳",
    비치발리볼: "🏖️",
    소프트볼: "🥎",
    크리켓: "🏏",
    하키: "🏑",
    필드하키: "🏑",

    // 수상 종목
    수영: "🏊",
    서핑: "🏄",
    카약: "🛶",
    다이빙: "🤿",
    수상스키: "🎿",
    윈드서핑: "🏄",
    요트: "⛵",
    조정: "🚣",
    싱크로나이즈: "🏊",
    아쿠아로빅: "🏊",

    // 피트니스
    헬스: "💪",
    피트니스: "💪",
    "헬스/피트니스": "💪",
    웨이트: "🏋️",
    웨이트트레이닝: "🏋️",
    요가: "🧘",
    필라테스: "🤸",
    크로스핏: "⚡",
    줌바: "💃",
    스피닝: "🚴",
    실내사이클: "🚴",
    에어로빅: "🤾",
    스트레칭: "🧘",
    바디펌프: "🏋️",
    바디컴뱃: "🥊",
    바디밸런스: "🧘",
    런닝: "🏃",
    조깅: "🏃",
    마라톤: "🏃",
    사이클: "🚴",
    자전거: "🚴",
    트레드밀: "🏃",
    기능성운동: "⚡",
    TRX: "🔗",
    케틀벨: "⚫",
    플랭크: "⏱️",

    // 무술/격투기
    복싱: "🥊",
    태권도: "🥋",
    주짓수: "🤼",
    유도: "🥋",
    검도: "⚔️",
    mma: "🥊",
    MMA: "🥊",
    킥복싱: "🦵",
    합기도: "🥋",
    카포에라: "🤸",
    무에타이: "🥊",
    가라테: "🥋",
    쿵푸: "🥋",
    펜싱: "🤺",
    우슈: "🥋",

    // 익스트림
    클라이밍: "🧗",
    암벽등반: "🧗",
    등산: "🥾",
    트레킹: "🥾",
    스케이트보드: "🛹",
    인라인: "⛸️",
    스키: "⛷️",
    스노보드: "🏂",
    패러글라이딩: "🪂",
    번지점프: "🪂",
    스카이다이빙: "🪂",
    행글라이딩: "🪂",
    bmx: "🚴",
    BMX: "🚴",
    서바이벌: "🏹",
    사격: "🎯",
    양궁: "🏹",

    // 댄스
    발레: "🩰",
    방송댄스: "🎤",
    힙합댄스: "🎧",
    힙합: "🎧",
    라틴댄스: "🌹",
    라틴: "🌹",
    스트릿댄스: "🧢",
    스트릿: "🧢",
    재즈댄스: "🎷",
    재즈: "🎷",
    왈츠: "👗",
    탱고: "🔥",
    살사: "🌶️",
    벨리댄스: "💎",
    폴댄스: "💪",
    현대무용: "🎭",
    한국무용: "🏯",
    브레이크댄스: "🔄",
    브레이킹: "🔄",
    kpop: "⭐",
    "K-POP": "⭐",
    케이팝: "⭐",
    댄스스포츠: "👠",
    사교댄스: "👫",
    플라멩코: "👠",
    스윙댄스: "🎩",
    탭댄스: "👞",

    // 기타
    승마: "🏇",
    체조: "🤸",
    리듬체조: "🎀",
    피겨: "⛸️",
    피겨스케이팅: "⛸️",
    스피드스케이팅: "⛸️",
    쇼트트랙: "⛸️",
    컬링: "🥌",
    아이스하키: "🏒",
    배틀: "🏆",
    치어리딩: "📣",
    트램폴린: "🔵",
    아크로바틱: "🎪",
    저글링: "🤹",
    슬랙라인: "➰",
    파쿠르: "🏃",
    프리러닝: "🏃",
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

  // ✅ 카테고리별 기본 이모지 추가!
  const categoryDefaults = {
    ball: "⚽",
    water: "🏊",
    fitness: "💪",
    martial: "🥊",
    extreme: "🧗",
    dance: "💃",
  };

  return categoryDefaults[category] || "🏃";
}

// ✅ 새 운동 종목 추가 - 완전히 수정됨!
export async function addNewSport(name, category, icon) {
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

  return sportsData;
}
