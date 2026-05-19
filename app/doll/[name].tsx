import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

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

type DollParams = {
  name: string;
  image: string;
  release_year: string;
  release_month: string;
  face_type: string;
  face_color: string;
  hair_color: string;
  hairstyle: string;
  eye_color: string;
  release_date: string;
  price: string;
  description: string;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function DollDetailScreen() {
  const params = useLocalSearchParams<DollParams>();
  const router = useRouter();

  const month = Number(params.release_month) || 0;
  const year = Number(params.release_year) || 0;
  const dateLabel =
    params.release_date || (month && year ? `${MONTHS[month]} ${year}` : "");

  return (
    <>
      <Stack.Screen
        options={{
          title: params.name || "Detail",
          headerTitleStyle: { fontSize: 14 },
          headerStyle: { backgroundColor: "#fff9fb" },
          headerTintColor: "#d63384",
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {params.image ? (
          <Image
            source={{ uri: params.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text>No Image</Text>
          </View>
        )}

        <Text style={styles.name}>{params.name}</Text>

        <View style={styles.badgeRow}>
          {dateLabel ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{dateLabel}</Text>
            </View>
          ) : null}
          {params.face_type ? (
            <View style={[styles.badge, styles.badgeAlt]}>
              <Text style={styles.badgeTextAlt}>{params.face_type}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Specs</Text>
          <InfoRow label="Face Color" value={params.face_color} />
          <InfoRow label="Hair Color" value={params.hair_color} />
          <InfoRow label="Hairstyle" value={params.hairstyle} />
          <InfoRow label="Eye Color" value={params.eye_color} />
          <InfoRow label="Price" value={params.price} />
        </View>

        {params.description ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{params.description}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← 목록으로</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff9fb",
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  noImage: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eee",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  badge: {
    backgroundColor: "#ffe2ec",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeAlt: {
    backgroundColor: "#d63384",
  },
  badgeText: {
    color: "#d63384",
    fontSize: 12,
    fontWeight: "600",
  },
  badgeTextAlt: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#d63384",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0d0da",
  },
  rowLabel: {
    width: 90,
    fontSize: 12,
    fontWeight: "600",
    color: "#aaa",
  },
  rowValue: {
    flex: 1,
    fontSize: 13,
    color: "#333",
  },
  description: {
    fontSize: 12,
    color: "#555",
    lineHeight: 18,
  },
  backButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0d0da",
  },
  backButtonText: {
    color: "#d63384",
    fontSize: 13,
    fontWeight: "600",
  },
});
