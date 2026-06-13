import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const pagePath = join(root, 'src/pages/index.astro');
const page = readFileSync(pagePath, 'utf8');

const normalizedPage = page
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&mdash;', '—')
  .replaceAll('&euro;', '€')
  .replaceAll('&middot;', '·')
  .replaceAll('&laquo;', '"')
  .replaceAll('&raquo;', '"')
  .replace(/\s+/g, ' ')
  .trim();

const failures = [];

const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const assertIncludes = (needle, label) => {
  assert(normalizedPage.includes(needle), `${label} is missing: ${needle}`);
};

assertIncludes('Вечная классика', 'Classic tour title');
assertIncludes('Позитано — Праяно — Изумрудный грот — Амальфи — Атрани', 'Classic tour route');
assertIncludes('6 часов · макс. 3 человека', 'Classic tour duration');
assertIncludes('Экскурсия на кабриолете через всё побережье с пешеходными прогулками в Позитано и Амальфи и посещением Изумрудного грота', 'Classic intro');
assertIncludes('Изумрудный грот', 'Emerald Grotto section');
assertIncludes('+ €10/чел. билет в грот', 'Classic price note');

assertIncludes('Амальфи на вкус', 'Taste tour title');
assertIncludes('Равелло — Семейная винодельня в долине Трамонти — Амальфи', 'Taste tour route');
assertIncludes('Семейная винодельня в долине Трамонти', 'Taste winery section');
assertIncludes('Это не просто дегустация, а настоящее гастрономическое путешествие', 'Taste winery description');
assertIncludes('+ €10/чел. билет на виллу', 'Taste villa ticket note');
assertIncludes('+ €50/чел. винная дегустация', 'Taste tasting note');

assert(page.includes('/images/optimized/amalfi-taste-ravello.webp'), 'Taste tour cover image is not referenced');
assert(page.includes('/images/optimized/amalfi-taste-winery.webp'), 'Taste tour inline image is not referenced');
assert(existsSync(join(root, 'public/images/optimized/amalfi-taste-ravello.webp')), 'Taste tour cover image asset is missing');
assert(existsSync(join(root, 'public/images/optimized/amalfi-taste-winery.webp')), 'Taste tour winery image asset is missing');

assert(page.includes('"name": "Кабриолет — Амальфи на вкус"'), 'Taste tour JSON-LD offer is missing');

if (failures.length) {
  console.error('Tour content check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tour content check passed.');
