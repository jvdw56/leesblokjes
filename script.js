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

  // --- Spraaksynthese (Voorlezen) State ---
  let synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let activeSpeechButton = null;

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
    showToast('Tekst gewist. 🗑️');
    textInput.focus();
  });

  // --- 8. Kopiëren naar Klembord ---
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
  let toastTimeout = null;
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
});
