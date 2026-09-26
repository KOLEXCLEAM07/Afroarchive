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
      className="relative w-full bg-charcoal-950 text-ivory-100 py-24 border-t border-ivory-100/10 overflow-hidden"
    >
      {/* Background Atmosphere Vignette */}
      <div 
        className="absolute inset-0 bg-museum-vignette pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-ivory-100/10 pb-8">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center space-x-3">
              <Badge variant="bronze" size="sm">
                EXHIBITION GALLERY 05
              </Badge>
              <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400">
                KNOWLEDGE DISCOVERY AI
              </span>
            </div>

            <h2 className="font-display font-semibold text-3xl md:text-5xl text-ivory-100 tracking-tight">
              AFROARCHIVE AI CURATOR
            </h2>

            <p className="font-sans text-sm md:text-base text-ivory-300 font-light leading-relaxed">
              Inquire directly about verified primary sources, astronomical calculations, philosophical treatises, and architectural monuments across African civilizations.
            </p>
          </div>

          <div className="flex items-center space-x-2 font-mono text-2xs text-bronze-400">
            <Sparkles className="w-4 h-4 text-bronze-400 animate-pulse" />
            <span>AI CURATOR v2.4 · PEER-VERIFIED ENGINE</span>
          </div>
        </div>

        {/* Suggested Prompts Pills */}
        <div className="space-y-3">
          <span className="font-mono text-2xs uppercase tracking-widest text-ivory-400 block">
            SUGGESTED CURATORIAL INQUIRIES:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendQuery(prompt)}
                type="button"
                className="font-sans text-xs text-ivory-200 bg-charcoal-850 border border-ivory-100/10 hover:border-bronze-400/50 hover:text-bronze-300 px-3.5 py-2 rounded transition-colors text-left"
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>

        {/* Curator Interface Window */}
        <div className="bg-charcoal-900 rounded-lg border border-ivory-100/15 shadow-museum overflow-hidden flex flex-col h-[600px]">
          
          {/* Window Header */}
          <div className="px-6 py-4 bg-charcoal-850 border-b border-ivory-100/10 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-bronze-400/20 border border-bronze-400/50 flex items-center justify-center text-bronze-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-semibold text-sm text-ivory-100">
                  AfroArchive Curator Assistant
                </span>
                <span className="font-mono text-[10px] text-bronze-400 tracking-wider uppercase">
                  SCHOLARLY INQUIRY ENGINE
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-ivory-400 font-mono text-2xs">
              <ShieldCheck className="w-4 h-4 text-bronze-400" />
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
                    className={`max-w-3xl rounded-lg p-5 space-y-4 ${
                      isCurator
                        ? 'bg-charcoal-850 border border-ivory-100/10 text-ivory-100 shadow-artifact'
                        : 'bg-bronze-900/40 border border-bronze-400/40 text-ivory-100'
                    }`}
                  >
                    {isCurator && msg.topicTitle && (
                      <div className="border-b border-ivory-100/10 pb-2 flex justify-between items-center">
                        <span className="font-mono text-2xs uppercase tracking-widest text-bronze-400">
                          {msg.topicTitle}
                        </span>
                        <span className="font-mono text-[10px] text-ivory-400">
                          CURATORIAL CITATION
                        </span>
                      </div>
                    )}

                    <p className="font-sans text-sm md:text-base font-light leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </p>

                    {/* Citations Box */}
                    {isCurator && msg.citations && msg.citations.length > 0 && (
                      <div className="pt-3 border-t border-ivory-100/10 space-y-1.5 font-mono text-xs text-ivory-400">
                        <span className="text-[10px] uppercase text-bronze-400 tracking-wider flex items-center gap-1">
                          <FileText className="w-3 h-3" /> VERIFIED PRIMARY SOURCES:
                        </span>
                        {msg.citations.map((cite, i) => (
                          <div key={i} className="text-2xs text-ivory-300">
                            • {cite}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Artifact Deep Link Button */}
                    {isCurator && artifactLink && (
                      <div className="pt-3 border-t border-ivory-100/10 flex justify-end">
                        <button
                          onClick={() => onInspectArtifact(artifactLink)}
                          type="button"
                          className="inline-flex items-center space-x-2 text-xs font-mono text-bronze-300 bg-charcoal-900 border border-bronze-400/30 px-3.5 py-1.5 rounded hover:border-bronze-400 hover:text-bronze-400 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>INSPECT CATALOG ARTIFACT ({artifactLink.catalogNumber})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {isThinking && (
              <div className="flex items-center space-x-2 text-bronze-400 font-mono text-xs animate-pulse">
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
            className="p-4 bg-charcoal-850 border-t border-ivory-100/10 flex items-center space-x-3"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask the AI Curator about African manuscripts, civilizations, philosophy..."
              className="flex-1 bg-charcoal-950 text-ivory-100 font-sans text-sm px-4 py-3 rounded border border-ivory-100/15 focus:border-bronze-400 focus:outline-none placeholder:text-ivory-500"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-3 bg-bronze-400 text-charcoal-950 rounded font-semibold hover:bg-bronze-300 disabled:opacity-40 disabled:pointer-events-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bronze-400"
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
