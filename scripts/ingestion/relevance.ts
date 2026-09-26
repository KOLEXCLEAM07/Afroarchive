/**
 * AfroArchive Ingestion Framework - African Relevance Classifier
 * Validates that discovered records are authentically related to African knowledge,
 * history, philosophy, geography, languages, and scholarship.
 */

import { RelevanceAssessment } from './types';

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
  'negritude', 'ethiopianism', 'indigenous knowledge', 'african epistemolog',

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

export class AfricanRelevanceClassifier {
  /**
   * Assesses whether a text, country code list, or metadata is relevant to African knowledge.
   */
  static assess(
    title: string,
    summary: string,
    countryCodes: string[] = [],
    tags: string[] = [],
    content: string = ''
  ): RelevanceAssessment {
    const combinedText = `${title} ${summary} ${content} ${tags.join(' ')}`.toLowerCase();
    const reasons: string[] = [];
    const matchedKeywords: string[] = [];
    const detectedCountries: string[] = [];

    let score = 0.0;

    // 1. Check Country Codes
    for (const code of countryCodes) {
      const upper = code.toUpperCase();
      if (AFRICAN_COUNTRY_CODES.has(upper)) {
        detectedCountries.push(upper);
      }
    }

    if (detectedCountries.length > 0) {
      score += 0.4;
      reasons.push(`Matched ${detectedCountries.length} African country code(s): ${detectedCountries.join(', ')}`);
    }

    // 2. Check African Keywords in Title
    const titleLower = title.toLowerCase();
    for (const kw of AFRICAN_KEYWORDS) {
      if (titleLower.includes(kw)) {
        score += 0.35;
        matchedKeywords.push(kw);
        reasons.push(`Title explicitly contains African landmark keyword: "${kw}"`);
        break;
      }
    }

    // 3. Check African Keywords in Summary and Content
    let bodyMatches = 0;
    for (const kw of AFRICAN_KEYWORDS) {
      if (combinedText.includes(kw) && !matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
        bodyMatches++;
      }
    }

    if (bodyMatches > 0) {
      const bodyScore = Math.min(bodyMatches * 0.15, 0.4);
      score += bodyScore;
      reasons.push(`Matched ${bodyMatches} African context term(s): ${matchedKeywords.slice(0, 5).join(', ')}`);
    }

    // Cap score at 1.0
    const finalScore = Math.min(Number(score.toFixed(2)), 1.0);
    const isRelevant = finalScore >= 0.30;

    return {
      isRelevant,
      score: finalScore,
      reasons,
      matchedKeywords,
      detectedCountries,
    };
  }
}
