import assert from 'node:assert/strict'
import test from 'node:test'

import { WikimediaImporter, type WikimediaRawPage } from '../scripts/ingestion/importers/wikimedia'
import { ArticImporter, type ArticArtwork } from '../scripts/ingestion/importers/artic'
import { MetMuseumImporter, type MetObject } from '../scripts/ingestion/importers/met'

/**
 * Fixture-driven tests for each importer's `normalize()` step.
 *
 * `normalize()` is where a raw museum or Commons response becomes the record the
 * archive stores, and it is the step most likely to corrupt data silently: a
 * wrong knowledge type, or a "re-hosting is fine" flag on restricted media,
 * never throws and never shows up in a dry-run count. These fixtures are trimmed
 * copies of real API responses.
 *
 * `normalize()` performs no I/O, so no database or network is touched here.
 */

// ─── Wikimedia Commons ────────────────────────────────────────

const WIKIMEDIA_FILE: WikimediaRawPage = {
  pageid: 12345,
  title: 'File:Timbuktu manuscript page.jpg',
  imageinfo: [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Timbuktu_manuscript_page.jpg',
      descriptionurl: 'https://commons.wikimedia.org/wiki/File:Timbuktu_manuscript_page.jpg',
      thumburl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Timbuktu_manuscript_page.jpg/800px-Timbuktu_manuscript_page.jpg',
      width: 2400,
      height: 1600,
      size: 456789,
      mime: 'image/jpeg',
      extmetadata: {
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        Artist: { value: '<a href="https://commons.wikimedia.org/wiki/User:X">Ann Porteus</a>' },
        ImageDescription: { value: 'A page from a <b>Timbuktu</b> manuscript &amp; its script.' },
        DateTimeOriginal: { value: '1600' },
        Categories: { value: 'Timbuktu|Manuscripts|Mali' },
      },
    },
  ],
}

test('Wikimedia: keeps a manuscript a manuscript and strips HTML from the text', async () => {
  const item = await new WikimediaImporter().normalize(WIKIMEDIA_FILE)
  assert.ok(item, 'expected a normalized record')

  assert.equal(item.knowledgeType, 'manuscript', '"manuscript" in the title must not be downgraded')
  assert.equal(item.title, 'Timbuktu manuscript page')
  // Tags and entities are removed, the readable text is kept.
  assert.equal(item.summary, 'A page from a Timbuktu manuscript & its script.')
  assert.equal(item.sourceRecordId, 'WMC-12345')
  assert.equal(item.timePeriod, '1600')
  assert.equal(item.entityData?.media?.[0].mediaType, 'image')
  // The binary is referenced, never copied.
  assert.equal(
    item.entityData?.media?.[0].fileUrl,
    'https://upload.wikimedia.org/wikipedia/commons/a/ab/Timbuktu_manuscript_page.jpg',
  )
})

test('Wikimedia: skips a file with no image info instead of storing a blank record', async () => {
  const item = await new WikimediaImporter().normalize({ pageid: 7, title: 'File:Nothing.jpg' })
  assert.equal(item, null)
})

test('Wikimedia: an unrecognised licence is metadata-only and not re-hostable', async () => {
  const noLicence = structuredClone(WIKIMEDIA_FILE)
  noLicence.pageid = 1001
  noLicence.imageinfo![0].extmetadata = {
    Artist: { value: 'Unknown' },
    ImageDescription: { value: 'Old photograph.' },
  }
  const item = await new WikimediaImporter().normalize(noLicence)
  assert.ok(item)
  assert.equal(item.rights.licenseType, 'unknown')
  assert.equal(item.rights.canRehost, false)
  assert.equal(item.rights.isMetadataOnly, true)
})

test('Wikimedia: usage restrictions block re-hosting even under a free licence', async () => {
  const restricted = structuredClone(WIKIMEDIA_FILE)
  restricted.pageid = 1002
  restricted.imageinfo![0].extmetadata = {
    ...restricted.imageinfo![0].extmetadata,
    Restrictions: { value: 'Personality rights' },
  }
  const item = await new WikimediaImporter().normalize(restricted)
  assert.ok(item)
  assert.equal(item.rights.canRehost, false)
  assert.match(String(item.rights.rightsStatement), /Personality rights/)
})

// ─── Art Institute of Chicago ─────────────────────────────────

const ARTIC_ARTWORK: ArticArtwork = {
  id: 146967,
  title: 'Figure: Seated Couple',
  date_display: '19th century',
  place_of_origin: 'Nigeria',
  artist_display: 'Yoruba\nNigeria',
  medium_display: 'Wood, pigment',
  dimensions: '40 × 12 × 10 cm',
  credit_line: 'The Art Institute of Chicago, Gift of an anonymous donor',
  main_reference_number: '1997.345',
  image_id: 'a1b2c3d4-0000-0000-0000-000000000000',
  classification_title: 'sculpture',
  style_title: 'Yoruba',
  short_description: '<p>Carved <b>wood</b> figures of a couple.</p>',
  thumbnail: { width: 800, height: 1200 },
  is_public_domain: true,
  department_title: 'Arts of Africa',
}

test('Art Institute: a public-domain object becomes a CC0 artifact with IIIF image URLs', async () => {
  const item = await new ArticImporter().normalize(ARTIC_ARTWORK)
  assert.ok(item)

  assert.equal(item.knowledgeType, 'cultural_artifact')
  assert.equal(item.rights.licenseType, 'cc0')
  assert.equal(item.rights.canRehost, true)
  assert.ok(item.countryCodes.includes('NG'), 'Nigeria should be detected as an African country')
  assert.match(item.slug, /-artic-146967$/)
  assert.equal(item.sourceUrl, 'https://www.artic.edu/artworks/146967')
  assert.equal(
    item.entityData?.media?.[0].fileUrl,
    'https://www.artic.edu/iiif/2/a1b2c3d4-0000-0000-0000-000000000000/full/843,/0/default.jpg',
  )
  // The leading "The Art Institute of Chicago," is stripped so the credit is not doubled.
  assert.match(item.rights.attribution, /^Art Institute of Chicago, Gift of an anonymous donor$/)
})

test('Art Institute: skips objects that are not public domain or have no image', async () => {
  assert.equal(await new ArticImporter().normalize({ ...ARTIC_ARTWORK, is_public_domain: false }), null)
  assert.equal(await new ArticImporter().normalize({ ...ARTIC_ARTWORK, image_id: null }), null)
  assert.equal(await new ArticImporter().normalize({ ...ARTIC_ARTWORK, title: '   ' }), null)
})

// ─── The Metropolitan Museum of Art ───────────────────────────

const MET_OBJECT: MetObject = {
  objectID: 318123,
  isPublicDomain: true,
  primaryImage: 'https://images.metmuseum.org/CRDImages/ao/original/DP123456.jpg',
  primaryImageSmall: 'https://images.metmuseum.org/CRDImages/ao/web-large/DP123456.jpg',
  accessionNumber: '1978.412.1',
  department: 'Arts of Africa, Oceania, and the Americas',
  objectName: 'Figure',
  title: 'Figure: Seated Couple',
  culture: 'Dogon',
  country: 'Mali',
  region: 'Bandiagara',
  objectDate: '16th–19th century',
  medium: 'Wood',
  dimensions: 'H. 30 cm',
  creditLine: 'The Michael C. Rockefeller Memorial Collection',
  classification: 'Wood-Sculpture',
  objectURL: 'https://www.metmuseum.org/art/collection/search/318123',
}

test('Met: a public-domain object becomes a CC0 artifact credited to the museum', async () => {
  const item = await new MetMuseumImporter().normalize(MET_OBJECT)
  assert.ok(item)

  assert.equal(item.knowledgeType, 'cultural_artifact')
  assert.equal(item.rights.licenseType, 'cc0')
  assert.equal(item.rights.canRehost, true)
  assert.ok(item.countryCodes.includes('ML'), 'Mali should be detected as an African country')
  assert.match(item.slug, /-met-318123$/)
  assert.match(item.rights.attribution, /The Metropolitan Museum of Art/)
})

test('Met: only the object\'s own type decides manuscript vs artifact', async () => {
  const manuscript = await new MetMuseumImporter().normalize({
    ...MET_OBJECT,
    objectID: 555,
    objectName: 'Manuscripts',
    classification: 'Manuscripts',
  })
  assert.equal(manuscript?.knowledgeType, 'manuscript')

  // "Amulet, papyrus scepter" mentions papyrus but is an artifact, not a manuscript.
  const artifact = await new MetMuseumImporter().normalize({
    ...MET_OBJECT,
    objectID: 556,
    objectName: 'Amulet, papyrus scepter',
    classification: 'Amulets',
  })
  assert.equal(artifact?.knowledgeType, 'cultural_artifact')
})

test('Met: skips non-public-domain, image-less or failed objects', async () => {
  assert.equal(await new MetMuseumImporter().normalize({ ...MET_OBJECT, isPublicDomain: false }), null)
  assert.equal(await new MetMuseumImporter().normalize({ ...MET_OBJECT, primaryImage: '' }), null)
  assert.equal(await new MetMuseumImporter().normalize({ objectID: 1, _fetchError: 'HTTP 404' }), null)
})
