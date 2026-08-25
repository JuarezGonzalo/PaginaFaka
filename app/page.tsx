const socials = [
  ["TikTok", "https://www.tiktok.com/@fakallen", "♪"],
  ["YouTube", "https://www.youtube.com/@Fakallen", "▶"],
  ["Instagram", "https://www.instagram.com/fakallen.tv/", "◎"],
  ["Twitch", "https://www.twitch.tv/fakallen", "▣"],
];

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="nav wrap" aria-label="Navegación principal">
          <a className="brand" href="#inicio"><span>F</span> LA TABERNA</a>
          <div><a href="#tabernero">El tabernero</a><a href="#carta">La carta</a><a href="/cocteles">Libro de cócteles</a><a href="#horarios">Horarios</a></div>
        </nav>
        <div className="hero-content wrap" id="inicio">
          <p className="eyebrow">✦ Bienvenido, aventurero ✦</p>
          <h1>LA TABERNA<br/><em>DE FAKA</em></h1>
          <p className="tagline">Donde siempre hay una silla libre<br/>para un aventurero.</p>
          <div className="actions">
            <a className="button" style={{ background: "#226d20", borderColor: "#73e51d", color: "#f5ffe9" }} href="https://kick.com/fakallen" target="_blank" rel="noreferrer">K ENTRAR A KICK</a>
            <a className="button discord" href="https://discord.gg/ApcQwgcGPF" target="_blank" rel="noreferrer">☯ UNIRME AL DISCORD</a>
          </div>
          <div className="socials">{socials.map(([name, href, icon]) => <a key={name} href={href} target="_blank" rel="noreferrer"><b>{icon}</b>{name}</a>)}</div>
        </div>
      </section>

      <div className="content wrap">
        <section className="panel intro" id="tabernero">
          <div className="portrait">🍺</div>
          <div><p className="eyebrow">CONOCÉ AL TABERNERO</p><h2>⚔ ¿Quién es Fakallen?</h2><p>Streamer argentino de gaming, clips, cagadas, charlas de taberna y comunidad. Acercate al fuego, tomá algo y quedate: ya sos parte de la taberna.</p></div>
        </section>

        <div className="grid">
          <section className="panel" id="carta"><p className="eyebrow">PARA LA COMUNIDAD</p><h2>📜 Carta de la Taberna</h2><div className="menu"><a href="https://kick.com/fakallen" target="_blank" rel="noreferrer">🍺 <span><b>Trago del día</b><small>Descubrilo en el próximo directo</small></span></a><a href="/cocteles">📖 <span><b>Libro de Cócteles</b><small>Abrí el recetario del barman</small></span></a><a href="mailto:contacto.fakallen@gmail.com">🎁 <span><b>Donaciones y pedidos</b><small>Mandá tu cuervo al tabernero</small></span></a></div></section>
          <section className="panel"><p className="eyebrow">MOMENTOS DE AVENTURA</p><h2>🎬 Clips destacados</h2><div className="clips"><a href="https://www.tiktok.com/@fakallen" target="_blank" rel="noreferrer"><span>▶</span><b>TikTok</b></a><a href="https://www.youtube.com/@Fakallen" target="_blank" rel="noreferrer"><span>▶</span><b>YouTube</b></a><a href="https://kick.com/fakallen" target="_blank" rel="noreferrer"><span>▶</span><b>Kick</b></a></div></section>
        </div>

        <section className="panel schedule" id="horarios"><div className="calendar">▦</div><div><p className="eyebrow">CUANDO CAE LA NOCHE</p><h2>Horarios de stream</h2><p>Abrimos la taberna de noche. Seguime en redes para saber cuándo se encienden las antorchas.</p></div><a className="text-link" href="https://kick.com/fakallen" target="_blank" rel="noreferrer">VER CANAL →</a></section>
        <footer><span>La taberna nunca cierra el corazón.</span><a href="mailto:contacto.fakallen@gmail.com">✉ contacto.fakallen@gmail.com</a><small>© {new Date().getFullYear()} La Taberna de Faka</small></footer>
      </div>
    </main>
  );
}
