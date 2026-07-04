import { Flashcard, MultiSensoryFlashcard } from "@/lib/types";

export class FlashcardAdapter {
  /**
   * Migrates a legacy flashcard to the new multi-sensory format.
   * Assigns a random ID and places the existing text into the `content` object.
   */
  static migrateLegacyFlashcard(oldCard: Flashcard): MultiSensoryFlashcard {
    // Generate a random ID if it's missing (a UUID or simple random string for now)
    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    
    return {
      id,
      content: {
        front: oldCard.front,
        back: oldCard.back,
      },
      metadata: {},
      // audio and visualMnemonic are left undefined intentionally, 
      // as legacy cards did not have them.
    };
  }

  /**
   * Migrates an array of legacy flashcards.
   */
  static migrateLegacyFlashcards(oldCards: Flashcard[]): MultiSensoryFlashcard[] {
    return oldCards.map((card) => this.migrateLegacyFlashcard(card));
  }

  /**
   * Normalizes a possibly-mixed array of flashcards (some already
   * MultiSensoryFlashcard, some still the legacy {front, back} shape from
   * documents written before this migration existed) into MultiSensoryFlashcard[].
   */
  static normalizeFlashcards(cards: (MultiSensoryFlashcard | Flashcard)[]): MultiSensoryFlashcard[] {
    return cards.map((card) =>
      "content" in card ? card : this.migrateLegacyFlashcard(card),
    );
  }
}
