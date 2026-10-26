# Dr.Baby (Doctora)

Application de révision pour l'internat/résidanat (programme FMPR), en HTML/CSS/JS statique, hébergée sur GitHub Pages et installable sur iPhone/iPad (Safari → Partager → « Sur l'écran d'accueil »).

Le reste du dépôt contient nos pages perso (`nous-deux/`, `anniversaire/`, `jeux/`…), servies à côté de l'app.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | coquille de l'app (en-tête, onglets, chat flottant) |
| `app.js` | toute la logique : écrans, sessions, répétition espacée, stats, réglages |
| `styles.css` | styles et thèmes (Rose, Menthe, Lavande, Nuit, Auto) |
| `sw.js` | service worker : réseau d'abord pour le code et les données, cache d'abord pour les PDF et images |
| `data/qcm.json` | banque de QCM |
| `data/courses.json` | liste des PDF de `content/cours/` |
| `assets/brand/hamster.png` | le chat qui flotte (oui, le fichier s'appelle hamster) |

## Banque de questions (`data/qcm.json`)

```json
{
  "meta": { "version": 2, "categories": [{ "id": "urg", "name": "Urgences", "emoji": "🚑" }], "levels": ["easy", "medium", "hard", "god"] },
  "questions": [
    { "id": "urg-001", "cat": "urg", "chapter": "Pneumothorax", "level": "easy",
      "q": "…", "options": ["bonne réponse", "faux", "faux", "faux"], "answer": 0, "explain": "…" }
  ]
}
```

- Une seule bonne réponse par question, 4 propositions. L'ordre est mélangé à l'affichage, donc la bonne réponse peut rester en position 0 dans le fichier.
- `level` : `easy`, `medium`, `hard`, `god` (affiché « Dr. House »).
- Matières : `urg` Urgences, `med` Pathologie médicale, `chir` Pathologie chirurgicale, `ana` Anatomie, `bio` Biologie.
- Les identifiants servent à la progression : ne pas renuméroter les questions existantes. Pour en ajouter, prendre l'identifiant suivant de la matière.
- Les questions s'appuient sur des notions consensuelles des cours du programme. Les chiffres qui dépendent de recommandations récentes ont été évités autant que possible.

## Fonctionnalités

- **Session rapide** : 10 questions adaptatives. Le niveau monte avec la série de bonnes réponses (0-1 facile, 2-3 moyen, 4-5 difficile, 6+ Dr. House) et des erreurs à revoir sont glissées dedans.
- **Par matière / chapitre**, avec un filtre de niveau.
- **Examen blanc** chronométré (20, 40, 60 ou 100 questions, 1 min/question), corrigé à la fin.
- **Mes erreurs** : répétition espacée (boîtes de Leitner). Une question ratée revient tout de suite, puis à 2, 4, 8, 16 et 32 jours quand elle est réussie.
- **Favoris** et **signalement** d'une question (envoyé par WhatsApp).
- **Stats** : réussite par matière et par niveau, 7 derniers jours, chapitres à retravailler, série de jours.
- **Cours** : les PDF du programme.
- **Réglages** : thème, sons, chat, objectif quotidien, surnom, sauvegarde/restauration de la progression (fichier JSON), remise à zéro.
- **Mots secrets** débloqués au fil des réponses.

## Progression

Tout est stocké en local dans le navigateur, clé `doctora_v2`. Il n'y a pas de compte ni de serveur. Penser à exporter une sauvegarde depuis les Réglages avant de changer de téléphone.

## Mise à jour

Après une modification de `app.js`, `styles.css` ou `data/qcm.json`, incrémenter `CACHE_NAME` dans `sw.js`.
