import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import {
  getExerciseLibrary,
  getExerciseLibraryBodyParts,
  LibraryExercise,
} from "@/api/exerciseLibrary";
import { useExerciseSelectionStore } from "@/store/exerciseSelectionStore";
import ExerciseThumbnail from "@/components/ExerciseThumbnail";
import { Colors, FontFamily, Radius } from "@/theme";

// La liste n'affiche que des miniatures statiques (quelques Ko) : un GIF animé pèse
// ~2 Mo décodé, et en monter des dizaines pendant le scroll saturait Safari iOS.
// Le GIF animé n'est affiché qu'une fois l'exercice choisi.
const ExerciseRow = memo(function ExerciseRow({
  item,
  onSelect,
}: {
  item: LibraryExercise;
  onSelect: (exercise: LibraryExercise) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onSelect(item)}>
      <ExerciseThumbnail exerciseId={item.id} gifUrl={item.gifUrl} size={56} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardMeta}>
          {item.bodyParts.join(", ")}
          {item.equipments.length ? ` — ${item.equipments.join(", ")}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default function ExerciseLibraryScreen() {
  const setSelected = useExerciseSelectionStore((state) => state.setSelected);

  const [search, setSearch] = useState("");
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const hasSelectedRef = useRef(false);

  useEffect(() => {
    getExerciseLibraryBodyParts()
      .then(setBodyParts)
      .catch((error) => console.error(error));
  }, []);

  const loadExercises = useCallback(async (searchValue: string, bodyPart: string | null) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const result = await getExerciseLibrary({
        search: searchValue || undefined,
        bodyPart: bodyPart || undefined,
      });
      // Ignore une réponse périmée (recherche modifiée entre-temps).
      if (requestId !== requestIdRef.current) return;
      setExercises(result.data);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadExercises(search, activeBodyPart);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, activeBodyPart, loadExercises]);

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    const requestId = requestIdRef.current;
    setLoadingMore(true);
    try {
      const result = await getExerciseLibrary({
        search: search || undefined,
        bodyPart: activeBodyPart || undefined,
        cursor: nextCursor,
      });
      if (requestId !== requestIdRef.current) return;
      setExercises((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  const handleSelect = useCallback((exercise: LibraryExercise) => {
    // Un double-tap déclencherait deux router.back() et quitterait aussi l'écran parent.
    if (hasSelectedRef.current) return;
    hasSelectedRef.current = true;
    setSelected({ id: exercise.id, name: exercise.name, gifUrl: exercise.gifUrl });
    router.back();
  }, [setSelected]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalogue d'exercices</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un exercice..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor={Colors.muted}
      />

      <View style={styles.filtersWrap}>
        {bodyParts.map((item) => {
          const isActive = activeBodyPart === item;
          return (
            <TouchableOpacity
              key={item}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveBodyPart(isActive ? null : item)}
            >
              <Text
                style={[styles.filterChipText, isActive && styles.filterChipTextActive]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10, marginTop: 12 }}
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListEmptyComponent={<Text style={styles.empty}>Aucun exercice trouvé.</Text>}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator color={Colors.accent} style={{ marginTop: 12 }} /> : null
          }
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews
          renderItem={({ item }) => <ExerciseRow item={item} onSelect={handleSelect} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    backgroundColor: Colors.bg,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    textTransform: "uppercase",
    color: Colors.ink,
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 12,
    fontFamily: FontFamily.body,
    fontSize: 16,
    color: Colors.ink,
    backgroundColor: Colors.surface,
  },
  filtersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.ink,
    textTransform: "capitalize",
  },
  filterChipTextActive: {
    color: Colors.bg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius,
    padding: 10,
  },
  cardName: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.ink,
    textTransform: "capitalize",
  },
  cardMeta: {
    fontFamily: FontFamily.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    textTransform: "capitalize",
  },
  empty: {
    fontFamily: FontFamily.body,
    textAlign: "center",
    color: Colors.muted,
    marginTop: 20,
  },
});
