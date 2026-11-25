const P = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };

export const Icon = {
  play: () => <svg {...P}><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></svg>,
  pause: () => <svg {...P}><rect x="6.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /><rect x="13.5" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" /></svg>,
  seed: () => <svg {...P}><path d="M12 20v-7M12 13c0-4 3-7 7-7 0 4-3 7-7 7zM12 15c0-3-2.5-5.5-6-5.5 0 3 2.5 5.5 6 5.5z" /></svg>,
  regrow: () => <svg {...P}><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5" /></svg>,
  wave: () => <svg {...P}><path d="M3 12c2-5 4-5 6 0s4 5 6 0 4-5 6 0" /></svg>,
  stack: () => <svg {...P}><path d="M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4" /></svg>,
  download: () => <svg {...P}><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>,
  share: () => <svg {...P}><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" /></svg>,
  zen: () => <svg {...P}><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" /></svg>,
  moon: () => <svg {...P}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>,
  dice: () => <svg {...P}><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="9" cy="9" r="1.2" fill="currentColor" /><circle cx="15" cy="15" r="1.2" fill="currentColor" /><circle cx="15" cy="9" r="1.2" fill="currentColor" /></svg>,
  sliders: () => <svg {...P}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>,
  note: () => <svg {...P}><path d="M9 18V6l10-2v12" /><circle cx="7" cy="18" r="2.5" /><circle cx="17" cy="16" r="2.5" /></svg>,
  close: () => <svg {...P}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  menu: () => <svg {...P}><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  lock: () => <svg {...P}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
  save: () => <svg {...P}><path d="M6 4h10l3 3v13H5V4zM8 4v5h7V4M8 20v-6h8v6" /></svg>,
  eye: () => <svg {...P}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>,
};
