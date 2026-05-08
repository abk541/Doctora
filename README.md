# Dr.Baby Web

Static iPad Safari/PWA version of the private study gift.

## Host On GitHub Pages

1. Commit the contents of `DoctoraWeb` to a GitHub repository.
2. Enable GitHub Pages for the branch/folder you publish.
3. Open the Pages URL on the iPad in Safari.
4. Use Safari Share > Add to Home Screen for the best app-like feel.

## Question Bank

The app now loads real bundled QCM from:

`data/qcm_concours_medical_difficulties.json`

Expected shape:

- `questions[].question`
- `questions[].answer_a` through `questions[].answer_d`
- `questions[].correct_answer`, using `A`, `B`, `C`, or `D`
- `questions[].difficulty`, using `easy`, `medium`, `hard`, or `god_level`
- `questions[].explanation`
- `questions[].category`
- `questions[].topic`

The session engine is adaptive:

- streak `0-1`: easy
- streak `2-3`: medium
- streak `4-5`: hard
- streak `6+`: god_level

After every two correct answers in a row, the next question is selected from the next harder level. A wrong answer resets the streak and brings the next question back down.

The UI never asks her to upload anything. It only reads bundled local files published with the app.

## Progress Saving

This is a static web app, so there is no server account or database.

Progress saves automatically in Safari using local browser storage:

- XP
- streak
- correct answers
- wrong QCM marked `À revoir`
- recent history

The Progress screen also creates a `Sauvegarde` code. Copy it to Notes if you want a manual backup. Paste it into Restore to recover progress later.

## Medical Reliability

The correction screen uses only the bundled JSON:

- her selected answer
- the correct answer
- the bundled explanation
- the local source file, page, and topic

If a verified explanation is missing, the app says:

`Je n’ai pas trouvé d’explication fiable dans les documents intégrés.`

The cute joke layer is separate from the medical correction layer.

## Mascot Asset

The only reaction/logo image currently used by the app is:

`assets/brand/hamster.png`

The older private reaction images are not referenced by the app or cache. The hamster is used as the app icon, the header mascot, and the answer reaction image.

## Privacy Note

If the GitHub repository is public, the bundled mascot/PDF-derived question data are public too. Use a private repository or private hosting if those assets must stay private.
