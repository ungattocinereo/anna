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

const assertNotIncludes = (needle, label) => {
  assert(!normalizedPage.includes(needle), `${label} should be removed: ${needle}`);
};

const normalize = (value) => value
  .replaceAll('&nbsp;', ' ')
  .replaceAll('&mdash;', '—')
  .replaceAll('&euro;', '€')
  .replaceAll('&middot;', '·')
  .replaceAll('&laquo;', '"')
  .replaceAll('&raquo;', '"')
  .replace(/\s+/g, ' ')
  .trim();

const extractTourBlock = (startMarker, endMarker) => {
  const startIndex = page.indexOf(startMarker);
  if (startIndex === -1) return '';

  const endIndex = page.indexOf(endMarker, startIndex + startMarker.length);
  return normalize(page.slice(startIndex, endIndex === -1 ? page.length : endIndex));
};

const classicBlock = extractTourBlock('<!-- ===== CABRIO: ВЕЧНАЯ КЛАССИКА ===== -->', '<!-- ===== CABRIO: АМАЛЬФИ НА ВКУС ===== -->');
const tasteBlock = extractTourBlock('<!-- ===== CABRIO: АМАЛЬФИ НА ВКУС ===== -->', '<!-- ===== CABRIO: ЭЛЕГАНТНАЯ РОСКОШЬ ===== -->');
const dolceVitaBlock = extractTourBlock('<!-- ===== CABRIO: ЭЛЕГАНТНАЯ РОСКОШЬ ===== -->', '<!-- ===== ДРУГИЕ ВПЕЧАТЛЕНИЯ ===== -->');
const boatBlock = extractTourBlock('<!-- ===== BOAT TOUR ===== -->', '<!-- ===== CABRIO: ВЕЧНАЯ КЛАССИКА ===== -->');
const expectedBoatOrder = ['Perla Blu', 'Reginella', 'Princess', 'Premium Boat'];
const boatOrder = [...boatBlock.matchAll(/<h4>([^<]+)<\/h4>/g)]
  .map((match) => match[1])
  .filter((title) => expectedBoatOrder.includes(title) || title === 'Cranchi Sport');

const extractBoatDetails = (name, nextName) => {
  const startIndex = boatBlock.indexOf(`<h4>${name}</h4>`);
  if (startIndex === -1) return '';

  const endIndex = nextName
    ? boatBlock.indexOf(`<h4>${nextName}</h4>`, startIndex + name.length)
    : boatBlock.indexOf('<p class="tour-departure"', startIndex);

  return boatBlock.slice(startIndex, endIndex === -1 ? boatBlock.length : endIndex);
};

const perlaBluDetails = extractBoatDetails('Perla Blu', 'Reginella');
const princessDetails = extractBoatDetails('Princess', 'Premium Boat');
const stripTags = (value) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const perlaBluText = stripTags(perlaBluDetails);
const princessText = stripTags(princessDetails);

assertIncludes('Вечная классика', 'Classic tour title');
assertIncludes('Позитано — Изумрудный грот — Амальфи', 'Classic tour route');
assertIncludes('6 часов · макс. 3 человека', 'Classic tour duration');
assertIncludes('Экскурсия на кабриолете через всё побережье с пешеходными прогулками в Позитано и Амальфи и посещением Изумрудного грота', 'Classic intro');
assertIncludes('Изумрудный грот', 'Emerald Grotto section');
assertIncludes('+ €10/чел. билет в грот', 'Classic price note');
assert(classicBlock && !classicBlock.includes('<h4>Атрани</h4>'), 'Classic tour Atrani section should be removed');
assertNotIncludes('Позитано — Праяно — Изумрудный грот — Амальфи — Атрани', 'Old classic route');

assertIncludes('Дольче Вита', 'Dolce Vita tour title');
assert(dolceVitaBlock && dolceVitaBlock.includes('Позитано — Сорренто'), 'Dolce Vita Positano-Sorrento route is missing');
assert(dolceVitaBlock && dolceVitaBlock.includes('6 часов · макс. 3 человека'), 'Dolce Vita duration should be 6 hours');
assert(dolceVitaBlock && !dolceVitaBlock.includes('8 часов · макс. 3 человека'), 'Dolce Vita duration should not be 8 hours');
assert(dolceVitaBlock && !dolceVitaBlock.includes('Также посетим древнюю Римскую виллу'), 'Dolce Vita MAR paragraph should be removed');
assert(dolceVitaBlock && !dolceVitaBlock.includes('+ €15/чел. билет на виллу'), 'Dolce Vita villa ticket note should be removed');

assertIncludes('Амальфи на вкус', 'Taste tour title');
assertIncludes('Равелло — Семейная винодельня в долине Трамонти — Амальфи', 'Taste tour route');
assertIncludes('Семейная винодельня в долине Трамонти', 'Taste winery section');
assertIncludes('Это не просто дегустация, а настоящее гастрономическое путешествие', 'Taste winery description');
assertIncludes('+ €10/чел. билет на виллу', 'Taste villa ticket note');
assertIncludes('+ €50/чел. винная дегустация', 'Taste tasting note');

assert(tasteBlock.includes('<div class="tour-cover"> <img src="/images/optimized/amalfi-taste-winery.webp"'), 'Taste tour cover should use the winery image');
assert(!tasteBlock.includes('tour-visual-card'), 'Taste tour inline image card should be removed');
assert(!page.includes('/images/optimized/amalfi-taste-ravello.webp'), 'Old taste tour Ravello image should not be referenced');
assert(existsSync(join(root, 'public/images/optimized/amalfi-taste-winery.webp')), 'Taste tour winery image asset is missing');

assert(page.includes('"name": "Кабриолет — Амальфи на вкус"'), 'Taste tour JSON-LD offer is missing');

assert(boatBlock.includes('<img src="/images/optimized/princess.webp" alt="Princess"'), 'Princess image should be used');
assert(existsSync(join(root, 'public/images/optimized/princess.webp')), 'Princess boat image asset is missing');
assert(!boatBlock.includes('Cranchi Sport'), 'Cranchi Sport boat card should be replaced');
assert(!boatBlock.includes('/images/optimized/cranchi sport.webp'), 'Cranchi image should not be referenced');
assert(JSON.stringify(boatOrder) === JSON.stringify(expectedBoatOrder), `Boat order should be ${expectedBoatOrder.join(' > ')}, got ${boatOrder.join(' > ')}`);
assert(perlaBluText.includes('€750 — 3.5 часа'), 'Perla Blu 3.5 hour price is missing');
assert(!perlaBluDetails.includes('7 часов'), 'Perla Blu 7 hour option should be removed');
assert(princessDetails.includes('макс. 8 человек'), 'Princess capacity should be 8 people');
assert(princessText.includes('€900 — 3.5 часа'), 'Princess 3.5 hour price should stay the same as Cranchi');
assert(princessText.includes('€1350 — 7 часов'), 'Princess 7 hour price should stay the same as Cranchi');

if (failures.length) {
  console.error('Tour content check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Tour content check passed.');
