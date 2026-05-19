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
  { label: "Mocha", keywords: ["mocha", "latte", "tan"] },
  { label: "Chocolate", keywords: ["chocolate", "choco", "brown skin"] },
];

const HAIR_BUCKETS: { label: string; keywords: string[] }[] = [
  { label: "Blonde", keywords: ["blonde", "blond"] },
  { label: "Brown", keywords: ["brown", "auburn"] },
  { label: "Black", keywords: ["black"] },
  { label: "Red", keywords: ["red", "orange"] },
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
    return [
      ...SKIN_BUCKETS.filter((b) => present.has(b.label)).map((b) => b.label),
      ...(present.has("Other") ? ["Other"] : []),
    ];
  }, [dolls]);

  const availableHairBuckets = useMemo(() => {
    const present = new Set<string>();
    dolls.forEach((d) =>
      classifyAll(d.hair_color, HAIR_BUCKETS).forEach((b) => present.add(b)),
    );
    return [
      ...HAIR_BUCKETS.filter((b) => present.has(b.label)).map((b) => b.label),
      ...(present.has("Other") ? ["Other"] : []),
    ];
  }, [dolls]);

  const normalizedSearch = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return dolls.filter((d) => {
      const matchSearch =
        normalizedSearch === ""
          ? true
          : [d.name, d.face_type, String(d.release_year), MONTHS[d.release_month]]
              .filter(Boolean)
              .some((field) => field.toLowerCase().includes(normalizedSearch));
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
        <Text style={styles.loadingText}>인형 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색창 */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 이름 · Face Type · 출시년월 검색..."
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
          <Text style={styles.filterLabel}>📅 출시년도</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedYear}
              onValueChange={(val) => setSelectedYear(val)}
              style={styles.picker}
            >
              <Picker.Item label="전체" value="all" />
              {years.map((y) => (
                <Picker.Item key={y} label={String(y)} value={String(y)} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerWrap}>
          <Text style={styles.filterLabel}>🎭 Face Type</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={selectedFaceType}
              onValueChange={(val) => setSelectedFaceType(val)}
              style={styles.picker}
            >
              <Picker.Item label="전체" value="all" />
              {faceTypes.map((ft) => (
                <Picker.Item key={ft} label={ft} value={ft} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.chipSection}>
        <View style={styles.chipHeader}>
          <Text style={styles.filterLabel}>🧴 Skin (다중 선택)</Text>
          {selectedSkins.length > 0 && (
            <Pressable onPress={() => setSelectedSkins([])} hitSlop={6}>
              <Text style={styles.chipReset}>초기화</Text>
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
                  {b}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.chipSection}>
        <View style={styles.chipHeader}>
          <Text style={styles.filterLabel}>💇 Hair (다중 선택)</Text>
          {selectedHairs.length > 0 && (
            <Pressable onPress={() => setSelectedHairs([])} hitSlop={6}>
              <Text style={styles.chipReset}>초기화</Text>
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
                  {b}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 결과 수 */}
      <Text style={styles.resultCount}>{filtered.length}개</Text>

      {/* 인형 리스트 */}
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.list}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        renderItem={({ item }) => (
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
                <Text>No Image</Text>
              </View>
            )}
            <View style={styles.info}>
              <HighlightedText
                text={item.name}
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
        )}
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
    overflow: "hidden",
  },
  picker: {
    height: 44,
    color: "#333",
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
