import assert from "node:assert/strict";
import test from "node:test";
import {
  analyseBotHand, botView, chooseBotAction, createDeck, estimateEnvidoChance,
  gameReducer, initialGame,
} from "../app/truco/game-engine.ts";

const deck = createDeck();
const c = (rank, suit) => deck.find((card) => card.rank === rank && card.suit === suit);
const hands = {
  human: [c(2, "oro"), c(6, "basto"), c(7, "copa")],
  bot: [c(1, "espada"), c(4, "copa"), c(5, "oro")],
};
const deal = (s, cards = hands) => gameReducer(s, { type: "deal", hands: cards });
const play = (s, player, card) => gameReducer(s, { type: "play", player, cardId: card.id });
const act = (s, roll = 0.9) => gameReducer(s, { type: "bot-act", revision: s.revision, roll });
const resolve = (s) => gameReducer(s, { type: "resolve-trick", revision: s.revision });
const lead = (difficulty, cards = hands) => deal({ ...initialGame(difficulty), status: "hand-over", mano: "human" }, cards);

test("Normal is the default; choice survives the deal, next hand and rematch", () => {
  assert.equal(initialGame().difficulty, "normal");
  let s = gameReducer(initialGame(), { type: "set-difficulty", difficulty: "hard" });
  s = deal(s);
  assert.equal(s.difficulty, "hard");
  s = gameReducer(s, { type: "fold", player: "human" });
  s = deal(s);
  assert.equal(s.difficulty, "hard");
  s = { ...s, score: { human: 0, bot: 29 } };
  s = gameReducer(s, { type: "fold", player: "human" });
  assert.equal(s.status, "match-over");
  s = gameReducer(s, { type: "set-difficulty", difficulty: "easy" });
  s = deal(s);
  assert.equal(s.difficulty, "easy");
  assert.deepEqual(s.score, { human: 0, bot: 0 });
});

test("difficulty is locked during a match, including between hands or during a pending call", () => {
  let s = deal(initialGame("hard"));
  assert.equal(gameReducer(s, { type: "set-difficulty", difficulty: "easy" }), s);
  s = gameReducer(s, { type: "truco", player: "human" });
  assert.equal(gameReducer(s, { type: "set-difficulty", difficulty: "easy" }), s);
  s = gameReducer(s, { type: "respond", player: "bot", accepted: false });
  assert.equal(s.status, "hand-over");
  assert.equal(gameReducer(s, { type: "set-difficulty", difficulty: "easy" }), s);
});

test("normal contests primera while easy uses the simple low-card opening", () => {
  assert.equal(chooseBotAction(botView(lead("easy")), 0.9).cardId, "4-copa");
  assert.equal(chooseBotAction(botView(lead("normal")), 0.9).cardId, "1-espada");
});

test("easy can waste a strong card when a cheaper card suffices; normal conserves it", () => {
  const cards = {
    human: [c(5, "basto"), c(6, "basto"), c(7, "copa")],
    bot: [c(1, "espada"), c(6, "oro"), c(4, "copa")],
  };
  let easy = deal(initialGame("easy"), cards);
  for (const player of ["human", "bot", "human"]) easy = gameReducer(easy, { type: "truco", player });
  easy = gameReducer(easy, { type: "respond", player: "bot", accepted: true });
  easy = play(easy, "human", cards.human[0]);
  const normal = { ...easy, difficulty: "normal" };
  assert.equal(chooseBotAction(botView(easy), 0.08).cardId, "1-espada");
  assert.equal(chooseBotAction(botView(normal), 0.9).cardId, "6-oro");
});

test("normal saves a bravo for tercera after winning primera", () => {
  const cards = {
    human: [c(4, "oro"), c(3, "copa"), c(12, "espada")],
    bot: [c(5, "basto"), c(3, "oro"), c(1, "espada")],
  };
  let s = deal(initialGame("normal"), cards);
  s = resolve(play(play(s, "human", cards.human[0]), "bot", cards.bot[0]));
  assert.equal(s.playedTricks[0].result, "bot");
  assert.equal(chooseBotAction(botView(s), 0.9).cardId, "3-oro");
});

test("hard finds a guaranteed two-bravo win and does not need to spend one opening", () => {
  const cards = { ...hands, bot: [c(1, "espada"), c(1, "basto"), c(4, "oro")] };
  const view = botView(lead("hard", cards));
  const analysis = analyseBotHand(view);
  assert.equal(analysis.chance, 1);
  assert.equal(analysis.card.id, "4-oro");
});

test("a hopeless second trick produces a real fold action without playing another card", () => {
  const cards = {
    human: [c(3, "oro"), c(1, "espada"), c(4, "basto")],
    bot: [c(4, "copa"), c(5, "oro"), c(6, "copa")],
  };
  for (const difficulty of ["easy", "normal", "hard"]) {
    let s = deal(initialGame(difficulty), cards);
    s = resolve(play(play(s, "human", cards.human[0]), "bot", cards.bot[0]));
    s = play(s, "human", cards.human[1]);
    const choice = chooseBotAction(botView(s), 0.9);
    assert.equal(choice.type, "fold");
    const next = act(s);
    assert.equal(next.status, "hand-over");
    assert.equal(next.score.human, 1);
    assert.equal(next.hands.bot.length, 2);
    assert.equal(next.played.human.id, "1-espada");
  }
});

test("hard accounts for the scoreboard instead of giving away a match by refusing Vale Cuatro", () => {
  const cards = { ...hands, bot: [c(3, "copa"), c(4, "basto"), c(5, "espada")] };
  let s = deal(initialGame("hard"), cards);
  s = gameReducer(s, { type: "truco", player: "human" });
  s = gameReducer(s, { type: "truco", player: "bot" });
  s = gameReducer(s, { type: "truco", player: "human" });
  assert.equal(s.pendingCall.value, 4);
  const lowStakes = chooseBotAction(botView(s), 0.9);
  assert.equal(lowStakes.type, "respond");
  assert.equal(lowStakes.accepted, false);
  const matchAtStake = chooseBotAction(botView({ ...s, score: { human: 29, bot: 0 } }), 0.9);
  assert.equal(matchAtStake.type, "respond");
  assert.equal(matchAtStake.accepted, true);
});

test("a strong bot one point from victory accepts instead of raising unnecessarily", () => {
  const cards = { ...hands, bot: [c(1, "espada"), c(1, "basto"), c(4, "oro")] };
  let s = deal(initialGame("hard"), cards);
  s = gameReducer({ ...s, score: { human: 15, bot: 29 } }, { type: "truco", player: "human" });
  assert.deepEqual(chooseBotAction(botView(s), 0.01), { type: "respond", player: "bot", accepted: true });
});

test("all levels use only public information, even for probability estimates and pending calls", () => {
  for (const difficulty of ["easy", "normal", "hard"]) {
    let s = play(deal(initialGame(difficulty)), "human", hands.human[0]);
    s = gameReducer(s, { type: "truco", player: "human" });
    const changed = {
      ...s,
      hands: { ...s.hands, human: [c(1, "basto"), c(7, "espada")] },
      initialHands: { ...s.initialHands, human: [hands.human[0], c(1, "basto"), c(7, "espada")] },
    };
    assert.deepEqual(botView(s), botView(changed));
    for (const roll of [0.01, 0.2, 0.8]) assert.deepEqual(chooseBotAction(botView(s), roll), chooseBotAction(botView(changed), roll));
    assert.deepEqual(analyseBotHand(botView(s)), analyseBotHand(botView(changed)));
    assert.equal(estimateEnvidoChance(botView(s)), estimateEnvidoChance(botView(changed)));
  }
});

test("hard uses the visible opponent card in its envido probability, not just its own tanto", () => {
  const s = deal(initialGame("hard"), {
    human: [c(7, "oro"), c(6, "oro"), c(4, "espada")],
    bot: [c(7, "copa"), c(5, "copa"), c(1, "basto")],
  });
  const seven = botView(play(s, "human", c(7, "oro")));
  const four = botView(play(s, "human", c(4, "espada")));
  assert.equal(seven.envido, four.envido);
  assert.ok(estimateEnvidoChance(seven) < estimateEnvidoChance(four));
});

test("replaying a bot event is deterministic, including hard hand sampling", () => {
  for (const difficulty of ["easy", "normal", "hard"]) {
    const s = play(deal(initialGame(difficulty)), "human", hands.human[0]);
    const action = { type: "bot-act", revision: s.revision, roll: 0.37 };
    assert.deepEqual(gameReducer(s, action), gameReducer(s, action));
    assert.equal(s.hands.bot.length, 3);
  }
});
