import AsyncStorage from "@react-native-async-storage/async-storage";

// Petit état "séance en cours" gardé en local pour pouvoir reprendre la séance
// si l'appli est fermée avant "Terminer la séance". Les séries elles-mêmes sont
// déjà enregistrées côté API : ici on ne garde que de quoi retrouver sa place.

export type QueueExercise = {
  id: string;
  name: string;
  targetSets: number;
  targetReps?: number;
  restDuration: number;
  gifUrl?: string | null;
  libraryId?: string | null;
  bodyParts?: string[];
};

export type ActiveWorkout = {
  sessionId: string;
  programId: string;
  dayId: string;
  dayName: string;
  queue: QueueExercise[];
  // Prochaine série à faire. exerciseIndex === queue.length : toutes les séries sont faites.
  exerciseIndex: number;
  setIndex: number;
};

const STORAGE_KEY = "activeWorkout";

export async function loadActiveWorkout(): Promise<ActiveWorkout | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? (JSON.parse(json) as ActiveWorkout) : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function saveActiveWorkout(workout: ActiveWorkout) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workout));
  } catch (error) {
    console.error(error);
  }
}

export async function clearActiveWorkout() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(error);
  }
}
