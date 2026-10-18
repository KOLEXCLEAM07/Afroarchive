import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanRecordDescription, decodeHtmlEntities, stripMarkup } from '../src/lib/recordText'

test('decodeHtmlEntities restores escaped markup characters', () => {
  assert.equal(
    decodeHtmlEntities('&lt;a href="x"&gt;link&lt;/a&gt; &amp; &quot;quoted&quot;'),
    '<a href="x">link</a> & "quoted"',
  )
})

test('stripMarkup removes anchors together with their link text', () => {
  assert.equal(
    stripMarkup('Item <a href="https://example.com/x" rel="nofollow">example.com/x</a> kept'),
    'Item   kept',
  )
})

test('cleanRecordDescription keeps the caption but drops Internet Archive catalogue and OCR', () => {
  const description =
    'Bronze head of a girl wearing coral-bead head-dress. Benin, West Africa Identifier: handbooktoethnog00brit (find matches) Title: Handbook to the ethnographical collections Year: 1910 (1910s) Authors: British Museum. Dept. of British and Mediaeval Antiquities Subjects: Publisher: (London) : Printed by order of the Trustees Text Appearing Before Image: erit especial mention. The negro races are agriculturists Note About Images Please note that these images are extracted from scanned page images.'
  assert.equal(
    cleanRecordDescription(description),
    'Bronze head of a girl wearing coral-bead head-dress. Benin, West Africa',
  )
})

test('cleanRecordDescription drops a Flickr permission notice but keeps the description', () => {
  const description =
    'Olduvai Gorge - The Cradle of Mankind - archeological site where the first human remains were discovered in the Ngorongoro Conservation Area, Tanzania PERMISSION TO USE: Please check the licence for this photo on Flickr. If the photo is not marked with the Creative Commons licence, only my friends and family are permitted to use it.'
  assert.equal(
    cleanRecordDescription(description),
    'Olduvai Gorge - The Cradle of Mankind - archeological site where the first human remains were discovered in the Ngorongoro Conservation Area, Tanzania',
  )
})

test('cleanRecordDescription drops a photographer promo and its escaped link', () => {
  const description =
    'The facade of this building needs repairing every year. Mud bricks seem not to be the most long-lasting building material. For more photos of Mali, go to &lt;a href="https://www.flickr.com/photos/ralf-steinberger/albums/72157678759639200"&gt;www.flickr.com/photos/ralf-steinberger/albums/72157678759...&lt;/a&gt;'
  assert.equal(
    cleanRecordDescription(description),
    'The facade of this building needs repairing every year. Mud bricks seem not to be the most long-lasting building material.',
  )
})

test('cleanRecordDescription strips a David Rumsey preamble and trailing subject list', () => {
  const description =
    'Zoomable full resolution image available at davidrumsey.com.This image 13171.011 is a part of image group 13171.000.1 map on 4 sheets, 52x50 or smaller. Includes inset: Asores and descriptive text. Relief shown pictorially. Subjects: World'
  assert.equal(
    cleanRecordDescription(description),
    '1 map on 4 sheets, 52x50 or smaller. Includes inset: Asores and descriptive text. Relief shown pictorially.',
  )
})

test('cleanRecordDescription removes a Wiki Loves Art project note', () => {
  const description =
    'Kente Cloth Probably Ewe, Ghana, c. 1986 Cotton and rayon, plain and supplementary weft-weave Purchase, 1987 (5676.1) Wikipedia Loves Art at the Honolulu Academy of Arts This photo of item # 5676.1 was contributed under the team name "fresche" please add a comment to the original Flickr page Project galleries on Flickr: this institution, this team'
  assert.equal(
    cleanRecordDescription(description),
    'Kente Cloth Probably Ewe, Ghana, c. 1986 Cotton and rayon, plain and supplementary weft-weave Purchase, 1987 (5676.1)',
  )
})

test('cleanRecordDescription returns null for catalogue-only descriptions', () => {
  assert.equal(cleanRecordDescription('Subjects: Birds -- Canary Islands; Birds -- South Africa'), null)
  assert.equal(cleanRecordDescription('Includes bibliographical references Subjects: Ethnology'), null)
  assert.equal(
    cleanRecordDescription(
      'Source: Asiatic Society of Mumbai Pages/Folios: XXXVI, 578p Identifier: BK_00038093 Digitization Sponsor: Government of Maharashtra Subjects: Book; Geography and Travel',
    ),
    null,
  )
})

test('cleanRecordDescription leaves genuine prose alone', () => {
  const prose =
    'Laila Lalami (Arabic: ليلى العلمي, born 1968) is a Moroccan-American novelist, essayist, and professor.'
  assert.equal(cleanRecordDescription(prose), prose)
})

test('cleanRecordDescription does not touch labelled museum metadata', () => {
  const description = 'This ivory pendant depicts a queen mother. Medium: Ivory, iron. Dimensions: 12.5 cm. Accession Number: 1990.1'
  assert.equal(cleanRecordDescription(description), description)
})
