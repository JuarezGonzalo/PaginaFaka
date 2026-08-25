"use client";

import { useMemo, useState } from "react";
import styles from "./cocteles.module.css";

type Cocktail = {
  name: string;
  category: string;
  glass: string;
  color: string;
  description: string;
  ingredients: string[];
  steps: string[];
  garnish: string;
};

const cocktails: Cocktail[] = [
  { name: "Gin Tonic", category: "Gin", glass: "🍸", color: "#9fcf91", description: "Fresco, cítrico y liviano. Un clásico para empezar la noche.", ingredients: ["50 ml de gin", "150 ml de agua tónica", "Hielo abundante", "1 rodaja de limón"], steps: ["Llená una copa balón con hielo.", "Agregá el gin y remové suavemente.", "Completá lentamente con agua tónica.", "Decorá con la rodaja de limón."], garnish: "Rodaja de limón o piel de pomelo" },
  { name: "Negroni", category: "Gin", glass: "🥃", color: "#b54732", description: "Amargo, intenso y elegante; para aventureros con experiencia.", ingredients: ["30 ml de gin", "30 ml de vermut rosso", "30 ml de Campari", "Hielo"], steps: ["Colocá todos los ingredientes en un vaso mezclador.", "Revolvé con hielo durante 20 segundos.", "Serví en un vaso corto con hielo nuevo."], garnish: "Piel de naranja" },
  { name: "Tom Collins", category: "Gin", glass: "🍹", color: "#d8d17b", description: "Burbujeante y cítrico, ideal para una ronda larga.", ingredients: ["50 ml de gin", "25 ml de jugo de limón", "15 ml de almíbar", "Soda", "Hielo"], steps: ["Agregá gin, limón y almíbar en un vaso alto.", "Llená con hielo.", "Completá con soda y mezclá suavemente."], garnish: "Rodaja de limón" },
  { name: "Fernet con Coca", category: "Fernet", glass: "🥤", color: "#77513d", description: "El ritual argentino que nunca falta en la mesa de la taberna.", ingredients: ["30% de Fernet", "70% de Coca-Cola", "Hielo"], steps: ["Llená un vaso largo con hielo.", "Agregá el Fernet.", "Incliná el vaso y completá lentamente con Coca-Cola.", "Revolvé una sola vez."], garnish: "Sin decoración: va derecho al corazón" },
  { name: "Fernet Menta", category: "Fernet", glass: "🌿", color: "#66814e", description: "Una variante fresca y herbal del brindis cordobés.", ingredients: ["45 ml de Fernet", "120 ml de gaseosa lima-limón", "6 hojas de menta", "Hielo"], steps: ["Golpeá suavemente la menta entre las manos.", "Colocala en un vaso con hielo.", "Sumá el Fernet y completá con gaseosa."], garnish: "Rama de menta" },
  { name: "Destornillador", category: "Vodka", glass: "🍊", color: "#e3a43f", description: "Simple, frutal y confiable como una buena misión secundaria.", ingredients: ["50 ml de vodka", "150 ml de jugo de naranja", "Hielo"], steps: ["Llená un vaso alto con hielo.", "Agregá el vodka.", "Completá con jugo de naranja y mezclá."], garnish: "Media rodaja de naranja" },
  { name: "Moscow Mule", category: "Vodka", glass: "🫗", color: "#9bc7b8", description: "Picante, cítrico y refrescante, servido como manda la tradición.", ingredients: ["50 ml de vodka", "20 ml de jugo de lima", "120 ml de ginger beer", "Hielo"], steps: ["Llená un jarro con hielo.", "Agregá vodka y lima.", "Completá con ginger beer y remové."], garnish: "Gajo de lima" },
  { name: "Old Fashioned", category: "Whisky", glass: "🥃", color: "#c47b34", description: "Corto, serio y con la paciencia de un viejo tabernero.", ingredients: ["60 ml de whisky", "10 ml de almíbar", "2 golpes de bitter", "Hielo grande"], steps: ["Poné el almíbar y el bitter en un vaso corto.", "Agregá whisky y un hielo grande.", "Revolvé durante 20 segundos."], garnish: "Piel de naranja" },
  { name: "Whisky Sour", category: "Whisky", glass: "🍋", color: "#d2b659", description: "Ácido, sedoso y equilibrado: una receta digna del salón principal.", ingredients: ["50 ml de whisky", "25 ml de limón", "20 ml de almíbar", "Clara de huevo opcional", "Hielo"], steps: ["Batí todos los ingredientes sin hielo.", "Agregá hielo y volvé a batir.", "Colá en una copa fría."], garnish: "Gotas de bitter o cereza" },
  { name: "Margarita", category: "Tequila", glass: "🍸", color: "#b9c85a", description: "Ácida y salina, con carácter para abrir cualquier celebración.", ingredients: ["50 ml de tequila", "25 ml de triple sec", "25 ml de lima", "Sal", "Hielo"], steps: ["Escarchá media copa con sal.", "Batí tequila, triple sec y lima con hielo.", "Colá y serví bien frío."], garnish: "Gajo de lima" },
  { name: "Mojito sin alcohol", category: "Otros", glass: "🌱", color: "#63a86d", description: "Toda la frescura del patio de la taberna, sin alcohol.", ingredients: ["1 lima", "10 hojas de menta", "20 ml de almíbar", "Soda", "Hielo picado"], steps: ["Presioná suavemente lima, menta y almíbar.", "Llená con hielo picado.", "Completá con soda y mezclá."], garnish: "Menta fresca" },
  { name: "Ponche de la Taberna", category: "Otros", glass: "🍷", color: "#8f3540", description: "Especial de la casa para compartir historias alrededor del fuego.", ingredients: ["100 ml de jugo de frutos rojos", "50 ml de jugo de naranja", "Soda", "Canela", "Hielo"], steps: ["Mezclá los jugos con hielo.", "Completá con soda.", "Terminá con una pizca de canela."], garnish: "Frutos rojos y naranja" },
];

const categories = ["Gin", "Fernet", "Vodka", "Whisky", "Tequila", "Otros"];

export default function CocktailsPage() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(categories[0]);
  const [selectedName, setSelectedName] = useState(cocktails[0].name);
  const categoryCocktails = useMemo(() => cocktails.filter((item) => item.category === category), [category]);
  const selected = categoryCocktails.find((item) => item.name === selectedName) ?? categoryCocktails[0];
  const currentIndex = categoryCocktails.findIndex((item) => item.name === selected.name);

  function selectCategory(nextCategory: string) {
    const first = cocktails.find((item) => item.category === nextCategory);
    setCategory(nextCategory);
    if (first) setSelectedName(first.name);
  }

  function move(direction: number) {
    const next = (currentIndex + direction + categoryCocktails.length) % categoryCocktails.length;
    setSelectedName(categoryCocktails[next].name);
  }

  return (
    <main className={styles.stage} style={{ "--accent": selected.color } as React.CSSProperties}>
      <header className={styles.header}>
        <a href="/" className={styles.home}>← Volver a la taberna</a>
        <div><span>F</span> LA TABERNA DE FAKA</div>
        <a href="https://kick.com/fakallen" target="_blank" rel="noreferrer" className={styles.kick}>KICK ↗</a>
      </header>

      {!open ? (
        <section className={styles.closedArea}>
          <p className={styles.kicker}>RECETAS, SECRETOS Y VIEJAS HISTORIAS</p>
          <button className={styles.closedBook} onClick={() => setOpen(true)} aria-label="Abrir el Libro de Cócteles">
            <span className={styles.bookRivets} aria-hidden="true">✦</span>
            <span className={styles.bookSeal}>F</span>
            <strong>LIBRO DE<br/>CÓCTELES</strong>
            <small>Recetario del Barman</small>
            <span className={styles.openHint}>HACÉ CLIC PARA ABRIR</span>
          </button>
        </section>
      ) : (
        <section className={styles.library}>
          <div className={styles.titleRow}>
            <div><p className={styles.kicker}>EL RECETARIO DEL BARMAN</p><h1>Libro de Cócteles</h1></div>
            <button onClick={() => setOpen(false)} className={styles.closeBook}>Cerrar libro ×</button>
          </div>

          <nav className={styles.tabs} aria-label="Categorías de cócteles">
            {categories.map((item) => <button key={item} className={item === category ? styles.activeTab : ""} onClick={() => selectCategory(item)}>{item}</button>)}
          </nav>

          <div className={styles.openBook}>
            <aside className={styles.indexPage}>
              <p className={styles.pageLabel}>ÍNDICE · {category.toUpperCase()}</p>
              <h2>Elegí tu trago</h2>
              <div className={styles.recipeList}>
                {categoryCocktails.map((item, index) => (
                  <button key={item.name} className={item.name === selected.name ? styles.activeRecipe : ""} onClick={() => setSelectedName(item.name)}>
                    <span>{String(index + 1).padStart(2, "0")}</span><div><b>{item.name}</b><small>{item.description}</small></div>
                  </button>
                ))}
              </div>
              <div className={styles.bookNote}>“Todo buen relato comienza con una ronda.”</div>
            </aside>

            <article className={styles.recipePage} key={selected.name}>
              <div className={styles.recipeTop}>
                <div><p className={styles.pageLabel}>{selected.category.toUpperCase()} · RECETA {String(currentIndex + 1).padStart(2, "0")}</p><h2>{selected.name}</h2><p className={styles.description}>{selected.description}</p></div>
                <div className={styles.drink} aria-label={`Ilustración de ${selected.name}`}><span>{selected.glass}</span><i /></div>
              </div>
              <div className={styles.recipeColumns}>
                <div><h3>Ingredientes</h3><ul>{selected.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul></div>
                <div><h3>Preparación</h3><ol>{selected.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
              </div>
              <div className={styles.garnish}><span>✦ Toque del barman</span><b>{selected.garnish}</b></div>
              <div className={styles.pageNav}><button onClick={() => move(-1)}>← Anterior</button><span>{currentIndex + 1} / {categoryCocktails.length}</span><button onClick={() => move(1)}>Siguiente →</button></div>
            </article>
          </div>
          <p className={styles.comingSoon}>Este es el primer tomo. Próximamente llegarán más recetas y sugerencias de la comunidad.</p>
        </section>
      )}
    </main>
  );
}
