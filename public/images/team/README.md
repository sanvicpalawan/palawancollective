# Dream Team photos

Bundled portraits for the seeded roster in `src/lib/control.ts` (`TEAM_SEEDS`).
Drop the files here with these exact names and they appear on the home page:

| Member                     | File                       |
| -------------------------- | -------------------------- |
| David Le & Quennie Azarraga | `1000057187.png`           |
| Clint Ponce de Leon         | `1000057270_2.jpg`         |
| Kyle Clark                  | `1000057301.jpg`           |
| Lawrence Woodleigh          | `1000057304.jpg`           |
| Alfie Lao                   | `1000057306.jpg`           |
| James & Ina                 | `1000057302_2.jpg`         |
| Tonton Varquez              | `1000057299_2.jpg`         |

Portrait crops around 4:5 read best (the card is `aspect-[4/5]`, object-cover).

Prefer not to touch the repo? Ops console → **Dream team → ⇧** uploads a photo
straight into Postgres (`uploaded_files`, served from `/uploads/…`), so it
survives every redeploy. A card whose photo is missing renders the member's
initials instead of a broken image, so nothing looks broken while the files are
still being gathered.
