import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pagePath = join(root, 'src/pages/index.astro');
const page = readFileSync(pagePath, 'utf8');

const expectedPosts = [
  'https://www.instagram.com/reel/DLUoL3vtRzL/?igsh=MWk2eXhuMjRlenFxMA==',
  'https://www.instagram.com/reel/DHiwLPxtihJ/?igsh=YjdiNDNhc2dncWVs',
  'https://www.instagram.com/reel/DMcRzj_sH2m/?igsh=MWltMm50c3VoNnJyYw==',
  'https://www.instagram.com/p/DNQRBt6olXd/?igsh=MWt0emd3djZyNWx4dg==',
  'https://www.instagram.com/p/DY62sJ8Df18/?igsh=OWFzcHMxZzc3dnMw',
  'https://www.instagram.com/reel/DL4YzhWtUKt/?igsh=b3F2dml0ZjNsdHZy',
  'https://www.instagram.com/reel/DZWv_bBtecY/?igsh=cjY2MmxieTZtcWc2',
  'https://www.instagram.com/reel/DKmgZ3NNn_z/?igsh=bDM0OHlxa3V0a280',
];
const expectedCount = expectedPosts.length;
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(page.includes('const galleryVideos = ['), 'galleryVideos data array is missing');
assert(!page.includes('const galleryPhotos = ['), 'legacy galleryPhotos array should be removed');
assert(page.includes('class="insta-item"'), 'Instagram gallery cards are missing');
assert(!page.includes('data-video-src'), 'gallery cards should open Instagram directly instead of lazy videos');
assert(!page.includes('data-poster-src'), 'gallery cards should use Instagram preview images directly');
assert(!page.includes('data-gallery-modal'), 'mobile video modal should be removed');
assert(!page.includes('galleryDialog'), 'gallery modal controller should be removed');
assert(!page.includes('Развернуть'), 'expand button should be removed');
assert(page.includes('В мой Instagram'), 'gallery profile link copy should say "В мой Instagram"');
assert(!page.includes('.gallery-modal'), 'gallery modal styles should be removed');
assert(!page.includes('insta-item__play'), 'center play button should be removed');
assert(page.includes('insta-item__hint'), 'corner Instagram hint is missing');
assert(!page.includes('insta-item__actions'), 'separate action buttons should be removed');

for (let index = 1; index <= expectedCount; index += 1) {
  const slug = String(index).padStart(2, '0');
  const posterPath = join(root, `public/images/instagram/ann-in-rome-${slug}.jpg`);
  const expectedPost = expectedPosts[index - 1];

  assert(page.includes(`/images/instagram/ann-in-rome-${slug}.jpg`), `Instagram preview ${slug} is not referenced`);
  assert(page.includes(expectedPost), `Instagram post URL ${slug} is not referenced`);
  assert(existsSync(posterPath), `Instagram preview asset ${slug} is missing`);
}

const referencedPosterCount = (page.match(/\/images\/instagram\/ann-in-rome-\d{2}\.jpg/g) || []).length;
const referencedPostCount = expectedPosts.reduce((count, url) => count + (page.includes(url) ? 1 : 0), 0);
assert(referencedPosterCount === expectedCount, `expected ${expectedCount} referenced posters, found ${referencedPosterCount}`);
assert(referencedPostCount === expectedCount, `expected ${expectedCount} Instagram URLs, found ${referencedPostCount}`);

if (failures.length) {
  console.error('Instagram gallery check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Instagram gallery check passed for ${expectedCount} cards.`);
