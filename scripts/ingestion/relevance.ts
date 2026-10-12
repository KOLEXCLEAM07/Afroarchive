/**
 * AfroArchive Ingestion Framework - African Relevance Classifier
 * Validates that discovered records are authentically related to African knowledge,
 * history, philosophy, geography, languages, and scholarship.
 */

import { KnowledgeType, RelevanceAssessment } from './types';

// African ISO 3166-1 alpha-2 country codes
export const AFRICAN_COUNTRY_CODES = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
  'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'CI', 'KE',
  'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG',
  'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG',
  'ZM', 'ZW'
]);

// Comprehensive dictionary of historical, cultural, and regional African terms
const AFRICAN_KEYWORDS = [
  // Regions & Geographies
  'africa', 'african', 'sahel', 'maghreb', 'horn of africa', 'swahili coast',
  'sub-saharan', 'congo basin', 'rift valley', 'senegambia', 'guinea coast',
  'kalahari', 'sahara', 'lake victoria', 'lake chad', 'zambezi', 'niger river',
  'west africa', 'east africa', 'central africa', 'southern africa', 'north africa',

  // African Nations
  'algeria', 'angola', 'benin', 'botswana', 'burkina faso', 'burundi', 'cabo verde',
  'cameroon', 'central african republic', 'chad', 'comoros', 'congo',
  'côte d\'ivoire', 'ivory coast', 'djibouti', 'egypt', 'equatorial guinea', 'eritrea',
  'eswatini', 'swaziland', 'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea', 'guinea-bissau',
  'kenya', 'lesotho', 'liberia', 'libya', 'madagascar', 'malawi', 'mali', 'mauritania',
  'mauritius', 'morocco', 'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda',
  'são tomé', 'senegal', 'seychelles', 'sierra leone', 'somalia', 'south africa',
  'south sudan', 'sudan', 'tanzania', 'togo', 'tunisia', 'uganda', 'zambia', 'zimbabwe',

  // Ancient & Precolonial Kingdoms/Civilizations
  'mali empire', 'songhai', 'songhay', 'axum', 'aksum', 'kush', 'nubia',
  'great zimbabwe', 'benin kingdom', 'dahomey', 'ashanti', 'asante', 'oyo empire',
  'kanem-bornu', 'kongo kingdom', 'mutapa', 'mapungubwe', 'carthage', 'nok culture',
  'igbo-ukwu', 'kilwa', 'zanzibar sultanate', 'moroccan empire', 'almoravid',
  'almohad', 'ifat', 'adwal', 'buganda', 'bunyoro', 'rwanda kingdom', 'zulu kingdom',

  // Cities, Historical Sites & Learning Centers
  'timbuktu', 'djenné', 'gao', 'lalibela', 'gondar', 'meroe', 'kerma', 'ouadane',
  'chinguetti', 'sankore', 'alexandria', 'al-azhar', 'kairouan', 'fez', 'luxor',
  'thebes', 'karnak', 'great enclosure', 'khami', 'loropeni', 'sidi yahya',

  // Philosophies, Concepts & Epistemologies
  'ubuntu', 'ma\'at', 'maat', 'seriti', 'omoluabi', 'ujamaa', 'harambee', 'ukama',
  'teranga', 'african philosophy', 'africana', 'panafricanism', 'pan-africanism',
  'negritude', 'ethiopianism', 'indigenous knowledge', 'african epistemology', 'african epistemologies',

  // Languages & Scripts
  'ge\'ez', 'gee\'ez', 'tifinagh', 'n\'ko', 'nko', 'ajami', 'vai script', 'nsibidi',
  'swahili', 'kiswahili', 'yoruba', 'igbo', 'hausa', 'amharic', 'oromo', 'zulu',
  'xhosa', 'shona', 'somali', 'fula', 'fulani', 'wolof', 'lingala', 'mandinka',
  'bambara', 'twi', 'akan', 'tigrinya', 'berber', 'amazigh', 'chewa',

  // Notable Historical Figures & Scholars
  'mansa musa', 'ahmad baba', 'ibn battuta', 'cheikh anta diop', 'frantz fanon',
  'kwame nkrumah', 'julius nyerere', 'amílcar cabral', 'thomas sankara', 'queen nzinga',
  'yisake', 'ezana', 'piye', 'taharqa', 'sundiata keita', 'sonni ali', 'askia muhammad',
  'idris alooma', 'shaka zulu', 'menelik', 'zera yacob', 'walda heywat', 'anton wilhelm amo',
  'steve biko', 'chinua achebe', 'wole soyinka', 'ngugi wa thiong\'o', 'wangari maathai',
];

// Phrases containing an African keyword that refer to something else entirely.
const FALSE_FRIEND_PHRASES = ['papua new guinea', 'new guinea', 'guinea pig', 'guinea pigs', 'guinea-pig'];

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase();
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Keywords are matched on word boundaries (Unicode-aware), so "chad" does not
// match "Chadwick", "twi" does not match "twin" and "gao" does not match "gaol".
const KEYWORD_PATTERNS: Array<{ keyword: string; re: RegExp }> = Array.from(
  new Set(AFRICAN_KEYWORDS.map(normalizeText))
).map((keyword) => ({
  keyword,
  re: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(keyword)}(?![\\p{L}\\p{N}])`, 'u'),
}));

function prepare(text: string): string {
  let t = normalizeText(text);
  for (const phrase of FALSE_FRIEND_PHRASES) t = t.split(phrase).join(' ');
  return t;
}

/** Returns the distinct African keywords found in the text (word-boundary matches). */
export function findAfricanKeywords(text: string): string[] {
  const prepared = prepare(text);
  return KEYWORD_PATTERNS.filter(({ re }) => re.test(prepared)).map(({ keyword }) => keyword);
}

export interface RelevanceOptions {
  /**
   * The record comes from a source already restricted to Africa (e.g. a museum's
   * African department, or a Wikidata query filtered to African entities).
   */
  trustedAfricanSource?: boolean;
  /** Scholarly works ('work') use a stricter rule — see `assess`. */
  knowledgeType?: KnowledgeType;
}

export class AfricanRelevanceClassifier {
  /**
   * Assesses whether a text, country code list, or metadata is relevant to African knowledge.
   *
   * For scholarly works (knowledgeType 'work') author-affiliation country codes alone
   * never make a record relevant: the title must contain an African keyword, or the
   * title + abstract must contain at least two distinct African keywords.
   */
  static assess(
    title: string,
    summary: string,
    countryCodes: string[] = [],
    tags: string[] = [],
    content: string = '',
    options: RelevanceOptions = {}
  ): RelevanceAssessment {
    const isWork = options.knowledgeType === 'work';
    const reasons: string[] = [];
    const detectedCountries: string[] = [];

    let score = 0.0;

    // 1. Country codes (ignored for scholarly works, where they reflect author affiliation)
    for (const code of countryCodes) {
      const upper = code.toUpperCase();
      if (AFRICAN_COUNTRY_CODES.has(upper) && !detectedCountries.includes(upper)) {
        detectedCountries.push(upper);
      }
    }

    if (detectedCountries.length > 0 && !isWork) {
      score += 0.4;
      reasons.push(`Matched ${detectedCountries.length} African country code(s): ${detectedCountries.join(', ')}`);
    }

    // 2. African keywords in the title
    const titleKeywords = findAfricanKeywords(title);
    const matchedKeywords: string[] = [...titleKeywords];
    if (titleKeywords.length > 0) {
      score += 0.35;
      reasons.push(`Title explicitly contains African keyword: "${titleKeywords[0]}"`);
    }

    // 3. African keywords in the body (tags are not considered for scholarly works)
    const bodyText = isWork ? `${summary} ${content}` : `${summary} ${content} ${tags.join(' ')}`;
    let bodyMatches = 0;
    for (const kw of findAfricanKeywords(bodyText)) {
      if (!matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
        bodyMatches++;
      }
    }

    if (bodyMatches > 0) {
      score += Math.min(bodyMatches * 0.15, 0.4);
      reasons.push(`Matched ${bodyMatches} African context term(s): ${matchedKeywords.slice(0, 5).join(', ')}`);
    }

    if (options.trustedAfricanSource) {
      score += 0.5;
      reasons.push('Record comes from a source restricted to Africa');
    }

    const finalScore = Math.min(Number(score.toFixed(2)), 1.0);

    let isRelevant: boolean;
    if (options.trustedAfricanSource) {
      isRelevant = true;
    } else if (isWork) {
      isRelevant = titleKeywords.length > 0 || matchedKeywords.length >= 2;
      if (!isRelevant && detectedCountries.length > 0) {
        reasons.push('African author affiliation alone is not sufficient for scholarly works');
      }
    } else {
      isRelevant = finalScore >= 0.3;
    }

    return {
      isRelevant,
      score: finalScore,
      reasons,
      matchedKeywords,
      detectedCountries,
    };
  }
}
