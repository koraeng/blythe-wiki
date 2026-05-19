import { pickLocalized, useLocale } from "@/hooks/use-locale";
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
  name_kr: string;
  face_color_kr: string;
  hair_color_kr: string;
  hairstyle_kr: string;
  eye_color_kr: string;
  release_date_kr: string;
  price_kr: string;
  description_kr: string;
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
  const { t, locale } = useLocale();

  const displayName = pickLocalized(params, "name", locale) as string;
  const displayFaceColor = pickLocalized(params, "face_color", locale) as string;
  const displayHairColor = pickLocalized(params, "hair_color", locale) as string;
  const displayHairstyle = pickLocalized(params, "hairstyle", locale) as string;
  const displayEyeColor = pickLocalized(params, "eye_color", locale) as string;
  const displayPrice = pickLocalized(params, "price", locale) as string;
  const displayDescription = pickLocalized(params, "description", locale) as string;
  const displayReleaseDate = pickLocalized(params, "release_date", locale) as string;

  const month = Number(params.release_month) || 0;
  const year = Number(params.release_year) || 0;
  const dateLabel =
    displayReleaseDate || (month && year ? `${MONTHS[month]} ${year}` : "");

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName || t.detail,
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
            <Text>{t.noImage}</Text>
          </View>
        )}

        <Text style={styles.name}>{displayName}</Text>

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
          <Text style={styles.sectionTitle}>{t.specs}</Text>
          <InfoRow label={t.faceColor} value={displayFaceColor} />
          <InfoRow label={t.hairColor} value={displayHairColor} />
          <InfoRow label={t.hairstyle} value={displayHairstyle} />
          <InfoRow label={t.eyeColor} value={displayEyeColor} />
          <InfoRow label={t.price} value={displayPrice} />
        </View>

        {displayDescription ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t.description}</Text>
            <Text style={styles.description}>{displayDescription}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>{t.backToList}</Text>
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
