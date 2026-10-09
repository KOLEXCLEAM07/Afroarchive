import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { licenseLabel } from '@/lib/knowledge'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

interface SourceRow { name: string; slug: string; base_url: string | null; default_license: string | null }

export default function AboutPage() {
  useDocumentTitle('About')
  const [sources, setSources] = useState<SourceRow[]>([])

  useEffect(() => {
    supabase.from('sources').select('name, slug, base_url, default_license').order('name')
      .then(({ data }) => setSources(((data ?? []) as SourceRow[]).filter(s => s.slug !== 'afroarchive-seed')))
  }, [])

  return (
    <div className="bg-sand-50 dark:bg-dark-bg py-14">
      <article className="container-app max-w-3xl text-gray-700 dark:text-gray-300 leading-relaxed">
        <h1 className="heading-xl text-3xl sm:text-4xl text-gray-900 dark:text-white mb-6">About AfroArchive</h1>
        <p className="text-lg mb-4">
          AfroArchive is an open, non-commercial archive of African knowledge. It brings together three kinds of material:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-10">
          <li><strong className="text-gray-900 dark:text-white">Essays</strong>: introductions written by the editorial desk and articles published by members, each with references.</li>
          <li><strong className="text-gray-900 dark:text-white">Archive records</strong>: objects, places, people and publications gathered from open collections.</li>
          <li><strong className="text-gray-900 dark:text-white">The virtual museum</strong>: a guided exhibition with a timeline, a regional map, and stories and proverbs.</li>
        </ul>

        <Section id="sources" title="Sources & licensing">
          <p>
            Archive records are imported from the open collections below. Each record keeps its original licence, attribution and a link back to the source. Reuse a record under the terms of its own licence, which is shown on the record page.
          </p>
          {sources.length > 0 && (
            <ul className="mt-4 divide-y divide-sand-200 dark:divide-dark-border border-y border-sand-200 dark:border-dark-border">
              {sources.map(s => (
                <li key={s.slug} className="flex items-center justify-between gap-4 py-3">
                  {s.base_url ? (
                    <a href={s.base_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:underline">
                      {s.name} <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  ) : <span className="font-medium">{s.name}</span>}
                  <span className="text-sm text-gray-500">{licenseLabel(s.default_license)} (typical)</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            Some scholarly records include only bibliographic details (title, authors, venue) because the full text is under copyright. These are marked “Metadata only”.
          </p>
        </Section>

        <Section id="guidelines" title="Contribution guidelines">
          <p>Anyone with an account can publish an article. Published articles are public. Drafts are visible only to their author. Please:</p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>Write about African history, culture, language, science, art or thought.</li>
            <li>List your sources under <em>References</em>, one per line, so readers can check them.</li>
            <li>Separate established facts from interpretation, and say when something is debated.</li>
            <li>Only use images you have the right to share, and credit them.</li>
            <li>Respect the communities you write about. Some knowledge is sacred or restricted; don’t publish it without permission.</li>
          </ul>
          <p className="mt-3">
            Ready? <Link to="/write" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">Start writing</Link>.
          </p>
        </Section>

        <Section id="privacy" title="Privacy">
          <ul className="list-disc pl-6 space-y-2">
            <li>Reading AfroArchive doesn’t require an account.</li>
            <li>If you sign up, we store your email address (never shown publicly) and the profile details you choose to add. Your username, name, bio and published articles are public.</li>
            <li>Likes and collections are stored with your account. Items you save with the bookmark button are kept only in your browser.</li>
            <li>Article view counts are anonymous totals.</li>
            <li>You can edit or delete your articles at any time from your profile.</li>
          </ul>
        </Section>

        <Section id="corrections" title="Corrections">
          <p>
            Archives are only as good as their accuracy. If you spot an error in an essay or record, tell the author, or follow the link on a record to correct it at its original source, so the fix benefits everyone.
          </p>
        </Section>
      </article>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mb-12">
      <h2 className="heading-md text-2xl text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </section>
  )
}
