export type Suit = "espada" | "basto" | "oro" | "copa";
export type Player = "human" | "bot";
export type TrickResult = Player | "tie";

export type TrucoCard = {
  id: string;
  rank: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;
  suit: Suit;
};

const ranks: TrucoCard["rank"][] = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const suits: Suit[] = ["espada", "basto", "oro", "copa"];

export const suitSymbol: Record<Suit, string> = {
  espada: "⚔",
  basto: "♣",
  oro: "●",
  copa: "♥",
};

export function createDeck(): TrucoCard[] {
  return suits.flatMap((suit) =>
    ranks.map((rank) => ({ id: `${rank}-${suit}`, rank, suit })),
  );
}

export function shuffleDeck(deck: TrucoCard[]): TrucoCard[] {
  const shuffled = [...deck];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

export function dealHand() {
  const deck = shuffleDeck(createDeck());
  return {
    human: deck.slice(0, 3),
    bot: deck.slice(3, 6),
  };
}

export function cardPower(card: TrucoCard): number {
  if (card.rank === 1 && card.suit === "espada") return 14;
  if (card.rank === 1 && card.suit === "basto") return 13;
  if (card.rank === 7 && card.suit === "espada") return 12;
  if (card.rank === 7 && card.suit === "oro") return 11;
  if (card.rank === 3) return 10;
  if (card.rank === 2) return 9;
  if (card.rank === 1) return 8;
  if (card.rank === 12) return 7;
  if (card.rank === 11) return 6;
  if (card.rank === 10) return 5;
  if (card.rank === 7) return 4;
  if (card.rank === 6) return 3;
  if (card.rank === 5) return 2;
  return 1;
}

export function calculateEnvido(hand: TrucoCard[]): number {
  const envidoValue = (card: TrucoCard) => (card.rank <= 7 ? card.rank : 0);
  let best = Math.max(...hand.map(envidoValue));

  for (let first = 0; first < hand.length; first += 1) {
    for (let second = first + 1; second < hand.length; second += 1) {
      if (hand[first].suit === hand[second].suit) {
        best = Math.max(best, 20 + envidoValue(hand[first]) + envidoValue(hand[second]));
      }
    }
  }

  return best;
}

export function compareCards(human: TrucoCard, bot: TrucoCard): TrickResult {
  const difference = cardPower(human) - cardPower(bot);
  if (difference > 0) return "human";
  if (difference < 0) return "bot";
  return "tie";
}

export function resolveHand(results: TrickResult[], mano: Player): Player | null {
  const [first, second, third] = results;
  if (!first) return null;

  if (first === "tie") {
    if (!second) return null;
    if (second !== "tie") return second;
    if (!third) return null;
    return third === "tie" ? mano : third;
  }

  if (!second) return null;
  if (second === first || second === "tie") return first;
  if (!third) return null;
  return third === "tie" ? first : third;
}

export function chooseBotCard(hand: TrucoCard[], humanCard?: TrucoCard): TrucoCard {
  const ordered = [...hand].sort((a, b) => cardPower(a) - cardPower(b));
  if (!humanCard) return ordered[0];

  const winningCard = ordered.find((card) => cardPower(card) > cardPower(humanCard));
  return winningCard ?? ordered[0];
}

export function nextLeader(result: TrickResult, currentLeader: Player, mano: Player): Player {
  if (result === "tie") return mano;
  return result || currentLeader;
}
