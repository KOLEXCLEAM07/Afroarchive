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
  'What is the debate over Dogon knowledge of Sirius?',
]

export const KNOWLEDGE_BASE: KnowledgeResponse[] = [
  {
    keywords: ['timbuktu', 'astronomy', 'manuscript', 'mathematics', 'sankore', 'ajami'],
    topicTitle: 'Timbuktu Astronomical & Mathematical Manuscripts',
    response:
      'Timbuktu became a major centre of Islamic learning from about the 15th to the 17th century, with scholars teaching around the Sankoré, Djinguereber and Sidi Yahya mosques. Its manuscripts are held today both by the Ahmed Baba Institute of Higher Learning and Islamic Research, a state research institute, and by private family libraries such as the Mamma Haidara library.\n\nThe manuscripts are mostly in Arabic, written in West African (Sudani-style) hands, and some are in African languages written in Arabic script (Ajami). Astronomical and mathematical texts among them deal with practical questions such as setting the lunar calendar, finding prayer times and determining the direction of Mecca.',
    citations: [
      'Jeppie, Shamil & Diagne, Souleymane Bachir (eds.). "The Meanings of Timbuktu" (HSRC Press, 2008)',
      'Hunwick, John O. "Timbuktu and the Songhay Empire: Al-Sa‘dī’s Ta’rīkh al-sūdān down to 1613" (Brill, 1999)',
    ],
    relatedArtifactId: 'timbuktu-astronomy-folio',
  },
  {
    keywords: ['zimbabwe', 'great zimbabwe', 'drystone', 'mortar', 'shona', 'conical'],
    topicTitle: 'Dry-Stone Architectural Engineering of Great Zimbabwe',
    response:
      'Great Zimbabwe was built mainly between the 11th and 15th centuries by ancestors of the Shona, without the use of mortar. The outer wall of the Great Enclosure is about 250 meters long and up to about 11 meters high.\n\nGranite on the surrounding hills naturally splits into slabs, a process that heating and cooling can speed up. Builders shaped these slabs into blocks and laid them in roughly even horizontal courses. The site was the seat of a ruling elite whose wealth came from gold and ivory exported through Swahili coast ports into Indian Ocean trade.',
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
      'The "Hatäta" (Inquiry) of Zera Yacob is a Ge’ez text dated 1667. It tells how the author, born near Aksum in 1599, fled religious persecution and lived for about two years in a cave near the Tekezé River, where he reflected on faith and reason. Written roughly a generation after Descartes (d. 1650), it is often compared with his work. It develops a rationalist philosophy based on the "light of the heart" (lëb), the reason God gives every person.\n\nThe text weighs religious claims by reason, criticises the buying and selling of people, defends equality between husband and wife, and holds that all human beings are equal before God. Its authorship is debated: in 1920 Carlo Conti Rossini argued that the Capuchin Giusto d’Urbino composed it. Claude Sumner defended Ethiopian authorship, and recent scholars (e.g. Ralph Lee, Anaïs Wion) remain divided.',
    citations: [
      'Sumner, Claude. "Ethiopian Philosophy, Vol. II: The Treatise of Zär’a Ya‘eqob and of Wäldä Ḥeywat" (1976)',
      'Ge’ez manuscripts, Bibliothèque nationale de France, Paris (Antoine d’Abbadie collection)',
    ],
    relatedArtifactId: 'zera-yacob-hatata',
  },
  {
    keywords: ['manden', 'sundiata', 'griot', 'constitution', 'charter', 'kouroukan'],
    topicTitle: 'The Manden Charter & Medieval West African Constitutionalism',
    response:
      'Oral tradition holds that after the Battle of Kirina (c. 1235), Sundiata Keita called an assembly at Kouroukan Fouga, where rules were laid down for the new Mali Empire. Griots (jeliw) passed these traditions down orally. They are often presented as an early declaration of social rules and rights.\n\nThe written versions are modern. A 1998 reconstruction made in Kankan, Guinea, sets the rules out as 44 articles, and the related "Manden Charter" (hunters’ oath) opens with the principle that every human life is a life. Historians debate how closely these texts reflect 13th-century originals. UNESCO inscribed "The Manden Charter, proclaimed in Kurukan Fuga" on its intangible heritage list in 2009.',
    citations: [
      'Niane, Djibril Tamsir. "Sundiata: An Epic of Old Mali" (Longman, 1965)',
      'UNESCO Representative List of the Intangible Cultural Heritage of Humanity: “The Manden Charter, proclaimed in Kurukan Fuga” (2009)',
    ],
    relatedArtifactId: 'sundiata-griot-epic',
  },
  {
    keywords: ['benin', 'bronze', 'cire perdue', 'lost-wax', 'oba', 'brass', 'casting'],
    topicTitle: 'Lost-Wax Metallurgy of the Benin Royal Court',
    response:
      'The "Benin Bronzes" are mostly brass. They were cast by the royal brass casters’ guild, Igun Eronmwon, in Benin City; the ivory carvers belonged to a separate guild, Igbesanmwan. The casters used the lost-wax (cire perdue) method. They modelled each piece in wax, covered it in clay, and heated the mould so the wax ran out. Molten brass was then poured into the space the wax had left.\n\nGeochemical analysis (Skowronek et al., 2023) shows that much of the metal came from brass manillas, ring-shaped trade currency made in the German Rhineland and brought by Portuguese and other European traders. The relief plaques, many from the 16th–17th centuries, depict court ceremony, officials and warriors of the Oba’s court.',
    citations: [
      'Eyo, Ekpo & Willett, Frank. "Treasures of Ancient Nigeria" (Knopf, 1980)',
      'Skowronek, Tobias B. et al. "German brass for Benin Bronzes: Geochemical analysis insights into the early Atlantic trade." PLOS ONE (2023)',
    ],
    relatedArtifactId: 'benin-bronze-plaque',
  },
  {
    keywords: ['dogon', 'sirius', 'astronomy', 'po tolo', 'star', 'bandiagara'],
    topicTitle: 'Dogon Cosmology & the Sirius Debate',
    response:
      'The Dogon of the Bandiagara Escarpment in Mali have a rich cosmology and ritual life, including the Sigui ceremony, held about once every 60 years (most recently 1967–1973).\n\nFrench anthropologists Marcel Griaule and Germaine Dieterlen reported in 1950, and again in "Le Renard pâle" (1965), that some Dogon informants knew of an invisible, very heavy companion of Sirius ("po tolo") orbiting it in about 50 years, which resembles the white dwarf Sirius B. They also reported knowledge of Jupiter’s moons and Saturn’s ring. However, when Walter van Beek’s team restudied the Dogon, they found no such knowledge among their informants (published in 1991). Most anthropologists consider the claims unproven, and they are often attributed to the way the interviews were conducted or to outside contact. Dogon cosmology remains valuable in its own right.',
    citations: [
      'Griaule, Marcel & Dieterlen, Germaine. "Le Renard pâle" (Institut d\'Ethnologie, Paris, 1965)',
      'van Beek, Walter E. A. "Dogon Restudied: A Field Evaluation of the Work of Marcel Griaule." Current Anthropology 32(2) (1991)',
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
    response: `I couldn't find anything about "${userQuery}" in the archive yet.\n\nTry searching the full archive, or choose one of the suggested prompts below. Topics covered so far include the Timbuktu manuscripts, Great Zimbabwe, the Benin brasses, Zera Yacob's Hatäta, the Manden Charter and Dogon cosmology.`,
    citations: [],
  }
}
