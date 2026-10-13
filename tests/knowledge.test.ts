import assert from 'node:assert/strict'
import test from 'node:test'
import { cleanRecordText, recordExcerpt } from '../src/lib/knowledge'

test('cleanRecordText removes imported HTML while preserving readable text', () => {
  assert.equal(
    cleanRecordText('A <a href="https://example.com">linked</a> record from commons:Timbuktu'),
    'A linked record from Timbuktu',
  )
})

test('recordExcerpt drops provider permission notices from card previews', () => {
  const description = 'Olduvai Gorge is an archaeological site in Tanzania. PERMISSION TO USE: Please check the licence on Flickr before reuse.'
  assert.equal(recordExcerpt(description), 'Olduvai Gorge is an archaeological site in Tanzania.')
})

test('recordExcerpt shortens long text on a word or sentence boundary', () => {
  const description = `${'A useful archive description. '.repeat(20)}Additional material.`
  const excerpt = recordExcerpt(description, 100)
  assert.ok(excerpt)
  assert.ok(excerpt.length <= 101)
  assert.match(excerpt, /…$/)
})
