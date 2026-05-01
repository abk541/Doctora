# Doctora Web

Static iPad Safari/PWA version of the private study gift.

## Host On GitHub Pages

1. Commit the contents of `DoctoraWeb` to a GitHub repository.
2. Enable GitHub Pages for the branch/folder you publish.
3. Open the Pages URL on the iPad in Safari.
4. Use Safari Share > Add to Home Screen for the best app-like feel.

## Progress Saving

This is a static web app, so there is no server account or database.

Progress saves automatically in Safari using local browser storage:

- XP
- streak
- mastered prompts
- prompts marked `À revoir`
- recent history

The Progress screen also creates a `Sauvegarde` code. Copy it to Notes if you want a manual backup. Paste it into Restore to recover progress later.

## Medical Content

The app uses `data/medical_prompts.json`, generated from the bundled annales PDFs. These are open exam-style prompts, not fake multiple-choice questions.

If a verified correction is not available in the local data, the app says:

`Je n’ai pas trouvé d’explication fiable dans les documents intégrés.`

## Privacy Note

If the GitHub repository is public, the bundled stickers/PDFs are public too. Use a private repository or private hosting if those assets must stay private.
