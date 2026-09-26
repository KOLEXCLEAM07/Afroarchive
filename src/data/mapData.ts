export interface RegionProfile {
  id: string
  regionKey: string
  name: string
  subtitle: string
  empires: string[]
  capitals: string[]
  tradeGoods: string[]
  architecturalStyle: string
  famousManuscriptOrArtifact: string
  summary: string
  coordinates: { x: number; y: number }
  color: string
}

export const MAP_REGIONS: RegionProfile[] = [
  {
    id: 'reg-west',
    regionKey: 'west',
    name: 'West African Sahel & Forest Kingdoms',
    subtitle: 'Mali, Songhai, Ghana, Benin & Ifẹ Civilizations',
    empires: ['Mali Empire', 'Songhai Empire', 'Ghana Empire (Wagadou)', 'Kingdom of Benin', 'Ifẹ Kingdom', 'Ashanti Empire'],
    capitals: ['Timbuktu', 'Niani', 'Gao', 'Kumbi Saleh', 'Benin City', 'Ile-Ife', 'Kumasi'],
    tradeGoods: ['Gold', 'Salt', 'Lost-Wax Bronzes', 'Ivory', 'Kola Nuts'],
    architecturalStyle: 'Sudano-Sahelian Earthen Architecture & Earthwork Fortifications',
    famousManuscriptOrArtifact: 'Timbuktu Astronomical Folios & Benin Royal Bronze Plaques',
    summary: 'The epicenter of medieval Trans-Saharan gold and salt trade, Sankoré University scholarship, lost-wax metallurgy, and massive pre-industrial earthwork fortifications.',
    coordinates: { x: 28, y: 44 },
    color: '#D4A034',
  },
  {
    id: 'reg-horn-nile',
    regionKey: 'east',
    name: 'Horn of Africa & Nile Valley',
    subtitle: 'Kush, Aksum, Zagwe & Solomonic Dynasties',
    empires: ['Kingdom of Kush / Meroë', 'Empire of Aksum', 'Zagwe Dynasty', 'Solomonic Empire'],
    capitals: ['Meroë', 'Napata', 'Aksum', 'Lalibela', 'Gondar'],
    tradeGoods: ['Gold', 'Myrrh', 'Incense', 'Ivory', 'Iron Weapons'],
    architecturalStyle: 'Monolithic Granite Stelae & Bedrock Rock-Hewn Churches',
    famousManuscriptOrArtifact: 'Stele of Aksum & Ge’ez Kebra Nagast Manuscripts',
    summary: 'Home to ancient Nilotic pyramid builders, Red Sea maritime trade, monolithic granite obelisks, and rock-carved churches active for over 1,500 years.',
    coordinates: { x: 68, y: 38 },
    color: '#E4B856',
  },
  {
    id: 'reg-north',
    regionKey: 'north',
    name: 'North Africa & Mediterranean Basin',
    subtitle: 'Kemet / Egypt, Carthage, Almoravid & Almohad Dynasties',
    empires: ['Kemet (Ancient Egypt)', 'Carthaginian Republic', 'Almoravid Empire', 'Fatimid Caliphate'],
    capitals: ['Memphis', 'Thebes', 'Carthage', 'Marrakech', 'Cairo'],
    tradeGoods: ['Papyrus', 'Grain', 'Olive Oil', 'Textiles', 'Copper'],
    architecturalStyle: 'Classical Stone Temples, Pyramids & Moorish Courtyard Architecture',
    famousManuscriptOrArtifact: 'Precepts of Ptahhotep & Prisse Papyrus',
    summary: 'The cradle of early Nilotic monumental stone architecture, Mediterranean maritime commerce, papyrus scholarship, and Moorish intellectual synthesis.',
    coordinates: { x: 48, y: 18 },
    color: '#B8860B',
  },
  {
    id: 'reg-east-swahili',
    regionKey: 'east',
    name: 'Swahili Coast Maritime Kingdoms',
    subtitle: 'Kilwa Kisiwani, Mombasa, Zanzibar & Sofala Sultanates',
    empires: ['Kilwa Sultanate', 'Mombasa City-State', 'Zanzibar Sultanate', 'Pate Kingdom'],
    capitals: ['Kilwa Kisiwani', 'Mombasa', 'Stone Town Zanzibar', 'Sofala'],
    tradeGoods: ['Gold', 'Ivory', 'Spices (Clove, Cinnamon)', 'Coral Stone', 'Porcelain Trade'],
    architecturalStyle: 'Coral-Rag Stone Mosques, Carved Omani Doors & Coastal Palaces',
    famousManuscriptOrArtifact: 'Kilwa Great Mosque Coral Architecture & Swahili Utendi Manuscripts',
    summary: 'A thriving medieval Indian Ocean maritime network linking African gold and ivory exporters directly to Arabia, Persia, India, and Ming Dynasty China.',
    coordinates: { x: 74, y: 58 },
    color: '#3A5243',
  },
  {
    id: 'reg-southern',
    regionKey: 'southern',
    name: 'Southern African Kingdoms',
    subtitle: 'Great Zimbabwe, Mapungubwe & Mutapa Empire',
    empires: ['Great Zimbabwe Kingdom', 'Kingdom of Mapungubwe', 'Mutapa Empire', 'Rozvi Empire'],
    capitals: ['Great Zimbabwe', 'Mapungubwe Hill', 'Kama'],
    tradeGoods: ['Gold Bullion', 'Copper Ore', 'Ivory', 'Iron Smelted Tools'],
    architecturalStyle: 'Dry-Stone Mortarless Granite Masonry Walls & Conical Towers',
    famousManuscriptOrArtifact: 'Great Zimbabwe Conical Tower & Golden Rhinoceros of Mapungubwe',
    summary: 'Famous for monumental dry-stone wall construction engineered without mortar, sophisticated gold metallurgy, and trade extending to Indian Ocean ports.',
    coordinates: { x: 56, y: 78 },
    color: '#8A7C6E',
  },
]
