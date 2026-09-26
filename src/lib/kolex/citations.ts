/**
 * AfroArchive - Kolex AI Provenance & Citation Generator
 * Converts retrieved semantic matches into verified source references,
 * formatted academic citations, and numbered RAG prompt contexts.
 */

import { KolexMatch, VerifiedSource } from './types';

export class CitationBuilder {
  /**
   * Deduplicates and aggregates matching chunks into a ranked list of verified sources
   */
  static extractVerifiedSources(matches: KolexMatch[]): VerifiedSource[] {
    const sourceMap = new Map<string, VerifiedSource>();
    let counter = 1;

    for (const match of matches) {
      if (!sourceMap.has(match.knowledgeItemId)) {
        const citation = this.formatCitationString(match);
        const resolvedUrl = match.sourceUrl || match.originalUrl || `https://afroarchive.org/items/${match.slug || match.knowledgeItemId}`;
        const sourceIndex = counter++;

        sourceMap.set(match.knowledgeItemId, {
          sourceIndex,
          badge: `[${sourceIndex}]`,
          knowledgeItemId: match.knowledgeItemId,
          title: match.title,
          slug: match.slug,
          knowledgeType: match.knowledgeType,
          sourceName: match.sourceName || match.sourceSlug || 'AfroArchive',
          sourceUrl: resolvedUrl,
          url: resolvedUrl,
          originalUrl: match.originalUrl,
          doi: match.doi,
          attribution: match.attribution,
          licenseType: match.licenseType,
          citationString: citation,
          citation,
          relevanceScore: match.similarity,
        });
      }
    }

    return Array.from(sourceMap.values());
  }

  /**
   * Generates a formal citation string for a source
   */
  static formatCitationString(match: KolexMatch): string {
    const title = match.title;
    const author = match.attribution ? match.attribution.replace(/^Licensed under [^ ]+ by /i, '').replace(/^© /i, '') : 'AfroArchive Contributor';
    const sourceName = match.sourceName || match.sourceSlug || 'AfroArchive Knowledge Repository';
    const year = match.metadata?.publicationYear || (match.metadata?.date_time_original ? String(match.metadata.date_time_original).slice(0, 4) : 'n.d.');

    let citation = `${author} (${year}). "${title}". ${sourceName}.`;
    if (match.doi) {
      const cleanDoi = match.doi.replace(/^https?:\/\/doi\.org\//i, '');
      citation += ` https://doi.org/${cleanDoi}`;
    } else if (match.sourceUrl) {
      citation += ` Available at: ${match.sourceUrl}`;
    }
    return citation;
  }

  /**
   * Builds formatted RAG context string with numbered source citations [1], [2], etc.
   */
  static buildPromptContext(matches: KolexMatch[], sources: VerifiedSource[]): string {
    const sourceIndexMap = new Map<string, number>();
    for (const src of sources) {
      sourceIndexMap.set(src.knowledgeItemId, src.sourceIndex);
    }

    const sections: string[] = [];

    for (const match of matches) {
      const idx = sourceIndexMap.get(match.knowledgeItemId) || 1;
      const section = [
        `--- EXCERPT [${idx}] ---`,
        `Title: ${match.title}`,
        `Type: ${match.knowledgeType} | License: ${match.licenseType}`,
        `Attribution: ${match.attribution}`,
        `Source: ${match.sourceUrl || match.originalUrl || 'AfroArchive'}`,
        `Content:`,
        match.chunkContent,
      ].join('\n');

      sections.push(section);
    }

    return sections.join('\n\n');
  }
}
