// ============================================================
// 검색 분석 및 인기 검색어 관리
// ============================================================
import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 검색 기록 저장
export async function logSearch(searchTerm, userId = null) {
  if (!searchTerm || searchTerm.trim() === "") return;
  
  try {
    await addDoc(collection(db, "searchLogs"), {
      searchTerm: searchTerm.trim(),
      userId: userId,
      timestamp: new Date().toISOString(),
    });
    
    console.log(`✅ 검색 기록 저장: "${searchTerm}"`);
  } catch (error) {
    console.error("검색 기록 저장 실패:", error);
  }
}

// 인기 검색어 가져오기 (최근 7일 기준)
export async function getPopularSearches(limitCount = 4) {
  try {
    // ✅ 모든 검색 기록 가져오기 (실시간 반영)
    const q = query(collection(db, "searchLogs"));
    
    const querySnapshot = await getDocs(q);
    
    // 7일 전 날짜 계산
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // 검색어별 카운트
    const searchCounts = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const term = data.searchTerm;
      const timestamp = new Date(data.timestamp);
      
      // 최근 7일 내 데이터만 포함
      if (term && timestamp >= sevenDaysAgo) {
        searchCounts[term] = (searchCounts[term] || 0) + 1;
      }
    });
    
    console.log("📊 검색어 통계:", searchCounts);
    
    // 검색 횟수 기준으로 정렬
    const sortedSearches = Object.entries(searchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([term, count]) => ({ term, count }));
    
    // 검색 기록이 없으면 기본값 반환
    if (sortedSearches.length === 0) {
      return [
        { term: "요가", count: 0 },
        { term: "필라테스", count: 0 },
        { term: "수영", count: 0 },
        { term: "테니스", count: 0 },
      ];
    }
    
    // 부족한 경우 기본값으로 채우기
    const defaultTerms = ["요가", "필라테스", "수영", "테니스"];
    while (sortedSearches.length < limitCount) {
      const nextDefault = defaultTerms[sortedSearches.length];
      if (!sortedSearches.find(s => s.term === nextDefault)) {
        sortedSearches.push({ term: nextDefault, count: 0 });
      } else {
        break;
      }
    }
    
    return sortedSearches;
  } catch (error) {
    console.error("인기 검색어 로드 실패:", error);
    // 에러 시 기본값 반환
    return [
      { term: "요가", count: 0 },
      { term: "필라테스", count: 0 },
      { term: "수영", count: 0 },
      { term: "테니스", count: 0 },
    ];
  }
}

// 실시간 인기 검색어 (최근 1시간)
export async function getTrendingSearches(limitCount = 4) {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const q = query(
      collection(db, "searchLogs"),
      where("timestamp", ">=", oneHourAgo.toISOString())
    );
    
    const querySnapshot = await getDocs(q);
    
    const searchCounts = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const term = data.searchTerm;
      
      if (term) {
        searchCounts[term] = (searchCounts[term] || 0) + 1;
      }
    });
    
    const sortedSearches = Object.entries(searchCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitCount)
      .map(([term, count]) => ({ term, count }));
    
    return sortedSearches;
  } catch (error) {
    console.error("실시간 검색어 로드 실패:", error);
    return [];
  }
}
