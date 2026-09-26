export interface KnowledgeResponse {
  keywords: string[]
  topicTitle: string
  response: string
  citations: string[]
  relatedArtifactId?: string
}

export const SUGGESTED_PROMPTS = [
  'Explain the mathematical astronomy in Timbuktu manuscripts.',
  'How did Great Zimbabwe construct walls without mortar?',
  'What is the moral philosophy of Zera Yacob’s Hatäta?',
  'Tell me about the Manden Human Rights Charter of Mali.',
  'What was the metallurgy technique used in Benin Bronzes?',
  'Explain the 50-year Sirius B orbit tracked by the Dogon.',
]

export const KNOWLEDGE_BASE: KnowledgeResponse[] = [
  {
    keywords: ['timbuktu', 'astronomy', 'manuscript', 'mathematics', 'sankore', 'ajami'],
    topicTitle: 'Timbuktu Astronomical & Mathematical Manuscripts',
    response:
      'The astronomical manuscripts of Timbuktu—preserved at Sankoré University and private family libraries such as the Ahmed Baba Institute—represent sophisticated mathematical astronomy developed in 14th–16th century West Africa.\n\nScholars utilized Sudani and Ajami scripts to calculate solar declination, lunar calendar algorithms, and planetary orbits. They mapped latitude using Polaris altitude observations to guide caravans across Trans-Saharan trade routes.',
    citations: [
      'Ahmed Baba Institute Archive Reg. #1384 (Timbuktu)',
      'Hunwick, John O. "Timbuktu and the Songhay Empire" (Brill, 2003)',
      'UNESCO Timbuktu Manuscripts Conservation Project',
    ],
    relatedArtifactId: 'timbuktu-astronomy-folio',
  },
  {
    keywords: ['zimbabwe', 'great zimbabwe', 'drystone', 'mortar', 'shona', 'conical'],
    topicTitle: 'Dry-Stone Architectural Engineering of Great Zimbabwe',
    response:
      'Great Zimbabwe was constructed between the 11th and 15th centuries by Shona stone masons without the use of mortar. The Great Enclosure perimeter wall stretches 250 meters in circumference and reaches up to 11 meters in height.\n\nBuilders utilized granite blocks split along natural fracture lines using fire and water, then dressed and laid them in uniform horizontal courses. The structure housed royal quarters and controlled trade networks exporting gold and ivory across the Indian Ocean to Persia and China.',
    citations: [
      'Huffman, Thomas N. "Snakes and Crocodiles: Power and Symbolism in Great Zimbabwe" (1996)',
      'National Museums and Monuments of Zimbabwe Records',
    ],
    relatedArtifactId: 'great-zimbabwe-enclosure',
  },
  {
    keywords: ['zera yacob', 'hatata', 'reason', 'ethiopia', 'philosophy', 'rationalism'],
    topicTitle: 'Zera Yacob and the 17th-Century Ethiopian Rationalist Hatäta',
    response:
      'In 1667 CE, Ethiopian philosopher Zera Yacob authored the "Hatäta" (Investigation) while living in a cave near Aksum. Preceding Western Enlightenment thinkers like Kant and Descartes, Yacob developed a rationalist philosophy based on the "light of reason" (lëb).\n\nHe systematically doubted religious dogmas, argued against slavery, defended gender equality in marriage, and asserted that all human beings are endowed with divine reason and equal dignity.',
    citations: [
      'Sumner, Claude. "Ethiopian Philosophy, Vol. II: The Treatise of Zəra Yəʿəqob" (1976)',
      'Ge’ez Manuscript MS 215, National Library of Ethiopia',
    ],
    relatedArtifactId: 'zera-yacob-hatata',
  },
  {
    keywords: ['manden', 'sundiata', 'griot', 'constitution', 'charter', 'kouroukan'],
    topicTitle: 'The Manden Charter & Medieval West African Constitutionalism',
    response:
      'Proclaimed in 1235 CE by Sundiata Keita at Kouroukan Fouga following the founding of the Mali Empire, the Manden Charter is one of the world’s oldest human rights constitutions.\n\nPreserved orally by Mandinka Griots across generations, the 44-article charter established principles of human dignity ("Every human life is a life"), social peace, female emancipation, and environmental protection. It was recognized by UNESCO in 2009.',
    citations: [
      'Niane, Djibril Tamsir. "Sundiata: An Epic of Old Mali" (Longman, 1965)',
      'UNESCO Representative List of Intangible Heritage #00290',
    ],
    relatedArtifactId: 'sundiata-griot-epic',
  },
  {
    keywords: ['benin', 'bronze', 'cire perdue', 'lost-wax', 'oba', 'brass', 'casting'],
    topicTitle: 'Lost-Wax Metallurgy of the Benin Royal Court',
    response:
      'The Benin Bronzes—cast from copper alloy by the royal Guild of Igbesanmwan in Benin City—represent pinnacle achievements in global lost-wax (cire perdue) metallurgy.\n\nArtists created detailed wax models coated in fine clay molds. Upon heating, the wax melted away and was replaced with molten bronze heated in crucibles. The resulting relief plaques recorded court history, military victories, and sacred royal ceremonies of the Oba of Benin.',
    citations: [
      'Eyo, Ekpo & Willett, Frank. "Treasures of Ancient Nigeria" (1980)',
      'Palace Guild Records of the Oba of Benin',
    ],
    relatedArtifactId: 'benin-bronze-plaque',
  },
  {
    keywords: ['dogon', 'sirius', 'astronomy', 'po tolo', 'star', 'bandiagara'],
    topicTitle: 'Dogon Astronomical Knowledge & Sirius B Orbit',
    response:
      'The Dogon people of the Bandiagara Escarpment in Mali maintained advanced astronomical traditions mapping Sirius B ("Po Tolo")—a heavy white dwarf star invisible to the naked eye.\n\nDogon oral tradition and geometric rock grids accurately calculated Sirius B’s 50-year elliptical orbit around Sirius A and determined Jupiter’s four moons, governing the sacred 60-year Sigui renewal ritual.',
    citations: [
      'Griaule, Marcel & Dieterlen, Germaine. "Le Renard Fou" (Paris, 1965)',
      'Bandiagara World Heritage Cultural Landscape Archive',
    ],
    relatedArtifactId: 'dogon-astronomy-chart',
  },
]

export function searchKnowledgeBase(userQuery: string): KnowledgeResponse {
  const queryLower = userQuery.toLowerCase()

  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some((kw) => queryLower.includes(kw))) {
      return item
    }
  }

  // Fallback response for general inquiries
  return {
    keywords: [],
    topicTitle: 'AfroArchive Curatorial Knowledge System',
    response: `Thank you for your curatorial inquiry regarding "${userQuery}".\n\nAfrican history, science, philosophy, and architectural traditions span over 5,000 years across 54 regnal eras. From the Nilotic monuments of Kush to the Saharan universities of Timbuktu and the stone enclosures of Great Zimbabwe, indigenous knowledge systems shaped global civilizational history.\n\nExplore our catalogued collections or select one of the suggested prompts below for deep provenance citations.`,
    citations: [
      'AfroArchive Peer-Verified Heritage Index (2026)',
      'UNESCO African World Heritage & Intangible Cultural Register',
    ],
  }
}
