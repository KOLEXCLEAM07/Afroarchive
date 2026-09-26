import { useState } from 'react'
import {
  Sparkles, ChevronDown, ChevronUp, Loader2,
  BookOpen, Languages, HelpCircle, Brain, MessageSquare, Lightbulb,
} from 'lucide-react'
import {
  summarizeArticle, translateArticle, explainConcept,
  generateQuiz, askAboutArticle, isGeminiConfigured,
} from '@/lib/gemini'
import { cn } from '@/lib/utils'
import type { Article, AIQuizQuestion } from '@/types'

const LANGUAGES = ['French', 'Arabic', 'Swahili', 'Portuguese', 'Amharic', 'Hausa', 'Yoruba', 'Igbo', 'Spanish']

interface AISidebarProps { article: Article }

export default function AISidebar({ article }: AISidebarProps) {
  const configured = isGeminiConfigured()

  if (!configured) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-accent-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">AI Tools</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your Gemini API key to unlock AI-powered article tools.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-accent-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">AI Tools</h3>
        <span className="badge badge-accent text-2xs">Gemini</span>
      </div>

      <SummaryTool article={article} />
      <TranslateTool article={article} />
      <QuizTool article={article} />
      <AskTool article={article} />
    </div>
  )
}

function AICard({ icon, title, children, id }: { icon: React.ReactNode; title: string; children: React.ReactNode; id?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card overflow-hidden">
      <button
        id={id}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-primary-600 dark:text-primary-400">{icon}</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-sand-200 dark:border-dark-border pt-4">{children}</div>}
    </div>
  )
}

function SummaryTool({ article }: { article: Article }) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const text = article.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const result = await summarizeArticle(text, article.title)
      setSummary(result)
    } catch { setSummary('Failed to generate summary. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <AICard icon={<BookOpen className="w-4 h-4" />} title="Summarize Article" id="ai-summary-btn">
      {!summary ? (
        <button onClick={generate} disabled={loading} className="w-full btn btn-outline btn-sm gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : 'Generate Summary'}
        </button>
      ) : (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{summary}</p>
          <button onClick={() => setSummary(null)} className="text-xs text-primary-600 dark:text-primary-400 mt-3 hover:underline">Regenerate</button>
        </div>
      )}
    </AICard>
  )
}

function TranslateTool({ article }: { article: Article }) {
  const [lang, setLang] = useState('')
  const [translation, setTranslation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const translate = async () => {
    if (!lang) return
    setLoading(true)
    try {
      const text = article.content.replace(/<[^>]*>/g, ' ').slice(0, 3000)
      const result = await translateArticle(text, lang)
      setTranslation(result)
    } catch { setTranslation('Translation failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <AICard icon={<Languages className="w-4 h-4" />} title="Translate Article" id="ai-translate-btn">
      <div className="space-y-3">
        <select value={lang} onChange={e => setLang(e.target.value)} className="input text-sm">
          <option value="">Select language…</option>
          {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button onClick={translate} disabled={!lang || loading} className="w-full btn btn-outline btn-sm gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Translating…</> : 'Translate'}
        </button>
        {translation && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-dark-surface rounded-xl text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
            {translation.slice(0, 800)}{translation.length > 800 ? '…' : ''}
          </div>
        )}
      </div>
    </AICard>
  )
}

function QuizTool({ article }: { article: Article }) {
  const [quiz, setQuiz] = useState<AIQuizQuestion[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const generate = async () => {
    setLoading(true); setAnswers({}); setSubmitted(false)
    try {
      const text = article.content.replace(/<[^>]*>/g, ' ')
      const result = await generateQuiz(text, article.title, 4)
      setQuiz(result)
    } catch { setQuiz(null) }
    finally { setLoading(false) }
  }

  const score = quiz ? Object.entries(answers).filter(([i, a]) => a === quiz[Number(i)].correct).length : 0

  return (
    <AICard icon={<Brain className="w-4 h-4" />} title="Take a Quiz" id="ai-quiz-btn">
      {!quiz ? (
        <button onClick={generate} disabled={loading} className="w-full btn btn-outline btn-sm gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating quiz…</> : 'Generate Quiz'}
        </button>
      ) : (
        <div className="space-y-4">
          {quiz.map((q, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">{i + 1}. {q.question}</p>
              <div className="space-y-1">
                {q.options.map((opt, j) => {
                  const isSelected = answers[i] === j
                  const isCorrect  = j === q.correct
                  const showResult = submitted && isSelected
                  return (
                    <button
                      key={j}
                      onClick={() => !submitted && setAnswers(a => ({ ...a, [i]: j }))}
                      className={cn(
                        'w-full text-left text-xs p-2 rounded-lg border transition-all',
                        isSelected && !submitted ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 'border-sand-200 dark:border-dark-border',
                        showResult && isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700' : '',
                        showResult && !isCorrect ? 'border-red-400 bg-red-50 dark:bg-red-900/20 text-red-600' : '',
                      )}
                    >
                      {['A', 'B', 'C', 'D'][j]}. {opt}
                    </button>
                  )
                })}
              </div>
              {submitted && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{q.explanation}</p>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            {!submitted ? (
              <button onClick={() => setSubmitted(true)} className="flex-1 btn btn-primary btn-sm">Submit</button>
            ) : (
              <div className="flex-1 text-center">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Score: {score}/{quiz.length} {score === quiz.length ? '🎉' : score >= quiz.length / 2 ? '👍' : '📚'}
                </p>
              </div>
            )}
            <button onClick={generate} className="btn btn-ghost btn-sm">Retry</button>
          </div>
        </div>
      )}
    </AICard>
  )
}

function AskTool({ article }: { article: Article }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const text = article.content.replace(/<[^>]*>/g, ' ')
      const result = await askAboutArticle(question, text, article.title)
      setAnswer(result)
    } catch { setAnswer('Could not answer. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <AICard icon={<MessageSquare className="w-4 h-4" />} title="Ask a Question" id="ai-ask-btn">
      <div className="space-y-2">
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask anything about this article…"
          rows={2}
          className="input text-sm resize-none"
          id="ai-ask-input"
        />
        <button onClick={ask} disabled={!question.trim() || loading} className="w-full btn btn-outline btn-sm gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Thinking…</> : 'Ask AI'}
        </button>
        {answer && (
          <div className="p-3 bg-gradient-to-br from-purple-50 to-primary-50 dark:from-dark-surface dark:to-dark-card rounded-xl border border-purple-100 dark:border-dark-border">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{answer}</p>
            </div>
          </div>
        )}
      </div>
    </AICard>
  )
}
