import { createContext, ReactNode, useContext, useState } from "react";

export type Locale = "en" | "kr";

const TRANSLATIONS = {
  en: {
    searchPlaceholder: "🔍 Search name · face type · release...",
    loadingDolls: "Loading dolls...",
    filterYear: "📅 Year",
    filterFaceType: "🎭 Face Type",
    filterSkin: "🧴 Skin (multi-select)",
    filterHair: "💇 Hair (multi-select)",
    all: "All",
    reset: "Reset",
    resultCount: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
    noImage: "No Image",
    specs: "Specs",
    description: "Description",
    faceColor: "Face Color",
    hairColor: "Hair Color",
    hairstyle: "Hairstyle",
    eyeColor: "Eye Color",
    price: "Price",
    backToList: "← Back to list",
    detail: "Detail",
  },
  kr: {
    searchPlaceholder: "🔍 이름 · Face Type · 출시년월 검색...",
    loadingDolls: "인형 불러오는 중...",
    filterYear: "📅 출시년도",
    filterFaceType: "🎭 Face Type",
    filterSkin: "🧴 피부톤 (다중 선택)",
    filterHair: "💇 머리색 (다중 선택)",
    all: "전체",
    reset: "초기화",
    resultCount: (n: number) => `${n}개`,
    noImage: "이미지 없음",
    specs: "스펙",
    description: "설명",
    faceColor: "얼굴색",
    hairColor: "머리색",
    hairstyle: "헤어스타일",
    eyeColor: "눈색",
    price: "가격",
    backToList: "← 목록으로",
    detail: "상세",
  },
} as const;

const SKIN_LABEL_KR: Record<string, string> = {
  Fair: "페어",
  Cream: "크림",
  Snow: "스노우",
  Tan: "탠",
  Other: "기타",
};

const HAIR_LABEL_KR: Record<string, string> = {
  Blonde: "금발",
  Yellow: "노랑",
  Brown: "갈색",
  Black: "흑발",
  Red: "적발",
  Pink: "분홍",
  Purple: "보라",
  Blue: "파랑",
  Green: "초록",
  "Gray/White": "백발",
  Other: "기타",
};

export function translateSkinBucket(label: string, locale: Locale): string {
  return locale === "kr" ? SKIN_LABEL_KR[label] ?? label : label;
}

/**
 * 데이터 객체에서 locale에 맞는 필드 값을 반환.
 * locale='kr'이면 `${field}_kr`을 우선 사용, 없으면 영문 필드로 폴백.
 */
export function pickLocalized<
  T extends Record<string, any>,
  K extends keyof T & string,
>(data: T, field: K, locale: Locale): T[K] | string {
  if (locale === "kr") {
    const krField = `${field}_kr` as keyof T;
    const krValue = data[krField];
    if (typeof krValue === "string" && krValue.length > 0) {
      return krValue as T[K];
    }
  }
  return (data[field] ?? "") as T[K];
}

export function translateHairBucket(label: string, locale: Locale): string {
  return locale === "kr" ? HAIR_LABEL_KR[label] ?? label : label;
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof TRANSLATIONS)["en"];
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
  t: TRANSLATIONS.en,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: TRANSLATIONS[locale] }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
