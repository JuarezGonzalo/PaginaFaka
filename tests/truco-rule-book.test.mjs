import assert from "node:assert/strict";
import test from "node:test";
import { calculateEnvido, cardPower, createDeck, faltaEnvidoPoints, gameReducer, initialGame, resolveHand, trucoLabels } from "../app/truco/game-engine.ts";
import { cardHierarchy, chapters, envidoBids, envidoExamples, faltaExamples, pardaExamples, trucoBids } from "../app/truco/rule-book-content.ts";

const deck = createDeck();
const card = (rank, suit) => deck.find(c => c.rank === rank && c.suit === suit);
const start = () => gameReducer(initialGame(), { type: "deal", hands: {
  human: [card(7, "oro"), card(6, "oro"), card(1, "espada")],
  bot: [card(3, "basto"), card(4, "copa"), card(5, "espada")],
} });

test("rule book has six distinct chapters", () => {
  assert.equal(chapters.length, 6);
  assert.equal(new Set(chapters.map(c => c.title)).size, 6);
});

test("book hierarchy includes all 40 cards exactly once, in engine order", () => {
  const cards = cardHierarchy.flatMap(group => group.cards);
  assert.deepEqual(cards.map(c => c.id).sort(), deck.map(c => c.id).sort());
  let previousPower = Infinity;
  for (const group of cardHierarchy) {
    const power = cardPower(group.cards[0]);
    assert.ok(power < previousPower, group.title);
    assert.ok(group.cards.every(c => cardPower(c) === power), group.title);
    previousPower = power;
  }
});

test("every illustrated Envido total matches the game", () => {
  for (const example of envidoExamples) assert.equal(calculateEnvido(example.cards), example.total, example.explanation);
});

test("book Envido table matches both accepted and refused chains", () => {
  for (const bid of envidoBids) {
    for (const accepted of [true, false]) {
      let state = start();
      let player = "human";
      for (const variant of bid.bids) {
        state = gameReducer(state, { type: "envido", player, variant });
        player = player === "human" ? "bot" : "human";
      }
      const caller = state.pendingCall.caller;
      assert.equal(state.pendingCall.points, bid.accepted);
      assert.equal(state.pendingCall.declinedPoints, bid.declined);
      state = gameReducer(state, { type: "respond", player, accepted });
      assert.equal(state.score[accepted ? "human" : caller], accepted ? bid.accepted : bid.declined, bid.label);
    }
  }
});

test("book Truco table matches direct raises and refused payouts", () => {
  for (const bid of trucoBids) {
    let state = start();
    let player = "human";
    for (let value = 2; value <= bid.accepted; value++) {
      state = gameReducer(state, { type: "truco", player });
      player = player === "human" ? "bot" : "human";
    }
    assert.equal(trucoLabels[state.pendingCall.value], bid.label);
    const caller = state.pendingCall.caller;
    const wanted = gameReducer(state, { type: "respond", player, accepted: true });
    assert.equal(wanted.trucoValue, bid.accepted);
    const refused = gameReducer(state, { type: "respond", player, accepted: false });
    assert.equal(refused.score[caller], bid.declined);
  }
});

test("every illustrated parda awards the documented winner", () => {
  for (const example of pardaExamples) assert.equal(resolveHand(example.results, example.mano), example.winner, example.explanation);
});

test("Falta examples follow this table's malas/buenas variant", () => {
  for (const example of faltaExamples) assert.equal(faltaEnvidoPoints(example), example.points, example.explanation);
});
