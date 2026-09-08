"use client";

import { useCallback, useEffect, useState } from "react";
import { SiKick } from "react-icons/si";
import {
  calculateEnvido,
  cardPower,
  chooseBotCard,
  compareCards,
  dealHand,
  nextLeader,
  resolveHand,
  suitSymbol,
  type Player,
  type TrickResult,
  type TrucoCard,
} from "./game-engine";
import styles from "./truco.module.css";

type GameStatus = "idle" | "playing" | "hand-over" | "match-over";
type PlayedTrick = { human: TrucoCard; bot: TrucoCard; result: TrickResult };
type EnvidoVariant = "envido" | "real-envido" | "falta-envido";
type PendingCall =
  | { kind: "envido"; variant: EnvidoVariant; caller: Player; label: string }
  | { kind: "truco"; level: 1 | 2 | 3; caller: Player; label: string };

const trucoLabels = { 1: "TRUCO", 2: "RETRUCO", 3: "VALE CUATRO" } as const;
const envidoLabels: Record<EnvidoVariant, string> = {
  envido: "ENVIDO",
  "real-envido": "REAL ENVIDO",
  "falta-envido": "FALTA ENVIDO",
};

function Card({ card, onPlay, disabled = false, played = false }: { card: TrucoCard; onPlay?: () => void; disabled?: boolean; played?: boolean }) {
  const content = (
    <>
      <span className={styles.cardCorner}>{card.rank}<i>{suitSymbol[card.suit]}</i></span>
      <strong>{suitSymbol[card.suit]}</strong>
      <span className={styles.cardName}>{card.suit.toUpperCase()}</span>
    </>
  );
  const className = `${styles.card} ${card.suit === "oro" || card.suit === "copa" ? styles.redCard : ""} ${played ? styles.playedCard : ""}`;

  if (!onPlay) return <div className={className} aria-label={`${card.rank} de ${card.suit}`}>{content}</div>;
  return <button className={`${className} ${styles.playableCard}`} onClick={onPlay} disabled={disabled} aria-label={`Jugar ${card.rank} de ${card.suit}`}>{content}</button>;
}

function CardPile({ cards, side }: { cards: TrucoCard[]; side: Player }) {
  return (
    <div className={`${styles.cardPile} ${side === "bot" ? styles.botPile : styles.humanPile}`} aria-label={`Cartas jugadas por ${side === "bot" ? "el Tabernero" : "vos"}`}>
      {cards.map((card, index) => (
        <div
          className={styles.pileLayer}
          key={card.id}
          style={{
            left: `${index * 15}px`,
            top: `${index * 8}px`,
            transform: `rotate(${side === "bot" ? -7 + index * 5 : 7 - index * 5}deg)`,
            zIndex: index + 1,
          }}
        >
          <Card card={card} played />
        </div>
      ))}
    </div>
  );
}

const resultLabel: Record<TrickResult, string> = {
  human: "Tuya",
  bot: "Tabernero",
  tie: "Parda",
};

export default function TrucoPage() {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [humanHand, setHumanHand] = useState<TrucoCard[]>([]);
  const [botHand, setBotHand] = useState<TrucoCard[]>([]);
  const [played, setPlayed] = useState<{ human?: TrucoCard; bot?: TrucoCard }>({});
  const [turn, setTurn] = useState<Player>("human");
  const [leader, setLeader] = useState<Player>("human");
  const [mano, setMano] = useState<Player>("human");
  const [tricks, setTricks] = useState<TrickResult[]>([]);
  const [playedTricks, setPlayedTricks] = useState<PlayedTrick[]>([]);
  const [score, setScore] = useState({ human: 0, bot: 0 });
  const [message, setMessage] = useState("La primera mano está por comenzar");
  const [handWinner, setHandWinner] = useState<Player | null>(null);
  const [envidoResolved, setEnvidoResolved] = useState(false);
  const [trucoLevel, setTrucoLevel] = useState<0 | 1 | 2 | 3>(0);
  const [raiseRight, setRaiseRight] = useState<Player | "either">("either");
  const [pendingCall, setPendingCall] = useState<PendingCall | null>(null);

  const finishHand = useCallback((winner: Player, points: number, reason: string) => {
    setScore((current) => {
      const next = { ...current, [winner]: current[winner] + points };
      setHandWinner(winner);
      setPendingCall(null);
      if (next[winner] >= 30) {
        setStatus("match-over");
        setMessage(winner === "human" ? `¡Ganaste la partida! ${reason}` : `El Tabernero ganó la partida. ${reason}`);
      } else {
        setStatus("hand-over");
        setMessage(reason);
      }
      return next;
    });
  }, []);

  const envidoStake = useCallback((variant: EnvidoVariant) => {
    if (variant === "envido") return 2;
    if (variant === "real-envido") return 3;
    const target = score.human < 15 && score.bot < 15 ? 15 : 30;
    return Math.max(1, target - Math.max(score.human, score.bot));
  }, [score]);

  const awardEnvido = useCallback((winner: Player, points: number, detail: string) => {
    const next = { ...score, [winner]: score[winner] + points };
    setScore(next);
    if (next[winner] >= 30) {
      setHandWinner(winner);
      setStatus("match-over");
      setMessage(winner === "human" ? `¡Ganaste la partida! ${detail}` : `El Tabernero ganó la partida. ${detail}`);
    } else {
      setMessage(detail);
    }
  }, [score]);

  const beginHand = useCallback((newMano: Player = mano) => {
    const hand = dealHand();
    setHumanHand(hand.human);
    setBotHand(hand.bot);
    setPlayed({});
    setTricks([]);
    setPlayedTricks([]);
    setHandWinner(null);
    setEnvidoResolved(false);
    setTrucoLevel(0);
    setRaiseRight("either");
    setMano(newMano);
    setLeader(newMano);
    setTurn(newMano);
    setStatus("playing");

    const botEnvido = calculateEnvido(hand.bot);
    const botPower = Math.max(...hand.bot.map(cardPower));
    const openingCall: PendingCall | null = botEnvido >= 30 && Math.random() < 0.55
      ? { kind: "envido", variant: "envido", caller: "bot", label: "ENVIDO" }
      : botPower >= 13 && Math.random() < 0.35
        ? { kind: "truco", level: 1, caller: "bot", label: "TRUCO" }
        : null;
    setPendingCall(openingCall);
    setMessage(openingCall ? `El Tabernero golpea la mesa: ¡${openingCall.label}!` : newMano === "human" ? "Sos mano. Elegí una carta." : "El Tabernero es mano…");
  }, [mano]);

  const startNextHand = () => beginHand(mano === "human" ? "bot" : "human");

  const resetMatch = () => {
    setScore({ human: 0, bot: 0 });
    beginHand("human");
  };

  const playHumanCard = (card: TrucoCard) => {
    if (status !== "playing" || turn !== "human" || played.human || pendingCall) return;
    setHumanHand((cards) => cards.filter((item) => item.id !== card.id));
    setPlayed((current) => ({ ...current, human: card }));
    if (!played.bot) {
      setTurn("bot");
      setMessage("El Tabernero estudia la mesa…");
    }
  };

  const callEnvido = (variant: EnvidoVariant) => {
    if (status !== "playing" || envidoResolved || tricks.length > 0 || played.human || played.bot || pendingCall) return;
    const call: PendingCall = { kind: "envido", variant, caller: "human", label: envidoLabels[variant] };
    setPendingCall(call);
    setMessage(`Cantaste ¡${call.label}! El Tabernero piensa…`);
  };

  const callTruco = () => {
    const nextLevel = (trucoLevel + 1) as 1 | 2 | 3;
    if (status !== "playing" || nextLevel > 3 || pendingCall || played.human || turn !== "human" || (raiseRight !== "human" && raiseRight !== "either")) return;
    const call: PendingCall = { kind: "truco", level: nextLevel, caller: "human", label: trucoLabels[nextLevel] };
    setPendingCall(call);
    setMessage(`Cantaste ¡${call.label}! El Tabernero piensa…`);
  };

  const respondToBot = (accepted: boolean) => {
    if (!pendingCall || pendingCall.caller !== "bot") return;
    const call = pendingCall;

    if (call.kind === "envido") {
      setEnvidoResolved(true);
      setPendingCall(null);
      if (!accepted) {
        awardEnvido("bot", 1, "No quisiste. El Tabernero se lleva 1 punto.");
        return;
      }
      const humanPoints = calculateEnvido(humanHand);
      const botPoints = calculateEnvido(botHand);
      const winner: Player = humanPoints === botPoints ? mano : humanPoints > botPoints ? "human" : "bot";
      const points = envidoStake(call.variant);
      awardEnvido(winner, points, `Quiero. Vos: ${humanPoints}. Tabernero: ${botPoints}. ${winner === "human" ? "¡Los tantos son tuyos!" : "Los tantos son del Tabernero."}`);
      return;
    }

    if (!accepted) {
      finishHand("bot", call.level, `No quisiste el ${call.label}. El Tabernero suma ${call.level}.`);
      return;
    }
    setTrucoLevel(call.level);
    setRaiseRight("human");
    setPendingCall(null);
    setMessage(`¡Quiero ${call.label.toLowerCase()}! La mano vale ${call.level + 1}.`);
  };

  useEffect(() => {
    if (status !== "playing" || turn !== "bot" || played.bot || botHand.length === 0 || pendingCall) return;
    const timer = window.setTimeout(() => {
      const card = chooseBotCard(botHand, played.human);
      setBotHand((cards) => cards.filter((item) => item.id !== card.id));
      setPlayed((current) => ({ ...current, bot: card }));
      if (!played.human) {
        setTurn("human");
        setMessage("El Tabernero jugó. Es tu turno.");
      }
    }, 650);
    return () => window.clearTimeout(timer);
  }, [botHand, pendingCall, played.bot, played.human, status, turn]);

  useEffect(() => {
    if (!pendingCall || pendingCall.caller !== "human" || status !== "playing") return;
    const call = pendingCall;
    const timer = window.setTimeout(() => {
      if (call.kind === "envido") {
        const botPoints = calculateEnvido(botHand);
        const threshold = call.variant === "envido" ? 23 : call.variant === "real-envido" ? 26 : 29;
        setEnvidoResolved(true);
        setPendingCall(null);
        if (botPoints < threshold) {
          awardEnvido("human", 1, `El Tabernero no quiso el ${call.label}. Sumás 1 punto.`);
          return;
        }
        const humanPoints = calculateEnvido(humanHand);
        const winner: Player = humanPoints === botPoints ? mano : humanPoints > botPoints ? "human" : "bot";
        const points = envidoStake(call.variant);
        awardEnvido(winner, points, `¡Quiero! Vos: ${humanPoints}. Tabernero: ${botPoints}. ${winner === "human" ? `Sumás ${points}.` : `El Tabernero suma ${points}.`}`);
        return;
      }

      const cardsInPlay = [...botHand, ...playedTricks.map((trick) => trick.bot), ...(played.bot ? [played.bot] : [])];
      const strongest = Math.max(...cardsInPlay.map(cardPower));
      const accepts = strongest >= (call.level === 1 ? 8 : call.level === 2 ? 10 : 12);
      if (!accepts) {
        finishHand("human", call.level, `El Tabernero no quiso el ${call.label}. Sumás ${call.level}.`);
        return;
      }

      setTrucoLevel(call.level);
      if (call.level < 3 && strongest >= 13 && Math.random() < 0.4) {
        const counterLevel = (call.level + 1) as 2 | 3;
        const counter: PendingCall = { kind: "truco", level: counterLevel, caller: "bot", label: trucoLabels[counterLevel] };
        setRaiseRight("human");
        setPendingCall(counter);
        setMessage(`El Tabernero acepta y redobla: ¡${counter.label}!`);
      } else {
        setRaiseRight("bot");
        setPendingCall(null);
        setMessage(`¡Quiero ${call.label.toLowerCase()}! La mano vale ${call.level + 1}.`);
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [awardEnvido, botHand, envidoStake, finishHand, humanHand, mano, pendingCall, played.bot, playedTricks, status]);

  useEffect(() => {
    if (!played.human || !played.bot || status !== "playing") return;
    const humanCard = played.human;
    const botCard = played.bot;
    const result = compareCards(humanCard, botCard);
    setMessage(result === "tie" ? "¡Parda!" : result === "human" ? "La baza es tuya." : "La baza es del Tabernero.");

    const timer = window.setTimeout(() => {
      const newTricks = [...tricks, result];
      const winner = resolveHand(newTricks, mano);
      setTricks(newTricks);
      setPlayedTricks((completed) => [...completed, { human: humanCard, bot: botCard, result }]);

      if (winner) {
        const handPoints = trucoLevel + 1;
        const newScore = { ...score, [winner]: score[winner] + handPoints };
        setScore(newScore);
        setHandWinner(winner);
        setPlayed({});
        if (newScore[winner] >= 30) {
          setStatus("match-over");
          setMessage(winner === "human" ? `¡Ganaste la partida! La mano valía ${handPoints}.` : `El Tabernero ganó la partida. La mano valía ${handPoints}.`);
        } else {
          setStatus("hand-over");
          setMessage(winner === "human" ? `¡Ganaste la mano y sumás ${handPoints}!` : `El Tabernero ganó la mano y suma ${handPoints}.`);
        }
        return;
      }

      const newLeader = nextLeader(result, leader, mano);
      setPlayed({});
      setLeader(newLeader);
      setTurn(newLeader);
      setStatus("playing");
      setMessage(newLeader === "human" ? "Siguiente baza. Salís vos." : "Siguiente baza. Sale el Tabernero…");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [leader, mano, played.bot, played.human, score, status, tricks, trucoLevel]);

  const canCallEnvido = status === "playing" && !pendingCall && !envidoResolved && tricks.length === 0 && !played.human && !played.bot;
  const canCallTruco = status === "playing" && !pendingCall && turn === "human" && !played.human && trucoLevel < 3 && (raiseRight === "human" || raiseRight === "either");
  const nextTrucoLabel = trucoLevel < 3 ? trucoLabels[(trucoLevel + 1) as 1 | 2 | 3] : "VALE CUATRO";

  return (
    <main className={styles.stage}>
      <header className={styles.header}>
        <a href="/" className={styles.back}>← Volver a la taberna</a>
        <a href="/" className={styles.brand}><span>F</span><b>LA TABERNA DE FAKA</b></a>
        <a href="https://kick.com/fakallen" target="_blank" rel="noreferrer" className={styles.kick}><SiKick aria-hidden="true" /> EN VIVO</a>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>UNA NUEVA SALA SE ABRE</p>
        <h1>La Mesa de Truco</h1>
        <p>Barajá, cantá y defendé tu honor. En esta mesa no alcanza con tener buenas cartas.</p>
      </section>

      <section className={styles.room}>
        <aside className={`${styles.woodPanel} ${styles.gameModes}`}>
          <div className={styles.panelHeading}><span>⚔</span><div><small>PRIMER DESAFÍO</small><h2>Contra la Taberna</h2></div></div>
          <div className={styles.modeCard}>
            <span className={styles.modeIcon}>🍺</span>
            <div><b>Desafiar al Tabernero</b><small>Partida clásica · 1 vs 1</small></div>
          </div>
          {status === "idle" && <button className={styles.gameButton} onClick={() => beginHand("human")}><span>REPARTIR CARTAS</span><small>JUGAR AHORA</small></button>}
          {status === "hand-over" && <button className={styles.gameButton} onClick={startNextHand}><span>NUEVA MANO</span><small>CONTINUAR LA PARTIDA</small></button>}
          {status === "match-over" && <button className={styles.gameButton} onClick={resetMatch}><span>REVANCHA</span><small>VOLVER A 0</small></button>}
          {status === "playing" && <div className={styles.activeBadge}><span>{pendingCall ? pendingCall.label : "PARTIDA EN CURSO"}</span><small>{pendingCall ? pendingCall.caller === "bot" ? "EL TABERNERO TE DESAFÍA" : "ESPERANDO RESPUESTA" : played.human && played.bot ? "RESOLVIENDO BAZA" : turn === "human" ? "TU TURNO" : "TURNO DEL TABERNERO"}</small></div>}
          {pendingCall?.caller === "bot" && (
            <div className={styles.responsePanel}>
              <small>¿ACEPTÁS EL CANTO?</small>
              <div><button onClick={() => respondToBot(true)}>QUIERO</button><button onClick={() => respondToBot(false)}>NO QUIERO</button></div>
            </div>
          )}
          {status === "playing" && pendingCall?.caller !== "bot" && (
            <div className={styles.callControls}>
              <small>CANTOS DE LA MANO</small>
              {canCallEnvido && <div className={styles.envidoButtons}><button onClick={() => callEnvido("envido")}>ENVIDO</button><button onClick={() => callEnvido("real-envido")}>REAL ENVIDO</button><button onClick={() => callEnvido("falta-envido")}>FALTA</button></div>}
              {canCallTruco && <button className={styles.trucoButton} onClick={callTruco}>{nextTrucoLabel}</button>}
              {!canCallEnvido && !canCallTruco && !pendingCall && <span className={styles.noCalls}>Jugá una carta para continuar.</span>}
              {pendingCall?.caller === "human" && <span className={styles.noCalls}>El Tabernero está pensando…</span>}
            </div>
          )}
          <div className={styles.trickTrack} aria-label="Resultado de las bazas">
            {[0, 1, 2].map((index) => <span key={index} className={tricks[index] ? styles.trickDone : ""}>{tricks[index] ? resultLabel[tricks[index]] : `Baza ${index + 1}`}</span>)}
          </div>
          <div className={styles.divider}><span>MESAS ONLINE</span></div>
          <p className={styles.muted}>Muy pronto vas a poder invitar aventureros con un código privado.</p>
          <div className={styles.onlineModes} aria-label="Modos online previstos">
            <span>1 VS 1</span><span>2 VS 2</span><span>3 VS 3</span>
          </div>
        </aside>

        <section className={styles.tableChamber} id="mesa" aria-label="Vista previa de la mesa de Truco">
          <div className={styles.lanternGlow} />
          <div className={styles.opponent}>
            <div className={styles.playerPlaque}><span className={styles.avatar}>F</span><div><small>RIVAL</small><b>EL TABERNERO</b></div><strong>{score.bot}</strong></div>
            <div className={styles.hiddenHand} aria-label={`${botHand.length} cartas ocultas del Tabernero`}>
              {botHand.map((card) => <i key={card.id}/>)}
            </div>
          </div>

          <div className={styles.table}>
            <div className={styles.woodGrain} />
            <div className={styles.tableSeal}><span>F</span><small>LA TABERNA</small></div>
            {status !== "idle" && <div className={styles.stakeBadge}>MANO · {trucoLevel + 1} {trucoLevel === 0 ? "PUNTO" : "PUNTOS"}</div>}
            {status === "idle" && <div className={styles.deck}><i/><i/><span>MAZO</span></div>}
            <CardPile cards={[...playedTricks.map((trick) => trick.bot), ...(played.bot ? [played.bot] : [])]} side="bot" />
            <CardPile cards={[...playedTricks.map((trick) => trick.human), ...(played.human ? [played.human] : [])]} side="human" />
            <div className={styles.tableMessage}><small>{status === "idle" ? "LA MESA AGUARDA" : handWinner ? "MANO TERMINADA" : `BAZA ${tricks.length + 1}`}</small><b>{message}</b></div>
          </div>

          <div className={styles.you}>
            <div className={styles.hand}>
              {status === "idle" ? (
                <><Card card={{ id: "preview-7", rank: 7, suit: "espada" }} /><Card card={{ id: "preview-1", rank: 1, suit: "basto" }} /><Card card={{ id: "preview-3", rank: 3, suit: "oro" }} /></>
              ) : humanHand.map((card) => <Card key={card.id} card={card} onPlay={() => playHumanCard(card)} disabled={status !== "playing" || turn !== "human" || Boolean(played.human) || Boolean(pendingCall)} />)}
            </div>
            <div className={styles.playerPlaque}><span className={styles.avatar}>♟</span><div><small>VOS</small><b>AVENTURERO</b></div><strong>{score.human}</strong></div>
          </div>
        </section>

        <aside className={`${styles.woodPanel} ${styles.guides}`}>
          <div className={styles.panelHeading}><span>📖</span><div><small>ANTES DE JUGAR</small><h2>Conocé la mesa</h2></div></div>
          <div className={styles.guideCard}><span>📜</span><div><b>Jerarquía activa</b><small>La Espadilla, el Bastillo y los siete bravos ya mandan en la mesa.</small></div><em>ACTIVO</em></div>
          <div className={styles.guideCard}><span>🎓</span><div><b>Aprender a jugar</b><small>Lecciones del Tabernero paso a paso.</small></div><em>PRONTO</em></div>
          <div className={styles.rankGuide}><small>LAS MÁS BRAVAS</small><b>1 Espada</b><b>1 Basto</b><b>7 Espada</b><b>7 Oro</b><span>3 · 2 · 1 falsas · figuras · 7 falsas · 6 · 5 · 4</span></div>
          <blockquote>“En mi mesa gana el que sabe jugar sus cartas.”<cite>— El Tabernero</cite></blockquote>
          <div className={styles.scorePreview}><small>PARTIDA A 30</small><div><span>AVENTURERO</span><b>{score.human}</b></div><div><span>TABERNERO</span><b>{score.bot}</b></div></div>
        </aside>
      </section>

      <footer className={styles.footer}>
        <span>FASE 3 · LOS CANTOS LLEGARON A LA MESA</span>
        <p>Envido, Real Envido, Falta Envido, Truco, Retruco y Vale Cuatro ya están activos.</p>
      </footer>
    </main>
  );
}
