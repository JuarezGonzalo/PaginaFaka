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
  let best = Math.max(0, ...hand.map(envidoValue));

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

export type EnvidoVariant = "envido" | "real-envido" | "falta-envido";
export type Difficulty = "easy" | "normal" | "hard";
export const difficulties: Record<Difficulty, { label: string; description: string }> = {
  easy: { label: "Fácil", description: "Para aprender: juega simple, arriesga poco y puede equivocarse." },
  normal: { label: "Normal", description: "Cuida las cartas, considera las bazas y hace algún farol." },
  hard: { label: "Difícil", description: "Analiza jugadas posibles, las cartas vistas y el marcador para decidir." },
};
export type TrucoValue = 1 | 2 | 3 | 4;
export type TrucoCall = { kind: "truco"; caller: Player; value: 2 | 3 | 4 };
export type EnvidoCall = {
  kind: "envido";
  caller: Player;
  bids: EnvidoVariant[];
  points: number;
  declinedPoints: number;
};
export type PendingCall = TrucoCall | EnvidoCall;
export type PlayedTrick = { human: TrucoCard; bot: TrucoCard; result: TrickResult };
export type GameState = {
  status: "idle" | "playing" | "hand-over" | "match-over";
  difficulty: Difficulty;
  hands: Record<Player, TrucoCard[]>;
  initialHands: Record<Player, TrucoCard[]>;
  played: Partial<Record<Player, TrucoCard>>;
  playedTricks: PlayedTrick[];
  mano: Player;
  leader: Player;
  turn: Player;
  score: Record<Player, number>;
  trucoValue: TrucoValue;
  raiseRight: Player | "either";
  envidoClosed: boolean;
  envidoResult: string | null;
  pendingCall: PendingCall | null;
  suspendedTruco: TrucoCall | null;
  handWinner: Player | null;
  message: string;
  revision: number;
};

export type GameAction =
  | { type: "set-difficulty"; difficulty: Difficulty }
  | { type: "deal"; hands: Record<Player, TrucoCard[]> }
  | { type: "play"; player: Player; cardId: string }
  | { type: "envido"; player: Player; variant: EnvidoVariant }
  | { type: "truco"; player: Player }
  | { type: "respond"; player: Player; accepted: boolean }
  | { type: "fold"; player: Player }
  | { type: "resolve-trick"; revision: number }
  | { type: "bot-act"; revision: number; roll: number };

export const envidoLabels: Record<EnvidoVariant, string> = {
  envido: "Envido",
  "real-envido": "Real Envido",
  "falta-envido": "Falta Envido",
};
export const trucoLabels = { 2: "Truco", 3: "Retruco", 4: "Vale Cuatro" } as const;
const other = (player: Player): Player => player === "human" ? "bot" : "human";
const playerName = (player: Player) => player === "human" ? "Vos" : "El Tabernero";

export function initialGame(difficulty: Difficulty = "normal"): GameState {
  return {
    difficulty,
    status: "idle", hands: { human: [], bot: [] }, initialHands: { human: [], bot: [] },
    played: {}, playedTricks: [], mano: "human", leader: "human", turn: "human",
    score: { human: 0, bot: 0 }, trucoValue: 1, raiseRight: "either",
    envidoClosed: false, envidoResult: null, pendingCall: null, suspendedTruco: null,
    handWinner: null, message: "La primera mano está por comenzar", revision: 0,
  };
}

export function isResolving(state: GameState): boolean {
  return Boolean(state.played.human && state.played.bot);
}

export function callLabel(call: PendingCall): string {
  return call.kind === "truco" ? trucoLabels[call.value] : call.bids.map((bid) => envidoLabels[bid]).join(" · ");
}

export function canPlayCard(state: GameState, player: Player): boolean {
  return state.status === "playing" && !state.pendingCall && !state.played[player] && state.turn === player;
}

export function availableEnvidos(state: GameState, player: Player): EnvidoVariant[] {
  if (state.status !== "playing" || state.envidoClosed || isResolving(state)) return [];
  const call = state.pendingCall;
  if (call?.caller === player) return [];
  if (call?.kind === "envido") {
    if (call.bids.includes("falta-envido")) return [];
    if (call.bids.includes("real-envido")) return ["falta-envido"];
    return call.bids.length < 2 ? ["envido", "real-envido", "falta-envido"] : ["real-envido", "falta-envido"];
  }
  if (state.playedTricks.length > 0 || state.trucoValue !== 1) return [];
  // The first Truco can be interrupted to settle Envido before answering it.
  if (call?.kind === "truco") return call.value === 2 ? ["envido", "real-envido", "falta-envido"] : [];
  if (state.turn !== player || state.hands[player].length !== 3) return [];
  return ["envido", "real-envido", "falta-envido"];
}

export function availableTruco(state: GameState, player: Player): 2 | 3 | 4 | null {
  if (state.status !== "playing" || isResolving(state)) return null;
  const call = state.pendingCall;
  if (call) {
    return call.kind === "truco" && call.caller !== player && call.value < 4
      ? (call.value + 1) as 3 | 4 : null;
  }
  if (state.hands[player].length === 0 || state.trucoValue === 4) return null;
  if (state.raiseRight !== "either" && state.raiseRight !== player) return null;
  return (state.trucoValue + 1) as 2 | 3 | 4;
}

export function canFold(state: GameState, player: Player): boolean {
  return state.status === "playing" && !isResolving(state) && state.pendingCall?.caller !== player;
}

// House variant retained from the first version: to 15 when both are in malas,
// otherwise to 30, using the leading score. Falta replaces earlier accepted bids.
export function faltaEnvidoPoints(score: Record<Player, number>): number {
  const target = Math.max(score.human, score.bot) < 15 ? 15 : 30;
  return Math.max(1, target - Math.max(score.human, score.bot));
}

export function foldPoints(state: GameState, player: Player): { envido: number; truco: number } {
  const call = state.pendingCall;
  if (call?.kind === "envido") return { envido: call.declinedPoints, truco: state.trucoValue };
  if (call?.kind === "truco") return { envido: 0, truco: state.trucoValue };
  const openingBonus = !state.envidoClosed && state.trucoValue === 1 && state.hands[player].length === 3;
  return { envido: openingBonus ? 1 : 0, truco: state.trucoValue };
}

function award(state: GameState, winner: Player, points: number, detail: string, endHand: boolean): GameState {
  const score = { ...state.score, [winner]: Math.min(30, state.score[winner] + points) };
  const matchOver = score[winner] >= 30;
  return {
    ...state, score,
    status: matchOver ? "match-over" : endHand ? "hand-over" : "playing",
    handWinner: matchOver || endHand ? winner : null,
    pendingCall: matchOver || endHand ? null : state.pendingCall,
    suspendedTruco: matchOver || endHand ? null : state.suspendedTruco,
    message: matchOver ? `${winner === "human" ? "¡Ganaste la partida!" : "El Tabernero ganó la partida."} ${detail}` : detail,
  };
}

function settleEnvido(state: GameState, call: EnvidoCall, accepted: boolean): GameState {
  const human = calculateEnvido(state.initialHands.human);
  const bot = calculateEnvido(state.initialHands.bot);
  const winner = accepted ? human === bot ? state.mano : human > bot ? "human" : "bot" : call.caller;
  const points = accepted ? call.points : call.declinedPoints;
  const detail = `${callLabel(call)}: ${accepted ? `vos ${human}, Tabernero ${bot}${human === bot ? " (gana quien es mano)" : ""}` : "no querido"}. ${playerName(winner)} +${points}.`;
  const next = award({ ...state, envidoClosed: true, envidoResult: detail, pendingCall: state.suspendedTruco, suspendedTruco: null }, winner, points, detail, false);
  if (next.status === "playing" && next.pendingCall) {
    return { ...next, message: `${detail} Sigue pendiente el ${callLabel(next.pendingCall)}.` };
  }
  return next;
}

function transition(state: GameState, action: GameAction): GameState {
  if (action.type === "set-difficulty") {
    if ((state.status !== "idle" && state.status !== "match-over") || !(action.difficulty in difficulties) || action.difficulty === state.difficulty) return state;
    return { ...state, difficulty: action.difficulty };
  }
  if (action.type === "deal") {
    if (state.status === "playing") return state;
    const allCards = [...action.hands.human, ...action.hands.bot];
    if (action.hands.human.length !== 3 || action.hands.bot.length !== 3 || new Set(allCards.map((card) => card.id)).size !== 6) return state;
    const restart = state.status === "idle" || state.status === "match-over";
    const mano = restart ? "human" : other(state.mano);
    return {
      ...initialGame(state.difficulty), status: "playing", score: restart ? { human: 0, bot: 0 } : state.score,
      hands: { human: [...action.hands.human], bot: [...action.hands.bot] },
      initialHands: { human: [...action.hands.human], bot: [...action.hands.bot] },
      mano, leader: mano, turn: mano,
      message: mano === "human" ? "Sos mano. Podés cantar o jugar una carta." : "El Tabernero es mano…",
    };
  }
  if (state.status !== "playing") return state;

  if (action.type === "play") {
    if (!canPlayCard(state, action.player)) return state;
    const card = state.hands[action.player].find((item) => item.id === action.cardId);
    if (!card) return state;
    const played = { ...state.played, [action.player]: card };
    let message = action.player === "human" ? "El Tabernero estudia la mesa…" : "El Tabernero jugó. Podés cantar o jugar.";
    if (played.human && played.bot) {
      const result = compareCards(played.human, played.bot);
      message = result === "tie" ? "¡Parda!" : result === "human" ? "La baza es tuya." : "La baza es del Tabernero.";
    }
    return { ...state, played, hands: { ...state.hands, [action.player]: state.hands[action.player].filter((item) => item.id !== card.id) }, turn: other(action.player), message };
  }

  if (action.type === "envido") {
    if (!availableEnvidos(state, action.player).includes(action.variant)) return state;
    const previous = state.pendingCall?.kind === "envido" ? state.pendingCall : null;
    const call: EnvidoCall = {
      kind: "envido", caller: action.player, bids: [...(previous?.bids ?? []), action.variant],
      points: action.variant === "falta-envido" ? faltaEnvidoPoints(state.score) : (previous?.points ?? 0) + (action.variant === "envido" ? 2 : 3),
      declinedPoints: previous?.points ?? 1,
    };
    return {
      ...state, pendingCall: call,
      suspendedTruco: state.pendingCall?.kind === "truco" ? state.pendingCall : state.suspendedTruco,
      message: `${playerName(action.player)}: ¡${envidoLabels[action.variant]}! ${call.points} puntos si se quiere; ${call.declinedPoints} si no.`,
    };
  }

  if (action.type === "truco") {
    const value = availableTruco(state, action.player);
    if (!value) return state;
    const previous = state.pendingCall?.kind === "truco" ? state.pendingCall : null;
    return {
      ...state, trucoValue: previous?.value ?? state.trucoValue,
      envidoClosed: previous ? true : state.envidoClosed,
      pendingCall: { kind: "truco", value, caller: action.player },
      message: `${playerName(action.player)}: ¡${previous ? "Quiero, " : ""}${trucoLabels[value]}!`,
    };
  }

  if (action.type === "respond") {
    const call = state.pendingCall;
    if (!call || call.caller === action.player) return state;
    if (call.kind === "envido") return settleEnvido(state, call, action.accepted);
    if (!action.accepted) return award(state, call.caller, state.trucoValue, `${trucoLabels[call.value]} no querido. ${playerName(call.caller)} +${state.trucoValue}.`, true);
    return { ...state, pendingCall: null, trucoValue: call.value, raiseRight: action.player, envidoClosed: true, message: `¡Quiero! La mano vale ${call.value}. ${playerName(action.player)} puede subir la apuesta.` };
  }

  if (action.type === "fold") {
    if (!canFold(state, action.player)) return state;
    const winner = other(action.player);
    const points = foldPoints(state, action.player);
    let next = state;
    if (state.pendingCall?.kind === "envido") {
      next = settleEnvido(state, state.pendingCall, false);
      if (next.status === "match-over") return next;
    } else if (points.envido) {
      const detail = `Retiro antes de jugar: ${playerName(winner)} +1 por Envido.`;
      next = award({ ...state, envidoClosed: true, envidoResult: detail }, winner, points.envido, detail, false);
      if (next.status === "match-over") return next;
    }
    return award(next, winner, points.truco, `${action.player === "human" ? "Te fuiste" : "El Tabernero se fue"} al mazo. ${playerName(winner)} +${points.truco} por la mano${points.envido ? ` y +${points.envido} por Envido` : ""}.`, true);
  }

  if (action.type === "resolve-trick") {
    if (action.revision !== state.revision || state.pendingCall || !state.played.human || !state.played.bot) return state;
    const result = compareCards(state.played.human, state.played.bot);
    const playedTricks = [...state.playedTricks, { human: state.played.human, bot: state.played.bot, result }];
    const winner = resolveHand(playedTricks.map((trick) => trick.result), state.mano);
    const next = { ...state, playedTricks, played: {}, envidoClosed: true };
    if (winner) return award(next, winner, state.trucoValue, `${winner === "human" ? "¡Ganaste la mano!" : "El Tabernero ganó la mano."} +${state.trucoValue}.`, true);
    const leader = nextLeader(result, state.leader, state.mano);
    return { ...next, leader, turn: leader, message: leader === "human" ? "Siguiente baza. Salís vos." : "Siguiente baza. Sale el Tabernero…" };
  }

  if (action.type === "bot-act") {
    if (action.revision !== state.revision) return state;
    const decision = chooseBotAction(botView(state), action.roll);
    return decision ? transition(state, decision) : state;
  }
  return state;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const next = transition(state, action);
  return next === state ? state : { ...next, revision: state.revision + 1 };
}

// Deliberately excludes the opponent's unplayed cards and original hand.
export type BotView = {
  difficulty: Difficulty;
  hand: TrucoCard[];
  envido: number;
  opponentCard?: TrucoCard;
  ownCard?: TrucoCard;
  knownCards: TrucoCard[];
  opponentPlayed: TrucoCard[];
  mano: Player;
  leader: Player;
  score: Record<Player, number>;
  trucoValue: TrucoValue;
  canFold: boolean;
  tricks: TrickResult[];
  pendingCall: PendingCall | null;
  envidos: EnvidoVariant[];
  truco: 2 | 3 | 4 | null;
  canPlay: boolean;
};

export function botView(state: GameState): BotView {
  const opponentPlayed = [...state.playedTricks.map((trick) => trick.human), ...(state.played.human ? [state.played.human] : [])];
  return {
    difficulty: state.difficulty, mano: state.mano, leader: state.leader, score: state.score,
    trucoValue: state.trucoValue, canFold: canFold(state, "bot"), ownCard: state.played.bot,
    knownCards: [...state.initialHands.bot, ...opponentPlayed], opponentPlayed,
    hand: state.hands.bot, envido: calculateEnvido(state.initialHands.bot),
    opponentCard: state.played.human, tricks: state.playedTricks.map((trick) => trick.result),
    pendingCall: state.pendingCall, envidos: availableEnvidos(state, "bot"),
    truco: availableTruco(state, "bot"), canPlay: canPlayCard(state, "bot"),
  };
}

const botProfiles = {
  easy: { mistake: 0.32, bluff: 0.005, envidoOpen: 0.3, envidoRaise: 0.08, trucoRaise: 0.1, raiseConfidence: 0.9 },
  normal: { mistake: 0, bluff: 0.04, envidoOpen: 0.65, envidoRaise: 0.45, trucoRaise: 0.4, raiseConfidence: 0.76 },
  hard: { mistake: 0, bluff: 0.08, envidoOpen: 0.9, envidoRaise: 0.65, trucoRaise: 0.65, raiseConfidence: 0.82 },
} as const;

function unseenCards(view: BotView): TrucoCard[] {
  const known = new Set(view.knownCards.map((card) => card.id));
  return createDeck().filter((card) => !known.has(card.id));
}

function normalCard(view: BotView): TrucoCard {
  const ordered = [...view.hand].sort((a, b) => cardPower(a) - cardPower(b));
  const rival = view.opponentCard;
  if (rival) {
    // A cheap parda can already win the hand; spending a bravo is unnecessary.
    const closing = ordered.find((card) => resolveHand([...view.tricks, compareCards(rival, card)], view.mano) === "bot");
    if (closing) return closing;
    const surviving = ordered.filter((card) => resolveHand([...view.tricks, compareCards(rival, card)], view.mano) !== "human");
    const winner = surviving.find((card) => cardPower(card) > cardPower(rival));
    const tie = surviving.find((card) => cardPower(card) === cardPower(rival));
    return winner ?? tie ?? ordered[0];
  }
  const strongest = ordered[ordered.length - 1];
  // With primera in hand, a strong reserve can finish in tercera.
  if (view.tricks[0] === "bot" && ordered.length === 2 && cardPower(strongest) >= 10) return ordered[0];
  return strongest;
}

function simpleHandChance(view: BotView, card: TrucoCard | null): number {
  const unseen = unseenCards(view);
  const chanceOfCard = (candidate: TrucoCard) => unseen.length === 0 ? 1 :
    unseen.reduce((sum, rival) => sum + (cardPower(candidate) > cardPower(rival) ? 1 : cardPower(candidate) === cardPower(rival) ? 0.5 : 0), 0) / unseen.length;
  let results = view.tricks;
  let remaining = [...view.hand, ...(view.ownCard ? [view.ownCard] : [])];
  if (view.opponentCard && card) {
    results = [...results, compareCards(view.opponentCard, card)];
    const winner = resolveHand(results, view.mano);
    if (winner) return winner === "bot" ? 1 : 0;
    remaining = remaining.filter((item) => item.id !== card.id);
  }
  const powers = remaining.map(chanceOfCard).sort((a, b) => b - a);
  const [best = 0, second = best] = powers;
  if (results.length === 2) return best;
  if (results[0] === "bot") return 1 - (1 - best) * (1 - second);
  if (results[0] === "human") return best * second;
  if (results[0] === "tie") return best;
  return best * (0.45 + 0.55 * second);
}

// Deterministic sampling from public information keeps reducer replay safe.
// The sampled hands are hypotheses, never the actual hidden opponent hand.
function possibleHands(view: BotView): TrucoCard[][] {
  const unseen = unseenCards(view);
  const count = 3 - view.opponentPlayed.length;
  if (count === 0) return [[]];
  if (count === 1) return unseen.map((card) => [card]);
  let seed = 2166136261;
  const key = view.knownCards.map((card) => card.id).sort().join(",") + view.mano + view.leader + view.tricks.join(",");
  for (let i = 0; i < key.length; i++) seed = Math.imul(seed ^ key.charCodeAt(i), 16777619) >>> 0;
  const samples: TrucoCard[][] = [];
  for (let sample = 0; sample < 48; sample++) {
    const pool = [...unseen];
    const hand: TrucoCard[] = [];
    for (let pick = 0; pick < count; pick++) {
      seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
      hand.push(pool.splice(Math.floor((seed / 4294967296) * pool.length), 1)[0]);
    }
    samples.push(hand);
  }
  return samples;
}

function forecast(
  bot: TrucoCard[], human: TrucoCard[], tricks: TrickResult[], mano: Player,
  leader: Player, played: Partial<Record<Player, TrucoCard>>,
): number {
  if (played.bot && played.human) {
    const result = compareCards(played.human, played.bot);
    const nextTricks = [...tricks, result];
    const winner = resolveHand(nextTricks, mano);
    if (winner) return winner === "bot" ? 1 : 0;
    return forecast(bot, human, nextTricks, mano, nextLeader(result, leader, mano), {});
  }
  const player = played.human ? "bot" : played.bot ? "human" : leader;
  const hand = player === "bot" ? bot : human;
  let best = player === "bot" ? 0 : 1;
  for (const card of hand) {
    const remainder = hand.filter((item) => item.id !== card.id);
    const result = forecast(
      player === "bot" ? remainder : bot, player === "human" ? remainder : human,
      tricks, mano, leader, { ...played, [player]: card },
    );
    best = player === "bot" ? Math.max(best, result) : Math.min(best, result);
    if (best === (player === "bot" ? 1 : 0)) break;
  }
  return best;
}

export function analyseBotHand(view: BotView): { chance: number; card: TrucoCard | null } {
  if (view.difficulty !== "hard") {
    const card = view.hand.length ? view.difficulty === "easy" ? chooseBotCard(view.hand, view.opponentCard) : normalCard(view) : null;
    return { card, chance: simpleHandChance(view, card) };
  }
  const hands = possibleHands(view);
  const played = { human: view.opponentCard, bot: view.ownCard };
  if (!view.ownCard && (view.opponentCard || view.leader === "bot")) {
    let best = { chance: -1, card: null as TrucoCard | null };
    for (const card of [...view.hand].sort((a, b) => cardPower(a) - cardPower(b))) {
      const remainder = view.hand.filter((item) => item.id !== card.id);
      const chance = hands.reduce((sum, hand) => sum + forecast(remainder, hand, view.tricks, view.mano, view.leader, { ...played, bot: card }), 0) / hands.length;
      if (chance > best.chance) best = { chance, card };
    }
    return best;
  }
  const chance = hands.reduce((sum, hand) => sum + forecast(view.hand, hand, view.tricks, view.mano, view.leader, played), 0) / hands.length;
  return { chance, card: null };
}

export function estimateEnvidoChance(view: BotView): number {
  if (view.difficulty !== "hard") return view.envido < 20 ? 0.05 + view.envido / 20 : 0.45 + ((view.envido - 20) / 13) * 0.55;
  const unseen = unseenCards(view);
  let total = 0;
  let wins = 0;
  const enumerate = (hand: TrucoCard[], start: number) => {
    if (hand.length === 3) {
      const rival = calculateEnvido(hand);
      wins += view.envido > rival || (view.envido === rival && view.mano === "bot") ? 1 : 0;
      total++;
      return;
    }
    for (let i = start; i <= unseen.length - (3 - hand.length); i++) enumerate([...hand, unseen[i]], i + 1);
  };
  enumerate(view.opponentPlayed, 0);
  return total ? wins / total : 0;
}

function pointUtility(view: BotView, player: Player, points: number): number {
  const remaining = 30 - view.score[player];
  return Math.min(points, remaining) + (points >= remaining ? 18 : 0);
}

function acceptsBet(view: BotView, chance: number, points: number, declined: number): boolean {
  // Near 30, refusing can lose the match: compare continuing against that cost.
  const accepting = chance * pointUtility(view, "bot", points) - (1 - chance) * pointUtility(view, "human", points);
  const refusing = -pointUtility(view, "human", declined);
  const caution = view.difficulty === "easy" ? 0.8 : view.difficulty === "normal" ? 0.15 : 0;
  return accepting >= refusing + caution;
}

function envidoChoice(view: BotView, chance: number): EnvidoVariant {
  if (chance >= 0.99 && view.envidos.includes("falta-envido")) return "falta-envido";
  return view.envidos[0];
}

export function chooseBotAction(view: BotView, roll: number): GameAction | null {
  const call = view.pendingCall;
  if (call?.caller === "bot") return null;
  if (!call && !view.canPlay) return null;
  const profile = botProfiles[view.difficulty];
  const random = Math.min(0.999999, Math.max(0, roll));
  const envidoChance = call?.kind === "envido" || view.envidos.length ? estimateEnvidoChance(view) : 0;

  if (call?.kind === "envido") {
    const confidence = Math.max(0, envidoChance - (call.bids.length - 1) * 0.06 - (call.bids.includes("falta-envido") ? 0.12 : 0));
    if (confidence >= profile.raiseConfidence && view.envidos.length && call.points < 30 - view.score.bot && random < profile.envidoRaise) {
      return { type: "envido", player: "bot", variant: envidoChoice(view, envidoChance) };
    }
    return { type: "respond", player: "bot", accepted: acceptsBet(view, confidence, call.points, call.declinedPoints) };
  }
  if (call?.kind === "truco" && view.envidos.length && envidoChance >= (view.difficulty === "easy" ? 0.9 : 0.7)) {
    return { type: "envido", player: "bot", variant: "envido" };
  }

  const analysis = analyseBotHand(view);
  const confidence = Math.max(0, analysis.chance);
  const canAffordBluff = view.score.human + (view.truco ?? 2) < 30 && confidence > 0.05 && confidence < 0.65;
  const bluff = canAffordBluff && random < profile.bluff;

  if (call?.kind === "truco") {
    const pressure = call.value === 4 ? 0.15 : call.value === 3 ? 0.08 : 0.02;
    if (view.truco && call.value < 30 - view.score.bot && ((confidence >= profile.raiseConfidence && random < profile.trucoRaise) || bluff)) return { type: "truco", player: "bot" };
    return { type: "respond", player: "bot", accepted: acceptsBet(view, Math.max(0, confidence - pressure), call.value, view.trucoValue) };
  }

  if (view.envidos.length && ((envidoChance >= 0.72 && random < profile.envidoOpen) || (random < profile.bluff && view.score.human < 27))) {
    const variant = view.envido >= 32 && view.difficulty !== "easy" ? "real-envido" : "envido";
    return { type: "envido", player: "bot", variant };
  }

  // Concede hopeless later tricks, but keep a possible comeback when folding loses the match.
  const foldingLosesMatch = view.score.human + view.trucoValue >= 30;
  const foldThreshold = view.difficulty === "easy" ? 0.06 : view.difficulty === "normal" ? 0.025 : 0.1;
  if (view.canFold && view.tricks.length > 0 && confidence <= foldThreshold && (!foldingLosesMatch || confidence === 0)) return { type: "fold", player: "bot" };
  if (view.truco && view.trucoValue < 30 - view.score.bot && ((confidence >= profile.raiseConfidence && random < profile.trucoRaise) || bluff)) return { type: "truco", player: "bot" };

  if (view.difficulty === "easy" && view.hand.length > 1 && random < profile.mistake) {
    const card = view.hand[Math.floor((random / profile.mistake) * view.hand.length)];
    return { type: "play", player: "bot", cardId: card.id };
  }
  const card = analysis.card ?? normalCard(view);
  return { type: "play", player: "bot", cardId: card.id };
}
