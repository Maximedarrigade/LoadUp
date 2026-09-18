import { useCallback, useEffect, useState } from "react";
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
import ExerciseGif from "@/components/ExerciseGif";

export default function ExerciseLibraryScreen() {
  const setSelected = useExerciseSelectionStore((state) => state.setSelected);

  const [search, setSearch] = useState("");
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [activeBodyPart, setActiveBodyPart] = useState<string | null>(null);
  const [exercises, setExercises] = useState<LibraryExercise[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    getExerciseLibraryBodyParts()
      .then(setBodyParts)
      .catch((error) => console.error(error));
  }, []);

  const loadExercises = useCallback(async (searchValue: string, bodyPart: string | null) => {
    setLoading(true);
    try {
      const result = await getExerciseLibrary({
        search: searchValue || undefined,
        bodyPart: bodyPart || undefined,
      });
      setExercises(result.data);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
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
    setLoadingMore(true);
    try {
      const result = await getExerciseLibrary({
        search: search || undefined,
        bodyPart: activeBodyPart || undefined,
        cursor: nextCursor,
      });
      setExercises((prev) => [...prev, ...result.data]);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleSelect(exercise: LibraryExercise) {
    setSelected({ id: exercise.id, name: exercise.name, gifUrl: exercise.gifUrl });
    router.back();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalogue d'exercices</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher un exercice..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#888"
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
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10, marginTop: 12 }}
          onEndReachedThreshold={0.4}
          onEndReached={handleLoadMore}
          ListEmptyComponent={<Text style={styles.empty}>Aucun exercice trouvé.</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleSelect(item)}>
              <ExerciseGif gifUrl={item.gifUrl} size={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardMeta}>
                  {item.bodyParts.join(", ")}
                  {item.equipments.length ? ` — ${item.equipments.join(", ")}` : ""}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#000",
  },
  filtersWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  filterChip: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#000",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 10,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cardMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    textTransform: "capitalize",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});
