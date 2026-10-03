import React, { useState } from 'react'
import { Sparkles, Send, BookOpen, ShieldCheck, FileText, ArrowRight, CornerDownLeft } from 'lucide-react'
import { SUGGESTED_PROMPTS, searchKnowledgeBase, KnowledgeResponse } from '../../data/aiKnowledgeBase'
import { ARTIFACTS_DATA } from '../../data/archiveData'
import { ArtifactItem } from '../../types/archiveTypes'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

import { KolexKnowledgeService } from '../../lib/kolex/service'
import { supabase } from '../../lib/supabase'

export interface AiCuratorSectionProps {
  onInspectArtifact: (artifact: ArtifactItem) => void
}

interface ChatMessage {
  id: string
  sender: 'user' | 'curator'
  text: string
  topicTitle?: string
  citations?: string[]
  relatedArtifactId?: string
}

export const AiCuratorSection: React.FC<AiCuratorSectionProps> = ({ onInspectArtifact }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'curator',
      text: 'Greetings. I am the AfroArchive AI Exhibition Curator, powered by Kolex AI and connected directly to our Supabase pgvector knowledge database. Ask me anything about Timbuktu manuscripts, Ubuntu philosophy, Benin Bronzes, or African civilizations!',
      topicTitle: 'Kolex AI Curatorial Assistant · Live Supabase Database',
      citations: [
        '[1] AfroArchive pgvector Knowledge Base (Live)',
        '[2] OpenAlex Scholarly Index & Wikimedia Commons Provenance',
      ],
    },
  ])
  const [inputQuery, setInputQuery] = useState('')
  const [isThinking, setIsThinking] = useState(false)

  const handleSendQuery = async (queryText: string) => {
    if (!queryText.trim()) return

    const userMsgId = `user-${Date.now()}`
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: queryText,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputQuery('')
    setIsThinking(true)

    try {
      const service = new KolexKnowledgeService(supabase)
      const result = await service.retrieveKnowledge({
        query: queryText,
        matchCount: 3,
        matchThreshold: 0.15,
      })

      if (result.matches.length > 0) {
        const top = result.matches[0]
        const cleanContent = top.chunkContent.replace(/^\[Entity:[^\]]+\]\s*/, '')
        const citationList = result.sources.map(
          (s) => `${s.badge} ${s.title} (${s.sourceName}) — ${s.attribution} [${s.licenseType}]`
        )

        const responseText = `${cleanContent}\n\n[⚡ Kolex Live Retrieval: ${result.matches.length} chunks retrieved from Supabase pgvector in ${result.executionTimeMs}ms · ${(top.similarity * 100).toFixed(0)}% semantic match]`

        const curatorMsg: ChatMessage = {
          id: `curator-${Date.now()}`,
          sender: 'curator',
          text: responseText,
          topicTitle: `${top.title} · ${top.knowledgeType.toUpperCase()}`,
          citations: citationList,
          relatedArtifactId: top.knowledgeItemId,
        }
        setMessages((prev) => [...prev, curatorMsg])
      } else {
        const knowledge = searchKnowledgeBase(queryText)
        const curatorMsg: ChatMessage = {
          id: `curator-${Date.now()}`,
          sender: 'curator',
          text: knowledge.response,
          topicTitle: knowledge.topicTitle,
          citations: knowledge.citations,
          relatedArtifactId: knowledge.relatedArtifactId,
        }
        setMessages((prev) => [...prev, curatorMsg])
      }
    } catch (err) {
      console.warn('Falling back to local curated base:', err)
      const knowledge = searchKnowledgeBase(queryText)
      const curatorMsg: ChatMessage = {
        id: `curator-${Date.now()}`,
        sender: 'curator',
        text: knowledge.response,
        topicTitle: knowledge.topicTitle,
        citations: knowledge.citations,
        relatedArtifactId: knowledge.relatedArtifactId,
      }
      setMessages((prev) => [...prev, curatorMsg])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <section
      id="ai"
      aria-label="AfroArchive AI Exhibition Curator"
      className="section bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border text-gray-900 dark:text-ivory-100 transition-colors overflow-hidden"
    >
      <div className="container-app space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-sand-200 dark:border-dark-border pb-8">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center space-x-3">
              <span className="badge badge-primary">KNOWLEDGE DISCOVERY AI</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Peer-Verified Citations Engine
              </span>
            </div>

            <h2 className="heading-xl text-gray-900 dark:text-white tracking-tight">
              AfroArchive AI Curator
            </h2>

            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed font-sans">
              Inquire directly about verified primary sources, astronomical calculations, philosophical treatises, and architectural monuments across African civilizations.
            </p>
          </div>

          <div className="flex items-center space-x-2 badge badge-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KOLEX AI VECTOR LAYER</span>
          </div>
        </div>

        {/* Suggested Prompts Pills */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider block">
            Suggested Curatorial Inquiries:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(prompt)}
                type="button"
                className="text-xs font-sans text-gray-700 dark:text-gray-200 bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border hover:border-primary-400/50 hover:bg-white dark:hover:bg-dark-surface px-3.5 py-2 rounded-lg transition-all text-left"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Curator Interface Window */}
        <div className="card bg-sand-50 dark:bg-dark-card border border-sand-200 dark:border-dark-border overflow-hidden flex flex-col h-[600px]">
          
          {/* Window Header */}
          <div className="px-6 py-4 bg-white dark:bg-dark-surface border-b border-sand-200 dark:border-dark-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-500/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm text-gray-900 dark:text-white">
                  AfroArchive Curator Assistant
                </span>
                <span className="font-mono text-[10px] text-primary-600 dark:text-accent-400 tracking-wider uppercase">
                  Scholarly Inquiry Engine
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-primary-500" />
              <span className="hidden sm:inline">CITATIONS ACTIVE</span>
            </div>
          </div>

          {/* Chat Transcript Scroll Region */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
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
                    className={`max-w-3xl rounded-xl p-5 space-y-4 ${
                      isCurator
                        ? 'bg-white dark:bg-dark-surface border border-sand-200 dark:border-dark-border text-gray-900 dark:text-white shadow-sm'
                        : 'bg-primary-600 text-white shadow-sm'
                    }`}
                  >
                    {isCurator && msg.topicTitle && (
                      <div className="border-b border-sand-200 dark:border-dark-border pb-2 flex justify-between items-center">
                        <span className="font-mono text-xs uppercase tracking-wider text-primary-600 dark:text-accent-400 font-semibold">
                          {msg.topicTitle}
                        </span>
                        <span className="badge badge-gray text-[10px]">
                          Curatorial Citation
                        </span>
                      </div>
                    )}

                    <p className="font-sans text-sm leading-relaxed whitespace-pre-line font-light">
                      {msg.text}
                    </p>

                    {/* Citations Box */}
                    {isCurator && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-sand-200 dark:border-dark-border space-y-1 font-mono text-xs text-gray-600 dark:text-gray-300">
                        <span className="text-[10px] uppercase text-primary-600 dark:text-accent-400 tracking-wider flex items-center gap-1 font-semibold">
                          <FileText className="w-3 h-3" /> VERIFIED PRIMARY SOURCES:
                        </span>
                        {msg.citations.map((cite, i) => (
                          <div key={i} className="text-xs text-gray-500 dark:text-gray-400">
                            • {cite}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Artifact Deep Link Button */}
                    {isCurator && artifactLink && (
                      <div className="pt-3 border-t border-sand-200 dark:border-dark-border flex justify-end">
                        <button
                          onClick={() => onInspectArtifact(artifactLink)}
                          type="button"
                          className="inline-flex items-center space-x-2 text-xs font-sans font-semibold text-primary-600 dark:text-accent-400 hover:underline transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Inspect Catalog Artifact ({artifactLink.catalogNumber})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isThinking && (
              <div className="flex items-center space-x-2 text-primary-600 dark:text-accent-400 font-mono text-xs animate-pulse">
                <Sparkles className="w-4 h-4" />
                <span>Consulting archival knowledge base & primary sources...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendQuery(inputQuery)
            }}
            className="p-4 bg-white dark:bg-dark-surface border-t border-sand-200 dark:border-dark-border flex items-center space-x-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask the AI Curator about African manuscripts, civilizations, philosophy..."
              className="input flex-1 text-sm"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="btn btn-primary p-3 rounded-lg"
              aria-label="Send Inquiry"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}
