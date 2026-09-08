import { SiKick } from "react-icons/si";
import styles from "./truco.module.css";

const Card = ({ number, suit, suitName, red = false }: { number: string; suit: string; suitName: string; red?: boolean }) => (
  <div className={`${styles.card} ${red ? styles.redCard : ""}`} aria-label={`${number} de ${suitName}`}>
    <span className={styles.cardCorner}>{number}<i>{suit}</i></span>
    <strong>{suit}</strong>
    <span className={styles.cardName}>{suitName}</span>
  </div>
);

export default function TrucoPage() {
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
          <div className={styles.comingButton} aria-label="Disponible en la siguiente fase"><span>PREPARAR LA MESA</span><small>PRÓXIMA FASE</small></div>
          <div className={styles.divider}><span>MESAS ONLINE</span></div>
          <p className={styles.muted}>Muy pronto vas a poder invitar aventureros con un código privado.</p>
          <div className={styles.onlineModes} aria-label="Modos online previstos">
            <span>1 VS 1</span><span>2 VS 2</span><span>3 VS 3</span>
          </div>
        </aside>

        <section className={styles.tableChamber} id="mesa" aria-label="Vista previa de la mesa de Truco">
          <div className={styles.lanternGlow} />
          <div className={styles.opponent}>
            <div className={styles.playerPlaque}><span className={styles.avatar}>F</span><div><small>RIVAL</small><b>EL TABERNERO</b></div><strong>0</strong></div>
            <div className={styles.hiddenHand} aria-label="Tres cartas ocultas del Tabernero"><i/><i/><i/></div>
          </div>

          <div className={styles.table}>
            <div className={styles.woodGrain} />
            <div className={styles.tableSeal}><span>F</span><small>LA TABERNA</small></div>
            <div className={styles.deck}><i/><i/><span>MAZO</span></div>
            <div className={styles.tableMessage}><small>LA MESA AGUARDA</small><b>La primera mano está por comenzar</b></div>
          </div>

          <div className={styles.you}>
            <div className={styles.hand}>
              <Card number="7" suit="⚔" suitName="ESPADA" />
              <Card number="1" suit="♣" suitName="BASTO" />
              <Card number="3" suit="●" suitName="ORO" red />
            </div>
            <div className={styles.playerPlaque}><span className={styles.avatar}>♟</span><div><small>VOS</small><b>AVENTURERO</b></div><strong>0</strong></div>
          </div>
        </section>

        <aside className={`${styles.woodPanel} ${styles.guides}`}>
          <div className={styles.panelHeading}><span>📖</span><div><small>ANTES DE JUGAR</small><h2>Conocé la mesa</h2></div></div>
          <div className={styles.guideCard}><span>📜</span><div><b>Libro de Reglas</b><small>Cartas, Envido, Truco y puntaje.</small></div><em>FASE 2</em></div>
          <div className={styles.guideCard}><span>🎓</span><div><b>Aprender a jugar</b><small>Lecciones del Tabernero paso a paso.</small></div><em>PRONTO</em></div>
          <blockquote>“En mi mesa gana el que sabe jugar sus cartas.”<cite>— El Tabernero</cite></blockquote>
          <div className={styles.scorePreview}><small>PARTIDA A 30</small><div><span>AVENTURERO</span><b>0</b></div><div><span>TABERNERO</span><b>0</b></div></div>
        </aside>
      </section>

      <footer className={styles.footer}>
        <span>FASE 1 · LA SALA ESTÁ PREPARADA</span>
        <p>Próximo paso: reglas, mazo español y motor de la primera mano.</p>
      </footer>
    </main>
  );
}
