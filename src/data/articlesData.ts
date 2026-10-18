import type { Article, Category, Profile } from '@/types'

// Editorial explainers that ship with the site. They are written by the
// AfroArchive editorial desk, not by named scholars, and carry no engagement
// numbers because none are tracked for them.

const EDITORIAL: Profile = {
  id: 'afroarchive-editorial',
  username: 'afroarchive',
  full_name: 'AfroArchive Editorial',
  bio: 'Introductory essays prepared by the AfroArchive editorial desk from the published scholarship listed under each article.',
  avatar_url: null,
  cover_url: null,
  country: null,
  website: null,
  languages: ['en'],
  role: 'contributor',
  is_verified: false,
  followers_count: 0,
  following_count: 0,
  articles_count: 0,
  total_views: 0,
  created_at: '',
  updated_at: '',
}

function category(slug: string, name: string, description: string): Category {
  return { id: slug, slug, name, description, icon: null, color: null, parent_id: null, articles_count: 0, created_at: '' }
}

const CATEGORIES = {
  philosophy: category('philosophy', 'Philosophy & Thought', 'African philosophical systems, ethics and worldviews.'),
  history: category('history', 'History & Civilizations', 'Empires, kingdoms and the archaeology of African societies.'),
  science: category('science', 'Science & Innovation', 'Astronomy, mathematics, medicine and technology.'),
  art: category('art-culture', 'Art & Culture', 'Sculpture, metallurgy, music and visual traditions.'),
}

function editorial(
  fields: Pick<Article, 'id' | 'title' | 'slug' | 'excerpt' | 'content' | 'cover_image' | 'cover_credit' | 'reading_time' | 'references_list' | 'country' | 'time_period' | 'published_at'> & { category: Category }
): Article {
  return {
    author_id: EDITORIAL.id,
    status: 'published',
    category_id: fields.category.id,
    views_count: 0,
    likes_count: 0,
    comments_count: 0,
    bookmarks_count: 0,
    is_featured: true,
    language: 'en',
    youtube_embed: null,
    created_at: fields.published_at ?? '',
    updated_at: fields.published_at ?? '',
    author: EDITORIAL,
    ...fields,
  }
}

export const FOUNDATIONAL_ARTICLES: Article[] = [
  editorial({
    id: 'art-ubuntu-01',
    title: 'The Philosophy of Ubuntu: I Am Because We Are',
    slug: 'philosophy-of-ubuntu',
    excerpt: 'Ubuntu is a southern African ethic of personhood built on relationships. This essay introduces its core ideas and how they shaped post-apartheid South Africa.',
    content: `Ubuntu is a southern African ethical idea rooted in the Nguni and Bantu languages. It is most often expressed through the Zulu maxim "Umuntu ngumuntu ngabantu", usually translated as "a person is a person through other persons."

Where much of modern European philosophy starts from the individual mind, Ubuntu starts from relationships. Personhood is not simply given at birth; it is achieved and recognised through how one treats family, neighbours, ancestors and strangers.

### Key dimensions of Ubuntu ethics

1. **Relational personhood.** Human existence is social. Harm done to one member of a community diminishes the community as a whole.
2. **Restoration over retribution.** In many southern African dispute-resolution traditions the aim was to repair relationships and restore balance rather than to isolate the wrongdoer.
3. **Hospitality and shared responsibility.** Obligations extend beyond the household, including care for children, elders and travellers.

> "A person with Ubuntu is open and available to others, affirming of others, does not feel threatened that others are able and good, based from a proper self-assurance that comes from knowing that he or she belongs in a greater whole."
> — Desmond Tutu, No Future Without Forgiveness (1999)

### Ubuntu in public life

After apartheid, Ubuntu was invoked in the epilogue of South Africa's 1993 Interim Constitution and in the work of the Truth and Reconciliation Commission. Philosophers such as Mogobe Ramose and Thaddeus Metz have since developed it into systematic moral theories, and it is discussed today in bioethics, law and political philosophy. Scholars also debate how far a single "Ubuntu philosophy" can be generalised across very different communities.`,
    cover_image: 'https://commons.wikimedia.org/wiki/Special:FilePath/South%20African%20stand%20-%20Community%20Village.jpg?width=1600',
    cover_credit: 'Community village, South Africa. Photo: Emna Mizouni, CC BY-SA 4.0, via Wikimedia Commons',
    category: CATEGORIES.philosophy,
    reading_time: 4,
    references_list: [
      'Tutu, Desmond. No Future Without Forgiveness. Doubleday, 1999.',
      'Ramose, Mogobe B. African Philosophy Through Ubuntu. Mond Books, 1999.',
      'Metz, Thaddeus. "Toward an African Moral Theory." Journal of Political Philosophy 15 (3), 2007.',
      'Gade, Christian B. N. "The Historical Development of the Written Discourses on Ubuntu." South African Journal of Philosophy 30 (3), 2011.',
    ],
    country: 'South Africa',
    time_period: 'Contemporary',
    published_at: '2026-07-15T10:00:00Z',
  }),

  editorial({
    id: 'art-zimbabwe-02',
    title: 'Great Zimbabwe: Stone Architecture of a Southern African Capital',
    slug: 'great-zimbabwe-engineering',
    excerpt: 'Between the 11th and 15th centuries, Shona-speaking builders raised Great Zimbabwe, the largest ancient stone structure in sub-Saharan Africa, without mortar.',
    content: `Great Zimbabwe, near present-day Masvingo, was the capital of a Shona-speaking state that flourished from roughly the 11th to the 15th century. At its height it may have housed around 10,000 to 18,000 people, and its ruins cover more than 700 hectares.

### Mortarless drystone walls

The site is famous for its drystone masonry. The outer wall of the Great Enclosure is about 250 metres long and reaches roughly 11 metres in height and 5 metres in thickness, built entirely without mortar.

Builders split granite from the surrounding hills, where natural heating and cooling causes the rock to break into slabs. The blocks were dressed and laid in courses that lean slightly inward, which helps the walls stand under their own weight.

### The Great Enclosure and the Conical Tower

Inside the Great Enclosure stands a solid stone Conical Tower about 9 metres high. Its purpose is not known for certain; interpretations include a symbolic granary, a sign of royal authority or a ritual structure.

### Trade across the Indian Ocean

Excavations have recovered:
- Chinese celadon and other Asian ceramics
- Persian and Near Eastern glass beads and pottery
- Gold and copper objects linked to regional mining
- Eight carved soapstone birds, now national symbols of Zimbabwe

These finds show that Great Zimbabwe was connected, through Swahili coastal towns such as Kilwa, to Indian Ocean trade networks reaching Arabia, India and China.

### Who built it

Colonial-era writers claimed the site was built by outsiders. Archaeological work from David Randall-MacIver (1905) and Gertrude Caton-Thompson (1929) onward demonstrated that it was built by the ancestors of the Shona. Great Zimbabwe became a UNESCO World Heritage Site in 1986.`,
    cover_image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Wall%20of%20the%20great%20enclosure%2C%20Great%20Zimbabwe.JPG?width=1600',
    cover_credit: 'Outer wall of the Great Enclosure, Great Zimbabwe. Photo: Jens Klinzing, CC BY 3.0, via Wikimedia Commons',
    category: CATEGORIES.history,
    reading_time: 4,
    references_list: [
      'Garlake, Peter. Great Zimbabwe. Thames and Hudson, 1973.',
      'Huffman, Thomas N. Snakes and Crocodiles: Power and Symbolism in Ancient Zimbabwe. Witwatersrand University Press, 1996.',
      'Pikirayi, Innocent. The Zimbabwe Culture: Origins and Decline of Southern Zambezian States. AltaMira Press, 2001.',
      'UNESCO World Heritage Centre. "Great Zimbabwe National Monument" (ref. 364).',
    ],
    country: 'Zimbabwe',
    time_period: '1100–1450 CE',
    published_at: '2026-07-20T10:00:00Z',
  }),

  editorial({
    id: 'art-timbuktu-03',
    title: 'Timbuktu: Scholarship and Manuscripts on the Niger Bend',
    slug: 'timbuktu-medieval-university',
    excerpt: 'From the 14th to the 16th century, Timbuktu was one of the great centres of Islamic learning in West Africa. Its manuscript libraries survive to this day.',
    content: `Timbuktu sits near the Niger River on the southern edge of the Sahara. Under the Mali and then the Songhay empires it became a centre of trade and, above all, of Islamic scholarship.

### The mosques of Sankoré, Djinguereber and Sidi Yahya

Learning in Timbuktu was not organised as a single university in the modern sense. Scholars taught students in their homes and around the great mosques of Sankoré, Djinguereber and Sidi Yahya. Students moved from teacher to teacher, receiving a licence (*ijāza*) to transmit a text once they had mastered it.

The curriculum included:
- Qur'anic studies, law (*fiqh*) and theology
- Arabic grammar, rhetoric and logic
- Astronomy, arithmetic and medicine

Estimates of the number of students in the 16th century vary widely, and figures as high as 25,000 found online are not supported by the sources.

### The manuscript tradition

Leo Africanus, who visited in the early 16th century, wrote that books brought from North Africa sold for more than any other merchandise in Timbuktu.

Families built private libraries over generations. The manuscripts are written in Arabic and in African languages using Arabic script (*Ajami*). Their subjects range from law and theology to astronomy, medicine and commercial records.

In 2012–2013, during the occupation of northern Mali, librarians and families smuggled hundreds of thousands of manuscripts to Bamako. Some manuscripts held at the Ahmed Baba Institute were burned, but most of the collections were saved.`,
    cover_image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sankore%20Mosque%20in%20Timbuktu.jpg?width=1600',
    cover_credit: 'Sankoré Mosque, Timbuktu. Photo: upyernoz, CC BY 2.0, via Wikimedia Commons',
    category: CATEGORIES.history,
    reading_time: 4,
    references_list: [
      'Hunwick, John O. Timbuktu and the Songhay Empire: Al-Sa‘dī’s Ta’rīkh al-sūdān down to 1613. Brill, 2003.',
      'Saad, Elias N. Social History of Timbuktu: The Role of Muslim Scholars and Notables, 1400–1900. Cambridge University Press, 1983.',
      'Jeppie, Shamil, and Souleymane Bachir Diagne (eds.). The Meanings of Timbuktu. HSRC Press, 2008.',
    ],
    country: 'Mali',
    time_period: '1300–1600 CE',
    published_at: '2026-07-25T10:00:00Z',
  }),

  editorial({
    id: 'art-dogon-04',
    title: 'Dogon Cosmology and the Sirius Debate',
    slug: 'dogon-astronomical-knowledge',
    excerpt: 'Claims that the Dogon of Mali knew about the invisible star Sirius B are widely repeated. What did the ethnographers record, and why do later fieldworkers dispute it?',
    content: `The Dogon live along the Bandiagara Escarpment in central Mali. Their cosmology, rituals and masked dances have been studied by anthropologists for nearly a century, and the Cliff of Bandiagara is a UNESCO World Heritage Site.

### What Griaule and Dieterlen reported

In the 1930s–1950s the French ethnographers Marcel Griaule and Germaine Dieterlen worked with Dogon informants. In 1950 and in their book *Le Renard Pâle* (1965) they reported that some Dogon described:
- a star they called *po tolo*, companion to Sirius (*sigi tolo*)
- an orbit of about 50 years
- a material heavier than anything on earth

These details resemble Sirius B, a white dwarf with a 50-year orbit that cannot be seen without a telescope. The claim was later popularised by Robert Temple's *The Sirius Mystery* (1976).

### Why the claim is contested

In 1991 the anthropologist Walter van Beek led a team that restudied the Dogon. They found no knowledge of Sirius as a double star among the people they interviewed. Van Beek suggested that Griaule's findings were shaped by his method of interviewing a small number of informants. Others point to possible contact with European astronomy, which was widely discussed in the 1920s. Most anthropologists today treat the Sirius B story as unproven.

### What is not in doubt

Dogon cosmology is a rich and complex body of knowledge in its own right. It links:
- the agricultural calendar
- the *Sigui* ceremony, held about every 60 years
- architecture, masks and myth

Its value does not depend on matching modern astrophysics.`,
    cover_image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tellem%20Dwellings%20above%20Dogon%20huts.jpg?width=1600',
    cover_credit: 'Tellem cliff dwellings above a Dogon village, Bandiagara Escarpment, Mali. Photo: Timm, CC BY-SA 3.0, via Wikimedia Commons',
    category: CATEGORIES.science,
    reading_time: 4,
    references_list: [
      'Griaule, Marcel, and Germaine Dieterlen. Le Renard Pâle. Institut d’Ethnologie, 1965.',
      'van Beek, Walter E. A. "Dogon Restudied: A Field Evaluation of the Work of Marcel Griaule." Current Anthropology 32 (2), 1991.',
      'UNESCO World Heritage Centre. "Cliff of Bandiagara (Land of the Dogons)" (ref. 516).',
    ],
    country: 'Mali',
    time_period: '20th-century ethnography',
    published_at: '2026-07-28T10:00:00Z',
  }),

  editorial({
    id: 'art-benin-05',
    title: 'Casting the Kingdom: The Brass Plaques and Heads of Benin',
    slug: 'benin-bronzes-metallurgy',
    excerpt: 'Royal guilds in the Kingdom of Benin cast brass heads and palace plaques for centuries. The works were looted in 1897 and are now at the centre of debates on restitution.',
    content: `The Kingdom of Benin, in present-day Edo State, Nigeria, supported specialist royal guilds. The brass casters' guild, *Igun Eronmwon*, worked for the Oba (king) and produced commemorative heads, figures and relief plaques. These works are usually called the "Benin Bronzes", although most are brass.

### The lost-wax process

The casters used the lost-wax (*cire perdue*) method:
1. A clay core was shaped.
2. Details were modelled over it in wax.
3. The wax model was covered with layers of clay to form a mould.
4. The mould was heated so the wax melted and ran out.
5. Molten metal was poured into the space the wax had left.
6. Once cool, the mould was broken away to reveal the casting.

Because the mould is destroyed, each casting is unique.

### Where the metal came from

Benin had little local copper. From the late 15th century, Portuguese and later Dutch traders exchanged brass manillas (bracelet-shaped ingots) for goods. A 2023 chemical study (Skowronek et al.) found that the metal in many manillas, and in many Benin works, came from the Rhineland in Germany. This links Benin's art to Atlantic trade networks.

### The palace plaques

From about the 16th century, rectangular plaques were nailed to the wooden pillars of the royal palace. They show:
- court ceremonies and officials
- warriors
- Portuguese visitors

### 1897 and restitution

In 1897 a British punitive expedition sacked Benin City. Thousands of objects were taken and sold to museums and collectors around the world.

Since 2021, institutions in Germany, the United States and the United Kingdom have begun transferring ownership of looted works back to Nigeria. Debate continues over where and how the returned works should be held.`,
    cover_image: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Benin_bronze_Louvre_A97-14-1.jpg',
    cover_credit: 'Commemorative head, Kingdom of Benin, Musée du Louvre. Public domain, via Wikimedia Commons',
    category: CATEGORIES.art,
    reading_time: 4,
    references_list: [
      'Ben-Amos, Paula Girshick. The Art of Benin. British Museum Press, rev. ed. 1995.',
      'Hicks, Dan. The Brutish Museums: The Benin Bronzes, Colonial Violence and Cultural Restitution. Pluto Press, 2020.',
      'Skowronek, Tobias B., et al. "German brass for Benin Bronzes: Geochemical analysis insights into the early Atlantic trade." PLOS ONE 18 (4), 2023.',
      'Plankensteiner, Barbara (ed.). Benin: Kings and Rituals. Snoeck, 2007.',
    ],
    country: 'Nigeria',
    time_period: '1400s–1897 CE',
    published_at: '2026-08-02T10:00:00Z',
  }),

  editorial({
    id: 'art-ifa-06',
    title: 'Ifá: The 256 Odù and Yoruba Systems of Knowledge',
    slug: 'ifa-divination-binary-system',
    excerpt: 'Ifá divination organises a vast body of Yoruba oral literature into 256 signs generated by a two-state system. UNESCO recognised it as intangible heritage in 2005.',
    content: `Ifá is a system of divination and a body of oral literature among the Yoruba of south-western Nigeria. It also exists across the Yoruba diaspora, from Benin Republic to Cuba and Brazil. UNESCO proclaimed it a Masterpiece of the Oral and Intangible Heritage of Humanity in 2005.

### How the signs are generated

A diviner (*babaláwo*) uses either sixteen palm nuts (*ikin*) or a divining chain (*ọ̀pẹ̀lẹ̀*). Each cast produces one of two marks, a single or a double stroke. Eight marks, arranged in two columns of four, make one sign.

There are 2⁸ = 256 possible combinations, called the *Odù*:
- sixteen principal Odù
- 240 combinations derived from them

### The verses

Each Odù is associated with many verses (*ẹsẹ Ifá*), which diviners memorise over years of training. The verses contain:
- narratives
- prescriptions for sacrifice
- herbal knowledge
- moral teaching

The diviner recites the verses linked to the sign that appears, and the client works out which one applies to their situation.

### Ifá and mathematics

Because the signs are generated by a two-state process, writers such as Ron Eglash have compared Ifá to binary arithmetic and traced possible historical links with geomancy in North Africa and the Arab world. These comparisons are illuminating, but Ifá is first of all a religious and literary tradition. Scholars like Wándé Abímbọ́lá emphasise its poetry, ethics and role in community life.`,
    cover_image: 'https://commons.wikimedia.org/wiki/Special:FilePath/Opon%20ifa%20retangular%2C%20Orossi.JPG?width=1600',
    cover_credit: 'Ifá divination tray (ọpọ́n Ifá). Photo: Toluaye, public domain, via Wikimedia Commons',
    category: CATEGORIES.philosophy,
    reading_time: 4,
    references_list: [
      'Abímbọ́lá, Wándé. Ifá: An Exposition of Ifá Literary Corpus. Oxford University Press Nigeria, 1976.',
      'Bascom, William. Ifa Divination: Communication Between Gods and Men in West Africa. Indiana University Press, 1969.',
      'Eglash, Ron. African Fractals: Modern Computing and Indigenous Design. Rutgers University Press, 1999.',
      'UNESCO. "Ifa divination system" (inscribed 2008 on the Representative List; proclaimed 2005).',
    ],
    country: 'Nigeria',
    time_period: 'Living tradition',
    published_at: '2026-08-10T10:00:00Z',
  }),
]
