import "dotenv/config";
import prisma from "../lib/prisma";
import { decrypt, encryptDeterministic } from "../lib/crypto";

// Rotation de ENCRYPTION_KEY : rechiffre User.email de l'ancienne clé vers la nouvelle.
//
//   OLD_ENCRYPTION_KEY=... NEW_ENCRYPTION_KEY=... npm run rotate:encryption-key            (simulation)
//   OLD_ENCRYPTION_KEY=... NEW_ENCRYPTION_KEY=... npm run rotate:encryption-key -- --apply (écriture)
//
// - Sans --apply, rien n'est écrit : le script vérifie seulement que la migration est possible.
// - Avec --apply, toutes les lignes sont modifiées dans UNE transaction : tout ou rien.
// - Relançable : une ligne déjà chiffrée avec la nouvelle clé est ignorée.
// - Symétrique : pour annuler, relancer en échangeant OLD et NEW.
// - Les emails ne sont jamais affichés, uniquement des compteurs et des ids.
// Ne pas le lancer pendant que l'application tourne : elle écrirait avec l'ancienne clé.

const HEX_KEY = /^[0-9a-fA-F]{64}$/;

function readKey(name: string) {
  const value = process.env[name];
  if (!value || !HEX_KEY.test(value)) {
    console.error(`${name} manquante ou invalide (attendu : 64 caractères hexadécimaux).`);
    process.exit(1);
  }
  return value;
}

function canDecrypt(stored: string, key: string) {
  try {
    decrypt(stored, key);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const oldKey = readKey("OLD_ENCRYPTION_KEY");
  const newKey = readKey("NEW_ENCRYPTION_KEY");
  const apply = process.argv.includes("--apply");

  if (oldKey.toLowerCase() === newKey.toLowerCase()) {
    console.error("L'ancienne et la nouvelle clé sont identiques : rien à faire.");
    process.exit(1);
  }

  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  const toMigrate: { id: string; oldValue: string; newValue: string }[] = [];
  const failedIds: string[] = [];
  let alreadyMigrated = 0;
  let nonCanonical = 0;

  for (const user of users) {
    if (canDecrypt(user.email, oldKey)) {
      const plaintext = decrypt(user.email, oldKey);
      const newValue = encryptDeterministic(plaintext, newKey);

      if (decrypt(newValue, newKey) !== plaintext) {
        failedIds.push(user.id);
        continue;
      }
      // L'appli retrouve un utilisateur en recalculant le chiffré de son email : une valeur
      // qui ne se recalcule pas à l'identique n'était déjà pas retrouvable avant la rotation.
      if (encryptDeterministic(plaintext, oldKey) !== user.email) nonCanonical++;

      toMigrate.push({ id: user.id, oldValue: user.email, newValue });
    } else if (canDecrypt(user.email, newKey)) {
      alreadyMigrated++;
    } else {
      failedIds.push(user.id);
    }
  }

  const newValues = new Set(toMigrate.map((u) => u.newValue));

  console.log(`Utilisateurs en base            : ${users.length}`);
  console.log(`À migrer (ancienne clé OK)      : ${toMigrate.length}`);
  console.log(`Déjà migrés (nouvelle clé OK)   : ${alreadyMigrated}`);
  console.log(`Illisibles avec les 2 clés      : ${failedIds.length}`);
  if (nonCanonical > 0) {
    console.log(`Attention : ${nonCanonical} valeur(s) ne se recalculent pas à l'identique (déjà non retrouvables).`);
  }

  if (failedIds.length > 0) {
    console.error(`ABANDON : ces ids ne se déchiffrent avec aucune des deux clés : ${failedIds.join(", ")}`);
    console.error("Vérifier OLD_ENCRYPTION_KEY (clé actuellement dans le .env du serveur). Rien n'a été écrit.");
    process.exit(1);
  }
  if (newValues.size !== toMigrate.length) {
    console.error("ABANDON : deux emails donneraient le même chiffré. Rien n'a été écrit.");
    process.exit(1);
  }

  if (!apply) {
    console.log("\nSIMULATION : rien n'a été écrit. Relancer avec --apply pour migrer.");
    return;
  }
  if (toMigrate.length === 0) {
    console.log("\nRien à migrer.");
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      for (const { id, oldValue, newValue } of toMigrate) {
        // Ne modifie que si la ligne est encore telle que lue : sinon on annule tout.
        const result = await tx.user.updateMany({ where: { id, email: oldValue }, data: { email: newValue } });
        if (result.count !== 1) {
          throw new Error(`L'utilisateur ${id} a changé pendant la migration. Transaction annulée.`);
        }
      }

      // Relecture avant de valider : si un seul chiffré n'est pas lisible avec la nouvelle clé, rollback.
      const after = await tx.user.findMany({ select: { id: true, email: true } });
      const unreadable = after.filter((u) => !canDecrypt(u.email, newKey));
      if (unreadable.length > 0 || after.length !== users.length) {
        throw new Error("Vérification finale échouée. Transaction annulée.");
      }
    },
    { timeout: 120_000, maxWait: 10_000 }
  );

  console.log(`\nMIGRATION TERMINÉE : ${toMigrate.length} email(s) rechiffré(s) avec la nouvelle clé.`);
  console.log("Remplacer maintenant ENCRYPTION_KEY dans le .env par la nouvelle clé, puis redémarrer le site.");
}

main()
  .catch((err) => {
    console.error("Échec :", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
