"use client";

import { useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import { SiKick } from "react-icons/si";
import {
  availableEnvidos, availableTruco, calculateEnvido, callLabel, canFold, canPlayCard,
  dealHand, difficulties, envidoLabels, foldPoints, gameReducer, initialGame, isResolving,
  suitSymbol, trucoLabels, type Player, type TrickResult, type TrucoCard,
} from "./game-engine";
import styles from "./truco.module.css";

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
  return <button type="button" className={`${className} ${styles.playableCard}`} onClick={onPlay} disabled={disabled} aria-label={`Jugar ${card.rank} de ${card.suit}`}>{content}</button>;
}

function CardPile({ cards, side }: { cards: TrucoCard[]; side: Player }) {
  return (
    <div className={`${styles.cardPile} ${side === "bot" ? styles.botPile : styles.humanPile}`} aria-label={`Cartas jugadas por ${side === "bot" ? "el Tabernero" : "vos"}`}>
      {cards.map((card, index) => (
        <div className={styles.pileLayer} key={card.id} style={{ left: `${index * 15}px`, top: `${index * 8}px`, transform: `rotate(${side === "bot" ? -7 + index * 5 : 7 - index * 5}deg)`, zIndex: index + 1 }}>
          <Card card={card} played />
        </div>
      ))}
    </div>
  );
}

const resultLabel: Record<TrickResult, string> = { human: "Tuya", bot: "Tabernero", tie: "Parda" };

export default function TrucoPage() {
  const [game, dispatch] = useReducer(gameReducer, undefined, initialGame);
  const tableRef = useRef<HTMLElement>(null);
  const { status, score, played, playedTricks, pendingCall, handWinner, message } = game;

  useEffect(() => {
    if (game.status !== "playing") return;
    if (isResolving(game) && !game.pendingCall) {
      const timer = window.setTimeout(() => dispatch({ type: "resolve-trick", revision: game.revision }), 1100);
      return () => window.clearTimeout(timer);
    }
    if (game.pendingCall?.caller === "human" || (!game.pendingCall && game.turn === "bot")) {
      const timer = window.setTimeout(() => dispatch({ type: "bot-act", revision: game.revision, roll: Math.random() }), 1000);
      return () => window.clearTimeout(timer);
    }
  }, [game]);

  const envidos = availableEnvidos(game, "human");
  const nextTruco = availableTruco(game, "human");
  const responding = pendingCall?.caller === "bot";
  const foldAllowed = canFold(game, "human");
  const fold = foldPoints(game, "human");
  const deal = () => {
    dispatch({ type: "deal", hands: dealHand() });
    if (window.matchMedia("(max-width: 780px)").matches) {
      window.requestAnimationFrame(() => {
        tableRef.current?.focus({ preventScroll: true });
        tableRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
      });
    }
  };
  const responsePoints = pendingCall?.kind === "envido" ? pendingCall.points : pendingCall?.value;
  const refusedPoints = pendingCall?.kind === "envido" ? pendingCall.declinedPoints : game.trucoValue;

  return (
    <main className={styles.stage}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}>← Volver a la taberna</Link>
        <Link href="/" className={styles.brand}><span>F</span><b>LA TABERNA DE FAKA</b></Link>
        <a href="https://kick.com/fakallen" target="_blank" rel="noreferrer" className={styles.kick}><SiKick aria-hidden="true" /> EN VIVO</a>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>SENTATE A LA MESA</p>
        <h1>La Mesa de Truco</h1>
        <p>Barajá, cantá y defendé tu honor. En esta mesa no alcanza con tener buenas cartas.</p>
      </section>

      <section className={styles.room}>
        <aside className={`${styles.woodPanel} ${styles.gameModes}`} id="configuracion">
          <div className={styles.panelHeading}><span>⚔</span><div><small>PRIMER DESAFÍO</small><h2>Contra la Taberna</h2></div></div>
          <div className={styles.modeCard}>
            <span className={styles.modeIcon}>🍺</span>
            <div><b>Desafiar al Tabernero</b><small>Sin flor · 1 vs 1 · A 30 puntos</small></div>
          </div>
          <fieldset className={styles.difficultyPicker} disabled={status === "playing" || status === "hand-over"} aria-describedby="difficulty-description">
            <legend>NIVEL DEL TABERNERO</legend>
            <div className={styles.difficultyOptions}>
              {(["easy", "normal", "hard"] as const).map((level) => (
                <label key={level} className={styles.difficultyOption}>
                  <input type="radio" name="difficulty" value={level} checked={game.difficulty === level} onChange={() => dispatch({ type: "set-difficulty", difficulty: level })} />
                  <span>{difficulties[level].label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <p id="difficulty-description" className={styles.difficultyDescription}>{difficulties[game.difficulty].description}</p>
          {(status === "playing" || status === "hand-over") && <p className={styles.difficultyLock}>Podés cambiar el nivel al terminar la partida.</p>}
          {status === "idle" && <button className={styles.gameButton} onClick={deal}><span>REPARTIR CARTAS</span><small>JUGAR AHORA</small></button>}
        </aside>

        <section ref={tableRef} className={styles.tableChamber} id="mesa" tabIndex={-1} aria-label="Mesa de Truco">
          <div className={styles.lanternGlow} />
          <div className={styles.opponent}>
            <div className={styles.playerPlaque}><span className={styles.avatar}>F</span><div><small>{difficulties[game.difficulty].label.toUpperCase()}{status !== "idle" && game.mano === "bot" ? " · MANO" : ""}</small><b>EL TABERNERO</b></div><strong>{score.bot}</strong></div>
            <div className={styles.hiddenHand} aria-label={`${game.hands.bot.length} cartas ocultas del Tabernero`}>{game.hands.bot.map((card) => <i key={card.id}/>)}</div>
          </div>

          <div className={styles.table}>
            <div className={styles.woodGrain} />
            <div className={styles.tableSeal}><span>F</span><small>LA TABERNA</small></div>
            {status !== "idle" && <div className={styles.stakeBadge}>MANO · {game.trucoValue} {game.trucoValue === 1 ? "PUNTO" : "PUNTOS"}</div>}
            {status === "idle" && <div className={styles.deck}><i/><i/><span>MAZO</span></div>}
            <CardPile cards={[...playedTricks.map((trick) => trick.bot), ...(played.bot ? [played.bot] : [])]} side="bot" />
            <CardPile cards={[...playedTricks.map((trick) => trick.human), ...(played.human ? [played.human] : [])]} side="human" />
          </div>
          <div className={styles.tableMessage} role="status" aria-live="polite"><small>{status === "idle" ? "LA MESA AGUARDA" : status === "match-over" ? "PARTIDA TERMINADA" : handWinner ? "MANO TERMINADA" : `BAZA ${playedTricks.length + 1}`}</small><b>{message}</b></div>

          <div className={styles.you}>
            <div className={styles.hand}>
              {status === "idle" ? (
                <><Card card={{ id: "preview-7", rank: 7, suit: "espada" }} /><Card card={{ id: "preview-1", rank: 1, suit: "basto" }} /><Card card={{ id: "preview-3", rank: 3, suit: "oro" }} /></>
              ) : game.hands.human.map((card) => <Card key={card.id} card={card} onPlay={() => dispatch({ type: "play", player: "human", cardId: card.id })} disabled={!canPlayCard(game, "human")} />)}
            </div>
            <div className={styles.playerPlaque}><span className={styles.avatar}>♟</span><div><small>VOS{status !== "idle" && game.mano === "human" ? " · MANO" : ""}</small><b>AVENTURERO</b></div><strong>{score.human}</strong></div>
          </div>
        </section>

        {status !== "idle" && <section className={`${styles.woodPanel} ${styles.gameControls}`} aria-label="Controles de la partida">
          {status === "hand-over" && <button className={styles.gameButton} onClick={deal}><span>NUEVA MANO</span><small>CONTINUAR LA PARTIDA</small></button>}
          {status === "match-over" && <>
            <button className={styles.gameButton} onClick={deal}><span>REVANCHA</span><small>VOLVER A 0</small></button>
            <a className={styles.changeLevel} href="#configuracion">Elegir otro nivel</a>
          </>}
          {status === "playing" && (
            <>
              <div className={styles.activeBadge}>
                <span>{pendingCall ? callLabel(pendingCall) : "PARTIDA EN CURSO"}</span>
                <small>{pendingCall ? responding ? "EL TABERNERO TE DESAFÍA" : "ESPERANDO RESPUESTA" : isResolving(game) ? "RESOLVIENDO BAZA" : game.turn === "human" ? "TU TURNO" : "TURNO DEL TABERNERO"}</small>
              </div>
              {game.suspendedTruco && <p className={styles.pendingHint}>El Envido está primero. Después se responde el {callLabel(game.suspendedTruco)}.</p>}
              {responding && (
                <div className={styles.responsePanel}>
                  <small>¿ACEPTÁS EL CANTO?</small>
                  <p className={styles.callAmount}>Querido: {responsePoints} · No querido: {refusedPoints}</p>
                  <div>
                    <button onClick={() => dispatch({ type: "respond", player: "human", accepted: true })}>QUIERO</button>
                    <button onClick={() => dispatch({ type: "respond", player: "human", accepted: false })}>NO QUIERO</button>
                  </div>
                </div>
              )}
              <div className={styles.callControls} aria-label="Cantos disponibles">
                <small>{responding ? pendingCall?.kind === "truco" && envidos.length ? "PODÉS SUBIR O CANTAR ENVIDO PRIMERO" : "TAMBIÉN PODÉS SUBIR" : "CANTOS DE LA MANO"}</small>
                {envidos.length > 0 && (
                  <div className={styles.envidoButtons}>
                    {envidos.map((variant) => <button key={variant} onClick={() => dispatch({ type: "envido", player: "human", variant })}>{envidoLabels[variant]}</button>)}
                  </div>
                )}
                {nextTruco && <button className={styles.trucoButton} onClick={() => dispatch({ type: "truco", player: "human" })}>{responding ? "QUIERO, " : ""}{trucoLabels[nextTruco]}</button>}
                {!envidos.length && !nextTruco && <span className={styles.noCalls}>{pendingCall ? responding ? "Respondé el canto para continuar." : "El Tabernero está pensando…" : isResolving(game) ? "Resolviendo la baza…" : game.turn === "human" ? "Jugá una carta para continuar." : "Esperá la jugada del Tabernero."}</span>}
              </div>
              <div className={styles.foldControls}>
                <button className={styles.foldButton} disabled={!foldAllowed} onClick={() => dispatch({ type: "fold", player: "human" })}>IR AL MAZO</button>
                {foldAllowed && <small>El Tabernero suma {fold.truco} por la mano{fold.envido > 0 ? ` y ${fold.envido} por Envido` : ""}. Al llegar a 30 termina la partida.</small>}
              </div>
            </>
          )}
          <div className={styles.trickTrack} aria-label="Resultado de las bazas">
            {[0, 1, 2].map((index) => <span key={index} className={playedTricks[index] ? styles.trickDone : ""}>{playedTricks[index] ? resultLabel[playedTricks[index].result] : `Baza ${index + 1}`}</span>)}
          </div>
        </section>}
        <aside className={`${styles.woodPanel} ${styles.onlineInfo}`} aria-label="Próximos modos online">
          <div className={styles.divider}><span>MESAS ONLINE</span></div>
          <p className={styles.muted}>Muy pronto vas a poder invitar aventureros con un código privado.</p>
          <div className={styles.onlineModes} aria-label="Modos online previstos"><span>1 VS 1</span><span>2 VS 2</span><span>3 VS 3</span></div>
        </aside>

        <aside className={`${styles.woodPanel} ${styles.guides}`}>
          <div className={styles.panelHeading}><span>📖</span><div><small>ANTES DE JUGAR</small><h2>Conocé la mesa</h2></div></div>
          {status !== "idle" && <div className={styles.envidoSummary}><small>TUS TANTOS</small><b>{calculateEnvido(game.initialHands.human)}</b><p>{game.envidoResult ?? "Se cuentan las tres cartas que recibiste, incluso las que ya jugaste."}</p></div>}
          <div className={styles.guideCard}><span>📜</span><div><b>Jerarquía activa</b><small>La Espadilla, el Bastillo y los siete bravos ya mandan en la mesa.</small></div></div>
          <details className={styles.tableRules}>
            <summary>Reglas de esta mesa</summary>
            <p>Sin flor. Partida a 30, con 15 malas y 15 buenas.</p>
            <p>El nivel se elige antes de repartir y se mantiene durante toda la partida. El Tabernero decide con sus cartas, los cantos, el marcador y las cartas visibles de la mesa.</p>
            <p>Envido + Envido: 4. Con Real Envido: 7. Si rechazás una subida, se cobra lo apostado antes de esa subida.</p>
            <p>La Falta reemplaza las apuestas anteriores: si ambos están en malas, vale lo que le falta al puntero para llegar a 15; si alguno está en buenas, para llegar a 30.</p>
            <p>Podés abrir el Envido en tu primer turno antes de tirar, o responder con Envido al primer Truco. Después se retoma el Truco pendiente.</p>
            <p>Ir al mazo entrega el valor aceptado de la mano. Antes de tu primera carta, sin cantos, también entrega 1 por Envido. Si hay un Envido pendiente, se rechaza antes de cerrar la mano.</p>
          </details>
          <div className={styles.rankGuide}><small>LAS MÁS BRAVAS</small><b>1 Espada</b><b>1 Basto</b><b>7 Espada</b><b>7 Oro</b><span>3 · 2 · 1 falsas · figuras · 7 falsas · 6 · 5 · 4</span></div>
          <blockquote>“En mi mesa gana el que sabe jugar sus cartas.”<cite>— El Tabernero</cite></blockquote>
          <div className={styles.scorePreview}><small>PARTIDA A 30</small><div><span>AVENTURERO</span><b>{score.human}</b></div><div><span>TABERNERO</span><b>{score.bot}</b></div></div>
        </aside>
      </section>

      <footer className={styles.footer}><span>LA TABERNA DE FAKA · TRUCO SIN FLOR</span><p>Los tantos se cantan. El coraje se demuestra.</p></footer>
    </main>
  );
}
