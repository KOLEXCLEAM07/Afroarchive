import assert from 'node:assert/strict'
import test from 'node:test'

import { supabase } from '../src/lib/supabase'
import { recordFilter, recordVisibilityFilter, queryKey } from '../src/lib/knowledgeQuery'
import { NOT_FLAGGED } from '../src/lib/knowledge'

/**
 * The moderation filter and a search term have to travel in a *single* PostgREST
 * `or` parameter. Sending a second `or` (which the browse pages used to do)
 * silently drops the first one, so a searched view could leak flagged records.
 * These tests pin the combined expression down without touching the network.
 */

test('the base filter hides flagged records', () => {
  assert.equal(recordVisibilityFilter(), NOT_FLAGGED)
})

test('with no search term the filter is just the visibility filter', () => {
  assert.equal(recordFilter(''), recordVisibilityFilter())
  assert.equal(recordFilter(null), recordVisibilityFilter())
  assert.equal(recordFilter('   '), recordVisibilityFilter())
})

test('a search term is ANDed with the visibility filter, not sent as a second or', () => {
  const filter = recordFilter('mut')
  assert.ok(filter.startsWith('and('), 'the two conditions must be intersected')
  // One `or` for visibility, one for the search columns — and never a third.
  assert.equal((filter.match(/\bor\(/g) ?? []).length, 2)
  assert.ok(filter.includes('title.ilike."%mut%"'))
  assert.ok(filter.includes('summary.ilike."%mut%"'))
})

test('search wildcards in user input cannot break out of the filter', () => {
  const filter = recordFilter('100%_a"b')
  assert.ok(filter.includes('\\%'), 'a literal % must be escaped')
  assert.ok(filter.includes('\\_'), 'a literal _ must be escaped')
  assert.ok(filter.includes('\\"'), 'a literal quote must be escaped')
})

test('custom search columns are honoured', () => {
  const filter = recordFilter('benin', ['title'])
  assert.ok(filter.includes('title.ilike."%benin%"'))
  assert.equal(filter.includes('summary.ilike'), false)
})

test('queryKey is stable regardless of key order', () => {
  assert.equal(queryKey('archive', { region: 'west', q: 'x' }), queryKey('archive', { q: 'x', region: 'west' }))
  assert.notEqual(queryKey('archive', { q: 'x' }), queryKey('discover', { q: 'x' }))
})

/**
 * Guards the double-parenthesis bug that broke every migrated query:
 * `supabase.or()` adds its own parentheses, so a helper that also wraps its
 * output yields `((...))` and PostgREST rejects the request. Building the query
 * is pure — no request is sent.
 */
test('the built request carries one correctly wrapped or-parameter', () => {
  const search = supabase.from('knowledge_items').select('id').or(recordFilter('mut'))
  const ors = search.url.searchParams.getAll('or')
  assert.equal(ors.length, 1, 'exactly one or-parameter, or PostgREST drops the first')
  assert.equal(ors[0], `(and(or(${NOT_FLAGGED}),or(title.ilike."%mut%",summary.ilike."%mut%")))`)
  assert.equal(ors[0].startsWith('(('), false, 'a double-wrapped filter is rejected by PostgREST')

  const plain = supabase.from('knowledge_items').select('id').or(recordFilter(''))
  assert.equal(plain.url.searchParams.getAll('or')[0], `(${NOT_FLAGGED})`)
})
