// Nom affiché d'un exercice : le nom français du catalogue s'il existe, sinon le nom stocké.

type LibraryName = { name: string; nameFr?: string | null };

export function libraryExerciseName(exercise: LibraryName) {
  return exercise.nameFr || exercise.name;
}

// Un exercice de programme garde une copie du nom anglais du catalogue. Tant que cette
// copie n'a pas été renommée par l'utilisateur, on affiche la traduction du catalogue.
export function programExerciseName(exercise: {
  name: string;
  exerciseLibrary?: LibraryName | null;
}) {
  const library = exercise.exerciseLibrary;
  if (library?.nameFr && exercise.name === library.name) return library.nameFr;
  return exercise.name;
}
