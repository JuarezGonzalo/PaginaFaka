"use client";

import { useEffect, useRef, useState } from "react";
import { suitSymbol, type TrucoCard } from "./game-engine";
import { cardHierarchy, chapters, envidoBids, envidoExamples, faltaExamples, pardaExamples, trucoBids } from "./rule-book-content";
import styles from "./rule-book.module.css";

function ExampleCard({ card }: { card: TrucoCard }) {
  return <span className={`${styles.card} ${card.suit === "oro" || card.suit === "copa" ? styles.redCard : ""}`} role="img" aria-label={`${card.rank} de ${card.suit}`}>
    <b aria-hidden="true">{card.rank}</b><strong aria-hidden="true">{suitSymbol[card.suit]}</strong><small aria-hidden="true">{card.suit}</small>
  </span>;
}

function Chapter({ index }: { index: number }) {
  switch (index) {
    case 0: return <>
      <p className={styles.lead}>Tres cartas, una mesa y un poco de coraje. No siempre gana quien tiene la mejor mano.</p>
      <div className={styles.facts}><span><b>1 vs 1</b>Vos y el Tabernero</span><span><b>A 30</b>15 malas + 15 buenas</span><span><b>Sin flor</b>Baraja de 40 cartas</span></div>
      <h3>Tu primera mano, paso a paso</h3>
      <ol className={styles.steps}>
        <li><b>Elegí el nivel y repartí.</b> Recibís tres cartas. El nivel se mantiene hasta terminar la partida.</li>
        <li><b>Mirales los tantos.</b> Antes de tu primera carta, podés cantar Envido si es tu turno. Esa apuesta se cobra por separado.</li>
        <li><b>Jugá una carta.</b> Una carta de cada jugador forma una <em>baza</em>. La de mayor jerarquía gana; iguales en fuerza hacen parda.</li>
        <li><b>Buscá ganar dos bazas.</b> Si hay empates, se aplican las reglas de pardas. Podés cantar Truco para subir el valor de la mano.</li>
        <li><b>Seguí con “Nueva mano”.</b> Se conserva el marcador y se alterna quién empieza. El primero en llegar a 30 gana.</li>
      </ol>
      <aside className={styles.note}><b>El consejo del Tabernero</b><p>El número grande no siempre manda: un 1 de espada le gana a cualquier 12. Consultá la jerarquía antes de largar una brava.</p></aside>
      <p className={styles.finePrint}>Este libro pausa la partida, no la reinicia. Cerrar o recargar la página sí pierde la partida actual: todavía no hay guardado.</p>
    </>;
    case 1: return <>
      <p>De mayor a menor fuerza. Las cartas de una misma fila empatan entre sí, aunque tengan distinto palo.</p>
      <ol className={styles.hierarchy}>
        {cardHierarchy.map((group, i) => <li key={group.title}>
          <span className={styles.rank}>{String(i + 1).padStart(2, "0")}</span>
          <div><b>{group.title}</b>{group.nickname && <small>{group.nickname}</small>}</div>
          <div className={styles.cards}>{group.cards.map(card => <ExampleCard key={card.id} card={card} />)}</div>
        </li>)}
      </ol>
      <aside className={styles.note}>No hay 8 ni 9. Para ganar bazas importa esta jerarquía; para el Envido, se cuentan los tantos de otra manera.</aside>
    </>;
    case 2: return <>
      <p className={styles.lead}>El Envido se juega con las tres cartas que recibiste, incluso si alguna ya está sobre la mesa.</p>
      <h3>Cómo contar tus tantos</h3>
      <p>Con dos del mismo palo, sumás sus valores y agregás 20. Del 1 al 7 cuentan su número; 10, 11 y 12 cuentan cero. Si no repetís palo, usás el mayor valor individual.</p>
      <div className={styles.examples}>{envidoExamples.map(example => <figure key={example.explanation}>
        <div className={styles.exampleHand}><div className={styles.cards}>{example.cards.map(card => <ExampleCard key={card.id} card={card} />)}</div><span className={styles.total}><b>{example.total}</b>tantos</span></div>
        <figcaption>{example.explanation}</figcaption>
      </figure>)}</div>
      <h3>¿Cuánto se apuesta?</h3>
      <div className={styles.tableWrap}><table><caption>Puntos que cobra quien gana el canto</caption><thead><tr><th scope="col">Canto</th><th scope="col">Quiero</th><th scope="col">No quiero</th></tr></thead><tbody>{envidoBids.map(bid => <tr key={bid.label}><th scope="row">{bid.label}</th><td>{bid.accepted}</td><td>{bid.declined}</td></tr>)}</tbody></table></div>
      <p>La columna “No quiero” indica lo que cobra el rival que hizo la última subida. Podés cantar Envido hasta dos veces en la cadena; después de Real Envido, solo se puede subir a Falta Envido.</p>
      <aside className={styles.note}><b>El Envido está primero</b><p>Podés abrirlo en tu primer turno, antes de tirar. También podés responder al primer Truco con Envido mientras siga disponible, aun si ya tiraste tu primera carta. Después se retoma ese Truco pendiente.</p></aside>
      <p>Si igualan los tantos, gana quien es mano. Al aceptar o subir el Truco se cierra la posibilidad de abrir Envido. La Falta tiene su propio cálculo: lo encontrás en “Las reglas de la casa”.</p>
    </>;
    case 3: return <>
      <p className={styles.lead}>El Truco cambia cuánto vale la mano. No cambia la fuerza de las cartas ni se suma como una apuesta aparte.</p>
      <p>Sin cantos, ganar la mano vale <b>1 punto</b>. Si se acepta una subida, pasa a valer 2, 3 o 4.</p>
      <div className={styles.tableWrap}><table><caption>Valor total de la mano, no puntos acumulados</caption><thead><tr><th scope="col">Canto</th><th scope="col">Quiero</th><th scope="col">No quiero</th></tr></thead><tbody>{trucoBids.map(bid => <tr key={bid.label}><th scope="row">{bid.label}</th><td>{bid.accepted}</td><td>{bid.declined}</td></tr>)}</tbody></table></div>
      <h3>Tres maneras de responder</h3>
      <ul className={styles.steps}>
        <li><b>Quiero:</b> aceptás y siguen las cartas. Quien gane la mano cobra el nuevo valor.</li>
        <li><b>No quiero:</b> termina la mano y quien cantó cobra el valor anterior.</li>
        <li><b>Quiero, Retruco / Quiero, Vale Cuatro:</b> aceptás el canto pendiente y lo subís en la misma respuesta.</li>
      </ul>
      <aside className={styles.note}><b>El derecho a subir cambia de lado</b><p>Si vos cantás Truco y el Tabernero acepta, él puede retrucar. No podés subir tu propio canto seguido. Si él canta Retruco, vos podés responder Vale Cuatro.</p></aside>
      <p>Mientras haya un canto pendiente, primero hay que responderlo: las cartas quedan bloqueadas. Los puntos ganados por Envido se conservan aunque después pierdas o rechaces el Truco.</p>
    </>;
    case 4: return <>
      <p><b>Ser mano</b> significa abrir la primera baza. En la primera mano empezás vos; después se alterna en cada reparto. También tenés la ventaja en Envidos empatados y cuando las tres bazas son pardas.</p>
      <p>Normalmente, quien gana una baza sale en la siguiente. En esta mesa, después de una parda sale quien es mano.</p>
      <h3>¿Y si las cartas empatan?</h3>
      <p>Una parda ocurre cuando ambas cartas tienen la misma fuerza. Estos ejemplos muestran quién se lleva la mano:</p>
      <div className={styles.pardas}>{pardaExamples.map(example => <figure key={example.explanation}>
        <div className={styles.tricks}>{example.results.map((result, i) => <span key={i} data-result={result}><small>Baza {i + 1}</small><b>{result === "human" ? "Vos" : result === "bot" ? "Tabernero" : "Parda"}</b></span>)}</div>
        <figcaption>{example.explanation}</figcaption>
      </figure>)}</div>
      <aside className={styles.note}>Ganar primera tiene mucho valor: si cada jugador gana una baza y la tercera empata, la primera decide.</aside>
    </>;
    default: return <>
      <p className={styles.lead}>El Truco tiene variantes. Estas son las que se usan en La Taberna de Faka.</p>
      <h3>Falta Envido: nuestra variante</h3>
      <p>La Falta <b>reemplaza</b> las apuestas anteriores de Envido; no se suma a ellas. Tomamos el puntaje de quien va adelante:</p>
      <ul className={styles.steps}><li><b>Ambos en malas (menos de 15):</b> lo que le falta al puntero para llegar a 15.</li><li><b>Al menos uno en buenas (15 o más):</b> lo que le falta al puntero para llegar a 30.</li></ul>
      <div className={styles.examples}>{faltaExamples.map(example => <figure key={example.human}>
        <div className={styles.scoreExample}><span>Vos <b>{example.human}</b> · Tabernero <b>{example.bot}</b></span><strong>Falta: {example.points}</strong></div><figcaption>{example.explanation}</figcaption>
      </figure>)}</div>
      <p>Si rechazás la Falta, el rival cobra la apuesta anterior de Envido. Si se cantó Falta directamente, sin cantos previos, cobra 1.</p>
      <h3>Ir al mazo</h3>
      <ul className={styles.steps}>
        <li>Entregás el valor aceptado de la mano. Una subida de Truco pendiente todavía no cuenta.</li>
        <li>Antes de tu primera carta, sin cantos y con Envido disponible, entregás <b>1 por la mano y 1 por Envido</b>.</li>
        <li>Si hay Envido pendiente, primero se rechaza ese canto y después se entrega la mano.</li>
        <li>El Envido ya resuelto no se vuelve a cobrar por retirarte.</li>
      </ul>
      <aside className={styles.note}><b>El 30 termina todo</b><p>La partida termina en cuanto alguien llega a 30, incluso si los puntos vienen de un Envido. No hay que esperar a que terminen las cartas.</p></aside>
      <p>El Tabernero solo decide con sus propias cartas, los cantos, el marcador y las cartas visibles. Subir la dificultad no le permite ver tus cartas ocultas.</p>
    </>;
  }
}

export default function RuleBook({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const pageRef = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      dialog.close();
    };
  }, [open]);

  const turnPage = (index: number) => {
    setChapter(index);
    pageRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  return <dialog ref={dialogRef} className={styles.dialog} aria-labelledby="rule-book-title" aria-describedby="rule-book-hint"
    onKeyDown={event => {
      if (event.key !== "Tab") return;
      const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), select:not(:disabled), [tabindex='0']")).filter(element => element.getClientRects().length > 0);
      const first = targets[0];
      const last = targets[targets.length - 1];
      const active = document.activeElement;
      if (!first || !last) return;
      if (event.shiftKey && (active === first || !targets.includes(active as HTMLElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (active === last || !targets.includes(active as HTMLElement))) {
        event.preventDefault(); first.focus();
      }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const r = event.currentTarget.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose();
    }}>
    <header className={styles.header}>
      <div><span className={styles.eyebrow}>LA TABERNA DE FAKA · MANUAL DEL AVENTURERO</span><h2 id="rule-book-title" ref={titleRef} tabIndex={-1}>El libro del Truco</h2><p id="rule-book-hint">La partida queda en pausa mientras leés.</p></div>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar libro de reglas">Cerrar <span aria-hidden="true">×</span></button>
    </header>
    <div className={styles.book}>
      <nav className={styles.index} aria-label="Capítulos del libro"><p>Índice del libro</p>{chapters.map((item, i) => <button key={item.title} type="button" onClick={() => turnPage(i)} aria-current={i === chapter ? "page" : undefined}><span>{String(i + 1).padStart(2, "0")}</span><b>{item.title}</b></button>)}<div className={styles.seal} aria-hidden="true">F</div><small>Los tantos se cantan.<br/>El coraje se demuestra.</small></nav>
      <label className={styles.mobileIndex}>Capítulo<select value={chapter} onChange={event => turnPage(Number(event.target.value))}>{chapters.map((item, i) => <option key={item.title} value={i}>{i + 1}. {item.title}</option>)}</select></label>
      <article className={styles.page} ref={pageRef} aria-labelledby="rule-chapter-title" tabIndex={0}>
        <div key={chapter} className={styles.pageContent}>
          <p className={styles.chapterLabel}>CAPÍTULO {String(chapter + 1).padStart(2, "0")} · {chapters[chapter].subtitle}</p>
          <h3 id="rule-chapter-title" className={styles.chapterTitle}>{chapters[chapter].title}</h3>
          <Chapter index={chapter} />
        </div>
      </article>
    </div>
    <footer className={styles.navigation}>
      <button type="button" onClick={() => turnPage(chapter - 1)} disabled={chapter === 0}>← Anterior</button>
      <span role="status" aria-live="polite">{chapter + 1} / {chapters.length}<span className={styles.srOnly}> · {chapters[chapter].title}</span></span>
      {chapter < chapters.length - 1 ? <button type="button" onClick={() => turnPage(chapter + 1)}>Siguiente →</button> : <button type="button" onClick={onClose}>Volver a la mesa</button>}
    </footer>
  </dialog>;
}
