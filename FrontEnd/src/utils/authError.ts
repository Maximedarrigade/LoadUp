// Message à afficher pour une erreur d'appel aux routes d'authentification.

type Options = {
  /** Message pour un 401 (identifiants refusés). */
  unauthorized?: string;
  /** Message si le serveur ne donne pas d'explication. */
  fallback: string;
};

function retryDelay(seconds: number) {
  if (seconds < 60) return "moins d'une minute";
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

export function authErrorMessage(err: any, { unauthorized, fallback }: Options) {
  const response = err?.response;
  // Pas de réponse : serveur injoignable, coupure réseau ou requête bloquée.
  if (!response) return "Impossible de joindre le serveur. Vérifie ta connexion et réessaie.";

  const data = response.data ?? {};
  if (response.status === 429) {
    const seconds = Number(data.retryAfterSeconds);
    return Number.isFinite(seconds) && seconds > 0
      ? `Trop de tentatives. Réessaie dans ${retryDelay(seconds)}.`
      : data.error || "Trop de tentatives. Réessaie dans quelques minutes.";
  }
  if (response.status === 401 && unauthorized) return unauthorized;
  if (response.status >= 500) return "Le serveur a rencontré un problème. Réessaie dans un instant.";
  return typeof data.error === "string" && data.error ? data.error : fallback;
}
