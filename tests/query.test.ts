import assert from 'node:assert/strict'
import test from 'node:test'
import { ilikeAny, isUuid, normalizeUrl } from '../src/lib/query'

test('isUuid accepts UUIDs and rejects arbitrary identifiers', () => {
  assert.equal(isUuid('f2d5be5c-4fad-43c9-9ef1-0e4d1b23d012'), true)
  assert.equal(isUuid('source-wikimedia'), false)
})

test('ilikeAny escapes user input before building a PostgREST filter', () => {
  assert.equal(
    ilikeAny(['title', 'summary'], '100% "Mali"'),
    'title.ilike."%100\\% \\"Mali\\"%",summary.ilike."%100\\% \\"Mali\\"%"',
  )
})

test('normalizeUrl only accepts safe http(s) URLs', () => {
  assert.equal(normalizeUrl('afroarchive.example'), 'https://afroarchive.example/')
  assert.equal(normalizeUrl('javascript:alert(1)'), null)
  assert.equal(normalizeUrl('http://example.com', { httpsOnly: true }), null)
})
