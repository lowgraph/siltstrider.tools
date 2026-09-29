export default function LegalPage({ title, updated = 'September 26, 2026', children }) {
  return (
    <main id="main-content" tabIndex={-1} className="legal-page">
      <nav aria-label="Legal page navigation">
        <a href="/">← Silt Strider</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </nav>
      <h1>{title}</h1>
      <p className="legal-date">Last updated: {updated}</p>
      {children}
      <footer>Unofficial fan project. Not affiliated with Bethesda or the mod teams.</footer>
    </main>
  );
}
