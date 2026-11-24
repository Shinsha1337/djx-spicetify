
  // Native encore_icon_dj_24 vector from Spotify Android app (res/drawable/encore_icon_dj_24.xml)
  const DJ_ICON_PATH_24 = "M11.74 20.997A9 9 0 0 1 3 12.022c.011-4.92 3.754-7.955 6.986-8.417 1.178-.169 1.792.05 2.183.346.438.333.774.894 1.144 1.773.108.256.216.536.332.834.622 1.61 1.444 3.737 3.443 5.239 1.398 1.05 2.026 2.118 2.208 3.066s-.052 1.917-.65 2.827c-1.22 1.858-3.87 3.31-6.71 3.31zm-.05 2q.155.003.31.003c6.076 0 11-4.924 11-11a10.98 10.98 0 0 0-2.47-6.947 11 11 0 0 0-3.61-2.894A10.96 10.96 0 0 0 12 1C5.925 1 1 5.925 1 12v.045c0 5.966 4.762 10.82 10.69 10.951Zm9.213-9.666c-.482-1.123-1.35-2.183-2.614-3.133-1.502-1.128-2.096-2.64-2.726-4.24a43 43 0 0 0-.407-1.01c-.234-.556-.51-1.138-.886-1.66q0.921,0.241 1.754.659a9.04 9.04 0 0 1 4.417 4.92 9.1 9.1 0 0 1 .463 4.464Z";

  const ICONS = {
    send: '<svg width="20" height="20" viewBox="0 0 16 16" fill="#000000" style="color: #000000;"><path d="M8 14.5a.75.75 0 0 1-.75-.75V4.31L4.03 7.53a.75.75 0 0 1-1.06-1.06l4.5-4.5a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06L8.75 4.31v9.44a.75.75 0 0 1-.75.75"/></svg>',
    // The exact 1:1 DJ glyph from the player-bar button, drawn in DJ's accent green: the same
    // variable the active button uses, so the two never drift apart.
    pick: `<svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" style="fill: var(--djx-accent, #19E68C); color: var(--djx-accent, #19E68C);"><path d="${DJ_ICON_PATH_24}"/></svg>`,
    dj: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M7.813 14.497A6.5 6.5 0 0 1 1.5 8.016c.008-3.553 2.71-5.744 5.043-6.078.85-.121 1.288.037 1.564.246.312.238.553.639.822 1.276q.115.277.239.602c.451 1.167 1.05 2.717 2.505 3.81 1.01.76 1.46 1.529 1.592 2.209.13.679-.037 1.375-.468 2.03-.88 1.34-2.793 2.388-4.844 2.388zm-.037 1.5A8 8 0 1 0 0 8.032c0 4.34 3.464 7.87 7.776 7.965m6.666-7.124c-.358-.788-.979-1.532-1.868-2.2-1.082-.813-1.51-1.9-1.967-3.06a31 31 0 0 0-.296-.736 6.3 6.3 0 0 0-.605-1.151 6.53 6.53 0 0 1 4.39 4.01 6.5 6.5 0 0 1 .346 3.137"/></svg>',
    voice: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2.75 2.75 0 0 0-2.75 2.75v4a2.75 2.75 0 0 0 5.5 0v-4A2.75 2.75 0 0 0 8 1M6.75 3.75a1.25 1.25 0 1 1 2.5 0v4a1.25 1.25 0 1 1-2.5 0z"/><path d="M3.5 7.75a.75.75 0 0 0-1.5 0A6 6 0 0 0 7.25 13.7v.8H5.5a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5H8.75v-.8A6 6 0 0 0 14 7.75a.75.75 0 0 0-1.5 0 4.5 4.5 0 0 1-9 0"/></svg>',
    commentary: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 2.5A1.5 1.5 0 0 0 1 4v6.5A1.5 1.5 0 0 0 2.5 12h1.75v2.25a.75.75 0 0 0 1.22.584L9.013 12H13.5a1.5 1.5 0 0 0 1.5-1.5V4a1.5 1.5 0 0 0-1.5-1.5zm0 1.5h11v6.5H8.5l-2.75 2.138V10.5H2.5z"/></svg>',
    play: '<svg role="img" height="14" width="14" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288z"/></svg>',
    stop: '<svg role="img" height="14" width="14" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="3" width="10" height="10" rx="1.5"/></svg>',
    check: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M15.53 2.47a.75.75 0 0 1 0 1.06L4.907 14.153.47 9.716a.75.75 0 0 1 1.06-1.06l3.377 3.376L14.47 2.47a.75.75 0 0 1 1.06 0"/></svg>',
    close: '<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" fill="currentColor"><path d="M2.47 2.47a.75.75 0 0 1 1.06 0L8 6.94l4.47-4.47a.75.75 0 1 1 1.06 1.06L9.06 8l4.47 4.47a.75.75 0 1 1-1.06 1.06L8 9.06l-4.47 4.47a.75.75 0 0 1-1.06-1.06L6.94 8 2.47 3.53a.75.75 0 0 1 0-1.06"/></svg>',
  };

  const STYLE = `
    /* Hide Spotify's native DJ button when it mounts/unmounts, so only our persistent button is shown */
    html .main-nowPlayingBar-extraControls span:has(button:not(#djx-button)[data-testid="dj-button"]),
    html .main-nowPlayingBar-extraControls span:has(button:not(#djx-button)[data-testid="dj-jump-button"]),
    html .main-nowPlayingBar-extraControls span:has(button:not(#djx-button) svg path[d^="M7.813 14.497"]),
    html .main-nowPlayingBar-extraControls button:not(#djx-button):is([data-testid="dj-button"], [data-testid="dj-jump-button"]),
    html .main-nowPlayingBar-extraControls button:not(#djx-button):has(svg path[d^="M7.813 14.497"]) {
      display: none !important;
    }
    /* Persistent DJ button inherits Spotify's native extraControls / Spicy Lyrics hover behaviour */
    #djx-button {
      flex-shrink: 0;
      padding: 0;
      width: 32px;
      height: 32px;
      min-width: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 0;
      color: var(--text-subdued, rgba(var(--spice-rgb-text, 255, 255, 255), 0.7));
      cursor: pointer;
    }
    #djx-button .Wrapper-sm-only {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    #djx-button svg {
      color: inherit;
      fill: currentColor;
      pointer-events: none;
    }
    #djx-button:hover,
    #djx-button:focus-visible {
      color: var(--text-base, var(--spice-text, #ffffff));
    }
    /* While a DJ set is playing the icon carries DJ's own accent green. */
    #djx-button.djx-active,
    #djx-button.djx-active:hover {
      color: var(--djx-accent, #19E68C);
    }
    @keyframes djx-btn-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.45; }
    }
    #djx-button.djx-pending svg {
      animation: djx-btn-pulse 1.1s ease-in-out infinite;
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
      color: color-mix(in srgb, #ffffff 74%, var(--djx-background));
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
      background: color-mix(in srgb, var(--djx-background) 78%, #000000);
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
    /* Native Spotify-styled right-click menu on the DJ button */
    #djx-context-menu {
      position: fixed;
      z-index: 2100;
      min-width: 248px;
      max-width: 300px;
      padding: 4px;
      border-radius: 4px;
      background: var(--background-elevated-base, #282828);
      color: rgba(255, 255, 255, 0.9);
      box-shadow: 0 16px 24px rgba(0, 0, 0, 0.3), 0 6px 8px rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.06);
      font-family: inherit;
    }
    #djx-context-menu ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .djx-ctx-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: 2px;
      background: transparent;
      color: hsla(0, 0%, 100%, 0.9);
      font: inherit;
      font-size: 14px;
      line-height: 20px;
      text-align: left;
      cursor: pointer;
    }
    .djx-ctx-item:hover,
    .djx-ctx-item:focus-visible {
      background: hsla(0, 0%, 100%, 0.1);
      color: #ffffff;
      outline: none;
    }
    .djx-ctx-item svg {
      flex: 0 0 auto;
      color: rgba(255, 255, 255, 0.7);
    }
    .djx-ctx-item:hover svg,
    .djx-ctx-item:focus-visible svg {
      color: #ffffff;
    }
    .djx-ctx-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1 1 auto;
    }
    .djx-ctx-label {
      font-weight: 400;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .djx-ctx-sub {
      font-size: 12px;
      line-height: 16px;
      color: var(--text-subdued, #a7a7a7);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* Modal dialog for Pick your DJ, DJ commentary, and Restart confirmation */
    #djx-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(0, 0, 0, 0);
      transition: background-color 0.16s ease;
    }
    #djx-modal-backdrop.djx-visible {
      background: rgba(0, 0, 0, 0.72);
    }
    #djx-modal {
      position: relative;
      display: flex;
      flex-direction: column;
      width: min(460px, calc(100vw - 32px));
      max-height: min(640px, calc(100vh - 48px));
      border-radius: 8px;
      background: var(--background-elevated-base, #282828);
      color: #ffffff;
      box-shadow: 0 24px 48px rgba(0, 0, 0, 0.55);
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
      font-family: inherit;
      opacity: 0;
      transform: translateY(8px) scale(0.985);
      transition: transform 0.16s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.12s ease;
    }
    #djx-modal-backdrop.djx-visible #djx-modal {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .djx-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 24px 12px;
      flex: 0 0 auto;
    }
    .djx-modal-title {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      line-height: 26px;
      letter-spacing: -0.02em;
      color: #ffffff;
    }
    .djx-modal-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
    }
    .djx-modal-close:hover,
    .djx-modal-close:focus-visible {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      outline: none;
    }
    .djx-modal-subtitle {
      margin: 0;
      padding: 0 24px 14px;
      font-size: 13px;
      line-height: 18px;
      color: var(--text-subdued, #b3b3b3);
      flex: 0 0 auto;
    }
    .djx-modal-body {
      overflow-y: auto;
      padding: 0 12px 20px;
      flex: 1 1 auto;
    }
    .djx-modal-body::-webkit-scrollbar {
      width: 8px;
    }
    .djx-modal-body::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 99px;
    }
    .djx-lang-heading {
      margin: 14px 12px 6px;
      font-size: 14px;
      font-weight: 700;
      line-height: 20px;
      color: #ffffff;
    }
    .djx-lang-group:first-child .djx-lang-heading {
      margin-top: 4px;
    }
    .djx-option-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: 6px;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .djx-option-row:hover,
    .djx-option-row:focus-visible,
    .djx-option-row:has(.djx-option-select:focus-visible) {
      background: rgba(255, 255, 255, 0.08);
      outline: none;
    }
    .djx-preview-btn {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: #ffffff;
      color: #000000;
      cursor: pointer;
      transition: transform 0.1s ease, background 0.12s ease;
    }
    .djx-preview-btn:hover {
      transform: scale(1.06);
    }
    .djx-preview-btn:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 2px;
    }
    .djx-preview-btn:active {
      transform: scale(0.96);
    }
    .djx-preview-btn.djx-playing {
      background: #1ed760;
      color: #000000;
    }
    .djx-option-select {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      text-align: left;
      cursor: pointer;
    }
    .djx-option-select:focus-visible {
      outline: none;
    }
    .djx-option-copy {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1 1 auto;
    }
    .djx-option-title {
      font-size: 15px;
      font-weight: 500;
      line-height: 20px;
      color: #ffffff;
    }
    .djx-option-desc {
      font-size: 13px;
      line-height: 18px;
      color: var(--text-subdued, #b3b3b3);
    }
    .djx-option-check {
      flex: 0 0 auto;
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #1ed760;
      opacity: 0;
    }
    .djx-option-row.djx-selected .djx-option-check {
      opacity: 1;
    }
    #djx-modal.djx-confirm-modal {
      width: min(380px, calc(100vw - 32px));
    }
    .djx-confirm-copy {
      margin: 0;
      padding: 0 24px 20px;
      font-size: 14px;
      line-height: 20px;
      color: var(--text-subdued, #b3b3b3);
    }
    .djx-confirm-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 0 24px 20px;
    }
    .djx-btn-secondary {
      height: 36px;
      padding: 0 18px;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: #ffffff;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .djx-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .djx-btn-secondary:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 2px;
    }
    .djx-btn-primary {
      height: 36px;
      padding: 0 22px;
      border: 0;
      border-radius: 999px;
      background: #ffffff;
      color: #000000;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .djx-btn-primary:hover {
      transform: scale(1.03);
      background: #f0f0f0;
    }
    .djx-btn-primary:focus-visible {
      outline: 2px solid #ffffff;
      outline-offset: 2px;
    }
    @media (prefers-reduced-motion: reduce) {
      #djx-panel, #djx-panel.djx-closing, #djx-button, #djx-button.djx-pending svg,
      #djx-modal-backdrop, #djx-modal, .djx-pick, .djx-suggest, .djx-submit,
      .djx-preview-btn, .djx-btn-primary {
        transition: none !important;
        transform: none !important;
        animation: none !important;
      }
      #djx-panel .djx-bar {
        animation: none !important;
      }
    }
  `;

