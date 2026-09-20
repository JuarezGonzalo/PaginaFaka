import assert from "node:assert/strict";
import test from "node:test";
import {
  availableEnvidos, availableTruco, botView, calculateEnvido, canFold,
  canPlayCard, createDeck, faltaEnvidoPoints, foldPoints, gameReducer,
  initialGame, isResolving, resolveHand,
} from "../app/truco/game-engine.ts";

const deck = createDeck();
const card = (rank, suit) => deck.find((c) => c.rank === rank && c.suit === suit);
const defaultHands = {
  human: [card(7, "oro"), card(6, "oro"), card(1, "espada")],
  bot: [card(7, "copa"), card(5, "copa"), card(1, "basto")],
};
function start(hands = defaultHands, mano = "human", score = { human: 0, bot: 0 }) {
  const before = { ...initialGame(), status: "hand-over", mano: mano === "human" ? "bot" : "human", score };
  return gameReducer(before, { type: "deal", hands });
}
const envido = (s, player, variant = "envido") => gameReducer(s, { type: "envido", player, variant });
const truco = (s, player) => gameReducer(s, { type: "truco", player });
const respond = (s, player, accepted = true) => gameReducer(s, { type: "respond", player, accepted });
const fold = (s, player = "human") => gameReducer(s, { type: "fold", player });
const play = (s, player, index = 0) => gameReducer(s, { type: "play", player, cardId: s.hands[player][index].id });
const resolve = (s) => gameReducer(s, { type: "resolve-trick", revision: s.revision });
const other = (p) => p === "human" ? "bot" : "human";

test("envido counts faces as zero and takes the best pair, including three matching suits", () => {
  assert.equal(calculateEnvido([card(10, "oro"), card(11, "oro"), card(7, "copa")]), 20);
  assert.equal(calculateEnvido([card(7, "oro"), card(6, "oro"), card(5, "oro")]), 33);
  assert.equal(calculateEnvido([card(12, "oro"), card(11, "basto"), card(10, "copa")]), 0);
  assert.equal(calculateEnvido([]), 0);
});

test("both players can start envido on their own first turn, even after the rival plays", () => {
  for (const mano of ["human", "bot"]) {
    let s = start(defaultHands, mano);
    assert.equal(availableEnvidos(s, mano).length, 3);
    assert.deepEqual(availableEnvidos(s, other(mano)), []);
    s = play(s, mano);
    assert.equal(availableEnvidos(s, other(mano)).length, 3);
    assert.deepEqual(availableEnvidos(s, mano), []);
  }
});

test("first-card envido uses the original three cards, not just the remaining two", () => {
  let s = play(start(), "human");
  s = envido(s, "bot");
  s = respond(s, "human");
  assert.equal(s.score.human, 2);
  assert.match(s.envidoResult, /vos 33, Tabernero 32/);
  assert.equal(s.played.human.id, "7-oro");
  assert.equal(s.turn, "bot");
});

test("envido ties go to mano, irrespective of who calls", () => {
  const hands = { ...defaultHands, bot: [card(7, "copa"), card(6, "copa"), card(1, "basto")] };
  for (const mano of ["human", "bot"]) {
    let s = envido(start(hands, mano), mano);
    s = respond(s, other(mano));
    assert.equal(s.score[mano], 2);
    assert.equal(s.score[other(mano)], 0);
  }
});

const sequences = [
  { bids: ["envido"], accepted: 2, declined: 1 },
  { bids: ["real-envido"], accepted: 3, declined: 1 },
  { bids: ["falta-envido"], accepted: 15, declined: 1 },
  { bids: ["envido", "envido"], accepted: 4, declined: 2 },
  { bids: ["envido", "real-envido"], accepted: 5, declined: 2 },
  { bids: ["envido", "envido", "real-envido"], accepted: 7, declined: 4 },
  { bids: ["envido", "envido", "real-envido", "falta-envido"], accepted: 15, declined: 7 },
  { bids: ["envido", "falta-envido"], accepted: 15, declined: 2 },
  { bids: ["envido", "envido", "falta-envido"], accepted: 15, declined: 4 },
  { bids: ["real-envido", "falta-envido"], accepted: 15, declined: 3 },
  { bids: ["envido", "real-envido", "falta-envido"], accepted: 15, declined: 5 },
];
for (const scenario of sequences) {
  test("envido accepted/rejected: " + scenario.bids.join(" / "), () => {
    for (const accepted of [true, false]) {
      let s = start();
      let caller = "human";
      for (const bid of scenario.bids) {
        assert.ok(availableEnvidos(s, caller).includes(bid));
        s = envido(s, caller, bid);
        caller = other(caller);
      }
      const lastCaller = other(caller);
      assert.equal(s.pendingCall.points, scenario.accepted);
      assert.equal(s.pendingCall.declinedPoints, scenario.declined);
      s = respond(s, caller, accepted);
      const winner = accepted ? "human" : lastCaller;
      assert.equal(s.score[winner], accepted ? scenario.accepted : scenario.declined);
      assert.equal(s.score[other(winner)], 0);
      assert.equal(s.pendingCall, null);
      assert.equal(s.envidoClosed, true);
      assert.deepEqual(availableEnvidos(s, caller), []);
      assert.equal(s.status, "playing");
    }
  });
}

test("cannot repeat a third envido, downgrade real/falta, raise own call, or reopen settled envido", () => {
  let s = envido(start(), "human");
  assert.equal(envido(s, "human"), s);
  s = envido(s, "bot");
  assert.equal(envido(s, "human"), s);
  s = envido(s, "human", "real-envido");
  assert.equal(envido(s, "bot", "envido"), s);
  s = envido(s, "bot", "falta-envido");
  assert.deepEqual(availableEnvidos(s, "human"), []);
  s = respond(s, "human");
  assert.equal(envido(s, "human"), s);
});

test("Falta house variant is explicit at malas/buenas boundary and replaces earlier bids", () => {
  assert.equal(faltaEnvidoPoints({ human: 8, bot: 11 }), 4);
  assert.equal(faltaEnvidoPoints({ human: 14, bot: 14 }), 1);
  assert.equal(faltaEnvidoPoints({ human: 15, bot: 8 }), 15);
  assert.equal(faltaEnvidoPoints({ human: 27, bot: 29 }), 1);
  let s = start(defaultHands, "human", { human: 14, bot: 10 });
  s = envido(s, "human");
  s = envido(s, "bot", "real-envido");
  s = envido(s, "human", "falta-envido");
  assert.equal(s.pendingCall.points, 1);
  assert.equal(s.pendingCall.declinedPoints, 5);
  s = respond(s, "bot");
  assert.equal(s.score.human, 15);
});

test("Envido interrupts Truco and restores the original caller after acceptance or rejection", () => {
  for (const accepted of [true, false]) {
    let s = truco(start(), "bot");
    s = envido(s, "human");
    s = envido(s, "bot", "real-envido");
    assert.equal(s.suspendedTruco.caller, "bot");
    assert.equal(s.trucoValue, 1);
    assert.equal(canPlayCard(s, "human"), false);
    s = respond(s, "human", accepted);
    assert.deepEqual(s.pendingCall, { kind: "truco", caller: "bot", value: 2 });
    assert.equal(s.suspendedTruco, null);
    assert.equal(s.turn, "human");
    s = respond(s, "human");
    assert.equal(s.pendingCall, null);
    assert.equal(s.trucoValue, 2);
    assert.equal(canPlayCard(s, "human"), true);
  }
});

test("responding to first Truco permits Envido after own first card, and counts that card", () => {
  let s = play(start(), "human");
  s = truco(s, "bot");
  assert.equal(availableEnvidos(s, "human").length, 3);
  s = envido(s, "human");
  s = respond(s, "bot");
  assert.match(s.envidoResult, /vos 33/);
  assert.equal(s.pendingCall.kind, "truco");
});

test("accepting or raising the first Truco closes the Envido window", () => {
  const s = truco(start(), "human");
  assert.deepEqual(availableEnvidos(respond(s, "bot"), "bot"), []);
  assert.deepEqual(availableEnvidos(truco(s, "bot"), "human"), []);
});

test("direct Quiero/Retruco/Vale Cuatro alternates sides and pays the preceding level on rejection", () => {
  for (let level = 2; level <= 4; level++) {
    let s = start();
    let caller = "human";
    for (let value = 2; value <= level; value++) {
      assert.equal(availableTruco(s, caller), value);
      s = truco(s, caller);
      assert.equal(s.trucoValue, value - 1);
      assert.equal(availableTruco(s, caller), null);
      caller = other(caller);
    }
    const rejected = respond(s, caller, false);
    assert.equal(rejected.status, "hand-over");
    assert.equal(rejected.score[other(caller)], level - 1);
    const accepted = respond(s, caller);
    assert.equal(accepted.status, "playing");
    assert.equal(accepted.trucoValue, level);
    assert.equal(availableTruco(accepted, other(caller)), null);
    assert.equal(availableTruco(accepted, caller), level < 4 ? level + 1 : null);
  }
});

test("accepted Truco can be raised later, including after own card, without changing card turn", () => {
  let s = respond(truco(start(), "bot"), "human");
  s = play(s, "human");
  const turn = s.turn;
  s = truco(s, "human");
  assert.equal(s.pendingCall.value, 3);
  assert.equal(s.turn, turn);
  assert.equal(s.played.human.id, "7-oro");
});

test("folding before own first card awards 1 Envido and 1 hand; after playing only 1 hand", () => {
  assert.deepEqual(foldPoints(start(), "human"), { envido: 1, truco: 1 });
  assert.equal(fold(start()).score.bot, 2);
  const played = play(start(), "human");
  const s = fold(played);
  assert.equal(s.score.bot, 1);
  assert.equal(s.played.human.id, played.played.human.id);
  assert.equal(s.status, "hand-over");
});

test("folding after accepted Truco, Retruco or Vale Cuatro pays the accepted value", () => {
  for (let level = 2; level <= 4; level++) {
    let s = start();
    let caller = "human";
    for (let value = 2; value <= level; value++) {
      s = truco(s, caller);
      caller = other(caller);
    }
    s = respond(s, caller);
    s = fold(s);
    assert.equal(s.score.bot, level);
    assert.equal(s.status, "hand-over");
  }
});

test("folding while answering a Truco raise only awards its preceding value", () => {
  let s = truco(start(), "bot");
  assert.equal(fold(s).score.bot, 1);
  s = truco(s, "human");
  s = truco(s, "bot");
  assert.equal(s.pendingCall.value, 4);
  assert.equal(fold(s).score.bot, 3);
});

test("folding during Envido rejects the last raise and also ends the hand", () => {
  let s = envido(start(), "human");
  s = envido(s, "bot", "real-envido");
  assert.deepEqual(foldPoints(s, "human"), { envido: 2, truco: 1 });
  s = fold(s);
  assert.equal(s.score.bot, 3);
  assert.equal(s.status, "hand-over");
  assert.equal(s.pendingCall, null);
  assert.match(s.envidoResult, /no querido/);
});

test("folding with suspended Truco cannot leave an unanswered call or award it twice", () => {
  let s = truco(start(), "bot");
  s = envido(s, "human");
  s = envido(s, "bot");
  s = fold(s);
  assert.equal(s.score.bot, 3);
  assert.equal(s.pendingCall, null);
  assert.equal(s.suspendedTruco, null);
  assert.equal(respond(s, "human", false), s);
});

test("already settled Envido is not charged again when folding before playing", () => {
  let s = respond(envido(start(), "human"), "bot");
  assert.deepEqual(foldPoints(s, "human"), { envido: 0, truco: 1 });
  s = fold(s);
  assert.deepEqual(s.score, { human: 2, bot: 1 });
});

test("Envido victory stops the match immediately, including rejected calls and withdrawals", () => {
  let s = start(defaultHands, "human", { human: 29, bot: 29 });
  s = truco(s, "human");
  s = envido(s, "bot");
  s = respond(s, "human", false);
  assert.equal(s.status, "match-over");
  assert.equal(s.score.bot, 30);
  assert.equal(s.pendingCall, null);
  assert.equal(s.suspendedTruco, null);
  assert.equal(play(s, "human"), s);
  let withdrawal = start(defaultHands, "human", { human: 0, bot: 29 });
  withdrawal = fold(withdrawal);
  assert.equal(withdrawal.score.bot, 30);
  assert.match(withdrawal.message, /Envido/);
  assert.doesNotMatch(withdrawal.message, /por la mano/);
});

test("no cards or points may change while a call is unresolved or a stale timer fires", () => {
  const initial = start();
  const s = truco(initial, "human");
  assert.equal(play(s, "human"), s);
  assert.equal(resolve(s), s);
  assert.equal(fold(s), s);
  assert.equal(gameReducer(s, { type: "bot-act", revision: initial.revision, roll: 0.8 }), s);
  let finished = respond(s, "bot", false);
  const oldRevision = s.revision;
  finished = gameReducer(finished, { type: "deal", hands: defaultHands });
  assert.equal(gameReducer(finished, { type: "bot-act", revision: oldRevision, roll: 0.8 }), finished);
});

test("illegal cards and double clicks cannot play twice or duplicate the score", () => {
  const initial = start();
  assert.equal(gameReducer(initial, { type: "play", player: "human", cardId: "not-in-hand" }), initial);
  const s = play(initial, "human");
  assert.equal(gameReducer(s, { type: "play", player: "human", cardId: initial.hands.human[0].id }), s);
  const ended = fold(s);
  assert.equal(fold(ended), ended);
});

test("baza resolution retains played cards; new hand resets bids and alternates mano", () => {
  let s = play(play(start(), "human", 2), "bot", 2);
  assert.ok(isResolving(s));
  assert.equal(canFold(s, "human"), false);
  s = resolve(s);
  const stale = s;
  s = play(play(s, "human"), "bot");
  s = resolve(s);
  assert.equal(s.status, "hand-over");
  assert.equal(s.score.human, 1);
  assert.equal(s.playedTricks.length, 2);
  assert.equal(s.playedTricks[0].human.id, "1-espada");
  assert.equal(gameReducer(s, { type: "resolve-trick", revision: stale.revision }), s);
  s = gameReducer(s, { type: "deal", hands: defaultHands });
  assert.equal(s.mano, "bot");
  assert.equal(s.playedTricks.length, 0);
  assert.equal(s.trucoValue, 1);
  assert.equal(s.envidoClosed, false);
  assert.equal(s.envidoResult, null);
  assert.equal(s.score.human, 1);
});

test("pardas and splits choose the correct hand winner", () => {
  assert.equal(resolveHand(["tie", "human"], "bot"), "human");
  assert.equal(resolveHand(["human", "tie"], "bot"), "human");
  assert.equal(resolveHand(["human", "bot", "tie"], "bot"), "human");
  assert.equal(resolveHand(["tie", "tie"], "bot"), null);
  assert.equal(resolveHand(["tie", "tie", "tie"], "bot"), "bot");
});

test("bot decisions see only its hand and public cards, not hidden opponent cards", () => {
  const s = start();
  const changed = { ...s, hands: { ...s.hands, human: defaultHands.bot }, initialHands: { ...s.initialHands, human: defaultHands.bot } };
  assert.deepEqual(botView(s), botView(changed));
  assert.equal(JSON.stringify(botView(s)).includes("1-espada"), false);
});

test("bot can prioritize Envido, raise Envido and Truco, and resume a interrupted call", () => {
  let s = truco(start(), "human");
  s = gameReducer(s, { type: "bot-act", revision: s.revision, roll: 0.2 });
  assert.equal(s.pendingCall.kind, "envido");
  assert.equal(s.suspendedTruco.kind, "truco");
  s = respond(s, "human");
  s = gameReducer(s, { type: "bot-act", revision: s.revision, roll: 0.8 });
  assert.equal(s.trucoValue, 2);
  assert.equal(s.pendingCall, null);
  s = envido(start(), "human");
  s = gameReducer(s, { type: "bot-act", revision: s.revision, roll: 0.2 });
  assert.deepEqual(s.pendingCall.bids, ["envido", "envido"]);
  const strongBot = { ...defaultHands, bot: [card(1, "basto"), card(3, "copa"), card(2, "espada")] };
  s = truco(start(strongBot), "human");
  s = gameReducer(s, { type: "bot-act", revision: s.revision, roll: 0.2 });
  assert.equal(s.pendingCall.value, 3);
});

for (const difficulty of ["easy", "normal", "hard"]) {
test("50 seeded matches without duplicate cards, points or blocked turns: " + difficulty, () => {
  let seed = 87654;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const draw = () => {
    const cards = [...deck];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return { human: cards.slice(0, 3), bot: cards.slice(3, 6) };
  };
  for (let match = 0; match < 50; match++) {
    let s = gameReducer(initialGame(difficulty), { type: "deal", hands: draw() });
    for (let step = 0; step < 5000 && s.status !== "match-over"; step++) {
      const before = s;
      if (s.status === "hand-over") {
        s = gameReducer(s, { type: "deal", hands: draw() });
      } else if (isResolving(s)) {
        s = resolve(s);
      } else if (s.pendingCall?.caller === "human" || (!s.pendingCall && s.turn === "bot")) {
        s = gameReducer(s, { type: "bot-act", revision: s.revision, roll: random() });
      } else {
        const choices = [];
        for (const variant of availableEnvidos(s, "human")) choices.push({ type: "envido", player: "human", variant });
        if (availableTruco(s, "human")) choices.push({ type: "truco", player: "human" });
        if (canFold(s, "human")) choices.push({ type: "fold", player: "human" });
        if (s.pendingCall?.caller === "bot") {
          choices.push({ type: "respond", player: "human", accepted: true }, { type: "respond", player: "human", accepted: false });
        }
        if (canPlayCard(s, "human")) for (const c of s.hands.human) choices.push({ type: "play", player: "human", cardId: c.id });
        assert.ok(choices.length > 0, "Every live position has a legal action");
        s = gameReducer(s, choices[Math.floor(random() * choices.length)]);
      }
      assert.notEqual(s, before, "A scheduled legal action must make progress");
      assert.ok(s.score.human >= before.score.human && s.score.bot >= before.score.bot);
      assert.ok(s.score.human <= 30 && s.score.bot <= 30);
      const all = [];
      for (const player of ["human", "bot"]) {
        const cards = [...s.hands[player], ...s.playedTricks.map((t) => t[player]), ...(s.played[player] ? [s.played[player]] : [])];
        assert.equal(cards.length, 3);
        all.push(...cards.map((c) => c.id));
      }
      assert.equal(new Set(all).size, 6);
    }
    assert.equal(s.status, "match-over");
    assert.equal(Math.max(s.score.human, s.score.bot), 30);
    assert.equal(s.pendingCall, null);
    const next = gameReducer(s, { type: "deal", hands: draw() });
    assert.deepEqual(next.score, { human: 0, bot: 0 });
    assert.equal(next.mano, "human");
    assert.equal(next.difficulty, difficulty);
  }
});
}
