"use client";
import { useEffect, useRef, useState } from 'react';
import { useShell } from './shell-context';

const descriptions = {
  home: 'Pick a planner for this playthrough.',
  challenge: 'Roll a character, a major goal, side tasks, and restrictions.',
  builder: 'Premade sheets and a custom class builder. Optimize gear when you are ready.',
  about: 'About this unofficial fan project.',
  changelog: 'What changed on the site, newest first.',
  enchanting: 'Effects, souls, and named enchanters.',
  spellmaking: 'Magicka, cast chance, and spellmaker gold.',
  alchemy: 'Apparatus, ingredients, and brew numbers.',
  travel: 'Fewest hops between towns.',
  leveler: 'Progression simulator, 5x multiplier training, and health projection.',
  factions: 'Track memberships, rank requirements, promotion eligibility, and inter-faction standing.',
  vault: 'Cloud character storage, OpenMW save ingestion, and build synchronization.'
};

const CALC_VIEWS = ['leveler', 'factions', 'enchanting', 'spellmaking', 'alchemy', 'travel'];
const MORE_VIEWS = ['about', 'changelog'];

// Phone tab bar: the four planners one tap away, everything else behind Menu.
const TAB_ICON = {
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  builder: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" /></>,
  challenge: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" /></>,
  leveler: <><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />
};
const PHONE_TABS = [
  { view: 'home', label: 'Home' },
  { view: 'builder', label: 'Build' },
  { view: 'challenge', label: 'Challenge' },
  { view: 'leveler', label: 'Level' }
];
const TabIcon = ({ name }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {TAB_ICON[name]}
  </svg>
);

export default function SiteHeader({ shell: propShell } = {}) {
  let contextShell = null;
  try { contextShell = useShell(); } catch {}
  const shell = propShell || contextShell;
  if (!shell) throw new Error('Shell required');
  const [open, setOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const root = useRef(null);
  const menu = useRef(null);
  const calcDropdownRef = useRef(null);
  const moreDropdownRef = useRef(null);
  const calcBtnRef = useRef(null);
  const moreBtnRef = useRef(null);
  const calcMenuRef = useRef(null);
  const moreMenuRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setCalcOpen(false);
    setMoreOpen(false);
  }, [shell.view]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.querySelector('.account-bar')?.classList.toggle('drawer-open', open);
      document.querySelector('header')?.classList.toggle('drawer-open', open);
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.querySelector('.account-bar')?.classList.remove('drawer-open');
        document.querySelector('header')?.classList.remove('drawer-open');
      }
    };
  }, [open]);

  useEffect(() => {
    const key = e => {
      if (e.key === 'Escape') {
        if (calcOpen) {
          setCalcOpen(false);
          calcBtnRef.current?.focus();
        } else if (moreOpen) {
          setMoreOpen(false);
          moreBtnRef.current?.focus();
        } else if (open) {
          setOpen(false);
          menu.current?.focus();
        }
      }
    };
    const outside = e => {
      const accountBar = typeof document !== 'undefined' ? document.querySelector('.account-bar') : null;
      if (calcOpen && !calcDropdownRef.current?.contains(e.target)) {
        setCalcOpen(false);
      }
      if (moreOpen && !moreDropdownRef.current?.contains(e.target)) {
        setMoreOpen(false);
      }
      if (open && !root.current?.contains(e.target) && !accountBar?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', key);
    document.addEventListener('click', outside);
    return () => {
      document.removeEventListener('keydown', key);
      document.removeEventListener('click', outside);
    };
  }, [open, calcOpen, moreOpen]);

  const handleDropdownBtnKeyDown = (e, type) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (type === 'calc') {
        setCalcOpen(true);
        setMoreOpen(false);
        setTimeout(() => {
          const items = calcMenuRef.current?.querySelectorAll('[role="menuitem"]');
          if (items?.length) {
            const target = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
            target.focus();
          }
        }, 0);
      } else if (type === 'more') {
        setMoreOpen(true);
        setCalcOpen(false);
        setTimeout(() => {
          const items = moreMenuRef.current?.querySelectorAll('[role="menuitem"]');
          if (items?.length) {
            const target = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
            target.focus();
          }
        }, 0);
      }
    }
  };

  const handleMenuKeyDown = (e, menuRef, btnRef, closeMenu) => {
    if (e.key === 'Tab') {
      closeMenu();
      return;
    }
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || []);
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (idx + 1) % items.length;
      items[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (idx - 1 + items.length) % items.length;
      items[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      btnRef.current?.focus();
    }
  };

  const navigate = (e, view) => {
    e.preventDefault();
    shell.navigate(view);
    setOpen(false);
    setCalcOpen(false);
    setMoreOpen(false);
  };

  // The phone menu opens under the header, so bring it into view when opened from the tab bar.
  const toggleMenuFromTabs = () => {
    if (!open && typeof window !== 'undefined') {
      try {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      } catch {}
    }
    setCalcOpen(false);
    setMoreOpen(false);
    setOpen(!open);
  };
  const onTabView = PHONE_TABS.some(t => t.view === shell.view);

  const isCalcActive = CALC_VIEWS.includes(shell.view);
  const isMoreActive = MORE_VIEWS.includes(shell.view);

  return (
    <div className="topbar" ref={root}>
      <div className="brand">
        <h1><a href="#home" className="brand-home" onClick={e => navigate(e, 'home')}>Silt Strider</a></h1>
        <p className="kicker">siltstrider.tools — Morrowind build planner &amp; challenge run generator<span className="page-sub">{descriptions[shell.view]}</span></p>
      </div>
      <button
        ref={menu}
        type="button"
        className="hamburger"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="react-menu-drawer"
        onClick={() => setOpen(!open)}
      >
        {open ? '✕' : '☰'}
      </button>
      <div className={'header-tools menu-drawer' + (open ? ' open' : '')} id="react-menu-drawer">
        <div className="nav-primary">
          <span className="drawer-label drawer-only">Character Planners</span>
          <button
            type="button"
            id="react-nav-challenge"
            className={'btn' + (shell.view === 'challenge' ? ' on' : '')}
            disabled={!shell.ready}
            aria-current={shell.view === 'challenge' ? 'page' : undefined}
            onClick={e => navigate(e, 'challenge')}
          >
            Challenge Runs
          </button>
          <button
            type="button"
            id="react-nav-build"
            className={'btn' + (shell.view === 'builder' ? ' on' : '')}
            disabled={!shell.ready}
            aria-current={shell.view === 'builder' ? 'page' : undefined}
            onClick={e => navigate(e, 'builder')}
          >
            Build Optimizer
          </button>
          <button
            type="button"
            id="react-nav-vault"
            className={'btn desktop-only' + (shell.view === 'vault' ? ' on' : '')}
            disabled={!shell.ready}
            aria-current={shell.view === 'vault' ? 'page' : undefined}
            onClick={e => navigate(e, 'vault')}
            title="Open Cloud Character Vault"
          >
            Cloud Vault
          </button>
          <button
            type="button"
            id="react-nav-leveler"
            className={'btn drawer-only' + (shell.view === 'leveler' ? ' on' : '')}
            disabled={!shell.ready}
            aria-current={shell.view === 'leveler' ? 'page' : undefined}
            onClick={e => navigate(e, 'leveler')}
          >
            Level Simulator
          </button>
          <button
            type="button"
            id="react-nav-factions"
            className={'btn drawer-only' + (shell.view === 'factions' ? ' on' : '')}
            disabled={!shell.ready}
            aria-current={shell.view === 'factions' ? 'page' : undefined}
            onClick={e => navigate(e, 'factions')}
          >
            Faction Journal
          </button>

          {/* Desktop Dropdowns */}
          <div className="nav-dropdown-wrap desktop-only" ref={calcDropdownRef}>
            <button
              ref={calcBtnRef}
              type="button"
              id="react-btn-dropdown-calc"
              className={'btn nav-dropdown-btn' + (isCalcActive ? ' on' : '')}
              disabled={!shell.ready}
              aria-haspopup="true"
              aria-expanded={calcOpen}
              aria-controls="react-calc-dropdown-menu"
              aria-label="Calculators menu"
              onClick={() => { setCalcOpen(!calcOpen); setMoreOpen(false); }}
              onKeyDown={e => handleDropdownBtnKeyDown(e, 'calc')}
            >
              Calculators <span className="dropdown-caret" aria-hidden="true">{calcOpen ? '▴' : '▾'}</span>
            </button>
            {calcOpen && (
              <div
                ref={calcMenuRef}
                id="react-calc-dropdown-menu"
                className="nav-dropdown-menu"
                role="menu"
                aria-label="Calculators"
                onKeyDown={e => handleMenuKeyDown(e, calcMenuRef, calcBtnRef, () => setCalcOpen(false))}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'leveler' ? ' on' : '')}
                  aria-current={shell.view === 'leveler' ? 'page' : undefined}
                  onClick={e => navigate(e, 'leveler')}
                >
                  Level Simulator
                </button>
                <button
                  type="button"
                  role="menuitem"
                  id="react-desk-factions"
                  className={'dropdown-item' + (shell.view === 'factions' ? ' on' : '')}
                  aria-current={shell.view === 'factions' ? 'page' : undefined}
                  onClick={e => navigate(e, 'factions')}
                >
                  Faction Journal
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'enchanting' ? ' on' : '')}
                  aria-current={shell.view === 'enchanting' ? 'page' : undefined}
                  onClick={e => navigate(e, 'enchanting')}
                >
                  Enchanting
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'spellmaking' ? ' on' : '')}
                  aria-current={shell.view === 'spellmaking' ? 'page' : undefined}
                  onClick={e => navigate(e, 'spellmaking')}
                >
                  Spellmaking
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'alchemy' ? ' on' : '')}
                  aria-current={shell.view === 'alchemy' ? 'page' : undefined}
                  onClick={e => navigate(e, 'alchemy')}
                >
                  Alchemy
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'travel' ? ' on' : '')}
                  aria-current={shell.view === 'travel' ? 'page' : undefined}
                  onClick={e => navigate(e, 'travel')}
                >
                  Travel Optimizer
                </button>
              </div>
            )}
          </div>

          <div className="nav-dropdown-wrap desktop-only" ref={moreDropdownRef}>
            <button
              ref={moreBtnRef}
              type="button"
              id="react-btn-dropdown-more"
              className={'btn nav-dropdown-btn' + (isMoreActive ? ' on' : '')}
              disabled={!shell.ready}
              aria-haspopup="true"
              aria-expanded={moreOpen}
              aria-controls="react-more-dropdown-menu"
              aria-label="More pages menu"
              onClick={() => { setMoreOpen(!moreOpen); setCalcOpen(false); }}
              onKeyDown={e => handleDropdownBtnKeyDown(e, 'more')}
            >
              More <span className="dropdown-caret" aria-hidden="true">{moreOpen ? '▴' : '▾'}</span>
            </button>
            {moreOpen && (
              <div
                ref={moreMenuRef}
                id="react-more-dropdown-menu"
                className="nav-dropdown-menu"
                role="menu"
                aria-label="More pages"
                onKeyDown={e => handleMenuKeyDown(e, moreMenuRef, moreBtnRef, () => setMoreOpen(false))}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'about' ? ' on' : '')}
                  aria-current={shell.view === 'about' ? 'page' : undefined}
                  onClick={e => navigate(e, 'about')}
                >
                  About Silt Strider
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={'dropdown-item' + (shell.view === 'changelog' ? ' on' : '')}
                  aria-current={shell.view === 'changelog' ? 'page' : undefined}
                  onClick={e => navigate(e, 'changelog')}
                >
                  Changelog
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Drawer Sections (< 900px) */}
        <div className="drawer-sections-mobile drawer-only">
          <div className="drawer-group">
            <span className="drawer-label">Calculators</span>
            <div className="drawer-grid grid-2">
              <button
                type="button"
                className={'btn' + (shell.view === 'leveler' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'leveler' ? 'page' : undefined}
                onClick={e => navigate(e, 'leveler')}
              >
                Level Simulator
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'factions' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'factions' ? 'page' : undefined}
                onClick={e => navigate(e, 'factions')}
              >
                Faction Journal
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'enchanting' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'enchanting' ? 'page' : undefined}
                onClick={e => navigate(e, 'enchanting')}
              >
                Enchanting
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'spellmaking' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'spellmaking' ? 'page' : undefined}
                onClick={e => navigate(e, 'spellmaking')}
              >
                Spellmaking
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'alchemy' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'alchemy' ? 'page' : undefined}
                onClick={e => navigate(e, 'alchemy')}
              >
                Alchemy
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'travel' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'travel' ? 'page' : undefined}
                onClick={e => navigate(e, 'travel')}
              >
                Travel
              </button>
            </div>
          </div>

          <div className="drawer-group">
            <span className="drawer-label">Reference &amp; Site</span>
            <div className="drawer-grid grid-3">
              <button
                type="button"
                className={'btn' + (shell.view === 'home' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'home' ? 'page' : undefined}
                onClick={e => navigate(e, 'home')}
              >
                Home
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'about' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'about' ? 'page' : undefined}
                onClick={e => navigate(e, 'about')}
              >
                About
              </button>
              <button
                type="button"
                className={'btn' + (shell.view === 'changelog' ? ' on' : '')}
                disabled={!shell.ready}
                aria-current={shell.view === 'changelog' ? 'page' : undefined}
                onClick={e => navigate(e, 'changelog')}
              >
                Changelog
              </button>
            </div>
          </div>

          <div className="drawer-group">
            <span className="drawer-label">Character Vault</span>
            <button
              type="button"
              id="react-drawer-vault"
              className={'btn w-full' + (shell.view === 'vault' ? ' on' : '')}
              disabled={!shell.ready}
              aria-current={shell.view === 'vault' ? 'page' : undefined}
              onClick={e => navigate(e, 'vault')}
            >
              Cloud Character Vault
            </button>
          </div>
        </div>

        {/* Game World Profile */}
        <div className="nav-secondary world-bar">
          <div className="world-controls">
            <span className="drawer-label">Game World Profile</span>
            <div className="seg" role="group" aria-label="World">
              <button
                type="button"
                className={'seg-btn' + (shell.world === 'vanilla' ? ' on' : '')}
                disabled={!shell.ready}
                aria-pressed={shell.world === 'vanilla'}
                onClick={() => shell.setProfile('vanilla')}
              >
                Vanilla
              </button>
              <button
                type="button"
                className={'seg-btn' + (shell.world === 'tr' ? ' on' : '')}
                id="react-world-tr"
                title="Tamriel Rebuilt"
                disabled={!shell.ready}
                aria-pressed={shell.world === 'tr'}
                onClick={() => shell.setProfile(shell.arce ? 'tr_arce' : 'tr')}
              >
                Tamriel Rebuilt
              </button>
            </div>
            {shell.world === 'tr' && (
              <button
                type="button"
                id="react-arce"
                className={'arce-toggle' + (shell.arce ? ' on' : '')}
                title="ARCE - Extra Races and Classes"
                aria-pressed={shell.arce}
                onClick={() => shell.setProfile(shell.arce ? 'tr' : 'tr_arce')}
              >
                ARCE - Extra Races and Classes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phone tab bar: shown below 900px, styled in globals.css */}
      <nav className="phone-tabs" aria-label="Main">
        {PHONE_TABS.map(tab => (
          <button
            key={tab.view}
            type="button"
            disabled={!shell.ready}
            aria-current={shell.view === tab.view ? 'page' : undefined}
            onClick={e => navigate(e, tab.view)}
          >
            <TabIcon name={tab.view} />
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="react-menu-drawer"
          aria-label={open ? 'Close menu' : 'Open menu: calculators, vault and more'}
          data-section={!open && !onTabView ? 'true' : undefined}
          onClick={toggleMenuFromTabs}
        >
          <TabIcon name={open ? 'close' : 'menu'} />
          <span>{open ? 'Close' : 'Menu'}</span>
        </button>
      </nav>
    </div>
  );
}
