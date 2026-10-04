# Dream Team photos

No Dream Team portrait files are currently committed to this directory. The
first roster seed referred to these filenames even though the files were not
in GitHub, which made the deployed image URLs return 404:

| Member | Former filename |
| --- | --- |
| David Le & Quennie Azarraga | `1000057187.png` |
| Clint Ponce de Leon | `1000057270_2.jpg` |
| Kyle Clark | `1000057301.jpg` |
| Lawrence Woodleigh | `1000057304.jpg` |
| Alfie Lao | `1000057306.jpg` |
| James & Ina | `1000057302_2.jpg` |
| Tonton Varquez | `1000057299_2.jpg` |

Seeds now leave the photo field blank and the public wall displays initials until
real portraits are supplied. Existing databases with those old seed URLs are
also normalized on the public wall; they are not sent to visitors as broken
image links.

To add the real photos without a code deployment, open Ops → **Dream team** and
use the ⇧ upload button on each member. Photos are saved in Postgres and served
from `/uploads/`, so they survive Vercel redeploys. Large raster images are
resized in the browser to fit Vercel's function upload limit before they are
sent. Portrait crops around 4:5 work best.
