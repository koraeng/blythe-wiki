import {
  pickLocalized,
  translateHairBucket,
  translateSkinBucket,
  useLocale,
} from "@/hooks/use-locale";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image"; // ← 이거 추가
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

//const API_URL = "http://172.30.1.66:8000/dolls";

const API_URL =
  Platform.OS === "web"
    ? "http://localhost:8000/dolls"
    : "http://172.30.1.66:8000/dolls";

type Doll = {
  name: string;
  image: string;
  release_year: number;
  release_month: number;
  face_type: string;
  face_color?: string;
  hair_color?: string;
  hairstyle?: string;
  eye_color?: string;
  release_date?: string;
  price?: string;
  description?: string;
  name_kr?: string;
  face_color_kr?: string;
  hair_color_kr?: string;
  hairstyle_kr?: string;
  eye_color_kr?: string;
  release_date_kr?: string;
  price_kr?: string;
  description_kr?: string;
};

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const SKIN_BUCKETS: { label: string; keywords: string[] }[] = [
  { label: "Fair", keywords: ["fair", "natural"] },
  { label: "Cream", keywords: ["cream"] },
  { label: "Snow", keywords: ["snow"] },
  {
    label: "Tan",
    keywords: ["mocha", "latte", "tan", "chocolate", "choco", "brown skin"],
  },
];

const HAIR_BUCKETS: { label: string; keywords: string[] }[] = [
  { label: "Blonde", keywords: ["blonde", "blond"] },
  { label: "Yellow", keywords: ["yellow", "honey", "lemon", "gold"] },
  { label: "Brown", keywords: ["brown", "auburn"] },
  { label: "Black", keywords: ["black"] },
  { label: "Red", keywords: ["red", "orange", "burgundy"] },
  { label: "Pink", keywords: ["pink"] },
  { label: "Purple", keywords: ["purple", "purplish", "violet", "lavender", "mauve"] },
  { label: "Blue", keywords: ["blue"] },
  { label: "Green", keywords: ["green", "olive"] },
  { label: "Gray/White", keywords: ["gray", "grey", "white", "silver", "ash"] },
];

function classify(
  value: string | undefined,
  buckets: { label: string; keywords: string[] }[],
): string {
  if (!value) return "";
  const lower = value.toLowerCase();
  for (const bucket of buckets) {
    if (bucket.keywords.some((k) => lower.includes(k))) return bucket.label;
  }
  return "Other";
}

function classifyAll(
  value: string | undefined,
  buckets: { label: string; keywords: string[] }[],
): string[] {
  if (!value) return [];
  const lower = value.toLowerCase();
  const matched = buckets
    .filter((b) => b.keywords.some((k) => lower.includes(k)))
    .map((b) => b.label);
  return matched.length > 0 ? matched : ["Other"];
}

function HighlightedText({
  text,
  query,
  style,
}: {
  text: string;
  query: string;
  style: any;
}) {
  if (!query) return <Text style={style}>{text}</Text>;
  const lower = text.toLowerCase();
  const parts: { value: string; matched: boolean }[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    const idx = lower.indexOf(query, cursor);
    if (idx === -1) {
      parts.push({ value: text.slice(cursor), matched: false });
      break;
    }
    if (idx > cursor) {
      parts.push({ value: text.slice(cursor, idx), matched: false });
    }
    parts.push({ value: text.slice(idx, idx + query.length), matched: true });
    cursor = idx + query.length;
  }
  return (
    <Text style={style}>
      {parts.map((p, i) =>
        p.matched ? (
          <Text key={i} style={styles.highlight}>
            {p.value}
          </Text>
        ) : (
          p.value
        ),
      )}
    </Text>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [dolls, setDolls] = useState<Doll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedFaceType, setSelectedFaceType] = useState<string>("all");
  const [selectedSkins, setSelectedSkins] = useState<string[]>([]);
  const [selectedHairs, setSelectedHairs] = useState<string[]>([]);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    b: string,
  ) => {
    setter((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b],
    );
  };

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => {
        setDolls(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const years = [...new Set(dolls.map((d) => d.release_year))].sort(
    (a, b) => b - a,
  );
  const faceTypes = [
    ...new Set(dolls.map((d) => d.face_type).filter(Boolean)),
  ].sort();

  const availableSkinBuckets = useMemo(() => {
    const present = new Set<string>();
    dolls.forEach((d) =>
      classifyAll(d.face_color, SKIN_BUCKETS).forEach((b) => present.add(b)),
    );
    return [...present].sort((a, b) => a.localeCompare(b));
  }, [dolls]);

  const availableHairBuckets = useMemo(() => {
    const present = new Set<string>();
    dolls.forEach((d) =>
      classifyAll(d.hair_color, HAIR_BUCKETS).forEach((b) => present.add(b)),
    );
    return [...present].sort((a, b) => a.localeCompare(b));
  }, [dolls]);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return dolls.filter((d) => {
      const matchSearch =
        normalizedSearch === ""
          ? true
          : [
              d.name,
              d.name_kr,
              d.face_type,
              String(d.release_year),
              MONTHS[d.release_month],
            ]
              .filter(Boolean)
              .some((field) =>
                (field as string).toLowerCase().includes(normalizedSearch),
              );
      const matchYear =
        selectedYear === "all" ? true : d.release_year === Number(selectedYear);
      const matchFace =
        selectedFaceType === "all" ? true : d.face_type === selectedFaceType;
      const matchSkin =
        selectedSkins.length === 0
          ? true
          : classifyAll(d.face_color, SKIN_BUCKETS).some((b) =>
              selectedSkins.includes(b),
            );
      const matchHair =
        selectedHairs.length === 0
          ? true
          : classifyAll(d.hair_color, HAIR_BUCKETS).some((b) =>
              selectedHairs.includes(b),
            );
      return matchSearch && matchYear && matchFace && matchSkin && matchHair;
    });
  }, [
    dolls,
    normalizedSearch,
    selectedYear,
    selectedFaceType,
    selectedSkins,
    selectedHairs,
  ]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff8fab" />
        <Text style={styles.loadingText}>{t.loadingDolls}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 언어 토글 */}
      <Pressable
        style={styles.localeToggle}
        onPress={() => setLocale(locale === "en" ? "kr" : "en")}
        hitSlop={8}
      >
        <Text style={styles.localeToggleText}>
          {locale === "en" ? "🇰🇷 KR" : "🇺🇸 EN"}
        </Text>
      </Pressable>

      {/* 검색창 */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#bbb"
        />
        {search.length > 0 && (
          <Pressable
            onPress={() => setSearch("")}
            style={styles.clearButton}
            hitSlop={8}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* 필터 */}
      <View style={styles.filterRow}>
        <View style={styles.pickerWrap}>
          <Text style={styles.filterLabel}>{t.filterYear}</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(val) => setSelectedYear(val)}
              style={styles.picker}
            >
              <Picker.Item label={t.all} value="all" />
              {years.map((y) => (
                <Picker.Item key={y} label={String(y)} value={String(y)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerWrap}>
          <Text style={styles.filterLabel}>{t.filterFaceType}</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedFaceType}
              onValueChange={(val) => setSelectedFaceType(val)}
              style={styles.picker}
            >
              <Picker.Item label={t.all} value="all" />
              {faceTypes.map((ft) => (
                <Picker.Item key={ft} label={ft} value={ft} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.chipSection}>
        <View style={styles.chipHeader}>
          <Text style={styles.filterLabel}>{t.filterSkin}</Text>
          {selectedSkins.length > 0 && (
            <Pressable onPress={() => setSelectedSkins([])} hitSlop={6}>
              <Text style={styles.chipReset}>{t.reset}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.chipRow}>
          {availableSkinBuckets.map((b) => {
            const active = selectedSkins.includes(b);
            return (
              <Pressable
                key={b}
                onPress={() => toggle(setSelectedSkins, b)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {translateSkinBucket(b, locale)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.chipSection}>
        <View style={styles.chipHeader}>
          <Text style={styles.filterLabel}>{t.filterHair}</Text>
          {selectedHairs.length > 0 && (
            <Pressable onPress={() => setSelectedHairs([])} hitSlop={6}>
              <Text style={styles.chipReset}>{t.reset}</Text>
            </Pressable>
          )}
        </View>
        <View style={styles.chipRow}>
          {availableHairBuckets.map((b) => {
            const active = selectedHairs.includes(b);
            return (
              <Pressable
                key={b}
                onPress={() => toggle(setSelectedHairs, b)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  style={[styles.chipText, active && styles.chipTextActive]}
                >
                  {translateHairBucket(b, locale)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 결과 수 */}
      <Text style={styles.resultCount}>{t.resultCount(filtered.length)}</Text>

      {/* 인형 리스트 */}
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={({ item }) => {
          const displayName = pickLocalized(item, "name", locale) as string;
          return (
            <Pressable
              style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: "/doll/[name]",
                  params: {
                    name: item.name,
                    image: item.image,
                    release_year: String(item.release_year),
                    release_month: String(item.release_month),
                    face_type: item.face_type,
                    face_color: item.face_color ?? "",
                    hair_color: item.hair_color ?? "",
                    hairstyle: item.hairstyle ?? "",
                    eye_color: item.eye_color ?? "",
                    release_date: item.release_date ?? "",
                    price: item.price ?? "",
                    description: item.description ?? "",
                    name_kr: item.name_kr ?? "",
                    face_color_kr: item.face_color_kr ?? "",
                    hair_color_kr: item.hair_color_kr ?? "",
                    hairstyle_kr: item.hairstyle_kr ?? "",
                    eye_color_kr: item.eye_color_kr ?? "",
                    release_date_kr: item.release_date_kr ?? "",
                    price_kr: item.price_kr ?? "",
                    description_kr: item.description_kr ?? "",
                  },
                })
              }
            >
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.image, styles.noImage]}>
                  <Text>{t.noImage}</Text>
                </View>
              )}
              <View style={styles.info}>
                <HighlightedText
                  text={displayName}
                  query={normalizedSearch}
                  style={styles.name}
                />
                <Text style={styles.date}>
                  {MONTHS[item.release_month]} {item.release_year}
                </Text>
                {item.face_type ? (
                  <HighlightedText
                    text={item.face_type}
                    query={normalizedSearch}
                    style={styles.faceType}
                  />
                ) : null}
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff9fb",
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  localeToggle: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0d0da",
  },
  localeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d63384",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#888",
    fontSize: 14,
  },
  searchWrap: {
    position: "relative",
    justifyContent: "center",
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 36,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#f0d0da",
    outlineStyle: "none",
    outlineWidth: 0,
  },
  clearButton: {
    position: "absolute",
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f0d0da",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 14,
    fontWeight: "700",
  },
  highlight: {
    backgroundColor: "#ffe2ec",
    color: "#d63384",
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  pickerWrap: {
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#d63384",
    marginBottom: 4,
  },
  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f0d0da",
        paddingLeft:10,
    paddingRight:10
  },
  picker: {
    height: 40,
    color: "#333",
    borderRadius: 0,
    borderColor: "#ffffff00",
    // @ts-expect-error web-only outline props for removing focus ring
    outlineStyle: "none",
    outlineWidth: 0,
  },
  resultCount: {
    fontSize: 12,
    color: "#aaa",
    marginBottom: 8,
  },
  chipSection: {
    marginBottom: 12,
  },
  chipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  chipReset: {
    fontSize: 12,
    color: "#d63384",
    fontWeight: "600",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0d0da",
  },
  chipActive: {
    backgroundColor: "#d63384",
    borderColor: "#d63384",
  },
  chipText: {
    fontSize: 12,
    color: "#d63384",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#fff",
  },
  list: {
    paddingBottom: 32,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  image: {
    width: 100,
    height: 100,
  },
  noImage: {
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#ff8fab",
    marginBottom: 4,
  },
  faceType: {
    fontSize: 11,
    color: "#aaa",
  },
});
