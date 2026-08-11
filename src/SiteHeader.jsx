import { useState } from 'react';

const modelItems = [
  { label: 'Rules', href: 'https://policyengine.org/uk/model/rules' },
  { label: 'Data', href: 'https://policyengine.org/uk/model/data' },
  { label: 'Behavioral responses', href: 'https://policyengine.org/uk/model/behavioral' },
];

const aboutItems = [
  { label: 'Team', href: 'https://policyengine.org/uk/team' },
  { label: 'Supporters', href: 'https://policyengine.org/uk/supporters' },
  { label: 'Citations', href: 'https://policyengine.org/uk/citations' },
  { label: 'Events', href: 'https://policyengine.org/uk/events' },
];

const mobileItems = [
  { label: 'Research', href: 'https://policyengine.org/uk/research' },
  ...modelItems,
  { label: 'API', href: 'https://policyengine.org/uk/api' },
  { label: 'Python', href: 'https://policyengine.org/uk/python' },
  ...aboutItems,
  { label: 'Donate', href: 'https://policyengine.org/uk/donate' },
];

function ChevronIcon() {
  return (
    <svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14">
      <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function WorldIcon() {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
      <circle cx="12" cy="12" fill="none" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c2.3 2.4 3.5 5.4 3.5 9s-1.2 6.6-3.5 9c-2.3-2.4-3.5-5.4-3.5-9S9.7 5.4 12 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg aria-hidden="true" height="24" viewBox="0 0 24 24" width="24">
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      )}
    </svg>
  );
}

function Dropdown({ label, items }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="app-header__dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        aria-expanded={open}
        className="app-header__nav-link app-header__dropdown-trigger"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label}
        <ChevronIcon />
      </button>
      {open && (
        <div className="app-header__dropdown-panel">
          <div className="app-header__panel-surface">
            {items.map((item) => (
              <a className="app-header__dropdown-item" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  return (
    <header className="app-header" data-testid="site-header">
      <div className="app-header__inner">
        <div className="app-header__left">
          <a className="app-header__logo" href="https://policyengine.org/uk" aria-label="PolicyEngine UK home">
            <img alt="PolicyEngine" src="./assets/logos/policyengine/white.svg" />
          </a>
          <nav aria-label="PolicyEngine navigation" className="app-header__nav">
            <a className="app-header__nav-link" href="https://policyengine.org/uk/research">Research</a>
            <Dropdown items={modelItems} label="Model" />
            <a className="app-header__nav-link" href="https://policyengine.org/uk/api">API</a>
            <a className="app-header__nav-link" href="https://policyengine.org/uk/python">Python</a>
            <Dropdown items={aboutItems} label="About" />
            <a className="app-header__nav-link" href="https://policyengine.org/uk/donate">Donate</a>
          </nav>
        </div>

        <div className="app-header__controls">
          <div className="app-header__country">
            <button
              aria-expanded={countryOpen}
              className="app-header__country-trigger"
              onClick={() => setCountryOpen((value) => !value)}
              type="button"
            >
              <WorldIcon />
              <span>United Kingdom</span>
              <ChevronIcon />
            </button>
            {countryOpen && (
              <div className="app-header__country-panel">
                <div className="app-header__panel-surface">
                  <a className="app-header__dropdown-item app-header__dropdown-item--active" href="https://policyengine.org/uk">United Kingdom</a>
                  <a className="app-header__dropdown-item" href="https://policyengine.org/us">United States</a>
                </div>
              </div>
            )}
          </div>
          <button
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
            className="app-header__menu-button"
            onClick={() => setMobileOpen((value) => !value)}
            type="button"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>
      {mobileOpen && (
        <nav aria-label="Mobile navigation" className="app-header__mobile-nav">
          {mobileItems.map((item) => (
            <a className="app-header__mobile-link" href={item.href} key={`${item.label}-${item.href}`}>
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
