import { useCallback, useEffect, useRef, useState } from 'react';
import { IconChevronDown, IconMenu2, IconWorld, IconX } from '@tabler/icons-react';
import policyEngineLogo from './assets/logos/policyengine/white.svg';

const POLICYENGINE_URL = 'https://policyengine.org';
const POLICYENGINE_LOGO = policyEngineLogo;

// Kept in sync with app-v2's design tokens. Keeping this small token subset
// local lets the standalone article use the production header without taking
// a dependency on the rest of the application source tree.
const colors = {
  primary: {
    500: '#319795',
    600: '#2C7A7B',
    700: '#285E61',
    800: '#234E52',
  },
  text: {
    inverse: '#FFFFFF',
  },
  shadow: {
    light: 'rgba(16, 24, 40, 0.05)',
    medium: 'rgba(16, 24, 40, 0.1)',
  },
};

const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  layout: {
    header: '58px',
  },
};

const typography = {
  fontFamily: {
    primary: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    sm: '14px',
    lg: '18px',
  },
};

const COUNTRIES = [
  { id: 'us', label: 'United States' },
  { id: 'uk', label: 'United Kingdom' },
];

const NAV_ITEM_PADDING_X = 14;
const NAV_UNDERLINE_INSET = 10;
const DROPDOWN_GAP = 10;
const HOVER_OPEN_DELAY_MS = 100;
const HOVER_CLOSE_DELAY_MS = 200;

function getPathname() {
  return typeof window === 'undefined' ? '/uk' : window.location.pathname;
}

function getCountryId(pathname) {
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  return COUNTRIES.some((country) => country.id === firstSegment) ? firstSegment : 'uk';
}

function siteHref(countryId, path = '') {
  return `${POLICYENGINE_URL}/${countryId}${path}`;
}

const navItemStyle = {
  color: colors.text.inverse,
  fontWeight: typography.fontWeight.medium,
  fontSize: '15px',
  fontFamily: typography.fontFamily.primary,
  textDecoration: 'none',
  padding: `8px ${NAV_ITEM_PADDING_X}px`,
  letterSpacing: '0.01em',
  position: 'relative',
};

function NavUnderline({ visible }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `${NAV_UNDERLINE_INSET}px`,
        right: `${NAV_UNDERLINE_INSET}px`,
        bottom: '2px',
        height: '2px',
        borderRadius: '2px',
        backgroundColor: colors.text.inverse,
        transform: visible ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'center',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
      }}
    />
  );
}

function isItemActive(item, pathname) {
  const matches = (href) => {
    const itemPath = new URL(href, POLICYENGINE_URL).pathname;
    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  if (item.hasDropdown && item.dropdownItems) {
    return item.dropdownItems.some((child) => matches(child.href));
  }

  return item.href ? matches(item.href) : false;
}

function DropdownRow({ item, depth, index, visible, onClose }) {
  const isChild = depth > 0;

  return (
    <a
      href={item.href}
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        padding: `${isChild ? 8 : 11}px 16px ${isChild ? 8 : 11}px ${16 + depth * 16}px`,
        borderRadius: '10px',
        textDecoration: 'none',
        fontSize: isChild ? '13px' : '14px',
        fontFamily: typography.fontFamily.primary,
        fontWeight: isChild ? typography.fontWeight.medium : typography.fontWeight.semibold,
        color: isChild ? colors.primary[700] : colors.primary[800],
        transition: `background-color 0.12s ease 0ms, color 0.12s ease 0ms, opacity 0.3s ease ${
          visible ? index * 30 : 0
        }ms`,
        opacity: visible ? 1 : 0,
        lineHeight: '1.3',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.backgroundColor = colors.primary[500];
        event.currentTarget.style.color = colors.text.inverse;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.backgroundColor = 'transparent';
        event.currentTarget.style.color = isChild ? colors.primary[700] : colors.primary[800];
      }}
    >
      {item.label}
    </a>
  );
}

function DropdownPanel({ items, open, onClose }) {
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setContentHeight(0), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open && contentHeight === 0) {
    return null;
  }

  const rows = [];
  for (const item of items) {
    rows.push({ item, depth: 0 });
    for (const child of item.children ?? []) {
      rows.push({ item: child, depth: 1 });
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        paddingTop: `${DROPDOWN_GAP}px`,
        zIndex: 1001,
      }}
    >
      <div
        style={{
          transform: visible ? 'translateY(0)' : 'translateY(-8px)',
          minWidth: '220px',
          overflow: 'hidden',
          maxHeight: visible ? `${contentHeight}px` : '0px',
          opacity: visible ? 1 : 0,
          transition:
            'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))',
          backdropFilter: 'blur(24px) saturate(200%)',
          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
          boxShadow:
            '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
        }}
      >
        <div ref={contentRef} style={{ padding: '8px' }}>
          {rows.map(({ item, depth }, index) => (
            <DropdownRow
              key={`${item.label}-${item.href}`}
              item={item}
              depth={depth}
              index={index}
              visible={visible}
              onClose={onClose}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function NavItem({ setup, active }) {
  const { label, href, hasDropdown, dropdownItems } = setup;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef(null);
  const openTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    if (!dropdownOpen) {
      return undefined;
    }

    function handleClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }

    function handleKey(event) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [dropdownOpen]);

  const handleMouseEnter = () => {
    setHovered(true);
    if (!hasDropdown) {
      return;
    }
    clearTimers();
    openTimerRef.current = setTimeout(() => setDropdownOpen(true), HOVER_OPEN_DELAY_MS);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (!hasDropdown) {
      return;
    }
    clearTimers();
    closeTimerRef.current = setTimeout(() => setDropdownOpen(false), HOVER_CLOSE_DELAY_MS);
  };

  const underlineVisible = active || hovered || dropdownOpen;

  if (hasDropdown && dropdownItems) {
    return (
      <div
        ref={containerRef}
        style={{ position: 'relative' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => setDropdownOpen((previous) => !previous)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
          style={{
            ...navItemStyle,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{label}</span>
          <IconChevronDown
            size={15}
            color={colors.text.inverse}
            style={{
              opacity: 0.7,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
          <NavUnderline visible={underlineVisible} />
        </button>
        <DropdownPanel items={dropdownItems} open={dropdownOpen} onClose={() => setDropdownOpen(false)} />
      </div>
    );
  }

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      style={navItemStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-current={active ? 'page' : undefined}
    >
      {label}
      <NavUnderline visible={underlineVisible} />
    </a>
  );
}

function CountrySelector({ countryId, pathname }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  const handleCountryChange = useCallback(
    (newCountryId) => {
      setOpen(false);
      const pathParts = pathname.split('/').filter(Boolean);
      if (COUNTRIES.some((country) => country.id === pathParts[0])) {
        pathParts[0] = newCountryId;
        window.location.assign(`${POLICYENGINE_URL}/${pathParts.join('/')}`);
      } else {
        window.location.assign(siteHref(newCountryId));
      }
    },
    [pathname],
  );

  useEffect(() => {
    if (open && contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setContentHeight(0), 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Country selector"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '6px',
          transition: 'background-color 0.15s ease',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center',
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <IconWorld size={18} color={colors.text.inverse} />
      </button>

      {(open || contentHeight > 0) && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 999, cursor: 'default' }}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              transform: visible ? 'translateY(0)' : 'translateY(-8px)',
              marginTop: '10px',
              minWidth: '220px',
              overflow: 'hidden',
              maxHeight: visible ? `${contentHeight}px` : '0px',
              opacity: visible ? 1 : 0,
              transition:
                'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.97), rgba(240,249,255,0.95))',
              backdropFilter: 'blur(24px) saturate(200%)',
              WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              boxShadow:
                '0 20px 60px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.06), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
              zIndex: 1001,
            }}
          >
            <div ref={contentRef} style={{ padding: '8px' }}>
              {COUNTRIES.map((country, index) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleCountryChange(country.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    textAlign: 'left',
                    padding: '11px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontFamily: typography.fontFamily.primary,
                    fontWeight:
                      countryId === country.id ? typography.fontWeight.bold : typography.fontWeight.semibold,
                    color: colors.primary[800],
                    transition: `background-color 0.12s ease 0ms, color 0.12s ease 0ms, opacity 0.3s ease ${
                      visible ? index * 50 : 0
                    }ms`,
                    opacity: visible ? 1 : 0,
                    lineHeight: '1.3',
                    letterSpacing: '-0.01em',
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = colors.primary[500];
                    event.currentTarget.style.color = colors.text.inverse;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = 'transparent';
                    event.currentTarget.style.color = colors.primary[800];
                  }}
                >
                  {country.label}
                  {countryId === country.id && (
                    <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.6 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const mobileNavLinkStyle = {
  color: colors.text.inverse,
  textDecoration: 'none',
  fontWeight: typography.fontWeight.medium,
  fontSize: typography.fontSize.sm,
  fontFamily: typography.fontFamily.primary,
  display: 'block',
};

function MobileNavLink({ item, onClose }) {
  return (
    <a href={item.href || '#'} onClick={onClose} style={mobileNavLinkStyle}>
      {item.label}
    </a>
  );
}

function MobileDropdownLink({ item, depth, onClose }) {
  return (
    <a
      href={item.href}
      onClick={onClose}
      style={{
        color: colors.text.inverse,
        textDecoration: 'none',
        fontWeight: typography.fontWeight.normal,
        fontSize: typography.fontSize.sm,
        fontFamily: typography.fontFamily.primary,
        paddingLeft: `${depth * 14}px`,
        opacity: depth > 0 ? 0.85 : 1,
      }}
    >
      {item.label}
    </a>
  );
}

function MobileMenu({ open, onClose, navItems }) {
  return (
    <div
      aria-hidden={!open}
      inert={!open}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        justifyContent: 'flex-end',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: open ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 'min(300px, calc(100vw - 24px))',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          height: '100%',
          backgroundColor: colors.primary[600],
          padding: spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.lg,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              color: colors.text.inverse,
              fontWeight: typography.fontWeight.semibold,
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamily.primary,
            }}
          >
            Menu
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <IconX size={20} color={colors.text.inverse} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}>
          {navItems.map((item) =>
            item.hasDropdown && item.dropdownItems ? (
              <div key={item.label}>
                <span
                  style={{
                    color: colors.text.inverse,
                    fontWeight: typography.fontWeight.medium,
                    fontSize: typography.fontSize.sm,
                    marginBottom: spacing.xs,
                    display: 'block',
                    fontFamily: typography.fontFamily.primary,
                  }}
                >
                  {item.label}
                </span>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.xs,
                    paddingLeft: spacing.md,
                  }}
                >
                  {item.dropdownItems.flatMap((dropdownItem) => [
                    <MobileDropdownLink
                      key={dropdownItem.label}
                      item={dropdownItem}
                      depth={0}
                      onClose={onClose}
                    />,
                    ...(dropdownItem.children ?? []).map((grandchild) => (
                      <MobileDropdownLink
                        key={`${dropdownItem.label}-${grandchild.label}`}
                        item={grandchild}
                        depth={1}
                        onClose={onClose}
                      />
                    )),
                  ])}
                </div>
              </div>
            ) : (
              <MobileNavLink key={item.label} item={item} onClose={onClose} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = getPathname();
  const countryId = getCountryId(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Research', href: siteHref(countryId, '/research'), hasDropdown: false },
    {
      label: 'Model',
      hasDropdown: true,
      dropdownItems: [
        {
          label: 'Rules',
          href: siteHref(countryId, '/model/rules'),
          children: [
            { label: 'Coverage', href: siteHref(countryId, '/model/rules/coverage') },
            { label: 'Parameters', href: siteHref(countryId, '/model/rules/parameters') },
            { label: 'Variables', href: siteHref(countryId, '/model/rules/variables') },
          ],
        },
        {
          label: 'Data',
          href: siteHref(countryId, '/model/data'),
          children: [
            { label: 'Pipeline', href: siteHref(countryId, '/model/data/pipeline') },
            { label: 'Calibration', href: siteHref(countryId, '/model/data/calibration') },
            { label: 'Validation', href: siteHref(countryId, '/model/data/validation') },
          ],
        },
        { label: 'Behavioral responses', href: siteHref(countryId, '/model/behavioral') },
      ],
    },
    { label: 'API', href: siteHref(countryId, '/api'), hasDropdown: false },
    { label: 'Python', href: siteHref(countryId, '/python'), hasDropdown: false },
    {
      label: 'About',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Team', href: siteHref(countryId, '/team') },
        { label: 'Supporters', href: siteHref(countryId, '/supporters') },
        { label: 'Citations', href: siteHref(countryId, '/citations') },
        { label: 'Events', href: siteHref(countryId, '/events') },
      ],
    },
    { label: 'Donate', href: siteHref(countryId, '/donate'), hasDropdown: false },
  ];

  return (
    <header
      className="site-header"
      data-testid="site-header"
      style={{
        position: 'sticky',
        top: 0,
        paddingBlock: spacing.sm,
        paddingInline: 'clamp(16px, 4vw, 32px)',
        height: spacing.layout.header,
        background: `linear-gradient(to right, ${colors.primary[800]}, ${colors.primary[600]})`,
        borderBottom: `0.5px solid ${colors.primary[700]}`,
        boxShadow: `0px 2px 4px -1px ${colors.shadow.light}, 0px 4px 6px -1px ${colors.shadow.medium}`,
        zIndex: 1000,
        fontFamily: typography.fontFamily.primary,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a
            href={siteHref(countryId)}
            aria-label={`PolicyEngine ${countryId.toUpperCase()} home`}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '40px' }}
          >
            <img src={POLICYENGINE_LOGO} alt="PolicyEngine" style={{ height: '24px', width: 'auto' }} />
          </a>

          <nav
            aria-label="PolicyEngine navigation"
            className="site-header__desktop"
            data-testid="desktop-nav"
            style={{ alignItems: 'center', gap: '24px' }}
          >
            {navItems.map((item) => (
              <NavItem key={item.label} setup={item} active={isItemActive(item, pathname)} />
            ))}
          </nav>
        </div>

        <div className="site-header__desktop" style={{ alignItems: 'center' }}>
          <CountrySelector countryId={countryId} pathname={pathname} />
        </div>

        <div className="site-header__mobile" style={{ alignItems: 'center', gap: spacing.md }}>
          <CountrySelector countryId={countryId} pathname={pathname} />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Toggle navigation"
            style={{
              padding: '4px',
              borderRadius: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <IconMenu2 size={24} color={colors.text.inverse} />
          </button>
        </div>
      </div>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} navItems={navItems} />
    </header>
  );
}
