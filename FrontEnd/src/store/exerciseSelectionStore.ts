import { create } from "zustand";

export type SelectedLibraryExercise = {
  id: string;
  // Nom anglais du catalogue : c'est lui qui est enregistré dans le programme.
  name: string;
  // Nom à afficher (français s'il existe).
  displayName: string;
  gifUrl: string;
};

type ExerciseSelectionState = {
  selected: SelectedLibraryExercise | null;
  setSelected: (exercise: SelectedLibraryExercise) => void;
  clear: () => void;
};

export const useExerciseSelectionStore = create<ExerciseSelectionState>((set) => ({
  selected: null,
  setSelected: (exercise) => set({ selected: exercise }),
  clear: () => set({ selected: null }),
}));
