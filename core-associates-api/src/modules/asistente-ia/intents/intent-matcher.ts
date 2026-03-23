import { INTENTS, IntentDef } from './intents.registry';

/** Remove accents and lowercase */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function containsAll(text: string, words: string[]): boolean {
  return words.every((w) => text.includes(w));
}

export interface IntentMatch {
  intent: IntentDef;
  id: string;
  resolverKey: string;
}

/**
 * Matches user input against the intent registry.
 * Returns the first matching intent or null.
 */
export function matchIntent(input: string): IntentMatch | null {
  const text = normalize(input);

  for (const intent of INTENTS) {
    const matched = intent.keywords.some((group) => containsAll(text, group));
    if (matched) {
      return { intent, id: intent.id, resolverKey: intent.resolverKey };
    }
  }

  return null;
}
