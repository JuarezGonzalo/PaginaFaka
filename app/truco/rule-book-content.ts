import type { EnvidoVariant, Player, TrickResult, TrucoCard } from "./game-engine";

export const chapters = [
  { title: "Sentate a la mesa", subtitle: "Lo necesario para empezar" },
  { title: "El valor de las cartas", subtitle: "De la Espadilla al cuatro" },
  { title: "Los tantos del Envido", subtitle: "Dos cartas, un mismo palo" },
  { title: "Truco, Retruco y más", subtitle: "Cuánto vale la mano" },
  { title: "Mano, bazas y pardas", subtitle: "Quién gana cuando hay empate" },
  { title: "Las reglas de la casa", subtitle: "Falta Envido e ir al mazo" },
] as const;

const card = (rank: TrucoCard["rank"], suit: TrucoCard["suit"]): TrucoCard => ({ id: `${rank}-${suit}`, rank, suit });
const suits: TrucoCard["suit"][] = ["espada", "basto", "oro", "copa"];

// Keep the complete hierarchy and teaching examples checked against the engine.
export const cardHierarchy = [
  { title: "1 de espada", nickname: "La Espadilla", cards: [card(1, "espada")] },
  { title: "1 de basto", nickname: "El Bastillo", cards: [card(1, "basto")] },
  { title: "7 de espada", nickname: "Siete bravo", cards: [card(7, "espada")] },
  { title: "7 de oro", nickname: "Siete bravo", cards: [card(7, "oro")] },
  { title: "Todos los 3", cards: suits.map(s => card(3, s)) },
  { title: "Todos los 2", cards: suits.map(s => card(2, s)) },
  { title: "1 de oro y de copa", nickname: "Los unos falsos", cards: [card(1, "oro"), card(1, "copa")] },
  { title: "Todos los 12", cards: suits.map(s => card(12, s)) },
  { title: "Todos los 11", cards: suits.map(s => card(11, s)) },
  { title: "Todos los 10", cards: suits.map(s => card(10, s)) },
  { title: "7 de basto y de copa", nickname: "Los sietes falsos", cards: [card(7, "basto"), card(7, "copa")] },
  { title: "Todos los 6", cards: suits.map(s => card(6, s)) },
  { title: "Todos los 5", cards: suits.map(s => card(5, s)) },
  { title: "Todos los 4", cards: suits.map(s => card(4, s)) },
];

export const envidoExamples = [
  { cards: [card(7, "oro"), card(6, "oro"), card(1, "espada")], total: 33, explanation: "7 + 6 + 20. Dos oros: el Envido más alto posible." },
  { cards: [card(12, "copa"), card(5, "copa"), card(3, "basto")], total: 25, explanation: "0 + 5 + 20. Las figuras (10, 11 y 12) valen cero para el Envido." },
  { cards: [card(7, "espada"), card(6, "basto"), card(3, "oro")], total: 7, explanation: "Tres palos distintos: cuenta la carta de mayor valor de Envido, sin sumar 20." },
  { cards: [card(7, "basto"), card(5, "basto"), card(2, "basto")], total: 32, explanation: "7 + 5 + 20. Como acá no jugamos con flor, elegís las dos mejores del mismo palo." },
];

export const envidoBids: { label: string; bids: EnvidoVariant[]; accepted: number; declined: number }[] = [
  { label: "Envido", bids: ["envido"], accepted: 2, declined: 1 },
  { label: "Real Envido", bids: ["real-envido"], accepted: 3, declined: 1 },
  { label: "Envido + Envido", bids: ["envido", "envido"], accepted: 4, declined: 2 },
  { label: "Envido + Real Envido", bids: ["envido", "real-envido"], accepted: 5, declined: 2 },
  { label: "Envido + Envido + Real Envido", bids: ["envido", "envido", "real-envido"], accepted: 7, declined: 4 },
];

export const trucoBids = [
  { label: "Truco", accepted: 2, declined: 1 },
  { label: "Retruco", accepted: 3, declined: 2 },
  { label: "Vale Cuatro", accepted: 4, declined: 3 },
];

export const pardaExamples: { results: TrickResult[]; mano: Player; winner: Player; explanation: string }[] = [
  { results: ["human", "tie"], mano: "bot", winner: "human", explanation: "Ganaste primera y la segunda es parda: la mano es tuya." },
  { results: ["tie", "bot"], mano: "human", winner: "bot", explanation: "Primera parda: quien gana la segunda se lleva la mano." },
  { results: ["human", "bot", "tie"], mano: "bot", winner: "human", explanation: "Una baza para cada uno y tercera parda: gana quien hizo primera." },
  { results: ["tie", "tie", "human"], mano: "bot", winner: "human", explanation: "Dos pardas: la tercera decide." },
  { results: ["tie", "tie", "tie"], mano: "human", winner: "human", explanation: "Tres pardas: gana quien es mano. En este ejemplo, vos." },
];

export const faltaExamples = [
  { human: 8, bot: 11, points: 4, explanation: "Ambos en malas: al puntero le faltan 4 para llegar a 15." },
  { human: 18, bot: 22, points: 8, explanation: "Ya hay buenas: al puntero le faltan 8 para llegar a 30." },
  { human: 14, bot: 15, points: 15, explanation: "Con alguien en 15, ya se calcula hacia 30." },
];
