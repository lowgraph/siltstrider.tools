export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

/** Every unmatched address (the static export's 404.html), in the legal pages' layout. */
export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="legal-page">
      <nav aria-label="Site">
        <a href="/">← Silt Strider</a>
      </nav>
      <h1>Page not found</h1>
      <p>There is nothing at this address. The link may be mistyped, or the page may have moved.</p>
      <p>
        Go to the <a href="/">home page</a>, or straight to a tool: the <a href="/builder">Build Optimizer</a>,
        the <a href="/leveler">Level Simulator</a>, the <a href="/travel">Travel Optimizer</a> or <a href="/alchemy">Alchemy</a>.
      </p>
      <footer>Unofficial fan project. Not affiliated with Bethesda or the mod teams.</footer>
    </main>
  );
}
