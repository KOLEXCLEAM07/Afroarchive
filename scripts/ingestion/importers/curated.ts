/**
 * AfroArchive Ingestion Framework - Curated Editorial Seed Importer
 * Seeds a small, hand-checked set of places, kingdoms/states and people written
 * by the AfroArchive editorial desk. Dates marked "c." are approximate; fields
 * that are contested in mainstream scholarship are deliberately left out.
 */

import { BaseImporter } from './base-importer';
import { NormalizedItem, BatchFetchResult, ConnectorOptions, RightsAssessment } from '../types';

type EntityData = NonNullable<NormalizedItem['entityData']>;

interface CuratedBase {
  slug: string;
  title: string;
  summary: string;
  content?: string;
  /** Exact English Wikipedia article title, when known. */
  wikipediaTitle?: string;
  countryCodes: string[];
  timePeriod?: string;
  tags: string[];
}

export type CuratedEntry =
  | (CuratedBase & { knowledgeType: 'place'; place: NonNullable<EntityData['place']> })
  | (CuratedBase & { knowledgeType: 'kingdom_or_state'; kingdomOrState: NonNullable<EntityData['kingdomOrState']> })
  | (CuratedBase & { knowledgeType: 'person'; person: NonNullable<EntityData['person']> });

const EDITORIAL_RIGHTS: RightsAssessment = {
  licenseType: 'cc_by',
  attribution: 'AfroArchive Editorial',
  canRehost: true,
  isMetadataOnly: false,
};

const wikipediaUrl = (title: string) =>
  `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_')).replace(/%2C/g, ',')}`;

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------
const PLACES: CuratedEntry[] = [
  {
    knowledgeType: 'place',
    slug: 'timbuktu',
    title: 'Timbuktu',
    wikipediaTitle: 'Timbuktu',
    summary:
      'Timbuktu is a city in Mali near the northern bend of the Niger River. Between the 14th and 16th centuries it was a major centre of trans-Saharan trade and Islamic scholarship under the Mali and Songhai empires. Its Djinguereber, Sankore and Sidi Yahya mosques are a UNESCO World Heritage Site.',
    content:
      'Scholars in Timbuktu copied, taught and collected manuscripts on law, theology, astronomy, medicine and grammar, and many families kept private libraries. Large numbers of these manuscripts survive in public and family collections today.',
    countryCodes: ['ML'],
    tags: ['timbuktu', 'mali', 'manuscripts', 'islamic-scholarship', 'trans-saharan-trade', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Tombouctou', 'Tumbutu'],
      modernCountry: 'Mali',
      historicalRegion: 'Western Sudan (Sahel)',
      latitude: 16.7758,
      longitude: -3.0094,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'djenne',
    title: 'Djenné',
    wikipediaTitle: 'Djenné',
    summary:
      'Djenné is a town in the inland Niger Delta of central Mali, long connected to the trade networks of the Sahel. It is known for its earthen architecture, including the Great Mosque, the present building of which dates from 1907. The old town and the nearby early urban site of Djenné-Djenno are a UNESCO World Heritage Site.',
    content:
      'Excavations at Djenné-Djenno, a short distance from the modern town, show that the area was settled from the late first millennium BCE and grew into a large urban settlement well before the rise of the Mali Empire.',
    countryCodes: ['ML'],
    tags: ['djenne', 'mali', 'earthen-architecture', 'great-mosque', 'inland-niger-delta', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Jenne'],
      modernCountry: 'Mali',
      historicalRegion: 'Inland Niger Delta',
      latitude: 13.9056,
      longitude: -4.555,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'gao',
    title: 'Gao',
    wikipediaTitle: 'Gao',
    summary:
      'Gao is a city on the Niger River in eastern Mali. It was an important trading town from at least the 9th century and became the capital of the Songhai Empire in the 15th and 16th centuries. The Tomb of Askia, built for Askia Muhammad I at the end of the 15th century, is a UNESCO World Heritage Site.',
    countryCodes: ['ML'],
    tags: ['gao', 'mali', 'songhai', 'tomb-of-askia', 'niger-river', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Kawkaw'],
      modernCountry: 'Mali',
      historicalRegion: 'Middle Niger',
      latitude: 16.2667,
      longitude: -0.05,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'great-zimbabwe',
    title: 'Great Zimbabwe',
    wikipediaTitle: 'Great Zimbabwe',
    summary:
      'Great Zimbabwe is a ruined stone city near Masvingo in southeastern Zimbabwe, built by ancestors of the Shona and occupied mainly between the 11th and 15th centuries. Its dry-stone walls, including the Great Enclosure, were built without mortar. The site, a UNESCO World Heritage Site, gave its name to the modern country.',
    content:
      'At its height the city was the centre of a state whose wealth came from cattle, agriculture and long-distance trade in gold and ivory reaching the Swahili coast. Soapstone bird carvings found at the site have become national emblems of Zimbabwe.',
    countryCodes: ['ZW'],
    timePeriod: 'c. 11th–15th century CE',
    tags: ['great-zimbabwe', 'zimbabwe', 'shona', 'stone-architecture', 'archaeology', 'unesco-world-heritage'],
    place: {
      modernCountry: 'Zimbabwe',
      historicalRegion: 'Zimbabwe Plateau',
      latitude: -20.2667,
      longitude: 30.9333,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'mapungubwe-hill',
    title: 'Mapungubwe',
    wikipediaTitle: 'Kingdom of Mapungubwe',
    summary:
      'Mapungubwe is a hilltop settlement near the confluence of the Limpopo and Shashe rivers in northern South Africa. Between about 1075 and 1220 CE it was the capital of the earliest known state in southern Africa. Burials on the hill contained gold objects, including a small gold-foil rhinoceros.',
    countryCodes: ['ZA'],
    timePeriod: 'c. 1075–1220 CE',
    tags: ['mapungubwe', 'south-africa', 'limpopo', 'archaeology', 'gold', 'unesco-world-heritage'],
    place: {
      modernCountry: 'South Africa',
      historicalRegion: 'Limpopo Valley',
      latitude: -22.1925,
      longitude: 29.2389,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'aksum',
    title: 'Aksum',
    wikipediaTitle: 'Axum',
    summary:
      'Aksum is a town in the Tigray Region of northern Ethiopia and was the capital of the Kingdom of Aksum. It is known for its monumental carved stone stelae, royal tombs and inscriptions. The archaeological site is a UNESCO World Heritage Site.',
    content:
      'In Ethiopian Orthodox tradition the Church of Our Lady Mary of Zion in Aksum holds the Ark of the Covenant, which makes the town an important place of pilgrimage.',
    countryCodes: ['ET'],
    tags: ['aksum', 'ethiopia', 'stelae', 'archaeology', 'tigray', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Axum'],
      modernCountry: 'Ethiopia',
      historicalRegion: 'Tigray',
      latitude: 14.1208,
      longitude: 38.7278,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'lalibela',
    title: 'Lalibela',
    wikipediaTitle: 'Lalibela',
    summary:
      'Lalibela is a town in the Amhara Region of Ethiopia known for its eleven monolithic churches cut down into the rock. Tradition attributes them to King Gebre Mesqel Lalibela of the Zagwe dynasty, who reigned in the late 12th and early 13th centuries. The churches remain in active use and are a UNESCO World Heritage Site.',
    countryCodes: ['ET'],
    tags: ['lalibela', 'ethiopia', 'rock-hewn-churches', 'zagwe-dynasty', 'ethiopian-orthodox', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Roha'],
      modernCountry: 'Ethiopia',
      historicalRegion: 'Lasta',
      latitude: 12.0317,
      longitude: 39.0411,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'meroe',
    title: 'Meroë',
    wikipediaTitle: 'Meroë',
    summary:
      'Meroë is an ancient city on the east bank of the Nile in Sudan, north of Khartoum. It was the principal city of the Kingdom of Kush in its later period and is known for its many small steep-sided royal pyramids and evidence of large-scale iron working. The archaeological sites of the Island of Meroë are a UNESCO World Heritage Site.',
    countryCodes: ['SD'],
    tags: ['meroe', 'sudan', 'kush', 'nubia', 'pyramids', 'iron-working', 'unesco-world-heritage'],
    place: {
      modernCountry: 'Sudan',
      historicalRegion: 'Nubia (Butana)',
      latitude: 16.9333,
      longitude: 33.7264,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'jebel-barkal',
    title: 'Jebel Barkal and Napata',
    wikipediaTitle: 'Jebel Barkal',
    summary:
      'Jebel Barkal is a flat-topped sandstone hill near the Nile at Karima in northern Sudan. It was regarded as a sacred mountain and the site of a major temple of Amun, and it lies at the heart of Napata, the early capital of the Kingdom of Kush. Gebel Barkal and the sites of the Napatan region are a UNESCO World Heritage Site.',
    countryCodes: ['SD'],
    tags: ['jebel-barkal', 'napata', 'sudan', 'kush', 'nubia', 'temple-of-amun', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Napata', 'Gebel Barkal'],
      modernCountry: 'Sudan',
      historicalRegion: 'Nubia',
      latitude: 18.5368,
      longitude: 31.8276,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'kilwa-kisiwani',
    title: 'Kilwa Kisiwani',
    wikipediaTitle: 'Kilwa Kisiwani',
    summary:
      'Kilwa Kisiwani is an island off the southern coast of Tanzania that was the seat of the Kilwa Sultanate, one of the leading Swahili trading cities on the Indian Ocean. It controlled much of the gold trade from the southern African interior. Its ruins, including the Great Mosque and the palace of Husuni Kubwa, are a UNESCO World Heritage Site together with nearby Songo Mnara.',
    content: 'The traveller Ibn Battuta visited Kilwa in the 1330s and described it as a beautiful and well-built town.',
    countryCodes: ['TZ'],
    tags: ['kilwa', 'tanzania', 'swahili-coast', 'indian-ocean-trade', 'coral-stone-architecture', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Kilwa'],
      modernCountry: 'Tanzania',
      historicalRegion: 'Swahili Coast',
      latitude: -8.9817,
      longitude: 39.5172,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'benin-city',
    title: 'Benin City',
    wikipediaTitle: 'Benin City',
    summary:
      'Benin City is the capital of Edo State in southern Nigeria and was the capital of the Kingdom of Benin. The historic city was surrounded by extensive earthen walls and moats. British forces captured and burned it in 1897 and removed thousands of royal works of art, now known as the Benin Bronzes.',
    content:
      'The city remains the seat of the Oba of Benin. Guilds that served the royal court, including the bronze casters of Igun Street, continue to work there.',
    countryCodes: ['NG'],
    tags: ['benin-city', 'nigeria', 'edo', 'kingdom-of-benin', 'benin-bronzes'],
    place: {
      historicalNames: ['Edo', 'Ubinu'],
      modernCountry: 'Nigeria',
      historicalRegion: 'Edo',
      latitude: 6.3333,
      longitude: 5.6222,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'ile-ife',
    title: 'Ile-Ife',
    wikipediaTitle: 'Ifẹ',
    summary:
      'Ile-Ife is a city in Osun State, southwestern Nigeria, regarded in Yoruba tradition as the place where the world and humanity were created. Between about the 12th and 15th centuries its artists produced naturalistic heads and figures in terracotta and copper alloy. It is the seat of the Ooni of Ife.',
    countryCodes: ['NG'],
    tags: ['ile-ife', 'nigeria', 'yoruba', 'ife-art', 'terracotta', 'bronze-casting'],
    place: {
      historicalNames: ['Ife'],
      modernCountry: 'Nigeria',
      historicalRegion: 'Yorubaland',
      latitude: 7.4833,
      longitude: 4.5592,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'kano',
    title: 'Kano',
    wikipediaTitle: 'Kano (city)',
    summary:
      'Kano is a city in northern Nigeria and one of the oldest of the Hausa city-states. It grew as a walled commercial centre linked to trans-Saharan trade, known for its markets, textiles and indigo dye pits. After the jihad of the early 19th century it became an emirate within the Sokoto Caliphate.',
    countryCodes: ['NG'],
    tags: ['kano', 'nigeria', 'hausa', 'trans-saharan-trade', 'textiles', 'sokoto-caliphate'],
    place: {
      modernCountry: 'Nigeria',
      historicalRegion: 'Hausaland',
      latitude: 12.0,
      longitude: 8.5167,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'stone-town-zanzibar',
    title: 'Stone Town of Zanzibar',
    wikipediaTitle: 'Stone Town',
    summary:
      'Stone Town is the old part of Zanzibar City on the island of Unguja, Tanzania. It is a Swahili coastal trading town whose buildings reflect African, Arab, Persian, Indian and European influences. In the 19th century it was the seat of the Sultanate of Zanzibar, and it is a UNESCO World Heritage Site.',
    countryCodes: ['TZ'],
    tags: ['stone-town', 'zanzibar', 'tanzania', 'swahili-coast', 'indian-ocean-trade', 'unesco-world-heritage'],
    place: {
      modernCountry: 'Tanzania',
      historicalRegion: 'Swahili Coast',
      latitude: -6.1624,
      longitude: 39.1913,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'karnak',
    title: 'Karnak',
    wikipediaTitle: 'Karnak',
    summary:
      'Karnak is a vast temple complex at Luxor, the site of ancient Thebes, in Upper Egypt. Dedicated chiefly to the god Amun-Ra, it was built and extended over roughly two thousand years, from the Middle Kingdom to the Ptolemaic period. It forms part of the UNESCO World Heritage Site of Ancient Thebes with its Necropolis.',
    content:
      'Kushite kings of Egypt’s 25th Dynasty, including Taharqa, were among the many rulers who added structures to the complex.',
    countryCodes: ['EG'],
    tags: ['karnak', 'thebes', 'luxor', 'egypt', 'ancient-egypt', 'temple', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Ipet-isut', 'Thebes'],
      modernCountry: 'Egypt',
      historicalRegion: 'Upper Egypt',
      latitude: 25.7183,
      longitude: 32.6583,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'carthage',
    title: 'Carthage',
    wikipediaTitle: 'Carthage',
    summary:
      'Carthage is an ancient city on the coast of the Gulf of Tunis in present-day Tunisia. Founded by Phoenician settlers, traditionally in 814 BCE, it became the centre of a Mediterranean power that fought three wars with Rome. Rome destroyed the city in 146 BCE and later rebuilt it as a Roman city; the archaeological site is a UNESCO World Heritage Site.',
    countryCodes: ['TN'],
    tags: ['carthage', 'tunisia', 'phoenicians', 'punic-wars', 'archaeology', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Qart-ḥadasht', 'Carthago'],
      modernCountry: 'Tunisia',
      historicalRegion: 'North Africa (Ifriqiya)',
      latitude: 36.8526,
      longitude: 10.3235,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'gondar',
    title: 'Gondar',
    wikipediaTitle: 'Gondar',
    summary:
      'Gondar is a city in the Amhara Region of Ethiopia, founded by Emperor Fasilides in the 1630s as a royal capital. It remained the seat of the Ethiopian emperors until the mid-19th century. The royal enclosure of Fasil Ghebbi, with its castles and palaces, is a UNESCO World Heritage Site.',
    countryCodes: ['ET'],
    tags: ['gondar', 'ethiopia', 'fasil-ghebbi', 'solomonic-dynasty', 'unesco-world-heritage'],
    place: {
      historicalNames: ['Gonder'],
      modernCountry: 'Ethiopia',
      historicalRegion: 'Begemder',
      latitude: 12.6,
      longitude: 37.4667,
    },
  },
  {
    knowledgeType: 'place',
    slug: 'igbo-ukwu',
    title: 'Igbo-Ukwu',
    wikipediaTitle: 'Igbo-Ukwu',
    summary:
      'Igbo-Ukwu is a town in Anambra State, southeastern Nigeria, where archaeologists found finely cast bronze objects, beads and a richly furnished burial. Excavated by Thurstan Shaw in 1959–60 and 1964, the finds are dated to around the 9th–10th centuries CE. They are among the oldest known copper-alloy castings in West Africa.',
    countryCodes: ['NG'],
    timePeriod: 'c. 9th–10th century CE',
    tags: ['igbo-ukwu', 'nigeria', 'igbo', 'bronze-casting', 'archaeology', 'lost-wax-casting'],
    place: {
      modernCountry: 'Nigeria',
      historicalRegion: 'Igboland',
      latitude: 6.0167,
      longitude: 7.0167,
    },
  },
];

// ---------------------------------------------------------------------------
// Kingdoms and states
// ---------------------------------------------------------------------------
const KINGDOMS: CuratedEntry[] = [
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kingdom-of-kush',
    title: 'Kingdom of Kush',
    wikipediaTitle: 'Kingdom of Kush',
    summary:
      'Kush was a kingdom in Nubia, along the Nile in present-day Sudan, with its capitals first at Napata and later at Meroë. In the 8th and 7th centuries BCE its kings ruled Egypt as the 25th Dynasty. The kingdom developed its own Meroitic script and remained a regional power until about the 4th century CE.',
    countryCodes: ['SD', 'EG'],
    timePeriod: 'c. 8th century BCE–c. 4th century CE',
    tags: ['kush', 'nubia', 'sudan', 'napata', 'meroe', 'twenty-fifth-dynasty'],
    kingdomOrState: {
      politicalStructure: 'Monarchy',
      notableRulers: ['Piye', 'Taharqa', 'Amanirenas'],
      modernCountries: ['Sudan', 'Egypt'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kingdom-of-aksum',
    title: 'Kingdom of Aksum',
    wikipediaTitle: 'Kingdom of Aksum',
    summary:
      'Aksum was a trading kingdom in the northern Ethiopian highlands and Eritrea, with its capital at Aksum. It minted its own coins and traded across the Red Sea and the Indian Ocean. Under King Ezana in the 4th century CE it became one of the first states to adopt Christianity.',
    countryCodes: ['ET', 'ER'],
    timePeriod: 'c. 1st–10th century CE',
    tags: ['aksum', 'ethiopia', 'eritrea', 'red-sea-trade', 'christianity', 'geez'],
    kingdomOrState: {
      politicalStructure: 'Monarchy',
      notableRulers: ['Ezana', 'Kaleb'],
      modernCountries: ['Ethiopia', 'Eritrea'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'ghana-empire',
    title: 'Ghana Empire (Wagadu)',
    wikipediaTitle: 'Ghana Empire',
    summary:
      'The Ghana Empire, known to its Soninke people as Wagadu, was a West African state in the region of present-day southeastern Mauritania and western Mali. It grew rich by controlling the trade in gold from the south and salt from the Sahara. The Andalusian geographer al-Bakri described its capital and king in 1068.',
    content:
      'The site of Koumbi Saleh in Mauritania is widely identified as its capital. The dates of the empire’s founding and decline are uncertain.',
    countryCodes: ['MR', 'ML'],
    timePeriod: 'flourished c. 8th–11th century CE',
    tags: ['ghana-empire', 'wagadu', 'soninke', 'mauritania', 'mali', 'trans-saharan-trade'],
    kingdomOrState: {
      politicalStructure: 'Monarchy',
      notableRulers: ['Tunka Manin'],
      modernCountries: ['Mauritania', 'Mali'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'mali-empire',
    title: 'Mali Empire',
    wikipediaTitle: 'Mali Empire',
    summary:
      'The Mali Empire was a Mande state in West Africa founded by Sundiata Keita around 1235. At its height in the 14th century it stretched from the Atlantic coast across the Sahel and controlled major gold-producing areas and trading cities such as Timbuktu. Its rulers held the title mansa.',
    countryCodes: ['ML', 'SN', 'GN', 'GM', 'MR'],
    timePeriod: 'c. 1235–1670 CE',
    tags: ['mali-empire', 'mande', 'west-africa', 'sahel', 'gold-trade', 'timbuktu'],
    kingdomOrState: {
      foundingYear: 1235,
      dissolutionYear: 1670,
      politicalStructure: 'Monarchy (mansa)',
      notableRulers: ['Sundiata Keita', 'Mansa Musa', 'Mansa Sulayman'],
      modernCountries: ['Mali', 'Senegal', 'Guinea', 'The Gambia', 'Mauritania'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'songhai-empire',
    title: 'Songhai Empire',
    wikipediaTitle: 'Songhai Empire',
    summary:
      'The Songhai Empire was a West African state centred on the middle Niger River, with its capital at Gao. It expanded rapidly under Sunni Ali from 1464 and reached its greatest extent under the Askia dynasty. It collapsed after a Moroccan army defeated it at the Battle of Tondibi in 1591.',
    countryCodes: ['ML', 'NE'],
    timePeriod: 'c. 1464–1591 CE',
    tags: ['songhai', 'gao', 'mali', 'niger', 'askia-dynasty', 'west-africa'],
    kingdomOrState: {
      foundingYear: 1464,
      dissolutionYear: 1591,
      politicalStructure: 'Monarchy',
      notableRulers: ['Sunni Ali', 'Askia Muhammad I', 'Askia Dawud'],
      modernCountries: ['Mali', 'Niger'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kingdom-of-great-zimbabwe',
    title: 'Kingdom of Zimbabwe',
    wikipediaTitle: 'Kingdom of Great Zimbabwe',
    summary:
      'The Kingdom of Zimbabwe was a Shona state on the Zimbabwe Plateau with its capital at Great Zimbabwe. Its wealth rested on cattle and on trade in gold and ivory with the Swahili coast. Its decline in the 15th century was followed by the rise of the Mutapa and Torwa states.',
    countryCodes: ['ZW'],
    timePeriod: 'c. 1220–1450 CE',
    tags: ['great-zimbabwe', 'zimbabwe', 'shona', 'gold-trade', 'southern-africa'],
    kingdomOrState: {
      politicalStructure: 'Monarchy',
      modernCountries: ['Zimbabwe'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kingdom-of-mapungubwe',
    title: 'Kingdom of Mapungubwe',
    wikipediaTitle: 'Kingdom of Mapungubwe',
    summary:
      'Mapungubwe was a state in the middle Limpopo valley, where the borders of South Africa, Botswana and Zimbabwe meet today. It is regarded as the earliest known state in southern Africa, with an elite living on Mapungubwe Hill separated from commoners below. It traded gold and ivory towards the Indian Ocean coast and declined in the early 13th century.',
    countryCodes: ['ZA', 'BW', 'ZW'],
    timePeriod: 'c. 1075–1220 CE',
    tags: ['mapungubwe', 'south-africa', 'botswana', 'zimbabwe', 'limpopo', 'southern-africa'],
    kingdomOrState: {
      politicalStructure: 'Monarchy',
      modernCountries: ['South Africa', 'Botswana', 'Zimbabwe'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kingdom-of-benin',
    title: 'Kingdom of Benin',
    wikipediaTitle: 'Kingdom of Benin',
    summary:
      'The Kingdom of Benin was an Edo state in what is now southern Nigeria, ruled by the Oba from Benin City. It expanded greatly from the 15th century and maintained guilds of artists who produced brass plaques, heads and ivory carvings for the royal court. British forces conquered it in 1897; the monarchy continues today as a traditional institution.',
    countryCodes: ['NG'],
    timePeriod: 'c. 12th century–1897 CE',
    tags: ['kingdom-of-benin', 'edo', 'nigeria', 'oba', 'benin-bronzes'],
    kingdomOrState: {
      dissolutionYear: 1897,
      politicalStructure: 'Monarchy (Oba)',
      notableRulers: ['Ewuare', 'Esigie', 'Ovonramwen'],
      modernCountries: ['Nigeria'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kingdom-of-kongo',
    title: 'Kingdom of Kongo',
    wikipediaTitle: 'Kingdom of Kongo',
    summary:
      'Kongo was a kingdom in west-central Africa south of the lower Congo River, with its capital at Mbanza Kongo. Its rulers, titled manikongo, entered into relations with Portugal from the 1480s, and King Afonso I promoted Christianity in the early 16th century. The kingdom was gradually weakened by civil wars and the Atlantic slave trade, and became a Portuguese vassal before it was abolished in 1914.',
    countryCodes: ['AO', 'CD', 'CG'],
    timePeriod: 'c. 1390–1914 CE',
    tags: ['kongo', 'angola', 'congo', 'mbanza-kongo', 'central-africa'],
    kingdomOrState: {
      dissolutionYear: 1914,
      politicalStructure: 'Monarchy (manikongo)',
      notableRulers: ['Afonso I'],
      modernCountries: ['Angola', 'Democratic Republic of the Congo', 'Republic of the Congo'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'asante-empire',
    title: 'Asante Empire',
    wikipediaTitle: 'Asante Empire',
    summary:
      'The Asante Empire was an Akan state in present-day Ghana with its capital at Kumasi. It was formed around 1701 under Osei Tutu, whose authority was symbolised by the Golden Stool, and grew through trade in gold and kola. After a series of wars with Britain it was annexed in 1901, though the Asantehene remains a traditional ruler today.',
    countryCodes: ['GH'],
    timePeriod: '1701–1901 CE',
    tags: ['asante', 'ashanti', 'akan', 'ghana', 'kumasi', 'golden-stool'],
    kingdomOrState: {
      foundingYear: 1701,
      dissolutionYear: 1901,
      politicalStructure: 'Monarchy (Asantehene) over a confederation of Akan states',
      notableRulers: ['Osei Tutu', 'Opoku Ware I', 'Prempeh I'],
      modernCountries: ['Ghana'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'oyo-empire',
    title: 'Oyo Empire',
    wikipediaTitle: 'Oyo Empire',
    summary:
      'The Oyo Empire was a Yoruba state in what is now western Nigeria and the Republic of Benin, with its capital at Oyo-Ile. Its power rested largely on cavalry, and in the 17th and 18th centuries it dominated much of the region. The ruler, the Alaafin, governed alongside a council of chiefs known as the Oyo Mesi; the empire collapsed in the 1830s.',
    countryCodes: ['NG', 'BJ'],
    tags: ['oyo', 'yoruba', 'nigeria', 'benin', 'alaafin', 'west-africa'],
    kingdomOrState: {
      politicalStructure: 'Monarchy (Alaafin) with a council of state (Oyo Mesi)',
      notableRulers: ['Abiodun'],
      modernCountries: ['Nigeria', 'Benin'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'kanem-bornu-empire',
    title: 'Kanem–Bornu Empire',
    wikipediaTitle: 'Kanem–Bornu Empire',
    summary:
      'Kanem–Bornu was a long-lived state around Lake Chad, ruled for centuries by the Sayfawa dynasty. Originally centred in Kanem, north-east of the lake, its rulers moved to Bornu, to the west, in the late 14th century. It reached a high point under Mai Idris Alooma in the late 16th century and controlled important trans-Saharan routes.',
    countryCodes: ['TD', 'NG', 'NE', 'CM'],
    timePeriod: 'c. 9th–19th century CE',
    tags: ['kanem-bornu', 'lake-chad', 'chad', 'nigeria', 'sayfawa', 'trans-saharan-trade'],
    kingdomOrState: {
      politicalStructure: 'Monarchy (mai)',
      notableRulers: ['Dunama Dabbalemi', 'Idris Alooma'],
      modernCountries: ['Chad', 'Nigeria', 'Niger', 'Cameroon'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'ethiopian-empire',
    title: 'Ethiopian Empire (Solomonic dynasty)',
    wikipediaTitle: 'Ethiopian Empire',
    summary:
      'The Ethiopian Empire was ruled from 1270 by the Solomonic dynasty, which claimed descent from King Solomon and the Queen of Sheba. Its emperors bore the title nəgusä nägäst, "king of kings". It defeated Italy at the Battle of Adwa in 1896 and lasted until Emperor Haile Selassie was deposed in 1974.',
    countryCodes: ['ET', 'ER'],
    timePeriod: '1270–1974 CE',
    tags: ['ethiopia', 'solomonic-dynasty', 'ethiopian-empire', 'adwa', 'eritrea'],
    kingdomOrState: {
      foundingYear: 1270,
      dissolutionYear: 1974,
      politicalStructure: 'Monarchy (emperor)',
      notableRulers: ['Yekuno Amlak', 'Zara Yaqob', 'Fasilides', 'Tewodros II', 'Menelik II', 'Haile Selassie'],
      modernCountries: ['Ethiopia', 'Eritrea'],
    },
  },
  {
    knowledgeType: 'kingdom_or_state',
    slug: 'sokoto-caliphate',
    title: 'Sokoto Caliphate',
    wikipediaTitle: 'Sokoto Caliphate',
    summary:
      'The Sokoto Caliphate was an Islamic state founded in 1804 after a jihad led by the Fulani scholar Usman dan Fodio. It united many Hausa states and other territories into a federation of emirates under the caliph at Sokoto. It was one of the largest states in 19th-century Africa and was conquered by the British in 1903.',
    countryCodes: ['NG', 'NE', 'CM'],
    timePeriod: '1804–1903 CE',
    tags: ['sokoto-caliphate', 'nigeria', 'hausa', 'fulani', 'usman-dan-fodio', 'islamic-scholarship'],
    kingdomOrState: {
      foundingYear: 1804,
      dissolutionYear: 1903,
      politicalStructure: 'Caliphate (federation of emirates)',
      notableRulers: ['Usman dan Fodio', 'Muhammad Bello'],
      modernCountries: ['Nigeria', 'Niger', 'Cameroon'],
    },
  },
];

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------
const PEOPLE: CuratedEntry[] = [
  {
    knowledgeType: 'person',
    slug: 'sundiata-keita',
    title: 'Sundiata Keita',
    wikipediaTitle: 'Sundiata Keita',
    summary:
      'Sundiata Keita was the founder of the Mali Empire in the 13th century. According to tradition he defeated Sumanguru, king of Sosso, at the Battle of Kirina around 1235. His life is the subject of the Epic of Sundiata, which Mande griots have passed down orally for centuries.',
    countryCodes: ['ML', 'GN'],
    timePeriod: '13th century CE',
    tags: ['sundiata-keita', 'mali-empire', 'mande', 'epic-of-sundiata', 'griots'],
    person: {
      alternativeNames: ['Sunjata', 'Mari Djata'],
      deathYear: 1255,
      isApproximateDates: true,
      era: '13th century',
      occupations: ['Ruler', 'Founder of the Mali Empire'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'mansa-musa',
    title: 'Mansa Musa',
    wikipediaTitle: 'Mansa Musa',
    summary:
      'Mansa Musa ruled the Mali Empire in the early 14th century. His pilgrimage to Mecca in 1324–25, during which he spent and gave away large amounts of gold in Cairo, made Mali known across the Mediterranean world. He sponsored building projects including the Djinguereber Mosque in Timbuktu.',
    countryCodes: ['ML'],
    timePeriod: 'reigned c. 1312–1337 CE',
    tags: ['mansa-musa', 'mali-empire', 'hajj', 'timbuktu', 'gold-trade'],
    person: {
      alternativeNames: ['Musa I of Mali', 'Kankan Musa'],
      isApproximateDates: true,
      era: '14th century',
      occupations: ['Ruler'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'askia-muhammad-i',
    title: 'Askia Muhammad I',
    wikipediaTitle: 'Askia Muhammad I',
    summary:
      'Askia Muhammad I took power in the Songhai Empire in 1493 and founded the Askia dynasty. He expanded the empire, reorganised its administration and supported Islamic learning, and made the pilgrimage to Mecca in 1496–97. He was deposed by his son in 1528.',
    countryCodes: ['ML', 'NE'],
    timePeriod: 'reigned 1493–1528 CE',
    tags: ['askia-muhammad', 'songhai', 'gao', 'askia-dynasty', 'islamic-scholarship'],
    person: {
      alternativeNames: ['Askia the Great', 'Muhammad Ture'],
      birthYear: 1443,
      deathYear: 1538,
      isApproximateDates: true,
      era: '15th–16th century',
      occupations: ['Ruler'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'ezana-of-aksum',
    title: 'Ezana of Aksum',
    wikipediaTitle: 'Ezana of Axum',
    summary:
      'Ezana was king of Aksum in the 4th century CE. He was the first Aksumite ruler to adopt Christianity, under the influence of his tutor Frumentius, and his later coins replaced pagan symbols with the cross. Inscriptions recording his campaigns survive in Ge’ez, Sabaean and Greek.',
    countryCodes: ['ET', 'ER'],
    timePeriod: '4th century CE',
    tags: ['ezana', 'aksum', 'ethiopia', 'christianity', 'geez', 'inscriptions'],
    person: {
      alternativeNames: ['Aezanas'],
      isApproximateDates: true,
      era: '4th century CE',
      occupations: ['Ruler'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'amanirenas',
    title: 'Amanirenas',
    wikipediaTitle: 'Amanirenas',
    summary:
      'Amanirenas was a queen (kandake) of the Kingdom of Kush in the late 1st century BCE. She is associated with the war against Roman Egypt in the 20s BCE, during which Kushite forces attacked Syene (Aswan). The conflict ended in a treaty that was favourable to Kush.',
    content:
      'A bronze head of the emperor Augustus, found buried at Meroë and now known as the Meroë Head, is generally thought to have been taken during this war.',
    countryCodes: ['SD'],
    timePeriod: 'late 1st century BCE',
    tags: ['amanirenas', 'kandake', 'kush', 'meroe', 'nubia', 'rome'],
    person: {
      isApproximateDates: true,
      era: '1st century BCE',
      occupations: ['Ruler', 'Military leader'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'nzinga-of-ndongo-and-matamba',
    title: 'Nzinga of Ndongo and Matamba',
    wikipediaTitle: 'Nzinga of Ndongo and Matamba',
    summary:
      'Nzinga was a 17th-century ruler of the Mbundu kingdoms of Ndongo and Matamba in present-day Angola. She first came to prominence as an envoy negotiating with the Portuguese in Luanda in 1622. Over decades of warfare and diplomacy she resisted Portuguese expansion and ruled Matamba until her death in 1663.',
    countryCodes: ['AO'],
    timePeriod: '17th century CE',
    tags: ['nzinga', 'ndongo', 'matamba', 'angola', 'mbundu', 'resistance'],
    person: {
      alternativeNames: ['Njinga Mbande', 'Ana de Sousa Nzinga Mbande'],
      birthYear: 1583,
      deathYear: 1663,
      isApproximateDates: true,
      era: '17th century',
      occupations: ['Ruler', 'Diplomat', 'Military leader'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'zera-yacob-philosopher',
    title: 'Zera Yacob (philosopher)',
    wikipediaTitle: 'Zera Yacob (philosopher)',
    summary:
      'Zera Yacob is the name given to the author of the Hatata, a 17th-century Ge’ez work of philosophy from Ethiopia. The text argues that truth should be sought through reason and criticises religious doctrines that cannot be justified by it. Its authorship has been debated: some scholars have argued it was written by the Italian Capuchin Giusto d’Urbino in the 19th century, while others defend its Ethiopian origin.',
    countryCodes: ['ET'],
    timePeriod: '17th century CE',
    tags: ['zera-yacob', 'hatata', 'ethiopian-philosophy', 'geez', 'rationalism'],
    person: {
      alternativeNames: ['Zär’a Ya’əqob'],
      birthYear: 1599,
      isApproximateDates: true,
      era: '17th century',
      occupations: ['Philosopher'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'ahmad-baba-al-timbukti',
    title: 'Ahmad Baba al-Timbukti',
    wikipediaTitle: 'Ahmad Baba al-Timbukti',
    summary:
      'Ahmad Baba was a scholar of Islamic law from Timbuktu and one of the most prolific writers of the Songhai period. After the Moroccan conquest he was deported to Marrakesh, where he taught for several years before returning to Timbuktu. The Ahmed Baba Institute, which holds a major manuscript collection in Timbuktu, is named after him.',
    countryCodes: ['ML'],
    timePeriod: '16th–17th century CE',
    tags: ['ahmad-baba', 'timbuktu', 'islamic-law', 'manuscripts', 'scholarship'],
    person: {
      alternativeNames: ['Ahmad Baba al-Massufi', 'Ahmed Baba'],
      birthYear: 1556,
      deathYear: 1627,
      era: '16th–17th century',
      occupations: ['Jurist', 'Scholar', 'Writer'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'yaa-asantewaa',
    title: 'Yaa Asantewaa',
    wikipediaTitle: 'Yaa Asantewaa',
    summary:
      'Yaa Asantewaa was the queen mother of Ejisu in the Asante Empire. In 1900 she led the Asante uprising against British colonial rule known as the War of the Golden Stool, after the British governor demanded the stool. She was captured and exiled to the Seychelles, where she died in 1921.',
    countryCodes: ['GH'],
    timePeriod: 'late 19th–early 20th century CE',
    tags: ['yaa-asantewaa', 'asante', 'ghana', 'golden-stool', 'resistance', 'women-leaders'],
    person: {
      deathYear: 1921,
      era: 'Late 19th–early 20th century',
      occupations: ['Queen mother', 'Military leader'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'shaka',
    title: 'Shaka',
    wikipediaTitle: 'Shaka',
    summary:
      'Shaka kaSenzangakhona was king of the Zulu from about 1816 until his death in 1828. He reorganised Zulu military forces and built the Zulu kingdom into a major power in south-eastern Africa through conquest and incorporation of neighbouring groups. He was assassinated by his half-brothers, including Dingane, who succeeded him.',
    countryCodes: ['ZA'],
    timePeriod: 'early 19th century CE',
    tags: ['shaka', 'zulu', 'south-africa', 'zulu-kingdom', 'kwazulu-natal'],
    person: {
      alternativeNames: ['Shaka kaSenzangakhona', 'Shaka Zulu'],
      birthYear: 1787,
      deathYear: 1828,
      isApproximateDates: true,
      era: 'Early 19th century',
      occupations: ['Ruler', 'Military leader'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'idia-iyoba-of-benin',
    title: 'Idia, Iyoba of Benin',
    wikipediaTitle: 'Idia',
    summary:
      'Idia was the mother of Oba Esigie of Benin, who reigned in the early 16th century. Tradition credits her with political and military support that helped secure his rule, and Esigie created the title of Iyoba (queen mother) in her honour. Ivory pendant masks thought to represent her are among the best-known works of Benin court art.',
    countryCodes: ['NG'],
    timePeriod: 'late 15th–early 16th century CE',
    tags: ['idia', 'iyoba', 'kingdom-of-benin', 'edo', 'nigeria', 'women-leaders', 'benin-ivory'],
    person: {
      alternativeNames: ['Queen Idia', 'Iyoba Idia'],
      isApproximateDates: true,
      era: 'Late 15th–early 16th century',
      occupations: ['Queen mother', 'Political adviser'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'ewuare',
    title: 'Ewuare',
    wikipediaTitle: 'Ewuare',
    summary:
      'Ewuare was an Oba of Benin who reigned in the mid-15th century. Benin traditions credit him with greatly expanding the kingdom, rebuilding Benin City and strengthening the institutions of royal government. He is often called Ewuare the Great.',
    countryCodes: ['NG'],
    timePeriod: 'reigned c. 1440–1473 CE',
    tags: ['ewuare', 'oba', 'kingdom-of-benin', 'edo', 'nigeria'],
    person: {
      alternativeNames: ['Ewuare the Great'],
      isApproximateDates: true,
      era: '15th century',
      occupations: ['Ruler'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'cheikh-anta-diop',
    title: 'Cheikh Anta Diop',
    wikipediaTitle: 'Cheikh Anta Diop',
    summary:
      'Cheikh Anta Diop was a Senegalese historian, anthropologist and physicist. In works such as Nations nègres et culture (1954) he argued that ancient Egyptian civilisation was African in its population and culture; these arguments were influential and remain debated. Cheikh Anta Diop University in Dakar is named after him.',
    countryCodes: ['SN'],
    timePeriod: '20th century',
    tags: ['cheikh-anta-diop', 'senegal', 'historiography', 'ancient-egypt', 'pan-africanism'],
    person: {
      birthYear: 1923,
      deathYear: 1986,
      era: '20th century',
      occupations: ['Historian', 'Anthropologist', 'Physicist', 'Politician'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'kwame-nkrumah',
    title: 'Kwame Nkrumah',
    wikipediaTitle: 'Kwame Nkrumah',
    summary:
      'Kwame Nkrumah led the Gold Coast to independence as Ghana in 1957, becoming its first prime minister and, from 1960, its first president. A leading Pan-Africanist, he helped found the Organisation of African Unity in 1963. He was overthrown in a military coup in 1966.',
    countryCodes: ['GH'],
    timePeriod: '20th century',
    tags: ['kwame-nkrumah', 'ghana', 'independence', 'pan-africanism', 'organisation-of-african-unity'],
    person: {
      birthYear: 1909,
      deathYear: 1972,
      era: '20th century',
      occupations: ['Politician', 'Political theorist'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'wangari-maathai',
    title: 'Wangarĩ Maathai',
    wikipediaTitle: 'Wangarĩ Maathai',
    summary:
      'Wangarĩ Maathai was a Kenyan environmentalist and political activist who founded the Green Belt Movement in 1977, which has organised the planting of millions of trees. In 2004 she became the first African woman to receive the Nobel Peace Prize. She also served as a member of the Kenyan parliament.',
    countryCodes: ['KE'],
    timePeriod: '20th–21st century',
    tags: ['wangari-maathai', 'kenya', 'green-belt-movement', 'environment', 'nobel-peace-prize'],
    person: {
      alternativeNames: ['Wangari Maathai'],
      birthYear: 1940,
      deathYear: 2011,
      era: '20th–21st century',
      occupations: ['Environmentalist', 'Biologist', 'Politician'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'chinua-achebe',
    title: 'Chinua Achebe',
    wikipediaTitle: 'Chinua Achebe',
    summary:
      'Chinua Achebe was a Nigerian novelist, poet and critic. His first novel, Things Fall Apart (1958), depicts Igbo society at the arrival of colonial rule and is one of the most widely read works of African literature. He was also founding editor of Heinemann’s African Writers Series.',
    countryCodes: ['NG'],
    timePeriod: '20th–21st century',
    tags: ['chinua-achebe', 'nigeria', 'igbo', 'literature', 'things-fall-apart'],
    person: {
      birthYear: 1930,
      deathYear: 2013,
      era: '20th–21st century',
      occupations: ['Novelist', 'Poet', 'Critic'],
    },
  },
  {
    knowledgeType: 'person',
    slug: 'funmilayo-ransome-kuti',
    title: 'Funmilayo Ransome-Kuti',
    wikipediaTitle: 'Funmilayo Ransome-Kuti',
    summary:
      'Funmilayo Ransome-Kuti was a Nigerian educator and political activist. In the 1940s she led the Abeokuta Women’s Union in campaigns against unfair taxation of market women, which led to the temporary abdication of the Alake of Abeokuta. She was a prominent figure in Nigeria’s anti-colonial and women’s rights movements.',
    countryCodes: ['NG'],
    timePeriod: '20th century',
    tags: ['funmilayo-ransome-kuti', 'nigeria', 'abeokuta', 'womens-rights', 'anti-colonialism'],
    person: {
      birthYear: 1900,
      deathYear: 1978,
      era: '20th century',
      occupations: ['Educator', 'Political activist'],
    },
  },
];

export const CURATED_ENTRIES: CuratedEntry[] = [...PLACES, ...KINGDOMS, ...PEOPLE];

export class CuratedImporter extends BaseImporter<CuratedEntry> {
  readonly name = 'AfroArchive Curated Seed Importer';
  readonly sourceSlug = 'afroarchive-seed';
  readonly sourceName = 'AfroArchive Editorial';
  readonly connectorType = 'manual';
  readonly baseUrl = '';

  protected rateLimitMs = 0;

  async fetchBatch(
    cursor?: string | number,
    limit: number = 25,
    _options?: ConnectorOptions
  ): Promise<BatchFetchResult<CuratedEntry>> {
    void _options;
    const offset = typeof cursor === 'number' ? cursor : parseInt(String(cursor ?? 0), 10) || 0;
    const records = CURATED_ENTRIES.slice(offset, offset + limit);
    const next = offset + records.length;
    const hasMore = next < CURATED_ENTRIES.length;
    return { records, nextCursor: hasMore ? next : null, hasMore };
  }

  async normalize(entry: CuratedEntry): Promise<NormalizedItem | null> {
    const url = entry.wikipediaTitle ? wikipediaUrl(entry.wikipediaTitle) : '';

    const entityData: EntityData =
      entry.knowledgeType === 'place'
        ? { place: entry.place }
        : entry.knowledgeType === 'kingdom_or_state'
          ? { kingdomOrState: entry.kingdomOrState }
          : { person: entry.person };

    return {
      slug: entry.slug,
      title: entry.title,
      summary: entry.summary,
      content: entry.content,
      knowledgeType: entry.knowledgeType,
      sourceSlug: this.sourceSlug,
      sourceRecordId: entry.slug,
      sourceUrl: url,
      originalUrl: url || undefined,
      externalIds: {},
      rights: { ...EDITORIAL_RIGHTS },
      languageCode: 'en',
      countryCodes: entry.countryCodes,
      timePeriod: entry.timePeriod,
      metadata: { editorial: true },
      tags: entry.tags,
      entityData,
    };
  }
}
