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

  // --- DOM Elementen voor Persoonlijk Leesprofiel ---
  const profileFont = document.getElementById('profile-font');
  const profileFontSize = document.getElementById('profile-font-size');
  const valFontSize = document.getElementById('val-font-size');
  const profileLineHeight = document.getElementById('profile-line-height');
  const valLineHeight = document.getElementById('val-line-height');
  const profileWordSpacing = document.getElementById('profile-word-spacing');
  const valWordSpacing = document.getElementById('val-word-spacing');
  const themeRadios = document.querySelectorAll('input[name="profile-theme"]');
  const btnResetProfile = document.getElementById('btn-reset-profile');

  // Leesweergave
  const toggleShowSyllables = document.getElementById('toggle-show-syllables');
  const toggleColorSyllables = document.getElementById('toggle-color-syllables');
  const readingProfileButtons = document.querySelectorAll('[data-reading-profile]');
  const readingModeButtons = document.querySelectorAll('[data-reading-mode]');
  const readingLayoutButtons = document.querySelectorAll('[data-reading-layout]');
  let readingProfile = 'navigator';
  let readingMode = 'syllables';
  let readingLayout = 'blocks';
  let currentBlocks = [];
  let currentText = '';

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

  // --- DOM Elementen voor Invoerbronnen ---
  const tabBtnText = document.getElementById('tab-btn-text');
  const importPanelText = document.getElementById('import-panel-text');
  const tabBtnDoc = document.getElementById('tab-btn-doc');
  const importPanelDoc = document.getElementById('import-panel-doc');

  // --- Spraaksynthese (Voorlezen) State ---
  let synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let activeSpeechButton = null;
  let speechRun = 0;

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
    wordSpacing: 1,
    theme: 'creme',
    showSyllables: false,
    colorSyllables: true,
    readingLayout: 'blocks',
    readingProfile: 'navigator'
  };

  function normalizeProfile(value) {
    const isObject = value !== null && typeof value === 'object' && !Array.isArray(value);
    const profile = isObject ? value : {};
    if (!isObject) console.warn('Ongeldig leesprofiel; standaardinstellingen worden gebruikt.');
    const normalized = { ...DEFAULT_PROFILE };
    for (const [key, min, max, step] of [
      ['fontSize', 14, 32, 1], ['lineHeight', 1.2, 2.5, 0.1], ['wordSpacing', 0.8, 2.4, 0.1]
    ]) {
      const raw = profile[key];
      const number = typeof raw === 'number' || (typeof raw === 'string' && raw.trim()) ? Number(raw) : NaN;
      if (Number.isFinite(number)) {
        normalized[key] = Number((Math.round(Math.min(max, Math.max(min, number)) / step) * step).toFixed(1));
      } else if (Object.hasOwn(profile, key)) {
        console.warn(`Ongeldige leesinstelling ${key}; standaardwaarde wordt gebruikt.`);
      }
    }
    const choices = {
      font: Object.keys(FONT_MAP),
      theme: ['creme', 'blauw', 'groen', 'donker'],
      readingProfile: ['navigator', 'focus'],
      readingLayout: ['blocks', 'continuous']
    };
    for (const [key, allowed] of Object.entries(choices)) {
      if (allowed.includes(profile[key])) normalized[key] = profile[key];
      else if (Object.hasOwn(profile, key)) console.warn(`Onbekende leesinstelling ${key}; standaardwaarde wordt gebruikt.`);
    }
    for (const key of ['showSyllables', 'colorSyllables']) {
      if (typeof profile[key] === 'boolean') normalized[key] = profile[key];
      else if (Object.hasOwn(profile, key)) console.warn(`Ongeldige leesinstelling ${key}; standaardwaarde wordt gebruikt.`);
    }
    return normalized;
  }

  function applyProfile(profile, updateInputs = true) {
    profile = normalizeProfile(profile);
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

    applyWordSpacing(profile.wordSpacing, updateInputs);
    setReadingLayout(profile.readingLayout, false);

    // 4. Achtergrondkleur
    const validThemes = ['creme', 'blauw', 'groen', 'donker'];
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
    setReadingProfile(profile.readingProfile, showSyl, colorSyl);
  }

  function setReadingProfile(profile, showSyllables = toggleShowSyllables.checked, colorSyllables = toggleColorSyllables.checked) {
    readingProfile = ['navigator', 'focus'].includes(profile) ? profile : 'navigator';
    readingMode = readingProfile === 'navigator' && showSyllables ? 'syllables' : 'sounds';
    document.body.dataset.activeProfile = readingProfile;
    document.body.classList.toggle('sound-mode', readingMode === 'sounds' && readingProfile !== 'focus');
    document.body.classList.toggle('show-syllables', readingMode === 'syllables' && showSyllables);
    document.body.classList.toggle('color-syllables', readingMode === 'syllables' && colorSyllables);
    readingModeButtons.forEach(button => {
      button.setAttribute('aria-pressed', String((showSyllables ? 'syllables' : 'sounds') === button.dataset.readingMode));
    });
    readingProfileButtons.forEach(button => {
      const selected = button.dataset.readingProfile === readingProfile;
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    if (currentBlocks.length) {
      renderBlocks(currentBlocks, false, currentText);
    } else if (textInput.value.trim()) {
      const rawText = textInput.value.trim();
      renderBlocks(splitIntoReadingBlocks(rawText), false, rawText);
    }
  }

  function wordFocusEnabled() {
    return readingProfile === 'focus';
  }

  function applyWordSpacing(value, updateInputs = true) {
    const parsed = Number(value);
    const spacing = Number.isFinite(parsed) ? Math.min(2.4, Math.max(0.8, parsed)) : 1;
    const formatted = spacing.toFixed(1);
    document.documentElement.style.setProperty('--word-gap', `${spacing * 0.65}em`);
    if (updateInputs) profileWordSpacing.value = formatted;
    valWordSpacing.textContent = `${formatted}×`;
    const labels = { '0.8': 'Compact', '1.0': 'Normaal', '1.4': 'Ruim', '1.8': 'Extra ruim', '2.4': 'Zeer ruim' };
    profileWordSpacing.setAttribute('aria-valuetext', `${formatted}×${labels[formatted] ? ` - ${labels[formatted]}` : ''}`);
  }

  function setReadingLayout(layout, refresh = true) {
    readingLayout = layout === 'continuous' ? 'continuous' : 'blocks';
    readingLayoutButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.readingLayout === readingLayout));
    });
    if (refresh && currentBlocks.length) renderBlocks(currentBlocks, false, currentText);
  }

  function getActiveProfileFromUI() {
    const selectedTheme = document.querySelector('input[name="profile-theme"]:checked')?.value || 'creme';
    return {
      font: profileFont ? profileFont.value : 'Lexend',
      fontSize: profileFontSize ? Number(profileFontSize.value) : 20,
      lineHeight: profileLineHeight ? Number(profileLineHeight.value) : 1.8,
      wordSpacing: Number(profileWordSpacing.value),
      theme: selectedTheme,
      showSyllables: Boolean(toggleShowSyllables?.checked),
      colorSyllables: Boolean(toggleColorSyllables?.checked),
      readingMode,
      readingLayout,
      readingProfile
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
    function readStoredProfile(key) {
      let raw;
      try {
        raw = localStorage.getItem(key);
      } catch (error) {
        console.warn('Kon opgeslagen leesinstellingen niet lezen:', error);
        return null;
      }
      if (raw === null) return null;
      try {
        const value = JSON.parse(raw);
        if (value === null || typeof value !== 'object' || Array.isArray(value)) {
          throw new TypeError('Het opgeslagen leesprofiel is geen instellingenobject.');
        }
        return value;
      } catch (error) {
        console.warn(`Ongeldige opgeslagen instellingen in ${key}:`, error);
        showToast('Opgeslagen instellingen konden niet worden hersteld. Standaardinstellingen worden gebruikt.');
        return null;
      }
    }
    const saved = readStoredProfile(PROFILE_KEY);
    if (saved) {
      const migrated = { ...saved };
      const legacyProfile = !Object.hasOwn(saved, 'readingProfile') &&
        (['sounds', 'syllables'].includes(saved.readingMode) ||
          typeof saved.showSyllables === 'boolean' || typeof saved.colorSyllables === 'boolean');
      if (legacyProfile || ['personal', 'sounds'].includes(saved.readingProfile)) {
        migrated.readingProfile = 'navigator';
        if (legacyProfile) {
          migrated.showSyllables = saved.readingMode !== 'sounds' &&
            (typeof saved.showSyllables === 'boolean' ? saved.showSyllables : true);
        } else if (saved.readingProfile === 'sounds') {
          migrated.showSyllables = false;
        }
      }
      if (migrated.theme === 'geel') migrated.theme = 'creme';
      applyProfile(migrated, true);
      saveProfile();
      return;
    }
    const old = readStoredProfile(OLD_SETTINGS_KEY);
    const legacyKeys = ['opendyslexic', 'largeFont', 'largeSpacing', 'darkMode', 'showSyllables', 'colorSyllables'];
    if (old) {
      for (const key of legacyKeys) {
        if (Object.hasOwn(old, key) && typeof old[key] !== 'boolean') {
          console.warn(`Ongeldige oude leesinstelling ${key}; standaardwaarde wordt gebruikt.`);
        }
      }
    }
    if (old && legacyKeys.some(key => typeof old[key] === 'boolean')) {
      const migrated = {
        font: old.opendyslexic === true ? 'OpenDyslexic' : 'Lexend',
        fontSize: old.largeFont === true ? 24 : 20,
        lineHeight: old.largeSpacing === true ? 2.2 : 1.8,
        theme: old.darkMode === true ? 'donker' : 'creme',
        showSyllables: typeof old.showSyllables === 'boolean' ? old.showSyllables : true,
        colorSyllables: typeof old.colorSyllables === 'boolean' ? old.colorSyllables : true,
        readingProfile: 'navigator'
      };
      applyProfile(migrated, true);
      saveProfile();
      return;
    }
    if (old) console.warn('Geen herkenbare oude leesinstellingen; standaardprofiel wordt gebruikt.');
    applyProfile(DEFAULT_PROFILE, true);
    saveProfile();
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

  profileWordSpacing.addEventListener('input', () => {
    applyWordSpacing(profileWordSpacing.value, false);
    saveProfile();
  });

  readingLayoutButtons.forEach(button => {
    button.addEventListener('click', () => {
      setReadingLayout(button.dataset.readingLayout);
      saveProfile();
    });
  });

  readingModeButtons.forEach(button => {
    button.addEventListener('click', () => {
      toggleShowSyllables.checked = button.dataset.readingMode === 'syllables';
      toggleShowSyllables.dispatchEvent(new Event('change'));
    });
  });

  themeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        document.body.setAttribute('data-theme', radio.value);
        document.body.classList.toggle('dark-mode', radio.value === 'donker');
        saveProfile();
      }
    });
  });

  readingProfileButtons.forEach(button => {
    button.addEventListener('click', () => {
      setReadingProfile(button.dataset.readingProfile);
      saveProfile();
    });
    button.addEventListener('keydown', event => {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const buttons = Array.from(readingProfileButtons);
      const index = buttons.indexOf(button);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 :
        (index + (['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1) + buttons.length) % buttons.length;
      const next = buttons[nextIndex];
      next.focus();
      next.click();
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
      setReadingProfile(readingProfile);
      saveProfile();
    });
  }

  if (toggleColorSyllables) {
    toggleColorSyllables.addEventListener('change', () => {
      if (toggleColorSyllables.checked && !toggleShowSyllables.checked) {
        toggleShowSyllables.checked = true;
      }
      setReadingProfile(readingProfile);
      saveProfile();
    });
  }

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
      const sentences = trimmedPara.match(/[\s\S]+?(?:[.!?]+["'’”)\]]*(?=\s|$)|$)/g);

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

  // --- 3b. Nederlandse geschreven lettergrepen (los van klankgroepen) ---
  const VOWEL_COMBOS = [
    'eeuw', 'ieuw', 'uw',
    'aai', 'ooi', 'oei',
    'aa', 'ee', 'oo', 'uu', 'ie', 'oe', 'ou', 'au', 'ei', 'ui', 'eu', 'ij', 'ëe',
    'a', 'e', 'i', 'o', 'u', 'y', 'é', 'è', 'ë', 'ï', 'ó', 'ò', 'ö', 'ü', 'á', 'à', 'ä'
  ];

  const VALID_ONSETS = new Set([
    'str', 'spr', 'spl', 'sch', 'scr', 'shr',
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kn', 'kr', 'kw',
    'pl', 'pr', 'ps', 'qu', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'ts',
    'tw', 'vl', 'vr', 'wr', 'ch',
    'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'z'
  ]);

  // Voeg hier alleen gecontroleerde schrijfwijzen toe; sleutels zijn hoofdletterongevoelig.
  const DUTCH_SYLLABLE_EXCEPTIONS = {
    robotje: ['ro', 'bot', 'je'],
    robotjes: ['ro', 'bot', 'jes'],
    vriendelijk: ['vrien', 'de', 'lijk'],
    vriendelijke: ['vrien', 'de', 'lij', 'ke']
  };

  const DUTCH_COMPOUND_PARTS = {
    tandwielen: ['tand', 'wielen'],
    speelgoedwinkel: ['speel', 'goed', 'winkel'],
    aardrijkskundeles: ['aard', 'rijks', 'kunde', 'les']
  };

  const DUTCH_SUFFIX_STEMS = {
    heid: new Set(['snel', 'vrij', 'waar', 'zeker', 'veilig', 'schoon']),
    heden: new Set(['snel', 'vrij', 'waar', 'zeker', 'veilig', 'schoon']),
    tje: new Set(['boom', 'huis', 'boek', 'school']),
    tjes: new Set(['boom', 'huis', 'boek', 'school']),
    pje: new Set(['boom']),
    pjes: new Set(['boom']),
    lijk: new Set(['eer', 'moei', 'gevaar']),
    lijke: new Set(['eer', 'moei', 'gevaar'])
  };

  const SYLLABLE_ONSETS = new Set([
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'kl', 'kn', 'kr', 'kw',
    'pl', 'pr', 'sl', 'sm', 'sn', 'sp', 'st', 'str', 'spr', 'spl', 'tr', 'tw',
    'vl', 'vr', 'wr', 'zw', 'ch', 'sch', 'schr'
  ]);

  function findSyllableNuclei(lower) {
    const nuclei = [];
    let i = 0;
    while (i < lower.length) {
      const vowel = VOWEL_COMBOS.find(candidate => lower.startsWith(candidate, i));
      if (vowel) {
        nuclei.push({ start: i, end: i + vowel.length });
        i += vowel.length;
      } else {
        i++;
      }
    }
    return nuclei;
  }

  function restoreSyllableCase(rawWord, parts) {
    let offset = 0;
    return parts.map(part => {
      const original = rawWord.slice(offset, offset + part.length);
      offset += part.length;
      return original;
    });
  }

  function splitDutchSyllableCore(rawWord) {
    const lower = rawWord.normalize('NFC').toLowerCase();
    if (lower.length !== rawWord.length || !/^[a-zéèëïóòöüáàä]+$/.test(lower)) return [rawWord];
    if (Object.hasOwn(DUTCH_SYLLABLE_EXCEPTIONS, lower)) {
      return restoreSyllableCase(rawWord, DUTCH_SYLLABLE_EXCEPTIONS[lower]);
    }
    if (Object.hasOwn(DUTCH_COMPOUND_PARTS, lower)) {
      return restoreSyllableCase(rawWord, DUTCH_COMPOUND_PARTS[lower])
        .flatMap(part => splitDutchSyllableCore(part));
    }
    for (const [suffix, stems] of Object.entries(DUTCH_SUFFIX_STEMS)) {
      const stem = lower.slice(0, -suffix.length);
      if (lower.endsWith(suffix) && stems.has(stem)) {
        return [
          ...splitDutchSyllableCore(rawWord.slice(0, stem.length)),
          ...splitDutchSyllableCore(rawWord.slice(stem.length))
        ];
      }
    }
    const nuclei = findSyllableNuclei(lower);
    if (nuclei.length <= 1) return [rawWord];
    const onset = lower.slice(0, nuclei[0].start);
    if (onset.length > 1 && !SYLLABLE_ONSETS.has(onset)) return [rawWord];

    const splitPoints = [];
    for (let k = 0; k < nuclei.length - 1; k++) {
      const consonantStart = nuclei[k].end;
      const consonants = lower.slice(consonantStart, nuclei[k + 1].start);
      let splitOffset;
      if (consonants.length === 0) {
        // Trema geeft een expliciete grens; andere klinkerbotsingen zijn onzeker.
        if (!/[ëïöüä]/.test(lower[nuclei[k + 1].start])) return [rawWord];
        splitOffset = 0;
      } else if (consonants.length === 1) {
        splitOffset = 0;
      } else if (consonants.length === 2 && consonants[0] === consonants[1]) {
        splitOffset = 1;
      } else if (consonants === 'ng' || consonants === 'nk') {
        splitOffset = 1;
      } else if (SYLLABLE_ONSETS.has(consonants)) {
        splitOffset = 0;
      } else {
        const nextOnset = [...SYLLABLE_ONSETS]
          .filter(cluster => consonants.endsWith(cluster))
          .sort((a, b) => b.length - a.length)[0];
        const coda = nextOnset ? consonants.slice(0, -nextOnset.length) : consonants.slice(0, -1);
        if (coda.length > 2 && !/^(cht|ng|nk|sch)$/.test(coda)) return [rawWord];
        splitOffset = coda.length;
      }
      splitPoints.push(consonantStart + splitOffset);
    }

    const syllables = [];
    let prevIndex = 0;
    for (const point of [...splitPoints, rawWord.length]) {
      const syllable = rawWord.slice(prevIndex, point);
      if (findSyllableNuclei(syllable.toLowerCase()).length !== 1) return [rawWord];
      syllables.push(syllable);
      prevIndex = point;
    }
    return syllables;
  }

  function splitDutchSyllables(rawWord) {
    if (!rawWord) return [rawWord];
    const match = /^([^\p{L}]*)([\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*)([^\p{L}]*)$/u.exec(rawWord);
    if (!match) return [rawWord];
    const [, prefix, word, punctuation] = match;
    // Apostrofwoorden zijn uitspraakafhankelijk; bewaar ze als geheel.
    if (/['’]/.test(word)) return [rawWord];
    const syllables = word.split('-').flatMap((part, index, parts) => {
      const split = splitDutchSyllableCore(part);
      if (index < parts.length - 1) split[split.length - 1] += '-';
      return split;
    });
    syllables[0] = prefix + syllables[0];
    syllables[syllables.length - 1] += punctuation;
    return syllables;
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
    const syllables = splitDutchSyllables(text);
    const content = syllables.length > 1
      ? syllables.map((syllable, index) =>
        `<span class="syl syl-c${index % 4}">${escapeHtml(syllable)}</span>`).join('')
      : escapeHtml(text);
    return `<span class="syl-word">${content}</span>`;
  }

  // Langste overeenkomst eerst: eeuw/ieuw gaan voor ee/ie, aai voor aa.
  const SOUND_GROUPS = [
    { color: 'white', marking: 'dots', groups: ['eeuw', 'ieuw', 'uw'] },
    { color: 'white', marking: 'underline', groups: ['aai', 'ooi', 'oei'] },
    { color: 'yellow', groups: ['aa', 'ee', 'oo', 'uu'] },
    { color: 'orange', groups: ['ij', 'ei', 'ou', 'au', 'ie', 'oe', 'eu', 'ui'] },
    { color: 'green', groups: ['a', 'e', 'i', 'o', 'u'] }
  ].flatMap(({ color, marking, groups }) => groups.map(text => ({ text, color, marking })))
    .sort((a, b) => b.text.length - a.text.length);

  const SOUND_CONSONANTS = [...new Set([...VALID_ONSETS, 'ng', 'nk', 'schr', 'c', 'q', 'x', 'y'])]
    .filter(group => /^[bcdfghjklmnpqrstvwxyz]+$/.test(group))
    .sort((a, b) => b.length - a.length);

  function splitDutchSounds(word) {
    const lower = word.replace(/[A-Z]/g, letter => letter.toLowerCase());
    const sounds = [];
    let index = 0;
    while (index < word.length) {
      const group = SOUND_GROUPS.find(candidate => lower.startsWith(candidate.text, index));
      if (group) {
        sounds.push({ text: word.slice(index, index + group.text.length), color: group.color, marking: group.marking });
        index += group.text.length;
        continue;
      }
      const consonant = SOUND_CONSONANTS.find(candidate => lower.startsWith(candidate, index));
      if (consonant) {
        sounds.push({ text: word.slice(index, index + consonant.length), color: 'blue' });
        index += consonant.length;
      } else {
        // Onbekende letters/tekens blijven intact, zonder een verzonnen klankkleur.
        const character = String.fromCodePoint(word.codePointAt(index));
        sounds.push({ text: character, color: null });
        index += character.length;
      }
    }
    return sounds;
  }

  function formatTextWithSounds(text) {
    const groups = splitDutchSounds(text).map(group => {
      if (!group.color) return escapeHtml(group.text);
      const content = group.marking === 'dots'
        ? Array.from(group.text).map(letter => `<span class="sound-letter">${escapeHtml(letter)}</span>`).join('')
        : escapeHtml(group.text);
      const markingClass = group.marking ? ` sound-${group.marking}` : '';
      return `<span class="sound sound-${group.color}${markingClass}">${content}</span>`;
    }).join('');
    return `<span class="sound-word">${groups}</span>`;
  }

  function formatReadingText(text) {
    return text.replace(/\S+|\s+/g, (token, offset) => {
      if (/^\s+$/.test(token)) return escapeHtml(token);
      const attributes = wordFocusEnabled()
        ? ` tabindex="0" role="button" aria-label="Leespositie: ${escapeHtml(token)}" aria-pressed="false"`
        : '';
      const start = `<span class="word-group" data-word-start="${offset}"${attributes}>`;
      if (readingProfile === 'focus') return `${start}${escapeHtml(token)}</span>`;
      if (readingMode === 'syllables') {
        return `${start}${formatTextWithSyllables(token)}</span>`;
      }
      const pieces = token.split(/([\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*)/u);
      const content = pieces.map((part, index) => index % 2
        ? formatTextWithSounds(part)
        : escapeHtml(part)).join('');
      return `${start}${content}</span>`;
    });
  }

  function clearReadingFocus() {
    outputArea.querySelectorAll('.active-focus, .active-word, .has-word-focus').forEach(element => {
      element.classList.remove('active-focus', 'active-word', 'has-word-focus');
      if (element.matches('.word-group[role="button"]')) element.setAttribute('aria-pressed', 'false');
    });
    outputArea.classList.remove('has-focus', 'has-word-focus');
  }

  function focusReadingPart(element) {
    clearReadingFocus();
    if (element.matches('.word-group')) {
      element.classList.add('active-word');
      element.setAttribute('aria-pressed', 'true');
      element.closest('.blokje-content').classList.add('has-word-focus');
      outputArea.classList.add('has-word-focus');
    } else {
      element.classList.add('active-focus');
      outputArea.classList.add('has-focus');
    }
  }

  function handleWordFocus(event) {
    const word = event.target.closest('.word-group[role="button"]');
    if (!word || !wordFocusEnabled()) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    const active = word.classList.contains('active-word');
    if (active) clearReadingFocus();
    else focusReadingPart(word);
  }
  outputArea.addEventListener('click', handleWordFocus);
  outputArea.addEventListener('keydown', handleWordFocus);

  function trackSpeechPosition(utterance, readingUnit, run) {
    utterance.onboundary = event => {
      if (run !== speechRun || !wordFocusEnabled() || event.name !== 'word') return;
      const words = Array.from(readingUnit.querySelectorAll('.word-group'));
      const word = words.find(element => {
        const start = Number(element.dataset.wordStart);
        return event.charIndex >= start && event.charIndex < start + element.textContent.length;
      });
      if (word) focusReadingPart(word);
    };
  }

  loadProfile();

  // --- 4. Blokjes Tonen in de UI ---
  function renderBlocks(blocks, scrollToOutput = true, originalText = (blocks || []).join('\n\n')) {
    stopSpeaking();
    currentBlocks = blocks ? [...blocks] : [];
    currentText = originalText;
    outputArea.innerHTML = '';
    outputArea.classList.remove('has-focus', 'has-word-focus');

    if (!blocks || blocks.length === 0) {
      renderEmptyState();
      outputActions.style.display = 'none';
      focusTip.style.display = 'none';
      return;
    }

    outputActions.style.display = 'flex';
    focusTip.style.display = readingLayout === 'blocks' ? 'block' : 'none';

    if (readingLayout === 'continuous') {
      const reading = document.createElement('div');
      reading.className = 'continuous-reading reading-unit';
      reading.setAttribute('role', 'region');
      reading.setAttribute('aria-label', 'Doorlopende leestekst');
      reading.dataset.originalText = originalText;
      const content = document.createElement('div');
      content.className = 'blokje-content';
      content.innerHTML = formatReadingText(originalText);
      reading.appendChild(content);
      outputArea.appendChild(reading);
      if (scrollToOutput) outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    blocks.forEach((text, index) => {
      const blockIndex = index + 1;
      const article = document.createElement('article');
      article.className = 'lees-blokje reading-unit';
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

      // Inhoud volgens de gekozen leesmodus
      const content = document.createElement('div');
      content.className = 'blokje-content';
      content.innerHTML = formatReadingText(text);

      article.appendChild(header);
      article.appendChild(content);

      // Klik/Enter actie: Focus-highlight modus (leeslampje)
      function toggleFocus() {
        const isCurrentlyActive = article.classList.contains('active-focus');
        if (!isCurrentlyActive) {
          focusReadingPart(article);
          article.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          clearReadingFocus();
        }
      }

      article.addEventListener('click', event => {
        if (!event.target.closest('.word-group[role="button"]')) toggleFocus();
      });
      article.addEventListener('keydown', (e) => {
        if (e.target.closest('.word-group[role="button"]')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleFocus();
        }
      });

      outputArea.appendChild(article);
    });

    // Scroll netjes naar het begin van de uitvoer
    if (scrollToOutput) outputArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    renderBlocks(blocks, true, rawText);
    showToast(readingLayout === 'continuous'
      ? 'Gelukt! Je doorlopende leestekst staat klaar. 🌟'
      : `Gelukt! We hebben er ${blocks.length} rustige blokjes van gemaakt. 🌟`);
  });

  // --- 6. Voorbeeldtekst Invoegen ---
  const SAMPLE_TEXT = `Er was eens een klein robotje dat Pip heette. Pip woonde in een gezellige werkplaats vol met glimmende tandwielen, gekleurde draadjes en vrolijk knipperende lampjes. 

Elke ochtend dronk Pip een klein bekertje zonne-energie om goed wakker te worden. Daarna ging hij naar het dak om naar de vogels in de bomen te zwaaien. De vogels zongen altijd een vrolijk deuntje voor hem terug.

Op een dag vond Pip een geheimzinnig kaartje op de grond. Er stond op: 'De schat van het zonnebos'. Pip zette zijn avonturiers-pet op en pakte zijn kompas. Dit werd de spannendste dag van het hele jaar!`;

  btnSample.addEventListener('click', () => {
    textInput.value = SAMPLE_TEXT;
    updateCounter();
    const blocks = splitIntoReadingBlocks(SAMPLE_TEXT);
    renderBlocks(blocks, true, SAMPLE_TEXT);
    showToast('Voorbeeldverhaal geladen! Veel leesplezier! 🚀');
  });

  // --- 7. Wissen Knop ---
  btnClear.addEventListener('click', () => {
    textInput.value = '';
    updateCounter();
    renderBlocks([]);
    setUploadState('idle');
    hideUploadAlert();
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
      renderBlocks(blocks, true, result.text);

      const outputDescription = readingLayout === 'continuous' ? 'doorlopende tekst' : `${blocks.length} leesblokjes`;
      showToast(`Document succesvol geladen! ${result.wordCount} woorden omgezet naar ${outputDescription}. 📄✨`);
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

  // --- 9. Importnavigatie (slechts een bronpaneel tegelijk) ---
  const IMPORT_SECTION_KEY = 'leesblokjes_actieve_import_sectie';
  const LAST_SECTION_KEY = 'leesblokjes_laatste_geopende_sectie';

  const SECTION_CONFIG = {
    text: {
      btn: tabBtnText,
      panel: importPanelText
    },
    doc: {
      btn: tabBtnDoc,
      panel: importPanelDoc
    }
  };

  /**
   * Bepaalt welke bron momenteel geopend is.
   */
  function getActiveImportSection() {
    for (const key of Object.keys(SECTION_CONFIG)) {
      const cfg = SECTION_CONFIG[key];
      if (!cfg.panel.hidden) {
        return key;
      }
    }
    return 'text';
  }

  /**
   * Selecteert een bron. De huidige bron kan niet worden dichtgeklapt.
   * @param {'text'|'doc'} targetSection
   * @param {boolean} [save=true]
   */
  function toggleImportSection(targetSection, save = true) {
    const nextActive = Object.hasOwn(SECTION_CONFIG, targetSection) ? targetSection : 'text';

    // Pas toe op alle secties (slechts één geopend houden)
    for (const [key, cfg] of Object.entries(SECTION_CONFIG)) {
      const isOpen = (key === nextActive);

      if (cfg.btn) {
        cfg.btn.classList.toggle('is-active', isOpen);
        cfg.btn.setAttribute('aria-pressed', String(isOpen));
      }

      if (cfg.panel) {
        cfg.panel.hidden = !isOpen;
      }
    }

    // Sla toestand op in localStorage
    if (save) {
      try {
        localStorage.setItem(IMPORT_SECTION_KEY, nextActive);
        localStorage.setItem(LAST_SECTION_KEY, nextActive);
      } catch (err) {
        console.warn('Kon actieve importsectie niet opslaan in localStorage:', err);
      }
    }

    return nextActive;
  }

  Object.entries(SECTION_CONFIG).forEach(([key, cfg]) => {
    cfg.btn.addEventListener('click', () => toggleImportSection(key));
  });

  /**
   * Eerste bezoek: tekst plakken. Daarna wordt de laatst gebruikte bron hersteld.
   * De oude accordeonwaarde 'none' wordt vertaald naar tekst plakken.
   */
  function loadImportSectionState() {
    let saved;
    try {
      saved = localStorage.getItem(IMPORT_SECTION_KEY);
    } catch (err) {
      console.warn('Kon actieve importbron niet laden uit localStorage:', err);
      toggleImportSection('text', false);
      return;
    }
    toggleImportSection(saved && Object.hasOwn(SECTION_CONFIG, saved) ? saved : 'text');
  }

  loadImportSectionState();

  // --- 12. Kopiëren naar Klembord ---
  btnCopy.addEventListener('click', async () => {
    const blockElements = Array.from(outputArea.querySelectorAll('.reading-unit'));
    if (blockElements.length === 0) return;

    const formattedText = readingLayout === 'continuous' ? currentText : blockElements
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
    speechRun++;
    if (synth && (synth.speaking || synth.pending)) {
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

  function handleSpeechError(event, run) {
    if (run !== speechRun) return;
    stopSpeaking();
    if (event.error === 'canceled' || event.error === 'interrupted') return;
    console.warn('Voorlezen is mislukt:', event.error);
    showToast('Voorlezen is mislukt. Probeer opnieuw of kies een andere Nederlandse stem in je browser.');
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
    const run = speechRun;

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
    focusReadingPart(blockElement);
    trackSpeechPosition(currentUtterance, blockElement, run);

    currentUtterance.onend = () => {
      if (run === speechRun) stopSpeaking();
    };

    currentUtterance.onerror = event => handleSpeechError(event, run);

    synth.speak(currentUtterance);
  }

  btnReadAll.addEventListener('click', () => {
    if (!synth) {
      showToast('Voorlezen wordt helaas niet ondersteund door deze browser.');
      return;
    }

    const blockElements = Array.from(outputArea.querySelectorAll('.reading-unit'));
    if (blockElements.length === 0) return;

    stopSpeaking();
    const run = speechRun;
    btnReadAll.style.display = 'none';
    btnStopAudio.style.display = 'inline-flex';

    let currentIndex = 0;

    function speakNext() {
      if (run !== speechRun) return;
      if (currentIndex >= blockElements.length) {
        stopSpeaking();
        return;
      }

      const el = blockElements[currentIndex];
      const text = el.dataset.originalText || el.querySelector('.blokje-content').textContent;

      // Highlight het actieve blokje
      focusReadingPart(el);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      currentUtterance = new SpeechSynthesisUtterance(text);
      const nlVoice = getDutchVoice();
      if (nlVoice) currentUtterance.voice = nlVoice;
      currentUtterance.lang = 'nl-NL';
      currentUtterance.rate = 0.9;
      trackSpeechPosition(currentUtterance, el, run);

      currentUtterance.onend = () => {
        if (run !== speechRun) return;
        currentIndex++;
        speakNext();
      };

      currentUtterance.onerror = event => handleSpeechError(event, run);

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

  // Publieke API voor documentverwerking en tests.
  window.LeesBlokjes = {
    DocumentProcessor,
    handleFileUpload,
    toggleImportSection,
    getActiveImportSection,
    loadImportSectionState,
    splitIntoReadingBlocks,
    renderBlocks,
    splitDutchSyllables,
    splitDutchSounds,
    applyProfile,
    showToast
  };
});
