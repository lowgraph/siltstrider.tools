"use client";
import { useShell } from './shell-context';

/**
 * SiteFooter: Native React implementation of the CRPG site footer.
 * Provides accessible navigation to About and Changelog views.
 */
export default function SiteFooter() {
  let shell = null;
  try {
    shell = useShell();
  } catch {}

  const handleNavigate = (e, view) => {
    if (e && e.preventDefault) e.preventDefault();
    if (shell?.navigate) {
      shell.navigate(view);
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#' + view;
    }
  };

  return (
    <footer className="site-footer">
      <p>
        Unofficial fan project — not affiliated with Bethesda.{" "}
        <a
          href="#about"
          id="link-about-footer"
          onClick={(e) => handleNavigate(e, "about")}
        >
          About &amp; credits
        </a>{" "}
        ·{" "}
        <a
          href="#changelog"
          id="link-changelog-footer"
          onClick={(e) => handleNavigate(e, "changelog")}
        >
          Changelog
        </a>
      </p>
    </footer>
  );
}
