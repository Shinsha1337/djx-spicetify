
  // Native encore_icon_dj_24 vector from Spotify Android app (res/drawable/encore_icon_dj_24.xml)
  const DJ_ICON_PATH_24 = "M11.74 20.997A9 9 0 0 1 3 12.022c.011-4.92 3.754-7.955 6.986-8.417 1.178-.169 1.792.05 2.183.346.438.333.774.894 1.144 1.773.108.256.216.536.332.834.622 1.61 1.444 3.737 3.443 5.239 1.398 1.05 2.026 2.118 2.208 3.066s-.052 1.917-.65 2.827c-1.22 1.858-3.87 3.31-6.71 3.31zm-.05 2q.155.003.31.003c6.076 0 11-4.924 11-11a10.98 10.98 0 0 0-2.47-6.947 11 11 0 0 0-3.61-2.894A10.96 10.96 0 0 0 12 1C5.925 1 1 5.925 1 12v.045c0 5.966 4.762 10.82 10.69 10.951Zm9.213-9.666c-.482-1.123-1.35-2.183-2.614-3.133-1.502-1.128-2.096-2.64-2.726-4.24a43 43 0 0 0-.407-1.01c-.234-.556-.51-1.138-.886-1.66q0.921,0.241 1.754.659a9.04 9.04 0 0 1 4.417 4.92 9.1 9.1 0 0 1 .463 4.464Z";

  const ICONS = {
    send: '<svg width="20" height="20" viewBox="0 0 16 16" fill="#000000" style="color: #000000;"><path d="M8 14.5a.75.75 0 0 1-.75-.75V4.31L4.03 7.53a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.31v9.44a.75.75 0 0 1-.75.75"/></svg>',
    // The exact 1:1 DJ glyph from the player-bar button, drawn in DJ's accent green: the same
    // variable the active button uses, so the two never drift apart.
    pick: `<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" style="fill: var(--djx-accent, #19E68C); color: var(--djx-accent, #19E68C);"><path d="${DJ_ICON_PATH_24}"/></svg>`,
    dj: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M7.813 14.497A6.5 6.5 0 0 1 1.5 8.016c.008-3.553 2.71-5.744 5.043-6.078.85-.121 1.288.037 1.564.246.312.238.553.639.822 1.276q.115.277.239.602c.451 1.167 1.05 2.717 2.505 3.81 1.01.76 1.46 1.529 1.592 2.209.13.679-.037 1.375-.468 2.03-.88 1.34-2.793 2.388-4.844 2.388zm-.037 1.5A8 8 0 1 0 0 8.032c0 4.34 3.464 7.87 7.776 7.965m6.666-7.124c-.358-.788-.979-1.532-1.868-2.2-1.082-.813-1.51-1.9-1.967-3.06a31 31 0 0 0-.296-.736 6.3 6.3 0 0 0-.605-1.151 6.53 6.53 0 0 1 4.39 4.01 6.5 6.5 0 0 1 .346 3.137"/></svg>',
  };

  const STYLE = `
    /* Hide Spotify's native DJ button when it mounts/unmounts, so only our persistent button is shown */
    html .main-nowPlayingBar-extraControls span:has(button:is([data-testid="dj-button"], [data-testid="dj-jump-button"], :has(svg path[d^="M7.813 14.497"]))),
    html .main-nowPlayingBar-extraControls button:is([data-testid="dj-button"], [data-testid="dj-jump-button"], :has(svg path[d^="M7.813 14.497"])):not(#djx-button) {
      display: none !important;
    }
    /* Our persistent DJ button, positioned left of the lyrics button with native hover scale */
    #djx-button {
      background: transparent !important;
      border: 0 !important;
      width: 32px !important;
      height: 32px !important;
      min-width: 32px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      border-radius: 50% !important;
      color: #b3b3b3 !important;
      cursor: pointer !important;
      transition: transform 0.15s cubic-bezier(0.3, 0, 0, 1), color 0.15s cubic-bezier(0.3, 0, 0, 1) !important;
      vertical-align: middle !important;
    }
    #djx-button svg {
      color: inherit !important;
      transition: inherit !important;
    }
    #djx-button:hover {
      color: #ffffff !important;
      transform: scale(1.08) !important;
    }
    /* While the sheet is open the icon carries DJ's own accent green. */
    #djx-button.djx-active,
    #djx-button.djx-active:hover {
      color: var(--djx-accent, #19E68C) !important;
    }
    #djx-button:active {
      transform: scale(0.96) !important;
    }
    /* Popup panel with smooth slide-up entrance and fade */
    #djx-panel {
      position: fixed;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      container-type: inline-size;
      width: min(400px, calc(100vw - 32px));
      max-height: calc(100vh - 120px);
      box-sizing: border-box;
      --djx-background: #0a59b8;
      --djx-tray: #0b4692;
      --djx-accent: #19E68C;
      background: var(--djx-background);
      color: #fff;
      font-family: inherit;
      font-weight: 400;
      text-align: left;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 16px 44px rgba(0, 0, 0, 0.45);
      opacity: 0;
      transform: translateY(16px);
      transition: opacity 0.22s cubic-bezier(0, 0, 0.2, 1), transform 0.22s cubic-bezier(0, 0, 0.2, 1);
      pointer-events: none;
    }
    #djx-panel.djx-visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }
    #djx-panel.djx-closing {
      opacity: 0;
      transform: translateY(14px);
      pointer-events: none;
      transition: opacity 0.18s cubic-bezier(0.4, 0, 1, 1), transform 0.18s cubic-bezier(0.4, 0, 1, 1);
    }
    #djx-panel * { box-sizing: border-box; }
    #djx-panel button { font: inherit; color: inherit; border: 0; background: none; cursor: pointer; }
    /* Keyboard focus stays inside the rounded shapes instead of hanging off their edges. */
    #djx-panel button:focus-visible {
      outline: 2px solid rgba(255, 255, 255, 0.92) !important;
      outline-offset: -3px !important;
    }
    /* The white round button needs its ring outside, on the dark tray, to be visible. */
    #djx-panel .djx-submit:focus-visible {
      outline-offset: 2px !important;
    }
    /* The borderless prompt field never draws a ring or a highlight of its own. */
    #djx-panel .djx-input:focus-visible {
      outline: none !important;
    }
    .djx-top {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px 16px 14px;
      min-height: 0;
      /* No overflow here on purpose: any "auto" axis turns the other one auto too, and the
         card row's edge bleed would grow a horizontal scrollbar. */
    }
    /* One line in any language, and it also shrinks with a narrow popup instead of clipping. */
    .djx-hero {
      margin: 0;
      font-size: clamp(12.5px, 3.85cqw, 15px);
      line-height: 1.3;
      letter-spacing: -0.2px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .djx-cards {
      display: flex;
      gap: 12px;
      /* Bleeds to the popup's right edge, exactly like the phone cuts cards at the screen edge.
         No trailing pad: a padded row ends mid-card, which slices a card on the left. */
      width: calc(100% + 16px);
      /* Chrome's scroll anchoring jumps the row to its end when the skeletons are replaced,
         which slices the first card on the left. */
      overflow-anchor: none;
      overflow-x: auto;
      overscroll-behavior-x: contain;
      scrollbar-width: none;
      scroll-behavior: smooth;
      /* Trailing air so the last card rests 16px off the panel edge instead of touching it.
         Card width is chosen so that the end of the scroll is also a card start: no left slice. */
      padding-right: 16px;
    }
    .djx-cards::-webkit-scrollbar {
      display: none;
    }
    /* Measured from the phone: 100x70 pick, 164x70 prompt cards, 12 gap, 8 radius at 360dp.
       Scaled to a 400px popup that is 111x78, 182x78, 12, 9. */
    #djx-panel .djx-pick,
    #djx-panel .djx-suggest,
    #djx-panel .djx-skeleton {
      height: 78px;
      border-radius: 9px;
    }
    /* "Let DJ pick" card in its rounded substrate/tray matching mobile app */
    #djx-panel .djx-pick {
      display: flex;
      flex: 0 0 111px;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px;
      background: rgba(255, 255, 255, 0.1) !important;
      border: 0 !important;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    /* Server-generated prompt ideas: outlined, not filled, exactly like the phone. */
    #djx-panel .djx-suggest {
      display: flex;
      flex: 0 0 178px;
      align-items: center;
      padding: 16px;
      background: transparent !important;
      border: 0 !important;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
      color: #b6ceea;
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      text-align: left;
      overflow: hidden;
      cursor: pointer;
      transition: background 0.15s, box-shadow 0.15s;
    }
    /* Placeholder cards for the moment before the backend answers: two shimmering bars. */
    #djx-panel .djx-skeleton {
      display: flex;
      flex: 0 0 178px;
      flex-direction: column;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
    }
    #djx-panel .djx-bar {
      display: block;
      height: 10px;
      border-radius: 5px;
      background-image: linear-gradient(100deg,
        rgba(255, 255, 255, 0.13) 30%, rgba(255, 255, 255, 0.32) 50%, rgba(255, 255, 255, 0.13) 70%);
      background-size: 220% 100%;
      animation: djx-shimmer 1.5s linear infinite;
    }
    #djx-panel .djx-bar-short {
      width: 62%;
    }
    @keyframes djx-shimmer {
      from { background-position: 150% 0; }
      to { background-position: -50% 0; }
    }
    .djx-pick > span {
      color: #ffffff;
      white-space: nowrap;
      letter-spacing: -0.2px;
    }
    /* Hover is a paint-only change: scaling a card inside the scroll row clips against the
       popup edges and looks broken at any window size. */
    #djx-panel .djx-pick:hover {
      background: rgba(255, 255, 255, 0.16) !important;
    }
    #djx-panel .djx-pick:active {
      background: rgba(255, 255, 255, 0.22) !important;
    }
    #djx-panel .djx-suggest:hover {
      background: rgba(255, 255, 255, 0.05) !important;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.26);
    }
    #djx-panel .djx-suggest:active {
      background: rgba(255, 255, 255, 0.09) !important;
    }
    /* Bottom input substrate tray matching the mobile app */
    .djx-form {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--djx-tray);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .djx-input {
      flex: 1 1 auto;
      min-width: 0;
      height: 38px;
      padding: 0 4px;
      border: 0 !important;
      background: transparent;
      color: #fff;
      font: inherit;
      font-size: 14px;
      outline: none !important;
      box-shadow: none !important;
    }
    .djx-input::placeholder {
      color: rgba(255, 255, 255, 0.65);
    }
    .djx-submit {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      min-width: 38px;
      border-radius: 50%;
      background: #ffffff !important;
      color: #000000 !important;
      cursor: pointer;
      transition: transform 0.12s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .djx-submit svg {
      color: #000000 !important;
      fill: #000000 !important;
    }
    .djx-submit:hover {
      transform: scale(1.06);
    }
    .djx-submit:active {
      transform: scale(0.96);
    }
    @media (prefers-reduced-motion: reduce) {
      #djx-panel, #djx-panel.djx-closing, #djx-button, .djx-pick, .djx-suggest, .djx-submit {
        transition: none !important;
        transform: none !important;
      }
      #djx-panel .djx-bar {
        animation: none !important;
      }
    }
  `;

