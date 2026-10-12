/**
 * AfroArchive Ingestion Framework - African country name → ISO 3166-1 alpha-2 mapping.
 * Used to turn free-text museum geography fields into country codes. Ambiguous
 * names (e.g. a bare "Congo" or "Rhodesia") are deliberately not mapped.
 */

const COUNTRY_NAMES: Record<string, string> = {
  algeria: 'DZ',
  angola: 'AO',
  benin: 'BJ',
  'republic of benin': 'BJ',
  dahomey: 'BJ',
  botswana: 'BW',
  bechuanaland: 'BW',
  'burkina faso': 'BF',
  'upper volta': 'BF',
  burundi: 'BI',
  'cabo verde': 'CV',
  'cape verde': 'CV',
  cameroon: 'CM',
  cameroun: 'CM',
  'central african republic': 'CF',
  chad: 'TD',
  comoros: 'KM',
  'republic of the congo': 'CG',
  'republic of congo': 'CG',
  'congo-brazzaville': 'CG',
  'congo brazzaville': 'CG',
  'democratic republic of the congo': 'CD',
  'democratic republic of congo': 'CD',
  'dem. rep. congo': 'CD',
  'congo-kinshasa': 'CD',
  'belgian congo': 'CD',
  'congo free state': 'CD',
  zaire: 'CD',
  djibouti: 'DJ',
  egypt: 'EG',
  'equatorial guinea': 'GQ',
  eritrea: 'ER',
  eswatini: 'SZ',
  swaziland: 'SZ',
  ethiopia: 'ET',
  abyssinia: 'ET',
  gabon: 'GA',
  gambia: 'GM',
  'the gambia': 'GM',
  ghana: 'GH',
  'gold coast': 'GH',
  'guinea-bissau': 'GW',
  'guinea bissau': 'GW',
  guinea: 'GN',
  "cote d'ivoire": 'CI',
  'cote divoire': 'CI',
  'ivory coast': 'CI',
  kenya: 'KE',
  lesotho: 'LS',
  basutoland: 'LS',
  liberia: 'LR',
  libya: 'LY',
  madagascar: 'MG',
  malawi: 'MW',
  nyasaland: 'MW',
  mali: 'ML',
  mauritania: 'MR',
  mauritius: 'MU',
  morocco: 'MA',
  mozambique: 'MZ',
  namibia: 'NA',
  niger: 'NE',
  nigeria: 'NG',
  rwanda: 'RW',
  'sao tome and principe': 'ST',
  'sao tome': 'ST',
  senegal: 'SN',
  seychelles: 'SC',
  'sierra leone': 'SL',
  somalia: 'SO',
  somaliland: 'SO',
  'south africa': 'ZA',
  'south sudan': 'SS',
  sudan: 'SD',
  tanzania: 'TZ',
  tanganyika: 'TZ',
  zanzibar: 'TZ',
  togo: 'TG',
  tunisia: 'TN',
  uganda: 'UG',
  zambia: 'ZM',
  'northern rhodesia': 'ZM',
  zimbabwe: 'ZW',
  'southern rhodesia': 'ZW',
};

// Phrases that contain an African country name but refer to somewhere else.
const FALSE_FRIENDS = ['papua new guinea', 'new guinea', 'guinea pig', 'guinea-pig'];

const NAMES_LONGEST_FIRST = Object.keys(COUNTRY_NAMES).sort((a, b) => b.length - a.length);

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘`]/g, "'")
    .toLowerCase();
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PATTERNS = NAMES_LONGEST_FIRST.map((name) => ({
  name,
  re: new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(name)}(?![\\p{L}\\p{N}])`, 'gu'),
}));

/** Detects African ISO alpha-2 codes mentioned in free-text geography fields. */
export function detectAfricanCountryCodes(...texts: Array<string | null | undefined>): string[] {
  const found = new Set<string>();
  for (const raw of texts) {
    if (!raw) continue;
    let text = normalize(raw);
    for (const ff of FALSE_FRIENDS) text = text.split(ff).join(' ');
    for (const { name, re } of PATTERNS) {
      re.lastIndex = 0;
      if (re.test(text)) {
        found.add(COUNTRY_NAMES[name]);
        // Blank out the match so "South Sudan" does not also yield "Sudan".
        text = text.replace(re, ' ');
      }
    }
  }
  return Array.from(found);
}

/** Exact lookup of a single country name (e.g. the Met `country` field). */
export function africanCountryCode(name?: string | null): string | undefined {
  if (!name) return undefined;
  return COUNTRY_NAMES[normalize(name).trim()] ?? detectAfricanCountryCodes(name)[0];
}
