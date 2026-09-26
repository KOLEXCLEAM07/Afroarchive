/**
 * AfroArchive Ingestion Framework - Rights & License Classifier
 * Ensures strict copyright compliance, preserves attribution, and forbids unauthorized file rehosting.
 */

import { LicenseType, RightsAssessment } from './types';

const PUBLIC_DOMAIN_PATTERNS = [
  /public\s*domain/i,
  /pdm/i,
  /cc0/i,
  /no\s*copyright/i,
  /expired/i,
  /usgov/i,
];

const CC_PATTERNS: Array<{ pattern: RegExp; type: LicenseType; url: string }> = [
  { pattern: /cc[-_\s]?0/i, type: 'cc0', url: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { pattern: /cc[-_\s]?by[-_\s]?sa/i, type: 'cc_by_sa', url: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  { pattern: /cc[-_\s]?by[-_\s]?nc[-_\s]?sa/i, type: 'cc_by_nc_sa', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' },
  { pattern: /cc[-_\s]?by[-_\s]?nc[-_\s]?nd/i, type: 'cc_by_nd', url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/' },
  { pattern: /cc[-_\s]?by[-_\s]?nc/i, type: 'cc_by_nc', url: 'https://creativecommons.org/licenses/by-nc/4.0/' },
  { pattern: /cc[-_\s]?by[-_\s]?nd/i, type: 'cc_by_nd', url: 'https://creativecommons.org/licenses/by-nd/4.0/' },
  { pattern: /cc[-_\s]?by/i, type: 'cc_by', url: 'https://creativecommons.org/licenses/by/4.0/' },
];

export class RightsClassifier {
  /**
   * Classifies raw license strings, URLs, or metadata into standard AfroArchive rights
   */
  static classify(rawLicense?: string, sourceUrl?: string, authorName?: string): RightsAssessment {
    if (!rawLicense || rawLicense.trim() === '') {
      return {
        licenseType: 'unknown',
        attribution: authorName ? `Source credit: ${authorName}` : 'AfroArchive Heritage Repository',
        canRehost: false,
        isMetadataOnly: true,
        rightsStatement: 'Rights undetermined. Metadata indexed for scholarship.',
      };
    }

    const normalized = rawLicense.toLowerCase().trim();

    // 1. Check CC0
    if (/cc0|zero/i.test(normalized)) {
      return {
        licenseType: 'cc0',
        licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        attribution: authorName ? `Dedicated to public domain by ${authorName}` : 'Public Domain (CC0)',
        canRehost: true,
        isMetadataOnly: false,
      };
    }

    // 2. Check Public Domain
    for (const pattern of PUBLIC_DOMAIN_PATTERNS) {
      if (pattern.test(normalized)) {
        return {
          licenseType: 'public_domain',
          licenseUrl: 'https://creativecommons.org/publicdomain/mark/1.0/',
          attribution: authorName ? `Public domain work by ${authorName}` : 'Public Domain',
          canRehost: true,
          isMetadataOnly: false,
        };
      }
    }

    // 3. Check Creative Commons variations
    for (const entry of CC_PATTERNS) {
      if (entry.pattern.test(normalized)) {
        return {
          licenseType: entry.type,
          licenseUrl: entry.url,
          attribution: authorName
            ? `Licensed under ${entry.type.toUpperCase().replace(/_/g, '-')} by ${authorName}`
            : `Licensed under ${entry.type.toUpperCase().replace(/_/g, '-')}`,
          canRehost: true, // CC allows distribution with attribution
          isMetadataOnly: false,
        };
      }
    }

    // 4. Restricted / All Rights Reserved / Copyrighted
    if (/copyright|all\s*rights\s*reserved|restricted|paywall|elsevier|springer|wiley/i.test(normalized)) {
      return {
        licenseType: 'copyrighted_metadata_only',
        licenseUrl: sourceUrl,
        attribution: authorName ? `© ${authorName}. All rights reserved.` : 'Restricted Copyright Material',
        canRehost: false, // Strict: never rehost copyrighted files
        isMetadataOnly: true,
        rightsStatement: 'Metadata cataloged for research purposes. Original work resides with rightsholder.',
      };
    }

    // 5. Default fallback to Unknown
    return {
      licenseType: 'unknown',
      licenseUrl: sourceUrl,
      attribution: authorName ? `Attribution: ${authorName}` : 'Source attribution pending verification',
      canRehost: false,
      isMetadataOnly: true,
      rightsStatement: 'Rights information unverified; asset treated as restricted.',
    };
  }
}
