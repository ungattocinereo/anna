import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pagePath = join(root, 'src/pages/index.astro');
const page = readFileSync(pagePath, 'utf8');

const expectedCount = 6;
const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

assert(page.includes('const galleryVideos = ['), 'galleryVideos data array is missing');
assert(!page.includes('const galleryPhotos = ['), 'legacy galleryPhotos array should be removed');
assert(page.includes('data-gallery-card'), 'desktop/mobile gallery cards need data-gallery-card hooks');
assert(page.includes('data-video-src'), 'gallery cards need lazy video source hooks');
assert(page.includes('data-poster-src'), 'gallery cards need poster source hooks');
assert(page.includes('data-gallery-modal'), 'mobile video modal is missing');
assert(page.includes('Смотреть в Инстаграме'), 'Instagram CTA copy is missing');
assert(page.includes('В мой Instagram'), 'gallery profile link copy should say "В мой Instagram"');
assert(page.includes('(hover: hover) and (pointer: fine)'), 'desktop hover capability guard is missing');
assert(page.includes('galleryDialog'), 'gallery modal controller is missing');
assert(page.includes('.gallery-modal'), 'gallery modal styles are missing');
assert(page.includes('.insta-item video'), 'video card styles are missing');
assert(!page.includes('insta-item__play'), 'center play button should be removed');
assert(page.includes('insta-item__hint'), 'corner hover hint is missing');
assert(page.includes('insta-item__actions'), 'desktop hover action buttons are missing');
assert(page.includes('data-gallery-expand'), 'expand action hook is missing');
assert(page.includes('Развернуть'), 'expand button copy is missing');

for (let index = 1; index <= expectedCount; index += 1) {
  const slug = String(index).padStart(2, '0');
  const posterPath = join(root, `public/video/posters/amalfi-gallery-${slug}.jpg`);
  const videoPath = join(root, `public/video/optimized/amalfi-gallery-${slug}.mp4`);

  assert(page.includes(`/video/posters/amalfi-gallery-${slug}.jpg`), `poster ${slug} is not referenced`);
  assert(page.includes(`/video/optimized/amalfi-gallery-${slug}.mp4`), `video ${slug} is not referenced`);
  assert(existsSync(posterPath), `poster asset ${slug} is missing`);
  assert(existsSync(videoPath), `optimized video asset ${slug} is missing`);
}

const referencedVideoCount = (page.match(/\/video\/optimized\/amalfi-gallery-\d{2}\.mp4/g) || []).length;
const referencedPosterCount = (page.match(/\/video\/posters\/amalfi-gallery-\d{2}\.jpg/g) || []).length;
assert(referencedVideoCount === expectedCount, `expected ${expectedCount} referenced videos, found ${referencedVideoCount}`);
assert(referencedPosterCount === expectedCount, `expected ${expectedCount} referenced posters, found ${referencedPosterCount}`);

if (failures.length) {
  console.error('Video gallery check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Video gallery check passed for ${expectedCount} cards.`);
