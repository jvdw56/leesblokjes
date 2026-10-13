/**
 * LeesBlokjes - JavaScript
 * Helpt kinderen met dyslexie door teksten op te knippen in rustige, overzichtelijke blokjes.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elementen ---
  const textInput = document.getElementById('text-input');
  const btnConvert = document.getElementById('btn-convert');
  const btnSample = document.getElementById('btn-sample');
  const btnClear = document.getElementById('btn-clear');
  const charCounter = document.getElementById('char-counter');

  const outputArea = document.getElementById('output-area');
  const outputActions = document.getElementById('output-actions');
  const focusTip = document.getElementById('focus-tip');
  const btnReadAll = document.getElementById('btn-read-all');
  const btnStopAudio = document.getElementById('btn-stop-audio');
  const btnCopy = document.getElementById('btn-copy');

  // --- Indeling & Inklapbaar Paneel ---
  const mainLayout = document.getElementById('main-layout');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCloseSidebar = document.getElementById('btn-close-sidebar');

  // --- DOM Elementen voor Persoonlijk Leesprofiel ---
  const profileFont = document.getElementById('profile-font');
  const profileFontSize = document.getElementById('profile-font-size');
  const valFontSize = document.getElementById('val-font-size');
  const profileLineHeight = document.getElementById('profile-line-height');
  const valLineHeight = document.getElementById('val-line-height');
  const themeRadios = document.querySelectorAll('input[name="profile-theme"]');
  const btnResetProfile = document.getElementById('btn-reset-profile');

  // Optie Toggles (Experimentele dyslexiemodus)
  const toggleShowSyllables = document.getElementById('toggle-show-syllables');
  const toggleColorSyllables = document.getElementById('toggle-color-syllables');

  // --- DOM Elementen voor Document Upload ---
  const fileInput = document.getElementById('file-input');
  const uploadDropzone = document.getElementById('upload-dropzone');
  const uploadIdle = document.getElementById('upload-idle');
  const uploadProcessing = document.getElementById('upload-processing');
  const uploadProcessingTitle = document.getElementById('upload-processing-title');
  const uploadSuccess = document.getElementById('upload-success');
  const uploadFileName = document.getElementById('upload-file-name');
  const uploadWordCount = document.getElementById('upload-word-count');
  const btnRemoveDoc = document.getElementById('btn-remove-doc');
  const uploadAlert = document.getElementById('upload-alert');
  const uploadAlertText = document.getElementById('upload-alert-text');
  const btnCloseAlert = document.getElementById('btn-close-alert');

  // --- DOM Elementen voor Webpagina Import & Tabs ---
  const tabBtnDoc = document.getElementById('tab-btn-doc');
  const tabBtnWeb = document.getElementById('tab-btn-web');
  const importPanelDoc = document.getElementById('import-panel-doc');
  const importPanelWeb = document.getElementById('import-panel-web');

  const webUrlInput = document.getElementById('web-url-input');
  const btnClearUrl = document.getElementById('btn-clear-url');
  const btnFetchWebpage = document.getElementById('btn-fetch-webpage');
  const webProcessing = document.getElementById('web-processing');
  const webProcessingTitle = document.getElementById('web-processing-title');
  const webSuccess = document.getElementById('web-success');
  const webSuccessTitle = document.getElementById('web-page-title');
  const webWordCount = document.getElementById('web-word-count');
  const btnRemoveWeb = document.getElementById('btn-remove-web');
  const webAlert = document.getElementById('web-alert');
  const webAlertText = document.getElementById('web-alert-text');
  const btnCloseWebAlert = document.getElementById('btn-close-web-alert');
  const webSuggestions = document.querySelector('.web-suggestions');
  const btnGotoBookmarklet = document.getElementById('btn-goto-bookmarklet');

  // --- DOM Elementen voor Bookmarklet Generator (LeesBlokjes op websites) ---
  const tabBtnBookmarklet = document.getElementById('tab-btn-bookmarklet');
  const importPanelBookmarklet = document.getElementById('import-panel-bookmarklet');
  const btnMakeBookmarklet = document.getElementById('btn-make-bookmarklet');
  const bookmarkletResult = document.getElementById('bookmarklet-result');
  const bookmarkletInstructionText = document.getElementById('bookmarklet-instruction-text');
  const bookmarkletLink = document.getElementById('bookmarklet-link');
  const btnCopyBookmarklet = document.getElementById('btn-copy-bookmarklet');

  // --- DOM Elementen voor Leesmodus Bronvermelding ---
  const sourceBanner = document.getElementById('source-banner');
  const sourceWebsiteName = document.getElementById('source-website-name');
  const sourceTitleDisplay = document.getElementById('source-title-display');
  const sourceUrlDisplay = document.getElementById('source-url-display');
  const btnCloseSource = document.getElementById('btn-close-source');

  // --- Spraaksynthese (Voorlezen) State ---
  let synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let activeSpeechButton = null;

  // --- Toast State ---
  let toastTimeout = null;

  // --- 1. Persoonlijk Leesprofiel Laden, Toepassen & Opslaan ---
  const PROFILE_KEY = 'leesblokjes_leesprofiel';
  const OLD_SETTINGS_KEY = 'leesblokjes_instellingen';

  const FONT_MAP = {
    'Lexend': "'Lexend', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    'OpenDyslexic': "'OpenDyslexic', 'Comic Sans MS', cursive, sans-serif",
    'Atkinson Hyperlegible': "'Atkinson Hyperlegible', system-ui, -apple-system, sans-serif",
    'Verdana': "Verdana, Geneva, Tahoma, sans-serif",
    'Arial': "Arial, Helvetica, sans-serif"
  };

  const DEFAULT_PROFILE = {
    font: 'Lexend',
    fontSize: 20,
    lineHeight: 1.8,
    theme: 'creme',
    showSyllables: true,
    colorSyllables: true
  };

  function applyProfile(profile, updateInputs = true) {
    // 1. Lettertype
    const fontName = FONT_MAP[profile.font] ? profile.font : 'Lexend';
    const fontFamily = FONT_MAP[fontName];
    document.documentElement.style.setProperty('--user-font-family', fontFamily);
    if (updateInputs && profileFont) {
      profileFont.value = fontName;
    }

    // 2. Tekstgrootte (14px - 32px)
    const fontSize = Math.min(32, Math.max(14, Number(profile.fontSize) || 20));
    document.documentElement.style.setProperty('--user-font-size', `${fontSize}px`);
    if (updateInputs && profileFontSize) {
      profileFontSize.value = fontSize;
    }
    if (valFontSize) {
      valFontSize.textContent = `${fontSize} px`;
    }

    // 3. Regelafstand (1.2 - 2.5)
    const rawLineHeight = Number(profile.lineHeight);
    const lineHeight = Math.min(2.5, Math.max(1.2, isNaN(rawLineHeight) ? 1.8 : rawLineHeight));
    const formattedLineHeight = lineHeight.toFixed(1);
    document.documentElement.style.setProperty('--user-line-height', formattedLineHeight);
    if (updateInputs && profileLineHeight) {
      profileLineHeight.value = formattedLineHeight;
    }
    if (valLineHeight) {
      valLineHeight.textContent = `${formattedLineHeight}×`;
    }

    // 4. Achtergrondkleur
    const validThemes = ['creme', 'blauw', 'groen', 'geel', 'donker'];
    const theme = validThemes.includes(profile.theme) ? profile.theme : 'creme';
    document.body.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'donker');
    if (updateInputs) {
      const activeRadio = document.querySelector(`input[name="profile-theme"][value="${theme}"]`);
      if (activeRadio) activeRadio.checked = true;
    }

    // 5. Lettergrepen
    const showSyl = Boolean(profile.showSyllables);
    const colorSyl = Boolean(profile.colorSyllables);
    if (updateInputs && toggleShowSyllables) {
      toggleShowSyllables.checked = showSyl;
    }
    if (updateInputs && toggleColorSyllables) {
      toggleColorSyllables.checked = colorSyl;
    }
    document.body.classList.toggle('show-syllables', showSyl);
    document.body.classList.toggle('color-syllables', colorSyl);
  }

  function getActiveProfileFromUI() {
    const selectedTheme = document.querySelector('input[name="profile-theme"]:checked')?.value || 'creme';
    return {
      font: profileFont ? profileFont.value : 'Lexend',
      fontSize: profileFontSize ? Number(profileFontSize.value) : 20,
      lineHeight: profileLineHeight ? Number(profileLineHeight.value) : 1.8,
      theme: selectedTheme,
      showSyllables: Boolean(toggleShowSyllables?.checked),
      colorSyllables: Boolean(toggleColorSyllables?.checked)
    };
  }

  function saveProfile() {
    try {
      const profile = getActiveProfileFromUI();
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn('Kon leesprofiel niet opslaan in localStorage:', e);
    }
  }

  function loadProfile() {
    try {
      const savedRaw = localStorage.getItem(PROFILE_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        applyProfile({ ...DEFAULT_PROFILE, ...saved }, true);
        return;
      }

      // Migratie van eventuele eerdere instellingen
      const oldRaw = localStorage.getItem(OLD_SETTINGS_KEY);
      if (oldRaw) {
        const old = JSON.parse(oldRaw);
        const migrated = {
          font: old.opendyslexic ? 'OpenDyslexic' : 'Lexend',
          fontSize: old.largeFont ? 24 : 20,
          lineHeight: old.largeSpacing ? 2.2 : 1.8,
          theme: old.darkMode ? 'donker' : 'creme',
          showSyllables: old.showSyllables !== undefined ? old.showSyllables : true,
          colorSyllables: old.colorSyllables !== undefined ? old.colorSyllables : true
        };
        applyProfile(migrated, true);
        saveProfile();
        return;
      }

      // Standaard profiel
      applyProfile(DEFAULT_PROFILE, true);
    } catch (e) {
      console.warn('Kon leesprofiel niet laden:', e);
      applyProfile(DEFAULT_PROFILE, true);
    }
  }

  // --- Event Listeners voor Direct Effect ---
  if (profileFont) {
    profileFont.addEventListener('change', () => {
      const fontName = profileFont.value;
      const fontFamily = FONT_MAP[fontName] || FONT_MAP['Lexend'];
      document.documentElement.style.setProperty('--user-font-family', fontFamily);
      saveProfile();
    });
  }

  if (profileFontSize) {
    profileFontSize.addEventListener('input', () => {
      const fontSize = Number(profileFontSize.value);
      document.documentElement.style.setProperty('--user-font-size', `${fontSize}px`);
      if (valFontSize) valFontSize.textContent = `${fontSize} px`;
      saveProfile();
    });
  }

  if (profileLineHeight) {
    profileLineHeight.addEventListener('input', () => {
      const lineHeight = Number(profileLineHeight.value).toFixed(1);
      document.documentElement.style.setProperty('--user-line-height', lineHeight);
      if (valLineHeight) valLineHeight.textContent = `${lineHeight}×`;
      saveProfile();
    });
  }

  themeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        document.body.setAttribute('data-theme', radio.value);
        document.body.classList.toggle('dark-mode', radio.value === 'donker');
        saveProfile();
      }
    });
  });

  if (btnResetProfile) {
    btnResetProfile.addEventListener('click', () => {
      applyProfile(DEFAULT_PROFILE, true);
      saveProfile();
      if (typeof showToast === 'function') {
        showToast('Standaard leesprofiel hersteld! 🔄');
      }
    });
  }

  if (toggleShowSyllables) {
    toggleShowSyllables.addEventListener('change', () => {
      document.body.classList.toggle('show-syllables', toggleShowSyllables.checked);
      saveProfile();
    });
  }

  if (toggleColorSyllables) {
    toggleColorSyllables.addEventListener('change', () => {
      if (toggleColorSyllables.checked && !toggleShowSyllables.checked) {
        toggleShowSyllables.checked = true;
        document.body.classList.add('show-syllables');
      }
      document.body.classList.toggle('color-syllables', toggleColorSyllables.checked);
      saveProfile();
    });
  }

  loadProfile();

  // --- 2. Inklapbaar Instellingenpaneel (Sidebar) ---
  const SIDEBAR_COLLAPSED_KEY = 'leesblokjes_paneel_ingeklapt';

  function setSidebarCollapsed(collapsed, save = true) {
    if (!mainLayout || !btnToggleSidebar) return;

    mainLayout.classList.toggle('sidebar-collapsed', collapsed);
    btnToggleSidebar.setAttribute('aria-expanded', String(!collapsed));
    btnToggleSidebar.classList.toggle('is-collapsed', collapsed);

    if (collapsed) {
      btnToggleSidebar.innerHTML = `
        <span class="toggle-icon" aria-hidden="true">🎨</span>
        <span class="toggle-text">Instellingen tonen</span>
      `;
      btnToggleSidebar.title = 'Toon de leesinstellingen';
    } else {
      btnToggleSidebar.innerHTML = `
        <span class="toggle-icon" aria-hidden="true">⚙️</span>
        <span class="toggle-text">Instellingen verbergen</span>
      `;
      btnToggleSidebar.title = 'Verberg instellingen voor meer tekstruimte';
    }

    if (save) {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
      } catch (e) {
        console.warn('Kon paneelstatus niet opslaan:', e);
      }
    }
  }

  function loadSidebarState() {
    try {
      const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      // Standaard uitgeklapt bij eerste gebruik (indien saved === null of niet 'true')
      const isCollapsed = saved === 'true';
      setSidebarCollapsed(isCollapsed, false);
    } catch (e) {
      setSidebarCollapsed(false, false);
    }
  }

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      const currentlyCollapsed = mainLayout.classList.contains('sidebar-collapsed');
      const newState = !currentlyCollapsed;
      setSidebarCollapsed(newState, true);
      if (newState && typeof showToast === 'function') {
        showToast('Instellingen verborgen voor meer ruimte. 📖');
      }
    });
  }

  if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener('click', () => {
      setSidebarCollapsed(true, true);
      if (typeof showToast === 'function') {
        showToast('Instellingen verborgen voor meer ruimte. 📖');
      }
    });
  }

  loadSidebarState();

  // --- 3. Tekstinvoer Hulpjes & Woordenteller ---
  function updateCounter() {
    const text = textInput.value.trim();
    if (!text) {
      charCounter.textContent = '0 woorden';
      return;
    }
    const words = text.split(/\s+/).filter(Boolean).length;
    charCounter.textContent = `${words} ${words === 1 ? 'woord' : 'woorden'}`;
  }

  textInput.addEventListener('input', updateCounter);

  // --- 3. Slimme Tekstopdeling in LeesBlokjes ---
  /**
   * Splitst een lange tekst op in hapklare, rustige blokjes.
   * - Splitst eerst op witregels / alinea's
   * - Als een alinea erg lang is (meer dan 3 zinnen of 35 woorden),
   *   wordt deze netjes in kleinere blokjes van 2-3 zinnen geknipt.
   */
  function splitIntoReadingBlocks(rawText) {
    if (!rawText || !rawText.trim()) return [];

    // Normaliseer regeleindes
    const cleaned = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    const rawParagraphs = cleaned.split(/\n\s*\n/);

    const blocks = [];

    rawParagraphs.forEach(para => {
      const trimmedPara = para.replace(/\n+/g, ' ').trim();
      if (!trimmedPara) return;

      // Splits zinnen op (rekening houdend met ., ! en ?)
      // Match zinnen inclusief het leesteken
      const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);

      if (!sentences || sentences.length <= 3) {
        // Korte alinea: mag 1 heel blokje blijven
        blocks.push(trimmedPara);
      } else {
        // Langere alinea: verdeel in blokjes van max 2 à 3 zinnen
        let currentChunk = [];
        let wordCountInChunk = 0;

        sentences.forEach((sentence) => {
          const sTrimmed = sentence.trim();
          if (!sTrimmed) return;

          const wordsInSentence = sTrimmed.split(/\s+/).length;

          // Voeg toe aan huidig blokje, tenzij het te lang wordt
          if (currentChunk.length >= 2 && (currentChunk.length >= 3 || wordCountInChunk + wordsInSentence > 35)) {
            blocks.push(currentChunk.join(' '));
            currentChunk = [sTrimmed];
            wordCountInChunk = wordsInSentence;
          } else {
            currentChunk.push(sTrimmed);
            wordCountInChunk += wordsInSentence;
          }
        });

        if (currentChunk.length > 0) {
          blocks.push(currentChunk.join(' '));
        }
      }
    });

    return blocks;
  }

  // --- 3b. Nederlandse Lettergreep-splitser (Proof of concept) ---
  const VOWEL_COMBOS = [
    'eeuw', 'ieuw',
    'aai', 'ooi', 'oei',
    'aa', 'ee', 'oo', 'uu', 'ie', 'oe', 'ou', 'au', 'ei', 'ui', 'eu', 'ij',
    'a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ë', 'ï', 'ó', 'ò', 'ö', 'ü', 'á', 'à', 'ä'
  ];

  const VALID_ONSETS = new Set([
    'str', 'spr', 'spl', 'sch', 'scr', 'shr',
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kn', 'kr', 'kw',
    'pl', 'pr', 'ps', 'qu', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'ts',
    'tw', 'vl', 'vr', 'wr', 'ch',
    'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z'
  ]);

  function splitDutchSyllables(rawWord) {
    if (!rawWord || rawWord.length < 3) return [rawWord];

    const lower = rawWord.toLowerCase();
    const nuclei = [];
    let i = 0;

    while (i < lower.length) {
      let matchedVowel = null;
      for (const vc of VOWEL_COMBOS) {
        if (lower.startsWith(vc, i)) {
          matchedVowel = vc;
          break;
        }
      }

      if (matchedVowel) {
        nuclei.push({
          start: i,
          end: i + matchedVowel.length,
          text: rawWord.slice(i, i + matchedVowel.length)
        });
        i += matchedVowel.length;
      } else {
        i++;
      }
    }

    if (nuclei.length <= 1) return [rawWord];

    const splitPoints = [];

    for (let k = 0; k < nuclei.length - 1; k++) {
      const currentNucleus = nuclei[k];
      const nextNucleus = nuclei[k + 1];

      const consonantStart = currentNucleus.end;
      const consonantEnd = nextNucleus.start;
      const consonants = lower.slice(consonantStart, consonantEnd);

      if (consonants.length === 0) {
        splitPoints.push(consonantStart);
      } else if (consonants.length === 1) {
        splitPoints.push(consonantStart);
      } else {
        let splitOffset = 1;
        if (consonants === 'ch') {
          splitOffset = 0;
        } else if (consonants === 'ng' || consonants === 'nk') {
          splitOffset = consonants.length;
        } else {
          let bestOnsetLen = 1;
          for (let len = Math.min(3, consonants.length); len >= 1; len--) {
            const candidateOnset = consonants.slice(consonants.length - len);
            if (VALID_ONSETS.has(candidateOnset) && consonants.length - len >= 1) {
              bestOnsetLen = len;
              break;
            }
          }
          splitOffset = consonants.length - bestOnsetLen;
        }

        splitPoints.push(consonantStart + splitOffset);
      }
    }

    const syllables = [];
    let prevIndex = 0;
    for (const pt of splitPoints) {
      if (pt > prevIndex && pt < rawWord.length) {
        syllables.push(rawWord.slice(prevIndex, pt));
        prevIndex = pt;
      }
    }
    if (prevIndex < rawWord.length) {
      syllables.push(rawWord.slice(prevIndex));
    }

    return syllables.length > 0 ? syllables : [rawWord];
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTextWithSyllables(text) {
    if (!text) return '';
    // Match a word (including hyphens/apostrophes) + optional immediately following punctuation, or any non-word chunk
    const regex = /([a-zA-ZÀ-ÿ]+(?:['’-][a-zA-ZÀ-ÿ]+)*)([.,!?:;]*)|([^a-zA-ZÀ-ÿ]+)/g;
    let result = '';
    let match;

    while ((match = regex.exec(text)) !== null) {
      const word = match[1];
      const punct = match[2];
      const nonWord = match[3];

      if (word) {
        const syllables = splitDutchSyllables(word);
        if (syllables.length > 1) {
          const sylSpans = syllables.map((syl, sIdx) => {
            const colorClass = `syl-c${sIdx % 4}`;
            return `<span class="syl ${colorClass}">${escapeHtml(syl)}</span>`;
          }).join('<span class="syl-sep" aria-hidden="true">|</span>');
          const punctSpan = punct ? `<span class="syl-punct">${escapeHtml(punct)}</span>` : '';
          result += `<span class="syl-word">${sylSpans}${punctSpan}</span>`;
        } else {
          result += escapeHtml(word + (punct || ''));
        }
      } else if (nonWord) {
        result += escapeHtml(nonWord);
      }
    }

    return result || escapeHtml(text);
  }

  // --- 4. Blokjes Tonen in de UI ---
  function renderBlocks(blocks) {
    stopSpeaking();
    outputArea.innerHTML = '';

    if (!blocks || blocks.length === 0) {
      renderEmptyState();
      outputActions.style.display = 'none';
      focusTip.style.display = 'none';
      return;
    }

    outputActions.style.display = 'flex';
    focusTip.style.display = 'block';

    blocks.forEach((text, index) => {
      const blockIndex = index + 1;
      const article = document.createElement('article');
      article.className = 'lees-blokje';
      article.setAttribute('tabindex', '0');
      article.setAttribute('role', 'region');
      article.setAttribute('aria-label', `Leesblokje ${blockIndex} van ${blocks.length}`);
      article.dataset.blockIndex = blockIndex;
      article.dataset.originalText = text;

      // Header met badge en voorleesknop
      const header = document.createElement('div');
      header.className = 'blokje-header';

      const badge = document.createElement('span');
      badge.className = 'blokje-badge';
      badge.innerHTML = `🧩 Blokje ${blockIndex}`;

      const actions = document.createElement('div');
      actions.className = 'blokje-actions';

      if ('speechSynthesis' in window) {
        const speakBtn = document.createElement('button');
        speakBtn.type = 'button';
        speakBtn.className = 'btn-speak-block';
        speakBtn.innerHTML = '🔊 Luister';
        speakBtn.setAttribute('title', `Lees blokje ${blockIndex} voor`);

        speakBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Voorkom dat focus-toggle ook triggert
          speakSingleBlock(text, speakBtn, article);
        });

        actions.appendChild(speakBtn);
      }

      header.appendChild(badge);
      header.appendChild(actions);

      // Inhoud (met lettergreep formatting)
      const content = document.createElement('div');
      content.className = 'blokje-content';
      content.innerHTML = formatTextWithSyllables(text);

      article.appendChild(header);
      article.appendChild(content);

      // Klik/Enter actie: Focus-highlight modus (leeslampje)
      function toggleFocus() {
        const isCurrentlyActive = article.classList.contains('active-focus');

        // Reset andere actieve blokjes
        document.querySelectorAll('.lees-blokje.active-focus').forEach(el => {
          el.classList.remove('active-focus');
        });

        if (!isCurrentlyActive) {
          article.classList.add('active-focus');
          outputArea.classList.add('has-focus');
          article.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          outputArea.classList.remove('has-focus');
        }
      }

      article.addEventListener('click', toggleFocus);
      article.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFocus();
        }
      });

      outputArea.appendChild(article);
    });

    // Scroll netjes naar het begin van de uitvoer
    outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderEmptyState() {
    outputArea.classList.remove('has-focus');
    outputArea.innerHTML = `
      <div class="empty-state" id="empty-state">
        <div class="empty-illustration" aria-hidden="true">
          <span class="floating-block fb1">🧩</span>
          <span class="floating-block fb2">📚</span>
          <span class="floating-block fb3">✨</span>
        </div>
        <p class="empty-title">Nog geen blokjes gemaakt</p>
        <p class="empty-text">
          Typ of plak hierboven een tekst en druk op de grote knop <strong>'Maak leesvriendelijk'</strong>.
          We maken er hapklare stukjes van!
        </p>
      </div>
    `;
  }

  // --- 5. Knop "Maak leesvriendelijk" ---
  btnConvert.addEventListener('click', () => {
    const rawText = textInput.value.trim();

    if (!rawText) {
      showToast('Typ of plak eerst een stukje tekst! ✍️');
      textInput.focus();
      return;
    }

    const blocks = splitIntoReadingBlocks(rawText);
    renderBlocks(blocks);
    showToast(`Gelukt! We hebben er ${blocks.length} rustige blokjes van gemaakt. 🌟`);
  });

  // --- 6. Voorbeeldtekst Invoegen ---
  const SAMPLE_TEXT = `Er was eens een klein robotje dat Pip heette. Pip woonde in een gezellige werkplaats vol met glimmende tandwielen, gekleurde draadjes en vrolijk knipperende lampjes. 

Elke ochtend dronk Pip een klein bekertje zonne-energie om goed wakker te worden. Daarna ging hij naar het dak om naar de vogels in de bomen te zwaaien. De vogels zongen altijd een vrolijk deuntje voor hem terug.

Op een dag vond Pip een geheimzinnig kaartje op de grond. Er stond op: 'De schat van het zonnebos'. Pip zette zijn avonturiers-pet op en pakte zijn kompas. Dit werd de spannendste dag van het hele jaar!`;

  btnSample.addEventListener('click', () => {
    textInput.value = SAMPLE_TEXT;
    updateCounter();
    const blocks = splitIntoReadingBlocks(SAMPLE_TEXT);
    renderBlocks(blocks);
    showToast('Voorbeeldverhaal geladen! Veel leesplezier! 🚀');
  });

  // --- 7. Wissen Knop ---
  btnClear.addEventListener('click', () => {
    textInput.value = '';
    updateCounter();
    renderBlocks([]);
    hideSourceInfo();
    setUploadState('idle');
    hideUploadAlert();
    setWebState('idle');
    hideWebAlert();
    if (webUrlInput) webUrlInput.value = '';
    if (btnClearUrl) btnClearUrl.style.display = 'none';
    showToast('Tekst gewist. 🗑️');
    textInput.focus();
  });

  // --- 8. Document Processor & Upload (.docx & .pdf) ---
  /**
   * Modulaire document processor voor het extraheren van tekst uit Word- en PDF-bestanden.
   * Werkt 100% lokaal in het browsergeheugen zonder server of externe API-oproepen.
   * Klaar voor latere uitbreiding met client-side OCR (bijv. Tesseract.js WebAssembly).
   */
  const DocumentProcessor = {
    supportedExtensions: ['docx', 'pdf'],

    /**
     * Extraheert tekst uit een aangeleverd File object (.docx of .pdf).
     * @param {File} file
     * @returns {Promise<{ text: string, wordCount: number, fileName: string, fileType: string, isScannedOrEmpty: boolean }>}
     */
    async extractText(file) {
      if (!file) {
        throw new Error('Geen bestand geselecteerd.');
      }

      const ext = this.getFileExtension(file.name);
      let rawText = '';

      if (ext === 'docx') {
        rawText = await this.extractFromDocx(file);
      } else if (ext === 'pdf') {
        rawText = await this.extractFromPdf(file);
      } else {
        throw new Error(`Het formaat .${ext || 'onbekend'} wordt niet ondersteund. Kies een Word- (.docx) of PDF- (.pdf) bestand.`);
      }

      const cleanText = this.cleanExtractedText(rawText);
      const wordCount = this.countWords(cleanText);
      const isScannedOrEmpty = wordCount === 0;

      return {
        text: cleanText,
        wordCount,
        fileName: file.name,
        fileType: ext,
        isScannedOrEmpty
      };
    },

    getFileExtension(fileName) {
      if (!fileName || !fileName.includes('.')) return '';
      return fileName.split('.').pop().toLowerCase().trim();
    },

    /**
     * Hulpfunctie om een File veilig uit te lezen als ArrayBuffer in elke moderne browser.
     */
    readAsArrayBuffer(file) {
      if (file.arrayBuffer) {
        return file.arrayBuffer();
      }
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    },

    /**
     * Extraheert tekst uit een .docx Word document via Mammoth.js.
     * Mammoth leest de Office Open XML documentstructuur 100% lokaal uit in de browser.
     */
    async extractFromDocx(file) {
      if (typeof window.mammoth === 'undefined') {
        throw new Error('De Word-bibliotheek (Mammoth) kon niet geladen worden. Controleer je internetverbinding of herlaad de pagina.');
      }

      try {
        const arrayBuffer = await this.readAsArrayBuffer(file);
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        return result && typeof result.value === 'string' ? result.value : '';
      } catch (err) {
        console.error('Fout bij extractie van .docx:', err);
        throw new Error('Kon het Word-document niet lezen. Het bestand is mogelijk beschadigd of beveiligd.');
      }
    },

    /**
     * Extraheert tekst uit een tekstgebaseerde PDF met behulp van PDF.js.
     * Itereert door alle pagina's en bouwt per regel en alinea tekst op.
     */
    async extractFromPdf(file) {
      if (typeof window.pdfjsLib === 'undefined') {
        throw new Error('De PDF-bibliotheek (PDF.js) kon niet geladen worden. Controleer je internetverbinding of herlaad de pagina.');
      }

      // Configureer de worker bron voor PDF.js
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      try {
        const arrayBuffer = await this.readAsArrayBuffer(file);
        const loadingTask = window.pdfjsLib.getDocument({
          data: new Uint8Array(arrayBuffer),
          useSystemFonts: true,
          isEvalSupported: false
        });

        const pdf = await loadingTask.promise;
        const pageTexts = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageStr = this.parsePdfTextContent(textContent);
          if (pageStr.trim()) {
            pageTexts.push(pageStr.trim());
          }
        }

        return pageTexts.join('\n\n');
      } catch (err) {
        console.error('Fout bij extractie van .pdf:', err);
        if (err && err.name === 'PasswordException') {
          throw new Error('Dit PDF-bestand is beveiligd met een wachtwoord. Ontgrendel het document eerst.');
        }
        throw new Error('Kon het PDF-document niet lezen. Het bestand is mogelijk beschadigd of beveiligd.');
      }
    },

    /**
     * Converteert losse PDF tekst-items naar nette regels en alinea's op basis van Y-coördinaten en EOL-markers.
     */
    parsePdfTextContent(textContent) {
      if (!textContent || !Array.isArray(textContent.items) || textContent.items.length === 0) {
        return '';
      }

      const items = textContent.items;
      const lines = [];
      let currentLine = '';
      let lastY = null;

      for (const item of items) {
        const str = item.str;
        if (!str && !item.hasEOL) continue;

        const y = item.transform ? Math.round(item.transform[5]) : null;
        const isNewLine = item.hasEOL || (lastY !== null && y !== null && Math.abs(y - lastY) > 6);

        if (isNewLine) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim());
          }
          currentLine = '';
        }

        if (str) {
          if (currentLine && !currentLine.endsWith(' ') && !str.startsWith(' ')) {
            currentLine += ' ';
          }
          currentLine += str;
        }

        if (y !== null) {
          lastY = y;
        }
      }

      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }

      return lines.join('\n');
    },

    /**
     * Maakt geëxtraheerde tekst schoon:
     * - Normaliseert regeleindes naar \n
     * - Verwijdert overtollige spaties binnen regels
     * - Beperkt opeenvolgende witregels tot maximaal 2
     * - Verwijdert storende niet-afdrukbare control characters
     */
    cleanExtractedText(raw) {
      if (!raw) return '';
      return raw
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
        .trim();
    },

    /**
     * Telt betrouwbaar het aantal woorden in een tekst.
     */
    countWords(text) {
      if (!text || !text.trim()) return 0;
      return text.trim().split(/\s+/).filter(Boolean).length;
    },

    /**
     * Extensiepunt voor toekomstige OCR functionaliteit.
     * Gescande PDF's en foto's kunnen in een volgende fase client-side via bijvoorbeeld Tesseract.js (WASM)
     * worden verwerkt zonder dat gegevens ooit een server raken.
     */
    async extractWithOcr(file, onProgress) {
      throw new Error('OCR wordt in een toekomstige versie ondersteund.');
    }
  };

  // Upload UI State Management
  function setUploadState(state, data = {}) {
    if (!uploadIdle || !uploadProcessing || !uploadSuccess) return;

    if (state === 'idle') {
      uploadIdle.style.display = 'flex';
      uploadProcessing.style.display = 'none';
      uploadSuccess.style.display = 'none';
      if (fileInput) fileInput.value = '';
    } else if (state === 'processing') {
      uploadIdle.style.display = 'none';
      uploadProcessing.style.display = 'flex';
      uploadSuccess.style.display = 'none';
      hideUploadAlert();
      if (uploadProcessingTitle) {
        uploadProcessingTitle.textContent = data.title || 'Bezig met document lezen...';
      }
    } else if (state === 'success') {
      uploadIdle.style.display = 'none';
      uploadProcessing.style.display = 'none';
      uploadSuccess.style.display = 'flex';
      hideUploadAlert();
      if (uploadFileName) uploadFileName.textContent = data.fileName || 'Document';
      if (uploadWordCount) {
        const count = data.wordCount || 0;
        uploadWordCount.textContent = `${count} ${count === 1 ? 'woord' : 'woorden'} gevonden`;
      }
    }
  }

  function showUploadAlert(message) {
    if (!uploadAlert || !uploadAlertText) return;
    uploadAlertText.textContent = message;
    uploadAlert.style.display = 'flex';
  }

  function hideUploadAlert() {
    if (!uploadAlert || !uploadAlertText) return;
    uploadAlert.style.display = 'none';
    uploadAlertText.textContent = '';
  }

  /**
   * Verwerkt een geüpload Word- of PDF-bestand:
   * 1. Valideert bestandstype (.docx of .pdf)
   * 2. Toont voortgangsstatus
   * 3. Extraheert tekst lokaal via DocumentProcessor
   * 4. Controleert of tekst gevonden is (of toont OCR-melding)
   * 5. Vult het tekstvak en genereert direct LeesBlokjes
   */
  async function handleFileUpload(file) {
    if (!file) return;

    hideUploadAlert();

    const ext = DocumentProcessor.getFileExtension(file.name);
    if (!DocumentProcessor.supportedExtensions.includes(ext)) {
      showUploadAlert('Alleen Word- (.docx) en PDF-bestanden (.pdf) worden ondersteund. Kies een bestand met de juiste extensie.');
      setUploadState('idle');
      return;
    }

    setUploadState('processing', {
      title: `Bezig met ${file.name} lezen...`
    });

    try {
      const result = await DocumentProcessor.extractText(file);

      // Foutafhandeling: geen tekst gevonden (waarschijnlijk scan of afbeelding)
      if (result.isScannedOrEmpty) {
        setUploadState('idle');
        showUploadAlert('Dit document bevat waarschijnlijk alleen afbeeldingen of een scan. OCR wordt in een toekomstige versie ondersteund.');
        showToast('Geen tekst gevonden in dit document. ⚠️');
        return;
      }

      // Succesvolle extractie: toon successtatus met bestandsnaam en aantal woorden
      setUploadState('success', {
        fileName: result.fileName,
        wordCount: result.wordCount
      });

      // Vul het invoervak
      textInput.value = result.text;
      updateCounter();

      // Voer direct de bestaande LeesBlokjes verwerking uit
      const blocks = splitIntoReadingBlocks(result.text);
      renderBlocks(blocks);

      showToast(`Document succesvol geladen! ${result.wordCount} woorden omgezet naar ${blocks.length} leesblokjes. 📄✨`);
    } catch (err) {
      console.error('Fout bij document upload:', err);
      setUploadState('idle');
      showUploadAlert(err.message || 'Er ging iets mis bij het openen van het document. Probeer het opnieuw.');
      showToast('Kon het document niet inlezen. ⚠️');
    }
  }

  // File input change listener
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });
  }

  // Drag & drop listeners op de dropzone
  if (uploadDropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      uploadDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadDropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      uploadDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!uploadDropzone.contains(e.relatedTarget)) {
          uploadDropzone.classList.remove('drag-over');
        }
      });
    });

    uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadDropzone.classList.remove('drag-over');

      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    // Toetsenbordtoegankelijkheid (Enter of spatie op de dropzone)
    uploadDropzone.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === uploadDropzone) {
        e.preventDefault();
        if (fileInput) fileInput.click();
      }
    });
  }

  // Knoppen voor wissen / ander bestand kiezen / melding sluiten
  if (btnRemoveDoc) {
    btnRemoveDoc.addEventListener('click', () => {
      setUploadState('idle');
      hideUploadAlert();
    });
  }

  if (btnCloseAlert) {
    btnCloseAlert.addEventListener('click', () => {
      hideUploadAlert();
    });
  }

  // --- 9. Inklapbare Importsecties (Accordion: Document, Webpagina, Bookmarklet BETA) ---
  const IMPORT_SECTION_KEY = 'leesblokjes_actieve_import_sectie';
  const LAST_SECTION_KEY = 'leesblokjes_laatste_geopende_sectie';

  const SECTION_CONFIG = {
    doc: {
      btn: tabBtnDoc,
      panel: importPanelDoc,
      item: document.getElementById('accordion-item-doc'),
      indicator: document.getElementById('indicator-doc')
    },
    web: {
      btn: tabBtnWeb,
      panel: importPanelWeb,
      item: document.getElementById('accordion-item-web'),
      indicator: document.getElementById('indicator-web')
    },
    bookmarklet: {
      btn: tabBtnBookmarklet,
      panel: importPanelBookmarklet,
      item: document.getElementById('accordion-item-bookmarklet'),
      indicator: document.getElementById('indicator-bookmarklet')
    }
  };

  /**
   * Bepaalt welke sectie momenteel geopend is ('doc' | 'web' | 'bookmarklet' | 'none').
   */
  function getActiveImportSection() {
    for (const key of ['doc', 'web', 'bookmarklet']) {
      const cfg = SECTION_CONFIG[key];
      if (cfg && cfg.panel && cfg.panel.style.display !== 'none') {
        return key;
      }
    }
    return 'none';
  }

  /**
   * Opent of sluit een importsectie (slechts één tegelijk geopend).
   * @param {'doc'|'web'|'bookmarklet'|'none'} targetSection
   * @param {boolean} [forceOpen=false]
   * @param {boolean} [save=true]
   */
  function toggleImportSection(targetSection, forceOpen = false, save = true) {
    const currentActive = getActiveImportSection();
    let nextActive = targetSection;

    // Als de gebruiker klikt op de sectie die al geopend is (en niet forceOpen), sluiten we die sectie
    if (!forceOpen && currentActive === targetSection) {
      nextActive = 'none';
    }

    // Pas toe op alle secties (slechts één geopend houden)
    for (const [key, cfg] of Object.entries(SECTION_CONFIG)) {
      const isOpen = (key === nextActive);

      if (cfg.btn) {
        cfg.btn.classList.toggle('is-open', isOpen);
        cfg.btn.classList.toggle('is-active', isOpen);
        cfg.btn.setAttribute('aria-expanded', String(isOpen));
      }

      if (cfg.item) {
        cfg.item.classList.toggle('is-expanded', isOpen);
      }

      if (cfg.panel) {
        cfg.panel.style.display = isOpen ? 'block' : 'none';
      }

      if (cfg.indicator) {
        if (isOpen) {
          cfg.indicator.innerHTML = '<span class="accordion-arrow" aria-hidden="true">▼</span> <span class="indicator-text">Klik om in te klappen</span>';
        } else {
          cfg.indicator.innerHTML = '<span class="accordion-arrow" aria-hidden="true">▶</span> <span class="indicator-text">Klik om uit te klappen</span>';
        }
      }
    }

    // Sla toestand op in localStorage
    if (save) {
      try {
        localStorage.setItem(IMPORT_SECTION_KEY, nextActive);
        if (nextActive !== 'none') {
          localStorage.setItem(LAST_SECTION_KEY, nextActive);
        }
      } catch (err) {
        console.warn('Kon actieve importsectie niet opslaan in localStorage:', err);
      }
    }

    return nextActive;
  }

  /**
   * Alias voor compatibiliteit met bestaande code, testen en extensie-koppelingen.
   */
  function switchImportTab(targetTab) {
    if (targetTab === 'doc' || targetTab === 'web' || targetTab === 'bookmarklet') {
      toggleImportSection(targetTab, true, true);
    } else {
      toggleImportSection('none', false, true);
    }
  }

  // Event Listeners voor inklapbare accordions
  if (tabBtnDoc) {
    tabBtnDoc.addEventListener('click', () => toggleImportSection('doc'));
  }
  if (tabBtnWeb) {
    tabBtnWeb.addEventListener('click', () => toggleImportSection('web'));
  }
  if (tabBtnBookmarklet) {
    tabBtnBookmarklet.addEventListener('click', () => toggleImportSection('bookmarklet'));
  }

  /**
   * Laadt toestand bij het openen van de applicatie.
   * Gedrag: bij openen van de website zijn alle drie de secties ingeklapt (default 'none').
   * Alleen het tekstvak is zichtbaar.
   * Indien de gebruiker eerder een sectie heeft geopend en niet heeft ingeklapt,
   * kan de laatste status worden hersteld.
   */
  function loadImportSectionState() {
    try {
      const saved = localStorage.getItem(IMPORT_SECTION_KEY);
      if (saved && saved !== 'none' && SECTION_CONFIG[saved]) {
        toggleImportSection(saved, true, false);
      } else {
        toggleImportSection('none', false, false);
      }
    } catch (err) {
      toggleImportSection('none', false, false);
    }
  }

  loadImportSectionState();

  // --- 10. Webpagina Processor & Import (Wikipedia, Jeugdjournaal, Nu.nl & Educatieve Websites) ---
  /**
   * Modulaire webpagina processor voor het ophalen en extraheren van tekst uit webpagina's.
   * - 100% lokaal in de browser, geen backend, geen betaalde diensten.
   * - Wikipedia: gebruikt de officiële publieke Wikimedia REST API met CORS-ondersteuning.
   * - Algemeen: probeert browser fetch en schoont HTML op met een intelligente DOM parser.
   * - Foutafhandeling: toont de vereiste melding wanneer de browser cross-origin toegang weigert.
   * - Extensie-klaar: communiceert direct met toekomstige browserextensies via window.postMessage en CustomEvents.
   */
  const WebpageProcessor = {
    /**
     * Valideert en normaliseert een ingevoerde link.
     */
    normalizeUrl(rawUrl) {
      if (!rawUrl || !rawUrl.trim()) {
        throw new Error('Voer eerst een geldige link (URL) in.');
      }
      let urlStr = rawUrl.trim();
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'https://' + urlStr;
      }
      try {
        const parsed = new URL(urlStr);
        if (!parsed.hostname || !parsed.hostname.includes('.')) {
          throw new Error('Ongeldige domeinnaam');
        }
        return parsed.href;
      } catch (e) {
        throw new Error('Dit internetadres lijkt niet te kloppen. Controleer de link en probeer het opnieuw.');
      }
    },

    /**
     * Haalt een webpagina op en extraheert de hoofdtekst.
     * @param {string} rawUrl
     * @returns {Promise<{ title: string, text: string, wordCount: number, url: string }>}
     */
    async fetchAndExtract(rawUrl) {
      const url = this.normalizeUrl(rawUrl);

      // 1. Toekomstige Browserextensie Interceptie
      // Wanneer een browserextensie geïnstalleerd is, kan deze CORS-beperkingen omzeilen.
      if (window.__LEESBLOKJES_EXTENSION__ && typeof window.__LEESBLOKJES_EXTENSION__.fetchPage === 'function') {
        try {
          const extResult = await window.__LEESBLOKJES_EXTENSION__.fetchPage(url);
          if (extResult && extResult.text) {
            const wordCount = extResult.text.split(/\s+/).filter(Boolean).length;
            return {
              title: extResult.title || 'Webpagina',
              text: extResult.text,
              wordCount,
              url
            };
          }
        } catch (extErr) {
          console.warn('Browserextensie ophalen mislukt, val terug op browser-fetch:', extErr);
        }
      }

      // 2. Wikipedia: speciale directe afhandeling via de officiële Wikimedia REST API met CORS-ondersteuning
      const wikiMatch = url.match(/https?:\/\/([a-z0-9_-]+)\.wikipedia\.org\/wiki\/([^#?]+)/i);
      if (wikiMatch) {
        return await this.fetchWikipedia(wikiMatch[1], decodeURIComponent(wikiMatch[2]), url);
      }

      // 3. Directe Browser Fetch (werkt voor sites met open CORS, educatieve platforms, en lokale servers)
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP fout: ${response.status}`);
        }

        const html = await response.text();
        const extracted = this.extractMainContent(html, url);

        if (!extracted.text || extracted.wordCount < 10) {
          throw new Error('Geen bruikbare hoofdtekst gevonden op deze webpagina.');
        }

        return {
          title: extracted.title,
          text: extracted.text,
          wordCount: extracted.wordCount,
          url
        };
      } catch (err) {
        // Indien toegang door CORS geweigerd wordt (zoals standaard bij nieuwssites zonder extensie)
        console.warn('Webpagina fetch geblokkeerd of niet direct toegankelijk:', err);
        const accessError = new Error(
          'Deze website laat geen directe toegang toe.\nKopieer de tekst handmatig of gebruik in een latere versie de browserextensie.'
        );
        accessError.isDirectAccessBlocked = true;
        throw accessError;
      }
    },

    /**
     * Haalt een Wikipedia-artikel op via de officiële MediaWiki REST API (volledig CORS-open).
     */
    async fetchWikipedia(lang, title, originalUrl) {
      const cleanTitle = title.replace(/_/g, ' ');
      const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title.replace(/ /g, '_'))}`;

      try {
        const res = await fetch(apiUrl);
        if (!res.ok) {
          throw new Error(`Wikipedia artikel niet gevonden (status: ${res.status}).`);
        }
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Verwijder overbodige elementen (tabellen, referenties, bewerkingslinks, categoriekaders)
        const toRemove = doc.querySelectorAll('style, script, link, .mw-ref, .mw-editsection, table, figure, .navbox, .infobox, .hatnote, .ambox, .metadata');
        toRemove.forEach(el => el.remove());

        const elements = doc.querySelectorAll('p, h2, h3');
        const paragraphs = [];

        elements.forEach(el => {
          const text = el.textContent.replace(/\s+/g, ' ').trim();
          if (!text) return;
          const tag = el.tagName.toLowerCase();
          if (tag === 'h2' || tag === 'h3') {
            // Sla typische Wikipedia slotsecties over
            if (/^(zie ook|bronnen|referenties|literatuur|externe links|noten|voetnoten|bibliografie)/i.test(text)) {
              return;
            }
            paragraphs.push(`\n### ${text}\n`);
          } else if (text.length > 20) {
            paragraphs.push(text);
          }
        });

        const fullText = paragraphs.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
        const words = fullText.split(/\s+/).filter(Boolean).length;

        if (words < 10) {
          throw new Error('Dit Wikipedia-artikel bevat te weinig tekst.');
        }

        return {
          title: cleanTitle + ' (Wikipedia)',
          text: fullText,
          wordCount: words,
          url: originalUrl
        };
      } catch (err) {
        console.warn('Wikipedia ophalen mislukt:', err);
        throw new Error(
          'Deze website laat geen directe toegang toe.\nKopieer de tekst handmatig of gebruik in een latere versie de browserextensie.'
        );
      }
    },

    /**
     * Extraheert de hoofdtekst uit HTML met behulp van DOMParser.
     */
    extractMainContent(html, url) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Verwijder storende niet-content elementen
      const removeSelectors = [
        'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
        'nav', 'header', 'footer', 'aside', 'form', 'button', 'dialog',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
        '.nav', '.navbar', '.menu', '.sidebar', '.footer', '.advertisement', '.ad',
        '.social-share', '.social-buttons', '.share-buttons', '.cookie-banner', '.cookie-notice',
        '.comments', '#comments', '.related-articles', '.related-posts'
      ];
      removeSelectors.forEach(sel => {
        doc.querySelectorAll(sel).forEach(el => el.remove());
      });

      // Paginatitel achterhalen
      let pageTitle = '';
      const h1 = doc.querySelector('h1');
      if (h1 && h1.textContent.trim()) {
        pageTitle = h1.textContent.trim();
      } else if (doc.title) {
        pageTitle = doc.title.split(/[-–|]/)[0].trim();
      }

      // Zoek naar hoofdcontent containers (geschikt voor nieuws & educatieve artikelen)
      const contentSelectors = [
        'article',
        '[itemprop="articleBody"]',
        '.article-body',
        '.article__body',
        '.article-content',
        '.post-content',
        '.entry-content',
        'main',
        '[role="main"]',
        '.content',
        '#content'
      ];

      let container = null;
      for (const sel of contentSelectors) {
        const el = doc.querySelector(sel);
        if (el && el.textContent.trim().length > 100) {
          container = el;
          break;
        }
      }
      if (!container) container = doc.body;

      const elements = container.querySelectorAll('h1, h2, h3, p, li, blockquote');
      const paragraphs = [];

      elements.forEach(el => {
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;
        const tag = el.tagName.toLowerCase();
        if (tag.startsWith('h')) {
          if (text.length >= 3 && text.length <= 120) {
            paragraphs.push(text);
          }
        } else if (tag === 'li') {
          if (text.length >= 20) {
            paragraphs.push('• ' + text);
          }
        } else {
          if (text.length >= 20) {
            paragraphs.push(text);
          }
        }
      });

      let fullText = paragraphs.join('\n\n').trim();
      if (!fullText || fullText.split(/\s+/).length < 20) {
        fullText = (container.innerText || container.textContent || '')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/[^\S\n]+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      }

      const wordCount = fullText.split(/\s+/).filter(Boolean).length;

      return {
        title: pageTitle || 'Webpagina',
        text: fullText,
        wordCount
      };
    }
  };

  // Web Import UI State Management
  function setWebState(state, data = {}) {
    if (!webProcessing || !webSuccess) return;

    if (state === 'idle') {
      webProcessing.style.display = 'none';
      webSuccess.style.display = 'none';
    } else if (state === 'processing') {
      webProcessing.style.display = 'flex';
      webSuccess.style.display = 'none';
      hideWebAlert();
      if (webProcessingTitle) {
        webProcessingTitle.textContent = data.title || 'Bezig met pagina ophalen...';
      }
    } else if (state === 'success') {
      webProcessing.style.display = 'none';
      webSuccess.style.display = 'flex';
      hideWebAlert();
      if (webSuccessTitle) webSuccessTitle.textContent = data.title || 'Webpagina';
      if (webWordCount) {
        const count = data.wordCount || 0;
        webWordCount.textContent = `${count} ${count === 1 ? 'woord' : 'woorden'} gevonden`;
      }
    }
  }

  function showWebAlert(message) {
    if (!webAlert || !webAlertText) return;
    webAlertText.textContent = message;
    webAlert.style.display = 'flex';
  }

  function hideWebAlert() {
    if (!webAlert || !webAlertText) return;
    webAlert.style.display = 'none';
    webAlertText.textContent = '';
  }

  /**
   * Verwerkt het ophalen van een webpagina:
   * 1. Valideert URL
   * 2. Toont voortgangsindicator
   * 3. Haalt pagina op via WebpageProcessor
   * 4. Indien succesvol: plaatst tekst in tekstvak en voert direct LeesBlokjes verwerking uit
   * 5. Indien niet succesvol: toont de vereiste foutmelding
   */
  async function handleWebImport(rawUrl) {
    const url = (rawUrl || (webUrlInput ? webUrlInput.value : '')).trim();

    hideWebAlert();

    if (!url) {
      showWebAlert('Voer eerst een link (URL) in van een webpagina.');
      if (webUrlInput) webUrlInput.focus();
      return;
    }

    setWebState('processing', {
      title: 'Bezig met webpagina ophalen...'
    });

    try {
      const result = await WebpageProcessor.fetchAndExtract(url);

      // Succesvolle extractie
      setWebState('success', {
        title: result.title,
        wordCount: result.wordCount
      });

      // Plaats de tekst in het invoervak
      textInput.value = result.text;
      updateCounter();

      // Pas direct de bestaande LeesBlokjes verwerking toe
      const blocks = splitIntoReadingBlocks(result.text);
      renderBlocks(blocks);

      // Toon bronvermelding boven de uitvoer
      displaySourceInfo(result.title, result.url);

      showToast(`Webpagina succesvol geladen! ${result.wordCount} woorden omgezet naar ${blocks.length} leesblokjes. 🌍✨`);
    } catch (err) {
      console.warn('Web import fout:', err);
      setWebState('idle');

      // Toon exact de vereiste foutmelding
      const message = err && err.message
        ? err.message
        : 'Deze website laat geen directe toegang toe.\nKopieer de tekst handmatig of gebruik in een latere versie de browserextensie.';

      showWebAlert(message);
      showToast('Deze website laat geen directe toegang toe. ⚠️');
    }
  }

  // Event Listeners voor Web Import
  if (btnFetchWebpage) {
    btnFetchWebpage.addEventListener('click', () => {
      handleWebImport(webUrlInput ? webUrlInput.value : '');
    });
  }

  if (webUrlInput) {
    webUrlInput.addEventListener('input', () => {
      if (btnClearUrl) {
        btnClearUrl.style.display = webUrlInput.value ? 'inline-block' : 'none';
      }
      hideWebAlert();
    });

    webUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleWebImport(webUrlInput.value);
      }
    });
  }

  if (btnClearUrl) {
    btnClearUrl.addEventListener('click', () => {
      if (webUrlInput) {
        webUrlInput.value = '';
        webUrlInput.focus();
      }
      btnClearUrl.style.display = 'none';
      setWebState('idle');
      hideWebAlert();
    });
  }

  if (btnRemoveWeb) {
    btnRemoveWeb.addEventListener('click', () => {
      setWebState('idle');
      hideWebAlert();
      if (webUrlInput) {
        webUrlInput.value = '';
        webUrlInput.focus();
      }
      if (btnClearUrl) btnClearUrl.style.display = 'none';
    });
  }

  if (btnCloseWebAlert) {
    btnCloseWebAlert.addEventListener('click', () => {
      hideWebAlert();
    });
  }

  // Klikken op suggestie-chips (bijv. Dolfijnen, De Maan, Jeugdjournaal, Nu.nl)
  if (webSuggestions) {
    webSuggestions.addEventListener('click', (e) => {
      const chip = e.target.closest('.btn-chip');
      if (chip && chip.dataset.url) {
        const url = chip.dataset.url;
        if (webUrlInput) {
          webUrlInput.value = url;
          if (btnClearUrl) btnClearUrl.style.display = 'inline-block';
        }
        handleWebImport(url);
      }
    });
  }

  // --- 11. Leesmodus: Bronvermelding & Website Herkenning ---
  function extractWebsiteName(url, title) {
    if (url) {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
        if (host.includes('wikipedia.org')) return 'Wikipedia';
        if (host.includes('jeugdjournaal.nl')) return 'NOS Jeugdjournaal';
        if (host.includes('nu.nl')) return 'Nu.nl';
        if (host.includes('schooltv.nl')) return 'Schooltv';
        if (host.includes('wikikids.nl')) return 'WikiKids';
        if (host.includes('squla.nl')) return 'Squla';
        return host.charAt(0).toUpperCase() + host.slice(1);
      } catch (e) {
        // Ongeldige URL, ga door naar titel
      }
    }
    if (title && title.trim()) {
      const parts = title.trim().split(/[|\-–—]/);
      if (parts.length > 1) {
        return parts[parts.length - 1].trim();
      }
      return title.trim();
    }
    return 'Webpagina';
  }

  function displaySourceInfo(title, url) {
    if (!sourceBanner) return;

    const hasTitle = Boolean(title && title.trim());
    const hasUrl = Boolean(url && url.trim());

    if (!hasTitle && !hasUrl) {
      hideSourceInfo();
      return;
    }

    const siteName = extractWebsiteName(url, title);
    if (sourceWebsiteName) {
      sourceWebsiteName.textContent = siteName;
    }

    if (sourceTitleDisplay) {
      sourceTitleDisplay.textContent = hasTitle ? title.trim() : siteName;
    }

    if (sourceUrlDisplay) {
      if (hasUrl) {
        const cleanUrl = url.trim();
        sourceUrlDisplay.textContent = cleanUrl;
        sourceUrlDisplay.href = cleanUrl;
        sourceUrlDisplay.style.display = 'inline';
      } else {
        sourceUrlDisplay.textContent = '-';
        sourceUrlDisplay.removeAttribute('href');
      }
    }

    sourceBanner.style.display = 'block';
  }

  function hideSourceInfo() {
    if (sourceBanner) {
      sourceBanner.style.display = 'none';
    }
  }

  if (btnCloseSource) {
    btnCloseSource.addEventListener('click', () => {
      hideSourceInfo();
    });
  }

  // --- 12. Universele Importfunctie (Bookmarklet, Browserextensies & Externe Koppelingen) ---
  /**
   * Universele importfunctie voor tekst van externe websites.
   * Kan direct aangeroepen worden door:
   * - De LeesBlokjes Bookmarklet (?title=, ?url=, ?text=)
   * - Chrome extensie
   * - Edge extensie
   * - Firefox extensie
   * 
   * @param {string|object} textOrOptions Tekst als string of optie-object { text, title, url }
   * @param {string} [maybeTitle] Optionele paginatitel
   * @param {string} [maybeUrl] Optionele website-URL
   */
  function importText(textOrOptions, maybeTitle, maybeUrl) {
    let text = '';
    let title = '';
    let url = '';

    if (typeof textOrOptions === 'object' && textOrOptions !== null) {
      text = textOrOptions.text || '';
      title = textOrOptions.title || '';
      url = textOrOptions.url || '';
    } else {
      text = textOrOptions || '';
      title = maybeTitle || '';
      url = maybeUrl || '';
    }

    // Foutafhandeling: wanneer de pagina geen leesbare tekst bevat
    if (!text || !text.trim()) {
      showWebAlert('Geen bruikbare tekst gevonden op deze pagina.');
      showToast('Geen bruikbare tekst gevonden op deze pagina. ⚠️');
      return {
        success: false,
        error: 'Geen bruikbare tekst gevonden op deze pagina.'
      };
    }

    const cleanText = text.trim();

    // 1. Vul automatisch het invoerveld
    if (textInput) {
      textInput.value = cleanText;
      updateCounter();
    }

    // 2. Genereer direct LeesBlokjes
    const blocks = splitIntoReadingBlocks(cleanText);
    renderBlocks(blocks);

    // 3. Toon bronwebsite en metadata in Leesmodus
    displaySourceInfo(title, url);

    const siteName = extractWebsiteName(url, title);
    const wordCount = cleanText.split(/\s+/).filter(Boolean).length;

    // Werk de web import status bij
    setWebState('success', {
      title: title || siteName,
      wordCount: wordCount
    });

    showToast(`Tekst van ${siteName} succesvol geladen! ${wordCount} woorden omgezet naar ${blocks.length} blokjes. ✨`);

    return {
      success: true,
      text: cleanText,
      title,
      url,
      websiteName: siteName,
      wordCount,
      blocksCount: blocks.length
    };
  }

  // --- 13. LeesBlokjes Bookmarklet Generator (LeesBlokjes op websites) ---
  /**
   * Genereert een browser bookmarklet met JavaScript code die:
   * 1. De zichtbare tekst van de huidige pagina verzamelt via document.body.innerText (of geselecteerde tekst).
   * 2. De paginatitel verzamelt via document.title.
   * 3. De website URL verzamelt via window.location.
   * 4. Een nieuw LeesBlokjes venster opent met ?title=, ?url= en ?text=.
   */
  function generateBookmarkletCode() {
    // Basis-URL van deze LeesBlokjes installatie (werkt op GitHub Pages, localhost en file)
    const baseAppUrl = window.location.href.split('?')[0].split('#')[0];

    const bookmarkletScript = "javascript:(function(){" +
      "try{" +
      "var title=document.title||'';" +
      "var url=window.location.href||'';" +
      "var sel=(window.getSelection&&window.getSelection().toString().trim())||'';" +
      "var bodyText=document.body?(document.body.innerText||''):'';" +
      "var text=sel||bodyText;" +
      "if(!text||!text.trim()){" +
      "alert('Geen bruikbare tekst gevonden op deze pagina.');" +
      "return;" +
      "}" +
      "if(text.length>15000){text=text.substring(0,15000);}" +
      "var base=" + JSON.stringify(baseAppUrl) + ";" +
      "var sep=base.indexOf('?')===-1?'?':'&';" +
      "var target=base+sep+'title='+encodeURIComponent(title)+'&url='+encodeURIComponent(url)+'&text='+encodeURIComponent(text);" +
      "window.open(target,'_blank');" +
      "}catch(err){" +
      "alert('Geen bruikbare tekst gevonden op deze pagina.');" +
      "}" +
      "})();";

    return {
      code: bookmarkletScript,
      appUrl: baseAppUrl
    };
  }

  // Bookmarklet Knop Actie: "Maak LeesBlokjes Bookmarklet"
  if (btnMakeBookmarklet) {
    btnMakeBookmarklet.addEventListener('click', () => {
      const { code } = generateBookmarkletCode();

      if (bookmarkletLink) {
        bookmarkletLink.href = code;
      }

      if (bookmarkletInstructionText) {
        bookmarkletInstructionText.textContent = 'Sleep deze knop naar je bladwijzerbalk.';
      }

      if (bookmarkletResult) {
        bookmarkletResult.style.display = 'flex';
        bookmarkletResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      showToast('Bookmarklet klaar! Sleep de knop naar je bladwijzerbalk. 🪄');
    });
  }

  if (btnCopyBookmarklet) {
    btnCopyBookmarklet.addEventListener('click', async () => {
      const { code } = generateBookmarkletCode();
      try {
        await navigator.clipboard.writeText(code);
        showToast('Bookmarklet-code gekopieerd naar klembord! 📋');
      } catch (err) {
        showToast('Kon code niet automatisch kopiëren.');
      }
    });
  }

  if (btnGotoBookmarklet) {
    btnGotoBookmarklet.addEventListener('click', () => {
      switchImportTab('bookmarklet');
      if (btnMakeBookmarklet) {
        btnMakeBookmarklet.click();
      }
    });
  }

  // --- 14. Koppelingen met Browserextensies (postMessage & URL parameters) ---
  // Luister naar berichten vanuit toekomstige browserextensies via window.postMessage
  window.addEventListener('message', (event) => {
    if (event.data && (
      event.data.type === 'LEESBLOKJES_EXT_IMPORT' ||
      event.data.type === 'LEESBLOKJES_IMPORT_WEBPAGE' ||
      event.data.type === 'LEESBLOKJES_IMPORT_TEXT'
    )) {
      const { text, title, url } = event.data;
      if (text) {
        switchImportTab('web');
        if (webUrlInput && url) webUrlInput.value = url;
        importText({ text, title, url });
      }
    }
  });

  // Ondersteun URL query parameters (?title=... &url=... &text=...) voor Bookmarklet en extensies
  function handleUrlQueryParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      let queryText = urlParams.get('text');
      let queryTitle = urlParams.get('title') || '';
      let queryUrl = urlParams.get('url') || urlParams.get('import_url') || '';

      // Fallback: controleer ook hash indien parameters via # doorgegeven zijn
      if (queryText === null && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.has('text')) {
          queryText = hashParams.get('text');
          queryTitle = hashParams.get('title') || queryTitle;
          queryUrl = hashParams.get('url') || queryUrl;
        }
      }

      // 1. Text parameter aanwezig (van Bookmarklet of Browserextensie)
      if (queryText !== null) {
        switchImportTab('web');
        if (webUrlInput && queryUrl) webUrlInput.value = queryUrl;

        if (!queryText.trim()) {
          showWebAlert('Geen bruikbare tekst gevonden op deze pagina.');
          showToast('Geen bruikbare tekst gevonden op deze pagina. ⚠️');
          return;
        }

        importText({
          text: queryText,
          title: queryTitle,
          url: queryUrl
        });
        return;
      }

      // 2. Alleen URL parameter aanwezig (directe webpagina import)
      if (queryUrl) {
        switchImportTab('web');
        if (webUrlInput) webUrlInput.value = queryUrl;
        handleWebImport(queryUrl);
      }
    } catch (paramErr) {
      console.warn('Fout bij het uitlezen van URL parameters:', paramErr);
    }
  }

  // Verwerk eventuele URL parameters bij het openen van de pagina
  handleUrlQueryParams();

  // --- 12. Kopiëren naar Klembord ---
  btnCopy.addEventListener('click', async () => {
    const blockElements = Array.from(outputArea.querySelectorAll('.lees-blokje'));
    if (blockElements.length === 0) return;

    const formattedText = blockElements
      .map((el, i) => `[Blokje ${i + 1}]\n${(el.dataset.originalText || el.querySelector('.blokje-content').textContent).trim()}`)
      .join('\n\n');

    try {
      await navigator.clipboard.writeText(formattedText);
      showToast('Klaar! De leesblokjes zijn gekopieerd naar je klembord. 📋');
    } catch (err) {
      // Fallback
      showToast('Kon niet automatisch kopiëren. Selecteer de tekst handmatig.');
    }
  });

  // --- 9. Voorlezen Functionaliteit (SpeechSynthesis) ---
  function getDutchVoice() {
    if (!synth) return null;
    const voices = synth.getVoices();
    // Zoek naar een Nederlandse stem (nl-NL of nl-BE)
    return voices.find(v => v.lang && v.lang.toLowerCase().startsWith('nl')) || null;
  }

  function stopSpeaking() {
    if (synth && synth.speaking) {
      synth.cancel();
    }
    if (activeSpeechButton) {
      activeSpeechButton.classList.remove('speaking');
      activeSpeechButton.innerHTML = '🔊 Luister';
      activeSpeechButton = null;
    }
    btnReadAll.style.display = 'inline-flex';
    btnStopAudio.style.display = 'none';
  }

  btnStopAudio.addEventListener('click', stopSpeaking);

  function speakSingleBlock(text, buttonElement, blockElement) {
    if (!synth) {
      showToast('Voorlezen wordt helaas niet ondersteund door deze browser.');
      return;
    }

    // Als we al dit blokje aan het voorlezen zijn, pauzeren/stoppen we
    if (activeSpeechButton === buttonElement && synth.speaking) {
      stopSpeaking();
      return;
    }

    stopSpeaking();

    currentUtterance = new SpeechSynthesisUtterance(text);
    const nlVoice = getDutchVoice();
    if (nlVoice) currentUtterance.voice = nlVoice;
    currentUtterance.lang = 'nl-NL';
    currentUtterance.rate = 0.9; // Iets rustiger leestempo voor kinderen!
    currentUtterance.pitch = 1.05;

    buttonElement.classList.add('speaking');
    buttonElement.innerHTML = '⏹️ Pauzeer';
    activeSpeechButton = buttonElement;

    // Activeer focus op dit blokje tijdens het voorlezen
    document.querySelectorAll('.lees-blokje.active-focus').forEach(el => el.classList.remove('active-focus'));
    blockElement.classList.add('active-focus');
    outputArea.classList.add('has-focus');

    currentUtterance.onend = () => {
      stopSpeaking();
    };

    currentUtterance.onerror = () => {
      stopSpeaking();
    };

    synth.speak(currentUtterance);
  }

  btnReadAll.addEventListener('click', () => {
    if (!synth) {
      showToast('Voorlezen wordt helaas niet ondersteund door deze browser.');
      return;
    }

    const blockElements = Array.from(outputArea.querySelectorAll('.lees-blokje'));
    if (blockElements.length === 0) return;

    stopSpeaking();
    btnReadAll.style.display = 'none';
    btnStopAudio.style.display = 'inline-flex';

    let currentIndex = 0;

    function speakNext() {
      if (currentIndex >= blockElements.length) {
        stopSpeaking();
        return;
      }

      const el = blockElements[currentIndex];
      const text = el.dataset.originalText || el.querySelector('.blokje-content').textContent;

      // Highlight het actieve blokje
      blockElements.forEach(b => b.classList.remove('active-focus'));
      el.classList.add('active-focus');
      outputArea.classList.add('has-focus');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      currentUtterance = new SpeechSynthesisUtterance(text);
      const nlVoice = getDutchVoice();
      if (nlVoice) currentUtterance.voice = nlVoice;
      currentUtterance.lang = 'nl-NL';
      currentUtterance.rate = 0.9;

      currentUtterance.onend = () => {
        currentIndex++;
        speakNext();
      };

      currentUtterance.onerror = () => {
        stopSpeaking();
      };

      synth.speak(currentUtterance);
    }

    speakNext();
  });

  // Stemmen laden wanneer gereed (asynchrone browser quirk)
  if (synth && synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = () => {
      // Cache stemmen zodra beschikbaar
      getDutchVoice();
    };
  }

  // --- 10. Toast Meldingen ---
  function showToast(message) {
    let toast = document.getElementById('toast-notice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notice';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Initialiseer woordenteller bij eventuele reeds aanwezige tekst
  updateCounter();

  // Exporteer publieke API voor extensies (Chrome, Edge, Firefox), bookmarklet en tests
  window.LeesBlokjes = {
    DocumentProcessor,
    WebpageProcessor,
    importText,
    generateBookmarkletCode,
    displaySourceInfo,
    hideSourceInfo,
    handleFileUpload,
    handleWebImport,
    handleUrlQueryParams,
    switchImportTab,
    toggleImportSection,
    getActiveImportSection,
    loadImportSectionState,
    splitIntoReadingBlocks,
    renderBlocks,
    splitDutchSyllables,
    applyProfile,
    showToast
  };
});
