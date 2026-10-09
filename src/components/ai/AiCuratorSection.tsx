import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Send, BookOpen, FileText, ArrowRight, ArrowUpRight, Info } from 'lucide-react'
import { SUGGESTED_PROMPTS, KNOWLEDGE_BASE, KnowledgeResponse } from '../../data/aiKnowledgeBase'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactItem } from '../../types/archiveTypes'

import { FunctionsHttpError } from '@supabase/supabase-js'
import { KolexKnowledgeService } from '../../lib/kolex/service'
import { supabase } from '../../lib/supabase'
import { licenseLabel } from '@/lib/knowledge'

export interface AiCuratorSectionProps {
  onInspectArtifact: (artifact: ArtifactItem) => void
}

interface RecordExcerpt {
  id: string
  title: string
  text: string
  source?: string
  href?: string
  externalHref?: string
}

interface ChatMessage {
  id: string
  sender: 'user' | 'curator'
  text: string
  topicTitle?: string
  citations?: string[]
  relatedArtifactId?: string
  excerpts?: RecordExcerpt[]
  searchQuery?: string
  answerSources?: CuratorSource[]
}

interface CuratorSource {
  n: number
  title: string
  slug: string | null
  license: string | null
  attribution: string | null
  sourceUrl: string | null
}

interface CuratorResponse {
  answer: string | null
  sources: CuratorSource[]
  message?: string
}

type CuratorResult =
  | { kind: 'answer'; data: CuratorResponse }
  | { kind: 'rate-limited' }
  | { kind: 'unavailable' }

async function askCurator(question: string): Promise<CuratorResult> {
  try {
    const { data, error } = await supabase.functions.invoke<CuratorResponse>('curator', {
      body: { question },
    })
    if (error) {
      if (error instanceof FunctionsHttpError && (error.context as Response | undefined)?.status === 429) {
        return { kind: 'rate-limited' }
      }
      return { kind: 'unavailable' }
    }
    if (!data || !Array.isArray(data.sources)) return { kind: 'unavailable' }
    return { kind: 'answer', data }
  } catch {
    return { kind: 'unavailable' }
  }
}

const sourceHref = (s: CuratorSource | undefined) =>
  s?.slug ? `/article/${s.slug}` : undefined

// Turns "[1]" / "[1, 2]" markers into links to the cited records.
function renderWithCitations(text: string, sources: CuratorSource[]): React.ReactNode[] {
  const parts = text.split(/(\[\d+(?:\s*,\s*\d+)*\])/g)
  return parts.map((part, i) => {
    const marker = part.match(/^\[(\d+(?:\s*,\s*\d+)*)\]$/)
    if (!marker) return <React.Fragment key={i}>{part}</React.Fragment>
    const nums = marker[1].split(',').map((n) => parseInt(n.trim(), 10))
    return (
      <sup key={i} className="font-mono text-[10px]">
        [
        {nums.map((n, j) => {
          const source = sources.find((s) => s.n === n)
          const href = sourceHref(source)
          return (
            <React.Fragment key={n}>
              {j > 0 && ', '}
              {href ? (
                <Link
                  to={href}
                  title={source?.title}
                  className="text-primary-600 dark:text-accent-400 hover:underline font-semibold"
                >
                  {n}
                </Link>
              ) : (
                <span title={source?.title}>{n}</span>
              )}
            </React.Fragment>
          )
        })}
        ]
      </sup>
    )
  })
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Whole-word match (allowing a plural "s"), so "start" doesn't match the keyword "star".
function findLocalTopic(query: string): KnowledgeResponse | null {
  const q = normalize(query)
  for (const item of KNOWLEDGE_BASE) {
    const hit = item.keywords.some((kw) =>
      new RegExp(`\\b${escapeRegExp(normalize(kw))}s?\\b`).test(q),
    )
    if (hit) return item
  }
  return null
}

const trimExcerpt = (text: string, max = 420) => {
  const clean = text.replace(/^\[Entity:[^\]]+\]\s*/, '').replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max)}…`
}

async function findRecordExcerpts(query: string): Promise<RecordExcerpt[]> {
  try {
    const service = new KolexKnowledgeService(supabase)
    const result = await service.retrieveKnowledge({
      query,
      matchCount: 3,
      matchThreshold: 0.15,
    })
    const seen = new Set<string>()
    return result.matches
      .filter((m) => {
        if (seen.has(m.knowledgeItemId)) return false
        seen.add(m.knowledgeItemId)
        return true
      })
      .map((m) => ({
        id: m.chunkId,
        title: m.title,
        text: trimExcerpt(m.chunkContent),
        source: m.sourceName || (m.attribution !== 'AfroArchive Repository' ? m.attribution : undefined),
        href: m.slug ? `/article/${m.slug}` : undefined,
        externalHref: m.slug ? undefined : m.originalUrl || m.sourceUrl || undefined,
      }))
  } catch (err) {
    console.warn('Archive record lookup failed:', err)
    return []
  }
}

export const AiCuratorSection: React.FC<AiCuratorSectionProps> = ({ onInspectArtifact }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'curator',
      text: 'Ask a question about the manuscripts, places, objects and ideas in this museum. I answer from the archive’s own records and point you to the sources so you can check them.',
      topicTitle: 'Ask the Curator',
    },
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const handleSendQuery = async (queryText: string) => {
    const query = queryText.trim()
    if (!query || isThinking) return

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: query }])
    setInputQuery('')
    setIsThinking(true)

    try {
      const remote = await askCurator(query)

      if (remote.kind === 'rate-limited') {
        setMessages((prev) => [
          ...prev,
          {
            id: `curator-${Date.now()}`,
            sender: 'curator',
            text: 'You’re asking quickly — please wait a moment.',
          },
        ])
        return
      }

      if (remote.kind === 'answer') {
        const { answer, sources, message } = remote.data
        const reply: ChatMessage = answer
          ? {
              id: `curator-${Date.now()}`,
              sender: 'curator',
              text: answer,
              topicTitle: 'From the archive',
              answerSources: sources,
            }
          : {
              id: `curator-${Date.now()}`,
              sender: 'curator',
              text: message || 'I couldn’t find that in the archive yet.',
              topicTitle: 'No matching records',
              searchQuery: query,
            }
        setMessages((prev) => [...prev, reply])
        return
      }

      // Curator service unavailable: fall back to matching on the archive's records locally.
      const local = findLocalTopic(query)
      const excerpts = await findRecordExcerpts(query)

      let reply: ChatMessage
      if (local) {
        reply = {
          id: `curator-${Date.now()}`,
          sender: 'curator',
          text: local.response,
          topicTitle: local.topicTitle,
          citations: local.citations,
          relatedArtifactId: local.relatedArtifactId,
          excerpts,
        }
      } else if (excerpts.length > 0) {
        reply = {
          id: `curator-${Date.now()}`,
          sender: 'curator',
          text: 'These records in the archive look relevant to your question:',
          topicTitle: 'From the archive',
          excerpts,
        }
      } else {
        reply = {
          id: `curator-${Date.now()}`,
          sender: 'curator',
          text: 'I couldn’t find anything in the archive’s records about that yet. Try rephrasing, pick one of the suggested questions, or search the full archive.',
          topicTitle: 'No matching records',
          searchQuery: query,
        }
      }
      setMessages((prev) => [...prev, reply])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <section
      id="ai"
      aria-label="Ask the Curator"
      className="py-12 md:py-16 bg-dark-bg border-t border-white/10 text-ivory-100 overflow-hidden"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className="eyebrow">Ask the curator</span>
              <span className="text-xs text-ivory-400">
                Answers with sources
              </span>
            </div>

            <h2 className="heading-xl text-white">
              Ask the curator
            </h2>

            <p className="text-sm md:text-base text-ivory-300 leading-relaxed">
              Ask about manuscripts, monuments, philosophy and the history behind the objects in this museum.
            </p>

            <p className="flex items-start gap-2 text-xs text-ivory-400">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>Answers are drawn from the archive’s records and may be incomplete. Check the linked sources.</span>
            </p>
          </div>
        </div>

        {/* Suggested Prompts Pills */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-ivory-400 block">
            Suggested questions
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(prompt)}
                type="button"
                disabled={isThinking}
                className="text-sm text-ivory-200 bg-white/5 border border-white/10 hover:border-accent-400/40 hover:text-white px-3.5 py-1.5 rounded-full transition-colors text-left disabled:opacity-60"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Curator Interface Window */}
        <div className="card rounded-2xl overflow-hidden flex flex-col h-[600px]">
          
          {/* Window Header */}
          <div className="px-6 py-4 bg-dark-surface border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-400/10 border border-accent-400/30 flex items-center justify-center text-accent-300">
                <Sparkles className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg leading-tight text-white">
                  Ask the curator
                </span>
                <span className="text-xs text-ivory-400">
                  Drawn from the archive’s records
                </span>
              </div>
            </div>
          </div>

          {/* Chat Transcript Scroll Region */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6" aria-live="polite">
            {messages.map((msg) => {
              const isCurator = msg.sender === 'curator'
              const artifactLink = msg.relatedArtifactId
                ? ARTIFACTS_DATA.find((a) => a.id === msg.relatedArtifactId)
                : null

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isCurator ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-3xl rounded-2xl p-5 space-y-4 ${
                      isCurator
                        ? 'bg-dark-surface border border-white/10 text-ivory-100'
                        : 'bg-primary-700 text-white'
                    }`}
                  >
                    {isCurator && msg.topicTitle && (
                      <div className="border-b border-white/10 pb-2">
                        <span className="text-xs font-semibold text-accent-300">
                          {msg.topicTitle}
                        </span>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {isCurator && msg.answerSources
                        ? renderWithCitations(msg.text, msg.answerSources)
                        : msg.text}
                    </p>

                    {/* Sources cited by the curator's answer */}
                    {isCurator && msg.answerSources && msg.answerSources.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <span className="text-xs text-accent-300 flex items-center gap-1.5 font-semibold">
                          <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Sources
                        </span>
                        <ol className="space-y-2">
                          {msg.answerSources.map((s) => {
                            const href = sourceHref(s)
                            return (
                              <li key={s.n} className="flex gap-2 text-xs">
                                <span className="font-mono text-gray-500 dark:text-gray-400">[{s.n}]</span>
                                <div className="space-y-0.5">
                                  {href ? (
                                    <Link
                                      to={href}
                                      className="font-serif font-semibold text-sm text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-accent-400 hover:underline"
                                    >
                                      {s.title}
                                    </Link>
                                  ) : s.sourceUrl ? (
                                    <a
                                      href={s.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 font-serif font-semibold text-sm text-gray-900 dark:text-white hover:underline"
                                    >
                                      {s.title} <ArrowUpRight className="w-3.5 h-3.5" />
                                    </a>
                                  ) : (
                                    <span className="font-serif font-semibold text-sm text-gray-900 dark:text-white">
                                      {s.title}
                                    </span>
                                  )}
                                  <div className="text-gray-500 dark:text-gray-400">
                                    {licenseLabel(s.license)}
                                    {s.attribution && ` · ${s.attribution}`}
                                  </div>
                                </div>
                              </li>
                            )
                          })}
                        </ol>
                      </div>
                    )}

                    {/* Record excerpts */}
                    {isCurator && msg.excerpts && msg.excerpts.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-3">
                        <span className="text-xs text-accent-300 font-semibold block">
                          Related records
                        </span>
                        {msg.excerpts.map((ex) => (
                          <div key={ex.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-1.5">
                            <div className="font-serif font-semibold text-sm text-gray-900 dark:text-white">{ex.title}</div>
                            <p className="text-xs text-ivory-300 leading-relaxed">{ex.text}</p>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              {ex.source && (
                                <span className="text-gray-500 dark:text-gray-400">Source: {ex.source}</span>
                              )}
                              {ex.href ? (
                                <Link
                                  to={ex.href}
                                  className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-accent-400 hover:underline"
                                >
                                  Read the record <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              ) : ex.externalHref ? (
                                <a
                                  href={ex.externalHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-primary-600 dark:text-accent-400 hover:underline"
                                >
                                  View original <ArrowUpRight className="w-3.5 h-3.5" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Citations Box */}
                    {isCurator && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-1 text-xs text-ivory-300">
                        <span className="text-xs text-accent-300 flex items-center gap-1.5 font-semibold">
                          <FileText className="w-3.5 h-3.5" aria-hidden="true" /> Sources
                        </span>
                        {msg.citations.map((cite, i) => (
                          <div key={i} className="text-xs text-gray-500 dark:text-gray-400">
                            • {cite}
                          </div>
                        ))}
                      </div>
                    )}

                    {isCurator && msg.searchQuery && (
                      <div className="pt-3 border-t border-white/10 flex justify-end">
                        <Link
                          to={`/discover?q=${encodeURIComponent(msg.searchQuery)}`}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-accent-300 hover:underline"
                        >
                          <span>Search the full archive</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {/* Artifact Deep Link Button */}
                    {isCurator && artifactLink && (
                      <div className="pt-3 border-t border-white/10 flex justify-end">
                        <button
                          onClick={() => onInspectArtifact(artifactLink)}
                          type="button"
                          className="inline-flex items-center gap-2 text-xs font-semibold text-accent-300 hover:underline transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>View in the collection: {artifactLink.title}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isThinking && (
              <div className="flex items-center gap-2 text-accent-300 text-sm animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Searching the archive…</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendQuery(inputQuery)
            }}
            className="p-4 bg-dark-surface border-t border-white/10 flex items-center gap-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              aria-label="Your question"
              placeholder="Ask about manuscripts, civilizations, philosophy..."
              className="input flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isThinking}
              className="btn btn-primary p-3"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
