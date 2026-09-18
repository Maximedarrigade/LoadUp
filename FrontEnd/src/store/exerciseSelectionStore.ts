import { create } from "zustand";

export type SelectedLibraryExercise = {
  id: string;
  name: string;
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
