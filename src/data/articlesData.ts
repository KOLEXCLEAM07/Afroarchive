import type { Article } from '@/types'

export const FOUNDATIONAL_ARTICLES: Article[] = [
  {
    id: 'art-ubuntu-01',
    author_id: 'a1',
    title: 'The Philosophy of Ubuntu: I Am Because We Are',
    slug: 'philosophy-of-ubuntu',
    excerpt: 'Explore the profound African philosophical concept of Ubuntu and its implications for modern human rights, restorative justice, and community ethics.',
    content: `Ubuntu is an ancient southern African ethical philosophy originating from Nguni and Bantu languages, best translated through the proverb "Umuntu ngumuntu ngabantu" — "A person is a person through other persons."

Unlike Cartesian individualism ("I think, therefore I am"), Ubuntu posits that human personhood is inherently relational, communitarian, and interdependent. One does not arrive into the world as a fully realized individual; rather, humanity is cultivated and affirmed through compassionate relations with kin, community, ancestors, and the ecosystem.

### Key Dimensions of Ubuntu Ethics

1. **Relational Ontology**: Human existence is intrinsically social. The isolation or suffering of any community member diminishes the wholeness of the entire society.
2. **Restorative Over Retributive Justice**: In traditional jurisprudence across southern Africa, conflicts were arbitrated not to inflict retribution or isolation, but to restore equilibrium and reconcile relationships.
3. **Collective Responsibility and Hospitality**: A traveller passing through a village was welcomed as kin; children were raised and protected by the entire collective.

> "A person with Ubuntu is open and available to others, affirming of others, does not feel threatened that others are able and good, based from a proper self-assurance that comes from knowing that he or she belongs in a greater whole."
> — Archbishop Desmond Tutu

### Modern Global Applications

In the post-apartheid era, Ubuntu served as the conceptual cornerstone for South Africa's Truth and Reconciliation Commission (TRC). Today, international scholars in bioethics, political philosophy, and organizational governance frequently cite Ubuntu as a powerful alternative to radical individualist paradigms.`,
    cover_image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80',
    status: 'published',
    category_id: 'philosophy',
    reading_time: 8,
    views_count: 18450,
    likes_count: 1420,
    comments_count: 78,
    bookmarks_count: 389,
    is_featured: true,
    references: [
      'Tutu, Desmond. No Future Without Forgiveness. Doubleday, 1999.',
      'Ramose, Mogobe B. African Philosophy Through Ubuntu. Mond Books, 1999.',
      'Wiredu, Kwasi. Cultural Universals and Particulars: An African Perspective. Indiana University Press, 1996.',
      'Metz, Thaddeus. "Toward an African Moral Theory." Journal of Political Philosophy, 2007.'
    ],
    language: 'en',
    published_at: '2026-07-15T10:00:00Z',
    created_at: '2026-07-15T10:00:00Z',
    updated_at: '2026-07-15T10:00:00Z',
    youtube_embed: null,
    country: 'South Africa',
    time_period: 'Contemporary & Traditional',
    author: {
      id: 'a1',
      username: 'dr_nkosi',
      full_name: 'Dr. Amara Nkosi',
      bio: 'Professor of African Epistemology and Ethics. Author of Relational Horizons in Pan-African Thought.',
      avatar_url: 'https://i.pravatar.cc/150?img=3',
      cover_url: null,
      country: 'South Africa',
      website: 'https://afroarchive.org/scholars/amara-nkosi',
      languages: ['en', 'zu', 'xh'],
      role: 'contributor',
      is_verified: true,
      followers_count: 5120,
      following_count: 140,
      articles_count: 48,
      total_views: 112000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: 'philosophy',
      name: 'Philosophy',
      slug: 'philosophy',
      description: 'African philosophical systems, ethics, and worldviews.',
      icon: '🧠',
      color: '#0F5132',
      parent_id: null,
      articles_count: 245,
      created_at: '',
    },
  },
  {
    id: 'art-zimbabwe-02',
    author_id: 'a2',
    title: 'Great Zimbabwe: Engineering Marvel of Medieval Africa',
    slug: 'great-zimbabwe-engineering',
    excerpt: 'How did ancient Shona architects erect the massive granite walls of Great Zimbabwe without mortar, creating the epic capital of southern Africa?',
    content: `Rising dramatically from the granite hills of Masvingo, Great Zimbabwe stands as one of humanity's most breathtaking architectural feats. Spanning over 1,700 acres, this medieval city was the nerve center of a vast Shona empire that dominated southern Africa between the 11th and 15th centuries.

### Mortarless Drystone Architecture

What distinguishes Great Zimbabwe is its sophisticated drystone masonry. The massive curved walls — some reaching heights of 11 meters (36 feet) and thicknesses exceeding 5 meters — were constructed entirely without mortar or binding cement.

Granite slabs were quarried by subjecting natural rock outcrops to controlled fire and cold water thermal cracking. The stone was then shaped into uniform blocks and laid in carefully battered, slightly inward-sloping courses to ensure structural equilibrium against seismic and wind forces for nearly a millennium.

### The Great Enclosure and Conical Tower

At the heart of the royal quarter lies the Great Enclosure, featuring an outer perimeter wall extending 250 meters. Inside stands the enigmatic Conical Tower, a solid masonry cylinder measuring 5.5 meters in diameter and 9 meters in height, believed to represent a granary symbolizing royal abundance and agricultural sovereignty.

> "The stone walls of Great Zimbabwe were not merely defensive fortresses; they were ideological monuments of divine kingship, acoustic amphitheaters for ritual, and hubs of a global trading empire."
> — Prof. Tendai Chikwanda

### Global Commerce and Gold Trade

Archaeological excavations at the site have uncovered:
- 14th-century Chinese celadon porcelain shards from the Ming dynasty
- Persian cobalt glassware and Arabian copper coins
- Seven famous carved Soapstone Birds representing ancestral protectors

These discoveries prove that Great Zimbabwe sat at the center of trans-oceanic Indian Ocean trade networks connecting southern Africa to Cairo, Kilwa, India, and China.`,
    cover_image: 'https://images.unsplash.com/photo-1504185073616-d9b5bef4e4e8?w=1200&q=80',
    status: 'published',
    category_id: 'history',
    reading_time: 11,
    views_count: 24800,
    likes_count: 1720,
    comments_count: 94,
    bookmarks_count: 512,
    is_featured: true,
    references: [
      'Huffman, Thomas N. Snakes and Crocodiles: Power and Symbolism in Great Zimbabwe. Wits University Press, 1996.',
      'Garlake, Peter. Great Zimbabwe. Thames and Hudson, 1973.',
      'Pikirayi, Innocent. The Zimbabwe Culture: Origins and Decline of Southern Zambezian States. Rowman Altamira, 2001.',
      'UNESCO World Heritage Centre. "Great Zimbabwe National Monument" (Ref: 364).'
    ],
    language: 'en',
    published_at: '2026-07-20T10:00:00Z',
    created_at: '2026-07-20T10:00:00Z',
    updated_at: '2026-07-20T10:00:00Z',
    youtube_embed: null,
    country: 'Zimbabwe',
    time_period: '1100–1450 CE',
    author: {
      id: 'a2',
      username: 'prof_chikwanda',
      full_name: 'Prof. Tendai Chikwanda',
      bio: 'Senior Archaeologist at Great Zimbabwe Monument Research Institute.',
      avatar_url: 'https://i.pravatar.cc/150?img=8',
      cover_url: null,
      country: 'Zimbabwe',
      website: null,
      languages: ['en', 'sn'],
      role: 'contributor',
      is_verified: true,
      followers_count: 8300,
      following_count: 250,
      articles_count: 82,
      total_views: 260000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: 'history',
      name: 'History',
      slug: 'history',
      description: 'Empires, kingdoms, and civilizational history.',
      icon: '🏛️',
      color: '#B08A44',
      parent_id: null,
      articles_count: 530,
      created_at: '',
    },
  },
  {
    id: 'art-timbuktu-03',
    author_id: 'a3',
    title: 'Timbuktu: The Harvard of the Medieval World',
    slug: 'timbuktu-medieval-university',
    excerpt: 'Long before European academies gained renown, Timbuktu hosted over 25,000 scholars and housed hundreds of thousands of scientific manuscripts.',
    content: `Located at the crossroads of the Sahara Desert and the Niger River, Timbuktu was the intellectual, commercial, and spiritual capital of the Mali and Songhai Empires. During its golden age in the 14th to 16th centuries, the city was world-famous for its university complex and colossal library archives.

### The University of Sankoré

The intellectual life of Timbuktu revolved around the University of Sankoré, alongside the Djinguereber and Sidi Yahya mosques. Together, these institutions educated upwards of 25,000 university students concurrently — in a city whose population was roughly 100,000.

Students mastered advanced curricula divided into degrees:
- General Sciences (Islamic Jurisprudence, Arabic Grammar, Rhetoric)
- Natural Sciences (Spherical Astronomy, Optics, Medicine, Pharmacology)
- Logic, Mathematics, and Commercial Law

Graduation was commemorated by the conferral of the traditional turban (*Imama*), signifying intellectual mastery and ethical responsibility.

### The Manuscript Tradition

Leo Africanus, visiting Timbuktu in the early 16th century, famously observed:
> "Here are great stores of doctors, judges, priests, and other learned men, that are bountifully maintained at the king's cost and charges. And hither are brought diverse manuscripts or written books out of Barbarie, which are sold for more money than any other merchandise."

Families across Timbuktu guarded private libraries containing hundreds of thousands of handwritten folios bound in stamped gazelle leather. These texts, written in Arabic and local languages using Ajami script, covered subjects ranging from astronomical calculation to treatments for optical diseases.`,
    cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&q=80',
    status: 'published',
    category_id: 'science',
    reading_time: 10,
    views_count: 21300,
    likes_count: 1190,
    comments_count: 62,
    bookmarks_count: 395,
    is_featured: false,
    references: [
      'Hunwick, John O. Timbuktu and the Songhay Empire. Brill, 2003.',
      'Saad, Elias N. Social History of Timbuktu. Cambridge University Press, 1983.',
      'Jeppie, Shamil, and Souleymane Bachir Diagne. The Meanings of Timbuktu. HSRC Press, 2008.'
    ],
    language: 'en',
    published_at: '2026-07-25T10:00:00Z',
    created_at: '2026-07-25T10:00:00Z',
    updated_at: '2026-07-25T10:00:00Z',
    youtube_embed: null,
    country: 'Mali',
    time_period: '1300–1600 CE',
    author: {
      id: 'a3',
      username: 'fatima_diallo',
      full_name: 'Fatima Diallo',
      bio: 'Curator of Saharan Heritage and Sahelian Manuscripts, Timbuktu Institute.',
      avatar_url: 'https://i.pravatar.cc/150?img=47',
      cover_url: null,
      country: 'Mali',
      website: null,
      languages: ['en', 'fr', 'bm'],
      role: 'contributor',
      is_verified: true,
      followers_count: 3100,
      following_count: 190,
      articles_count: 29,
      total_views: 65000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: 'science',
      name: 'Science & Education',
      slug: 'science',
      description: 'Astronomy, mathematics, and scholarly traditions.',
      icon: '📚',
      color: '#B08A44',
      parent_id: null,
      articles_count: 195,
      created_at: '',
    },
  },
  {
    id: 'art-dogon-04',
    author_id: 'a4',
    title: 'The Dogon Astronomical Knowledge: Stars Before Telescopes',
    slug: 'dogon-astronomical-knowledge',
    excerpt: 'The Dogon people of the Bandiagara Escarpment recorded orbits of Sirius B centuries before Western astronomers could photograph white dwarfs.',
    content: `Along the cliffs of the Bandiagara Escarpment in central Mali, the Dogon people have preserved a cosmological system of staggering complexity. Anthropological documentation by Marcel Griaule and Germaine Dieterlen in the 1930s revealed that Dogon priest-astronomers (*Hogon*) possessed granular mathematical descriptions of the Sirius star system.

### The Mystery of Po Tolo (Sirius B)

Central to Dogon cosmology is *Sigi Tolo* (Sirius A) and its invisible companion star *Po Tolo* (Sirius B). The Dogon stated that *Po Tolo*:
- Has an elliptical 50-year orbit around Sirius A
- Is composed of *sagala*, an unimaginably dense material heavier than all iron on Earth
- Rotates on its own axis while maintaining an eccentric orbital focus

Modern astrophysics verified that Sirius B is indeed a superdense white dwarf with an orbital period of 50.1 years. Its white dwarf nature was only confirmed in the West through spectrographic analysis in 1915, and the first photograph was captured in 1970.

> "To the Dogon, the universe is woven on a cosmic loom. The microscopic grain of Digitaria (*Po*) contains within itself the archetype of all matter and orbital movement."
> — Dr. Cosmos Nwosu

### Cosmological Calendars and Agricultural Cycles

The Dogon utilized their astronomical observations not as abstract theory, but to regulate the 60-year *Sigui* festival, coordinate seasonal millet planting, and navigate their harsh cliff-side environment with mathematical precision.`,
    cover_image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200&q=80',
    status: 'published',
    category_id: 'science',
    reading_time: 9,
    views_count: 32400,
    likes_count: 2240,
    comments_count: 142,
    bookmarks_count: 610,
    is_featured: false,
    references: [
      'Griaule, Marcel, and Germaine Dieterlen. Le Renard Pâle (The Pale Fox). Institut d’Ethnologie, 1965.',
      'Temple, Robert. The Sirius Mystery. St. Martin’s Press, 1976.',
      'Van Sertima, Ivan. Blacks in Science: Ancient and Modern. Transaction Publishers, 1983.'
    ],
    language: 'en',
    published_at: '2026-07-28T10:00:00Z',
    created_at: '2026-07-28T10:00:00Z',
    updated_at: '2026-07-28T10:00:00Z',
    youtube_embed: null,
    country: 'Mali',
    time_period: 'Traditional Knowledge',
    author: {
      id: 'a4',
      username: 'cosmos_nwosu',
      full_name: 'Dr. Cosmos Nwosu',
      bio: 'Astrophysicist and Indigenous Science Historian.',
      avatar_url: 'https://i.pravatar.cc/150?img=12',
      cover_url: null,
      country: 'Nigeria',
      website: null,
      languages: ['en', 'ig'],
      role: 'contributor',
      is_verified: true,
      followers_count: 6200,
      following_count: 310,
      articles_count: 59,
      total_views: 195000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: 'science',
      name: 'Science',
      slug: 'science',
      description: 'Indigenous astronomy and scientific systems.',
      icon: '🔭',
      color: '#0F5132',
      parent_id: null,
      articles_count: 148,
      created_at: '',
    },
  },
  {
    id: 'art-benin-05',
    author_id: 'a1',
    title: 'The Lost Wax Masterpieces: Metallurgy and Art of the Benin Kingdom',
    slug: 'benin-bronzes-metallurgy',
    excerpt: 'The royal brass casters of the Kingdom of Benin perfected lost-wax metallurgy, creating commemorative heads and historical relief plaques unmatched in the Renaissance world.',
    content: `Between the 13th and 19th centuries, the Kingdom of Benin (in modern-day Edo State, Nigeria) was renowned for its sophisticated guild of brass casters (*Igun Eronmwon*). Working under direct royal charter of the *Oba* (king), these master sculptors produced thousands of brass, bronze, and ivory masterpieces using the cire-perdue (lost wax) casting process.

### The Lost-Wax Casting Technique

Each brass sculpture was a singular, unreproducible work:
1. A core was shaped from refractory clay.
2. A detailed outer model was sculpted in refined beeswax.
3. Multiple layers of fine clay slips were applied around the wax to form a mold.
4. The assemblage was heated to melt out the wax (*lost wax*).
5. Molten bronze alloy (copper, zinc, and lead) was poured into the cavity at temperatures exceeding 1,000°C.
6. Once cooled, the mold was chipped away, revealing the metal relief.

### The Royal Court Plaques

The walls and pillars of the Oba's palace in Benin City were lined with cast relief plaques depicting diplomatic encounters with 15th-century Portuguese traders, ceremonial state rituals, court musicians, and battlefield triumphs.

> "The technique of Benin bronze casting was so advanced that early European visitors in 1897 could not believe they were produced by Black Africans — until chemical isotope analysis proved the ores and smelting were indigenous to the Niger basin."
> — Dr. Amara Nkosi

### Restitution and Global Justice

Today, the Benin Bronzes stand at the vanguard of the international movement for the repatriation of looted colonial treasures. Leading institutions including the Smithsonian, German state museums, and the Horniman Museum have begun officially returning title and physical works to Nigeria.`,
    cover_image: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Benin_bronze_Louvre_A97-14-1.jpg',
    status: 'published',
    category_id: 'arts',
    reading_time: 9,
    views_count: 27900,
    likes_count: 1840,
    comments_count: 110,
    bookmarks_count: 480,
    is_featured: true,
    references: [
      'Ben-Amos, Paula Girshick. The Art of Benin. British Museum Press, 1995.',
      'Hicks, Dan. The Brutish Museums: The Benin Bronzes, Colonial Violence and Cultural Restitution. Pluto Press, 2020.',
      'Nevadomsky, Joseph. "Studies of Benin Art and Technology." African Arts, 2005.'
    ],
    language: 'en',
    published_at: '2026-08-02T10:00:00Z',
    created_at: '2026-08-02T10:00:00Z',
    updated_at: '2026-08-02T10:00:00Z',
    youtube_embed: null,
    country: 'Nigeria',
    time_period: '1200–1897 CE',
    author: {
      id: 'a1',
      username: 'dr_nkosi',
      full_name: 'Dr. Amara Nkosi',
      bio: 'Professor of African Epistemology and Ethics.',
      avatar_url: 'https://i.pravatar.cc/150?img=3',
      cover_url: null,
      country: 'South Africa',
      website: null,
      languages: ['en'],
      role: 'contributor',
      is_verified: true,
      followers_count: 5120,
      following_count: 140,
      articles_count: 48,
      total_views: 112000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: 'arts',
      name: 'Arts & Metallurgy',
      slug: 'arts',
      description: 'Sculpture, brass casting, and classical aesthetic traditions.',
      icon: '🏺',
      color: '#B08A44',
      parent_id: null,
      articles_count: 280,
      created_at: '',
    },
  },
  {
    id: 'art-ifa-06',
    author_id: 'a4',
    title: 'The Ifa Divination System: Ancient African Binary Computing and Epistemology',
    slug: 'ifa-divination-binary-system',
    excerpt: 'Centuries before modern computer science, the Yoruba Ifa corpus utilized an 8-bit binary permutation system to organize centuries of oral knowledge.',
    content: `Recognized by UNESCO in 2005 as a Masterpiece of the Oral and Intangible Heritage of Humanity, the Ifa divination corpus of the Yoruba people of southwestern Nigeria is one of Africa's most remarkable intellectual architectures.

### The Binary Architecture of the Odu

At the mathematical heart of Ifa lies a base-2 binary numbering structure:
- A divining priest (*Babalawo*) casts sixteen sacred palm nuts (*Ikin*) or an *Opele* chain.
- The outcome generates a binary mark: single strike (|) or double strike (||).
- These marks form an 8-bit byte composed of two columns of four bits each.
- The basic 16 signs (*Oju Odu*) are squared ($16 \\times 16$), producing 256 principal Odù chapters.

Each of these 256 chapters contains up to 16 poems and historical commentaries (*Ese Ifa*), yielding an oral database containing thousands of botanical remedies, psychological counseling principles, philosophical treatises, and historical chronicles.

### Parallels with Modern Information Theory

Mathematicians and computing pioneers have pointed out the extraordinary isomorphism between the Ifa 8-bit configuration and binary computing matrices:
- Both rely on two discrete states (0 and 1, or single and double marks).
- Both organize complex multidimensional data through systematic branching algorithms.
- Both preserve computational integrity through rigorous parity checks and recited formulas.`,
    cover_image: 'https://images.unsplash.com/photo-1578925518470-4def7a0f08bb?w=1200&q=80',
    status: 'published',
    category_id: 'philosophy',
    reading_time: 10,
    views_count: 22100,
    likes_count: 1610,
    comments_count: 85,
    bookmarks_count: 420,
    is_featured: false,
    references: [
      'Abimbola, Wande. Ifá: An Exposition of Ifá Literary Corpus. Oxford University Press, 1976.',
      'Gates, Henry Louis Jr. The Signifying Monkey: A Theory of African-American Literary Criticism. Oxford University Press, 1988.',
      'Eglash, Ron. African Fractals: Modern Computing and Indigenous Design. Rutgers University Press, 1999.'
    ],
    language: 'en',
    published_at: '2026-08-10T10:00:00Z',
    created_at: '2026-08-10T10:00:00Z',
    updated_at: '2026-08-10T10:00:00Z',
    youtube_embed: null,
    country: 'Nigeria',
    time_period: 'Ancient to Present',
    author: {
      id: 'a4',
      username: 'cosmos_nwosu',
      full_name: 'Dr. Cosmos Nwosu',
      bio: 'Astrophysicist and Indigenous Science Historian.',
      avatar_url: 'https://i.pravatar.cc/150?img=12',
      cover_url: null,
      country: 'Nigeria',
      website: null,
      languages: ['en', 'ig', 'yo'],
      role: 'contributor',
      is_verified: true,
      followers_count: 6200,
      following_count: 310,
      articles_count: 59,
      total_views: 195000,
      created_at: '',
      updated_at: '',
    },
    category: {
      id: 'philosophy',
      name: 'Philosophy',
      slug: 'philosophy',
      description: 'Epistemology, mathematics, and cosmology.',
      icon: '🧠',
      color: '#0F5132',
      parent_id: null,
      articles_count: 245,
      created_at: '',
    },
  },
]
