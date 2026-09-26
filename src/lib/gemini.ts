import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

function getClient(): GoogleGenerativeAI {
  if (!genAI && apiKey && apiKey !== 'placeholder-gemini-key') {
    genAI = new GoogleGenerativeAI(apiKey)
  }
  if (!genAI) throw new Error('Gemini API key not configured')
  return genAI
}

function getModel() {
  return getClient().getGenerativeModel({ model: 'gemini-1.5-flash' })
}

// ─── Summarize Article ────────────────────────────────────────
export async function summarizeArticle(content: string, title: string): Promise<string> {
  const model = getModel()
  const prompt = `You are a knowledgeable assistant for AfroArchive, a platform preserving African knowledge.
  
Summarize this article about "${title}" in 3-4 clear, engaging sentences that capture the key insights.
Focus on making it accessible to readers new to this topic.

Article content:
${content.slice(0, 8000)}

Provide only the summary, no preamble.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── Translate Article ────────────────────────────────────────
export async function translateArticle(
  content: string,
  targetLanguage: string
): Promise<string> {
  const model = getModel()
  const prompt = `Translate the following article content to ${targetLanguage}.
Maintain the academic tone and cultural context. Preserve formatting.

Content:
${content.slice(0, 6000)}

Provide only the translation.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── Explain Concept ──────────────────────────────────────────
export async function explainConcept(
  concept: string,
  context: string
): Promise<string> {
  const model = getModel()
  const prompt = `You are an expert on African history, philosophy, and culture.
  
Explain the concept of "${concept}" in simple, clear language suitable for someone new to this topic.
Use the following article context to make your explanation relevant:

Context: ${context.slice(0, 2000)}

Provide a clear explanation in 2-3 paragraphs.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── Generate Quiz ────────────────────────────────────────────
export async function generateQuiz(
  content: string,
  title: string,
  numQuestions = 5
): Promise<Array<{ question: string; options: string[]; correct: number; explanation: string }>> {
  const model = getModel()
  const prompt = `Create ${numQuestions} multiple-choice quiz questions based on this article about "${title}".
  
Return a valid JSON array. Each item must have:
- "question": string
- "options": array of 4 strings (A, B, C, D choices)
- "correct": index (0-3) of the correct answer
- "explanation": brief explanation of why it's correct

Article content:
${content.slice(0, 6000)}

Return ONLY the JSON array, nothing else.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
  return JSON.parse(text)
}

// ─── Ask About Article ────────────────────────────────────────
export async function askAboutArticle(
  question: string,
  articleContent: string,
  articleTitle: string
): Promise<string> {
  const model = getModel()
  const prompt = `You are an expert assistant for AfroArchive, an African knowledge platform.
Answer the following question about the article titled "${articleTitle}".
Base your answer primarily on the article content, but you may add relevant context.
Be accurate, thoughtful, and culturally sensitive.

Article content:
${articleContent.slice(0, 6000)}

Question: ${question}

Provide a helpful, concise answer.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

// ─── Recommend Related Content ────────────────────────────────
export async function getContentRecommendations(
  articleTitle: string,
  articleExcerpt: string,
  availableTitles: string[]
): Promise<string[]> {
  const model = getModel()
  const prompt = `You are a content recommendation system for AfroArchive, an African knowledge platform.

Given an article titled "${articleTitle}" with this summary: "${articleExcerpt}"

From this list of available articles, pick the 4 most relevant ones:
${availableTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Return ONLY a JSON array of the article titles (exactly as written), nothing else.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
  try {
    return JSON.parse(text)
  } catch {
    return availableTitles.slice(0, 4)
  }
}

export const isGeminiConfigured = (): boolean =>
  Boolean(apiKey && apiKey !== 'placeholder-gemini-key')
