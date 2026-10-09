export interface GlossaryTerm {
  term: string
  language: string
  script?: string
  pronunciation?: string
  meaning: string
  context: string
  region: string
  /** Search query for /discover?q= */
  related?: string
}

export const GLOSSARY: GlossaryTerm[] = [
  // Nguni (Zulu, Xhosa)
  {
    term: 'Ubuntu',
    language: 'Zulu / Xhosa (Nguni)',
    pronunciation: 'oo-BOON-too',
    meaning: 'Humanity; humaneness. Often explained through the saying "umuntu ngumuntu ngabantu", a person is a person through other people.',
    context: 'An ethical idea found across Southern Africa that stresses mutual care and shared humanity. It was invoked in South Africa’s post-apartheid constitution-making and in the Truth and Reconciliation Commission.',
    region: 'Southern Africa',
    related: 'Ubuntu philosophy',
  },
  {
    term: 'Izibongo',
    language: 'Zulu',
    meaning: 'Praises; praise poetry.',
    context: 'A form of oral poetry that recites the deeds, character and lineage of a person, especially a chief or king. It is performed by a praise poet and is a major source for Zulu history.',
    region: 'Southern Africa',
    related: 'Zulu praise poetry',
  },
  {
    term: 'Imbongi',
    language: 'Xhosa / Zulu',
    meaning: 'Praise poet.',
    context: 'An oral poet who composes and performs praises for leaders and at public occasions. The role continued into modern times, with praise poets performing at political events.',
    region: 'Southern Africa',
    related: 'praise poetry',
  },
  {
    term: 'Sangoma',
    language: 'Zulu',
    meaning: 'Traditional healer and diviner (isangoma).',
    context: 'Sangomas diagnose illness and misfortune through divination and communication with the ancestors. They are distinct from inyanga, who are herbalists.',
    region: 'Southern Africa',
    related: 'traditional healing',
  },

  // Swahili
  {
    term: 'Ujamaa',
    language: 'Swahili',
    meaning: 'Familyhood; extended family.',
    context: 'The name Julius Nyerere gave to Tanzania’s policy of African socialism, set out in the Arusha Declaration of 1967. It included the resettlement of rural people into collective villages.',
    region: 'East Africa',
    related: 'Ujamaa Nyerere',
  },
  {
    term: 'Harambee',
    language: 'Swahili',
    meaning: 'Let us all pull together.',
    context: 'Kenya’s national motto, popularised by Jomo Kenyatta after independence. It also names a tradition of community self-help events that raise funds for schools, clinics and other local needs.',
    region: 'East Africa',
    related: 'Harambee Kenya',
  },
  {
    term: 'Uhuru',
    language: 'Swahili',
    meaning: 'Freedom; independence.',
    context: 'A rallying word of independence movements in East Africa in the 1950s and 1960s. It appears in many place names and monuments that commemorate independence.',
    region: 'East Africa',
    related: 'independence movements',
  },
  {
    term: 'Utu',
    language: 'Swahili',
    meaning: 'Humanity; humaneness; good character.',
    context: 'A Swahili ethical idea closely related to ubuntu, describing the qualities that make someone a good human being.',
    region: 'East Africa',
    related: 'Ubuntu',
  },
  {
    term: 'Ngoma',
    language: 'Swahili and other Bantu languages',
    meaning: 'Drum; also dance, song and the event in which they are performed.',
    context: 'The word is used across much of Central, Eastern and Southern Africa. In many communities ngoma also refers to healing rituals performed with music and dance.',
    region: 'Central, Eastern and Southern Africa',
    related: 'ngoma music',
  },

  // Akan (Twi)
  {
    term: 'Sankofa',
    language: 'Akan (Twi)',
    pronunciation: 'sahn-KOH-fah',
    meaning: 'Go back and fetch it.',
    context: 'Linked to the proverb that it is not wrong to go back for what you have forgotten, and represented by an Adinkra symbol of a bird looking backwards. It is widely used as an emblem of learning from the past.',
    region: 'West Africa (Ghana)',
    related: 'Sankofa',
  },
  {
    term: 'Adinkra',
    language: 'Akan (Twi)',
    meaning: 'A set of visual symbols, each standing for a concept, value or proverb.',
    context: 'Adinkra symbols were traditionally stamped onto cloth worn at funerals and other important occasions in Asante. They are now used widely in architecture, design and jewellery.',
    region: 'West Africa (Ghana, Côte d’Ivoire)',
    related: 'Adinkra symbols',
  },
  {
    term: 'Kente',
    language: 'Akan (Twi)',
    meaning: 'A cloth woven in narrow strips that are sewn together.',
    context: 'Kente is made by Asante and Ewe weavers in Ghana and Togo, and particular patterns carry names and meanings. It was historically associated with royalty and is worn on important occasions.',
    region: 'West Africa (Ghana, Togo)',
    related: 'Kente cloth',
  },
  {
    term: 'Sika Dwa Kofi',
    language: 'Akan (Twi)',
    meaning: 'The Golden Stool; literally "golden stool born on a Friday".',
    context: 'The sacred symbol of the Asante nation, traditionally said to have been brought down from the sky by the priest Okomfo Anokye for Osei Tutu. It is never sat upon, and a British demand for it sparked the War of the Golden Stool in 1900.',
    region: 'West Africa (Ghana)',
    related: 'Golden Stool',
  },
  {
    term: 'Okyeame',
    language: 'Akan (Twi)',
    meaning: 'Spokesperson or "linguist" of a chief.',
    context: 'The okyeame speaks on behalf of the chief and relays speech to and from him, often using proverbs. The office is marked by a carved staff topped with a figure that illustrates a proverb.',
    region: 'West Africa (Ghana)',
    related: 'Akan chieftaincy',
  },

  // Yoruba
  {
    term: 'Ọmọlúàbí',
    language: 'Yoruba',
    meaning: 'A person of good character.',
    context: 'A central Yoruba ethical ideal describing someone who is honest, respectful, hardworking and considerate of others. Good character (ìwà) is seen as the basis of a worthy life.',
    region: 'West Africa (Nigeria, Benin)',
    related: 'Yoruba ethics',
  },
  {
    term: 'Àṣẹ',
    language: 'Yoruba',
    meaning: 'Power, authority; the capacity to make things happen. Also said as "so be it" in response to a prayer.',
    context: 'In Yoruba thought àṣẹ is a force present in the gods, ancestors, rulers and spoken words. The term is also widely used in Afro-Atlantic religions such as Candomblé and Santería.',
    region: 'West Africa and the African diaspora',
    related: 'Yoruba religion',
  },
  {
    term: 'Ifá',
    language: 'Yoruba',
    meaning: 'A system of divination and the body of knowledge associated with it.',
    context: 'Ifá is associated with the deity Ọ̀rúnmìlà and is practised by trained priests who interpret signs and recite verses. UNESCO recognised the Ifá divination system as intangible cultural heritage.',
    region: 'West Africa and the African diaspora',
    related: 'Ifá divination',
  },
  {
    term: 'Odù',
    language: 'Yoruba',
    meaning: 'One of the 256 signs of Ifá divination, each with its own body of verses.',
    context: 'Each odù is associated with many verses that include stories, proverbs and guidance. Together they form a large oral literature memorised by Ifá priests.',
    region: 'West Africa (Nigeria, Benin)',
    related: 'Ifá',
  },
  {
    term: 'Babaláwo',
    language: 'Yoruba',
    meaning: 'Ifá priest; literally "father of secrets".',
    context: 'A babaláwo undergoes long training to master the verses of Ifá and to perform divination and rituals for clients.',
    region: 'West Africa and the African diaspora',
    related: 'Ifá priest',
  },
  {
    term: 'Òrìṣà',
    language: 'Yoruba',
    meaning: 'A deity or divine being.',
    context: 'Yoruba religion recognises many òrìṣà, such as Ògún, Ṣàngó and Ọ̀ṣun, under the supreme being Olódùmarè. Òrìṣà worship spread to the Americas with enslaved Yoruba people.',
    region: 'West Africa and the African diaspora',
    related: 'Orisha',
  },
  {
    term: 'Oba',
    language: 'Yoruba / Edo',
    meaning: 'King; ruler.',
    context: 'The title of rulers in many Yoruba towns and of the king of Benin. In Benin the Oba remains the head of a royal court with its own guilds and rituals.',
    region: 'West Africa (Nigeria)',
    related: 'Oba of Benin',
  },
  {
    term: 'Egungun',
    language: 'Yoruba',
    meaning: 'Ancestral masquerade.',
    context: 'Egungun masquerades represent the returning spirits of ancestors and appear at festivals and funerals. Their costumes are made of layered cloth that covers the performer completely.',
    region: 'West Africa (Nigeria, Benin)',
    related: 'Egungun masquerade',
  },

  // Edo
  {
    term: 'Igun Eronmwon',
    language: 'Edo',
    meaning: 'The guild of bronze casters of Benin.',
    context: 'A hereditary guild based on Igun Street in Benin City that has cast brass and bronze works for the Oba’s court for centuries. Its members still use the lost-wax method.',
    region: 'West Africa (Nigeria)',
    related: 'Benin Bronzes',
  },
  {
    term: 'Iyoba',
    language: 'Edo',
    meaning: 'Queen mother.',
    context: 'A title in the Kingdom of Benin given to the mother of the reigning Oba, first created by Oba Esigie for his mother, Idia. The Iyoba held her own court and estates.',
    region: 'West Africa (Nigeria)',
    related: 'Queen Idia',
  },

  // Igbo, Cross River
  {
    term: 'Chi',
    language: 'Igbo',
    meaning: 'Personal spiritual guardian; a person’s individual destiny or god.',
    context: 'In Igbo thought each person has a chi that shapes their fortune. Chinua Achebe wrote an influential essay on the idea, and it appears in many Igbo names.',
    region: 'West Africa (Nigeria)',
    related: 'Igbo cosmology',
  },
  {
    term: 'Mbari',
    language: 'Igbo',
    meaning: 'A shrine house filled with sculpted figures.',
    context: 'Mbari houses were built in the Owerri area, mainly in honour of the earth deity Ala. Their painted clay figures showed deities, people and scenes of daily life, and the houses were left to decay once completed.',
    region: 'West Africa (Nigeria)',
    related: 'Mbari',
  },
  {
    term: 'Nsibidi',
    language: 'Cross River languages (Ejagham, Efik, Igbo and others)',
    meaning: 'A system of graphic signs used to convey ideas.',
    context: 'Nsibidi is associated with the Cross River region and with secret societies such as Ekpe. Its signs appear on cloth, carvings and the body; much of its meaning was restricted to initiates.',
    region: 'West Africa (Nigeria, Cameroon)',
    related: 'Nsibidi',
  },

  // Hausa
  {
    term: 'Sarki',
    language: 'Hausa',
    meaning: 'King; emir; ruler.',
    context: 'The title of the rulers of Hausa city-states such as Kano and Katsina. After the 19th-century jihad, emirs within the Sokoto Caliphate continued to be called sarki in Hausa.',
    region: 'West Africa (Nigeria, Niger)',
    related: 'Hausa states',
  },

  // Mande
  {
    term: 'Mansa',
    language: 'Mande (Maninka)',
    meaning: 'King; ruler.',
    context: 'The title of the rulers of the Mali Empire, as in Mansa Musa. It conveys supreme political authority.',
    region: 'West Africa (Mali, Guinea)',
    related: 'Mali Empire',
  },
  {
    term: 'Jeli (griot)',
    language: 'Mande (Maninka, Bambara)',
    meaning: 'Hereditary bard and keeper of oral history. "Griot" is the French-derived term.',
    context: 'Jeliw (plural) recite genealogies, histories and epics such as the Epic of Sundiata, often accompanied by the kora or balafon. They have long served as advisers and spokespeople to rulers.',
    region: 'West Africa',
    related: 'griot',
  },
  {
    term: 'Kora',
    language: 'Mande',
    meaning: 'A harp-lute, usually with 21 strings.',
    context: 'The kora is made from a large calabash covered with cowhide and is played mainly by jeliw in the Mande world. It is closely associated with the Gambia, Senegal, Mali and Guinea.',
    region: 'West Africa',
    related: 'kora',
  },
  {
    term: 'Kurukan Fuga',
    language: 'Mande (Maninka)',
    meaning: 'The name of the place where, according to tradition, the Mali Empire’s founding assembly met.',
    context: 'Oral tradition holds that Sundiata Keita and allied leaders agreed on rules for the new empire there in the 13th century. The Manden Charter proclaimed at Kurukan Fuga is recognised by UNESCO as intangible cultural heritage; its contents survive through oral transmission.',
    region: 'West Africa (Mali, Guinea)',
    related: 'Manden Charter',
  },

  // Wolof
  {
    term: 'Teranga',
    language: 'Wolof',
    meaning: 'Hospitality.',
    context: 'Teranga is regarded as a core value in Senegal, expressed in welcoming and sharing with guests and strangers.',
    region: 'West Africa (Senegal, The Gambia)',
    related: 'Senegal',
  },

  // Dogon
  {
    term: 'Sigui',
    language: 'Dogon',
    meaning: 'A ceremony held roughly every 60 years.',
    context: 'The Sigui marks the renewal of the world and of generations among the Dogon of Mali, and moves from village to village over several years. The last cycle took place from 1967 to 1973.',
    region: 'West Africa (Mali)',
    related: 'Dogon',
  },

  // Kikuyu
  {
    term: 'Ngai',
    language: 'Kikuyu (Gĩkũyũ)',
    meaning: 'God; the supreme being.',
    context: 'In Kikuyu tradition Ngai was associated with Mount Kenya, called Kĩrĩnyaga, and prayers were made facing the mountain. The name is shared with the Maasai Enkai and other neighbouring traditions.',
    region: 'East Africa (Kenya)',
    related: 'Kikuyu religion',
  },

  // Ge'ez / Amharic
  {
    term: 'Ge’ez',
    language: 'Ge’ez',
    script: 'ግዕዝ',
    meaning: 'The classical language of Ethiopia and Eritrea, and the name of its script.',
    context: 'Ge’ez was the language of the Kingdom of Aksum and remains the liturgical language of the Ethiopian and Eritrean Orthodox churches. Its script is an abugida, in which each character represents a consonant with a vowel, and it is used today for Amharic and Tigrinya.',
    region: 'Horn of Africa',
    related: 'Geez script',
  },
  {
    term: 'Fidäl',
    language: 'Amharic / Ge’ez',
    script: 'ፊደል',
    meaning: 'Letter; alphabet. The usual name for the Ethiopic script.',
    context: 'The fidäl is learned as a table of consonant-vowel combinations. It is used to write Ge’ez, Amharic, Tigrinya and other languages of the Horn of Africa.',
    region: 'Horn of Africa',
    related: 'Ethiopic script',
  },
  {
    term: 'Nəgusä nägäst',
    language: 'Ge’ez / Amharic',
    script: 'ንጉሠ ነገሥት',
    meaning: 'King of kings.',
    context: 'The title of the emperors of Ethiopia, used until the end of the monarchy in 1974. Rulers of Aksum used a similar title in their inscriptions.',
    region: 'Horn of Africa',
    related: 'Ethiopian Empire',
  },
  {
    term: 'Tabot',
    language: 'Ge’ez / Amharic',
    script: 'ታቦት',
    meaning: 'A consecrated tablet representing the Ark of the Covenant.',
    context: 'Every Ethiopian Orthodox church holds a tabot, which consecrates the church. During the festival of Timkat the tabotat are carried in procession, wrapped in cloth.',
    region: 'Horn of Africa',
    related: 'Ethiopian Orthodox',
  },

  // Meroitic / Ancient Egyptian
  {
    term: 'Kandake',
    language: 'Meroitic',
    meaning: 'A title of royal women of Kush, usually understood as queen or queen mother. The exact meaning is debated.',
    context: 'Several Kushite queens bearing this title ruled in their own right, among them Amanirenas. Greek and Roman writers rendered it as Kandakē or Candace and sometimes treated it as a personal name.',
    region: 'Northeast Africa (Sudan)',
    related: 'Kandake',
  },
  {
    term: 'Maat',
    language: 'Ancient Egyptian',
    meaning: 'Truth, justice, balance and cosmic order.',
    context: 'Maat was both a principle and a goddess, shown with an ostrich feather. Kings were expected to uphold maat, and in funerary texts the heart of the dead was weighed against her feather.',
    region: 'Northeast Africa (Egypt)',
    related: 'Maat',
  },
  {
    term: 'Medu netjer',
    language: 'Ancient Egyptian',
    meaning: 'Words of the god; the Egyptian name for hieroglyphic writing.',
    context: 'Hieroglyphs were used for monumental and religious texts for more than three thousand years. Cursive forms, hieratic and later demotic, were used for everyday writing.',
    region: 'Northeast Africa (Egypt)',
    related: 'hieroglyphs',
  },

  // Arabic in African scholarship
  {
    term: 'Ajami',
    language: 'Arabic (term); used for Hausa, Wolof, Fula, Swahili and others',
    script: 'عجمي',
    meaning: 'Writing an African language in Arabic script. From the Arabic for "non-Arab" or "foreign".',
    context: 'Ajami writing has been used for centuries for poetry, religious teaching, letters and records. Many manuscripts in West and East African collections are written in Ajami.',
    region: 'West and East Africa',
    related: 'Ajami manuscripts',
  },
  {
    term: 'Ijāza',
    language: 'Arabic',
    script: 'إجازة',
    meaning: 'Licence or authorisation, especially to teach or transmit a text.',
    context: 'In Islamic scholarship a teacher grants an ijāza to a student who has studied a text, placing the student in a chain of transmission. Ijāzas were central to learning in centres such as Timbuktu.',
    region: 'North and West Africa',
    related: 'Timbuktu manuscripts',
  },
  {
    term: 'Bilād al-Sūdān',
    language: 'Arabic',
    script: 'بلاد السودان',
    meaning: 'Land of the Black peoples.',
    context: 'The term used by medieval Arabic geographers and historians for the lands south of the Sahara, especially the Sahel and savanna of West Africa. The modern country name Sudan comes from it.',
    region: 'West Africa and the Sahel',
    related: 'trans-Saharan trade',
  },
]
