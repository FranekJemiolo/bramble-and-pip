export interface SessionEventLog {
  timestamp: number;
  eventType: 'DISCOVERY' | 'PUZZLE_SOLVE' | 'OBSERVATION' | 'SEASON_ADVANCE';
  targetEntity: string;
  details: Record<string, unknown>;
}

export class ParentInsightService {
  /**
   * Generates localized offline conversation prompts for parents to discuss real-world
   * nature observations with their child at the dinner table or bedtime.
   * Zero network egress, zero tracking.
   */

  static generateConversationStarters(
    completedChapterIds: readonly number[],
    satchelItemIds: readonly string[]
  ): string[] {
    const starters: string[] = [];

    if (satchelItemIds.includes('snowdrop') || completedChapterIds.includes(1)) {
      starters.push(
        'Ask your explorer: "What flowers or green sprouts did you notice growing outside today?"'
      );
    }

    if (satchelItemIds.includes('smooth_stone') || completedChapterIds.includes(3)) {
      starters.push(
        'Ask your explorer: "Can you count three smooth stones or pebbles with me?"'
      );
    }

    if (satchelItemIds.includes('wooden_gear') || completedChapterIds.includes(7)) {
      starters.push(
        'Ask your explorer: "How did the little wooden cog help turn the big watermill wheel?"'
      );
    }

    if (satchelItemIds.includes('acorn') || completedChapterIds.includes(12)) {
      starters.push(
        'Ask your explorer: "Where do squirrels hide their acorns before winter comes?"'
      );
    }

    if (satchelItemIds.includes('pinecone') || completedChapterIds.includes(18)) {
      starters.push(
        'Ask your explorer: "What animal footprints did you spot in the snow with Pip?"'
      );
    }

    if (completedChapterIds.includes(20)) {
      starters.push(
        'Ask your explorer: "What was your favorite memory with Bramble and Pip by the warm lodge fire?"'
      );
    }

    // Default gentle conversation starter if no specific item
    if (starters.length === 0) {
      starters.push(
        'Ask your explorer: "What was Pip\'s favorite bird chirrup or woodland sound today?"'
      );
    }

    return starters;
  }
}
