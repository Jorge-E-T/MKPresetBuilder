'use strict';

// ════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════
const DB_NAME    = 'R1PresetBuilder';
const DB_VERSION = 1;
const STORE      = 'presets';

let PRESET_CATEGORIES = [
  'ART STYLE', 'PORTRAIT', 'NATURE', 'ARCHITECTURE', 'ABSTRACT',
  'ILLUSTRATION', 'SCI-FI', 'FANTASY', 'HISTORICAL', 'FUN AND CREATIVE',
  'PHOTOGRAPHY', 'FOOD', 'ANIMALS', 'TRAVEL', 'TECHNOLOGY',
  'OPTIONS', 'HUMOR', 'SOCIAL MEDIA', 'SATIRE', 'BEAUTY FILTER',
  'HORROR', 'VINTAGE', 'MINIMALIST', 'NEON', 'CINEMATIC',
  'CARTOON', 'ANIME', 'WATERCOLOR', 'SKETCH', 'PIXEL ART',
  'HOLIDAY', 'SPORTS', 'URBAN', 'UNDERWATER', 'SPACE',
  'FASHION', 'INTERIOR DESIGN', 'VEHICLES', 'WEATHER', 'SEASONAL',
  // Additional categories
  'SURREALISM', 'POP ART', 'STEAMPUNK', 'CYBERPUNK', 'GOTHIC',
  'IMPRESSIONISM', 'RENAISSANCE', 'STREET ART', 'COLLAGE', 'MOSAIC',
  'INFRARED', 'DOUBLE EXPOSURE', 'MACRO', 'AERIAL', 'NOIR'
];

// Permanent snapshot of the built-in categories — used to tell custom ones apart
const CORE_CATEGORIES = [...PRESET_CATEGORIES];

// ── Message Templates ──────────────────────────────────────────────────
const PRESET_TEMPLATES = {
  transform: "Take a picture and transform the image into [DESCRIBE TRANSFORMATION]. [ADD SPECIFIC DETAILS ABOUT STYLE, APPEARANCE, COLORS, ETC.]",
  transform_subject: "Take a picture and transform the subject into [WHAT THE SUBJECT BECOMES]. Preserve the subject's recognizable facial structure and identity. [ADD DETAILS ABOUT NEW APPEARANCE, ENVIRONMENT, LIGHTING].",
  convert: "Take a picture and convert the scene into [DESCRIBE NEW FORMAT/MEDIUM]. [ADD DETAILS ABOUT MATERIALS, TEXTURES, SCALE].",
  style: "Take a picture in the style of [ARTISTIC STYLE/ARTIST]. [ADD DETAILS ABOUT TECHNIQUE, COLORS, COMPOSITION].",
  place: "Take a picture and place the subject in [DESCRIBE SCENE/LOCATION]. [ADD DETAILS ABOUT LIGHTING, ATMOSPHERE, INTEGRATION].",
  recreate: "Take a picture and recreate [FAMOUS WORK/SCENE]. Replace [DESCRIBE WHAT TO REPLACE]. Preserve the iconic [DESCRIBE KEY ELEMENTS TO KEEP].",
  render: "Take a picture and render it as [FORMAT/MEDIUM]. [ADD DETAILS ABOUT APPEARANCE, TEXTURE, TECHNICAL SPECIFICS].",
  make: "Take a picture and make the subject into [CHARACTER/CREATURE]. [ADD DETAILS ABOUT APPEARANCE, TRAITS, SETTING]. Make it photorealistic.",
  analyze: "Analyze the image and [DESCRIBE WHAT TO ANALYZE/EXTRACT]. [ADD DETAILS ABOUT OUTPUT FORMAT] and email it to me.",
  enhance: "Take a picture and enhance [DESCRIBE WHAT TO ENHANCE — e.g. colors, details, lighting]. Maintain the original composition while [ADD SPECIFIC ENHANCEMENT DETAILS].",
  composite: "Take a picture and create a composite by [DESCRIBE COMPOSITING TECHNIQUE]. Blend [ELEMENT A] with [ELEMENT B] seamlessly. [ADD DETAILS ABOUT TRANSITIONS, LIGHTING MATCH].",
  miniature: "Take a picture and transform the scene into a miniature/tilt-shift effect. Make [DESCRIBE WHAT SHOULD LOOK MINIATURIZED]. [ADD DETAILS ABOUT FOCUS, SATURATION, SCALE].",
  time_period: "Take a picture and transport the scene to [TIME PERIOD/ERA]. Transform all elements to match [DESCRIBE ERA-SPECIFIC DETAILS — architecture, clothing, technology, colors].",
  emotion: "Take a picture and infuse the image with [DESCRIBE EMOTION/MOOD]. Use [COLOR PALETTE, LIGHTING, COMPOSITION TECHNIQUES] to evoke [TARGET FEELING].",
  material: "Take a picture and transform everything into [MATERIAL — e.g. glass, gold, ice, wood]. Maintain recognizable shapes while [ADD DETAILS ABOUT REFLECTIONS, TEXTURES, WEIGHT].",
  weather: "Take a picture and add [WEATHER EFFECT — rain, snow, fog, storm] to the scene. [ADD DETAILS ABOUT INTENSITY, LIGHTING CHANGES, ATMOSPHERE].",
  perspective: "Take a picture and change the perspective to [DESCRIBE NEW VIEWPOINT — bird's eye, worm's eye, isometric]. [ADD DETAILS ABOUT SCALE, DEPTH, DISTORTION].",
  random_even_odd: `Take a picture and transform [DESCRIBE BASE TRANSFORMATION].

SELECTION (CRITICAL):
- If an external master prompt specifies [WHAT CAN BE SPECIFIED], USE THAT
- If the RANDOM SEED ends in an EVEN number (0,2,4,6,8): SELECT Option A
- If the RANDOM SEED ends in an ODD number (1,3,5,7,9): SELECT Option B

If Option A:
[DESCRIBE WHAT HAPPENS IN OPTION A - BE SPECIFIC ABOUT VISUAL DETAILS, STYLE, SETTING, ETC.]

If Option B:
[DESCRIBE WHAT HAPPENS IN OPTION B - BE SPECIFIC ABOUT VISUAL DETAILS, STYLE, SETTING, ETC.]

[ADD ANY ADDITIONAL INSTRUCTIONS THAT APPLY TO BOTH OPTIONS - LIGHTING, QUALITY, PRESERVATION, ETC.]`,
  random_last_digit: `Take a picture and transform [DESCRIBE BASE TRANSFORMATION].

SELECTION (CRITICAL):
- If an external master prompt specifies [WHAT CAN BE SPECIFIED], USE THAT
- If none is specified, SELECT EXACTLY ONE using LAST DIGIT modulo [NUMBER 2-10]:
  - 0: [OPTION 1 DESCRIPTION]
  - 1: [OPTION 2 DESCRIPTION]
  - 2: [OPTION 3 DESCRIPTION]
  - 3: [OPTION 4 DESCRIPTION]
  - 4: [OPTION 5 DESCRIPTION]
  - 5: [OPTION 6 DESCRIPTION]
  - 6: [OPTION 7 DESCRIPTION]
  - 7: [OPTION 8 DESCRIPTION]
  - 8: [OPTION 9 DESCRIPTION]
  - 9: [OPTION 10 DESCRIPTION]

[ADD ANY ADDITIONAL INSTRUCTIONS THAT APPLY TO ALL OPTIONS]

IMPORTANT:
- Replace [NUMBER 2-10] with the actual number of options you have (between 2 and 10)
- Remove any unused option lines
- Each option should be a distinct visual variation or transformation`,
  random_last_two: `Take a picture and transform [DESCRIBE BASE TRANSFORMATION].

SELECTION (CRITICAL):
- If an external master prompt specifies [WHAT CAN BE SPECIFIED], USE THAT
- If none is specified, SELECT EXACTLY ONE using LAST TWO DIGITS modulo [NUMBER 11-99]:
  - 0: [OPTION 1 DESCRIPTION]
  - 1: [OPTION 2 DESCRIPTION]
  - 2: [OPTION 3 DESCRIPTION]
  - 3: [OPTION 4 DESCRIPTION]
  - 4: [OPTION 5 DESCRIPTION]
  - 5: [OPTION 6 DESCRIPTION]
  - 6: [OPTION 7 DESCRIPTION]
  - 7: [OPTION 8 DESCRIPTION]
  - 8: [OPTION 9 DESCRIPTION]
  - 9: [OPTION 10 DESCRIPTION]
  - 10: [OPTION 11 DESCRIPTION]

[ADD ANY ADDITIONAL INSTRUCTIONS THAT APPLY TO ALL OPTIONS]

IMPORTANT:
- Replace [NUMBER 11-99] with the actual number of options (between 11 and 99)
- Add or remove option lines to match your number of options
- Use LAST TWO DIGITS only when you have MORE than 10 options`,
  random_last_three: `Take a picture and transform [DESCRIBE BASE TRANSFORMATION].

SELECTION (CRITICAL):
- If an external master prompt specifies [WHAT CAN BE SPECIFIED], USE THAT
- If none is specified, SELECT EXACTLY ONE using LAST THREE DIGITS modulo [NUMBER 100+]:
  - 0: [OPTION 1 DESCRIPTION]
  - 1: [OPTION 2 DESCRIPTION]
  - 2: [OPTION 3 DESCRIPTION]
  (continue numbering for all your options)
  - 99: [OPTION 100 DESCRIPTION]
  - 100: [OPTION 101 DESCRIPTION]

[ADD ANY ADDITIONAL INSTRUCTIONS THAT APPLY TO ALL OPTIONS]

IMPORTANT:
- Replace [NUMBER 100+] with the actual number of options (101 or more)
- Use LAST THREE DIGITS only when you have 101 or more options`
};

// ── Additional Instruction Snippets ───────────────────────────────────
const INSTRUCTION_SNIPPETS = {
  identity: `IDENTITY PRESERVATION:\n• Subject must remain clearly recognizable\n• Do not replace the person\n• Do not alter ethnicity, age category, or core facial structure`,
  photorealistic: `Render the final result as a photorealistic, high-resolution photograph with professional-quality lighting and detail.`,
  hq: `OUTPUT QUALITY:\n• High resolution, sharp, detailed imagery\n• Professional photography lighting\n• No compression artifacts or digital noise`,
  notext: `Do not include any text, labels, watermarks, captions, UI elements, or interface graphics in the final image.`,
  colors: `Maintain the original color palette and lighting conditions of the captured scene as closely as possible.`,
  lighting: `Apply dramatic cinematic lighting with strong directional light sources, deep shadows, and rich contrast.`,
  background: `BACKGROUND TREATMENT:\n• Apply a bokeh blur to the background for subject separation\n• Keep the background contextually appropriate to the transformation`,
  composition: `COMPOSITION:\n• Maintain the original framing and perspective of the captured image\n• Subject should remain centered and prominent\n• Preserve the original aspect ratio`,
  option_reqs: `OPTION REQUIREMENTS:\nOPTION 001:\n• [Describe specific requirements for Option 001]\n• [Add visual details, style notes, special rules]\n\nOPTION 002:\n• [Describe specific requirements for Option 002]\n• [Add visual details, style notes, special rules]`,
  detail: `FINE DETAIL:\n• Maximize texture detail in [DESCRIBE AREA — e.g. fabric, skin, foliage]\n• Render fine details such as [hair strands / surface grain / micro-expressions] with high fidelity\n• Avoid over-smoothing or plastic-like rendering`,
  environment: `ENVIRONMENT INTEGRATION:\n• The subject must appear naturally embedded in the new environment\n• Match lighting direction and color temperature between subject and background\n• Add appropriate shadows, reflections, or ambient effects`,
  no_background_change: `Do not alter, replace, or significantly modify the background. Only apply changes to the foreground subject.`,
  // Additional instruction snippets
  aspect_ratio: `OUTPUT FORMAT:\n• Maintain the original aspect ratio of the captured image\n• Do not crop, stretch, or pad the image\n• Output resolution should match or exceed input resolution`,
  color_grade: `COLOR GRADING:\n• Apply [DESCRIBE COLOR GRADE — e.g. teal and orange, desaturated, warm vintage]\n• Adjust shadows toward [COLOR] and highlights toward [COLOR]\n• Maintain skin tone accuracy if subjects are present`,
  texture: `TEXTURE APPLICATION:\n• Apply [DESCRIBE TEXTURE — e.g. film grain, canvas, paper, fabric] overlay\n• Texture should be subtle and not obscure important details\n• Blend mode: [multiply/overlay/soft light] at [PERCENTAGE]% opacity`,
  depth_of_field: `DEPTH OF FIELD:\n• Apply shallow depth of field with focus on [DESCRIBE FOCUS POINT]\n• Background blur radius: [DESCRIBE INTENSITY — subtle/moderate/heavy]\n• Maintain sharp focus on primary subject elements`,
  style_consistency: `STYLE CONSISTENCY:\n• All elements must share the same artistic style\n• No mixing of photorealistic and illustrated elements\n• Maintain consistent line weight, color saturation, and detail level throughout`,
  negative_prompt: `AVOID:\n• No distorted faces or limbs\n• No text or watermarks\n• No oversaturated or neon colors unless specified\n• No blurry or low-quality output\n• No anachronistic elements`,
  framing: `FRAMING:\n• Use [DESCRIBE FRAMING — rule of thirds, centered, golden ratio]\n• Leave appropriate headroom and lead room for subjects\n• Ensure no important elements are cut off at edges`
};

// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
let db;
let editingId      = null;
let presetType     = 'simple';   // 'simple' | 'flat-options' | 'option-groups'
let selectedCats   = [];
let flatOptions    = [];         // [{uid, text}] — for Options Only type
let optionGroups   = [];         // [{uid, title, options:[{uid, text}]}] — for Option Groups type
let allPresets     = [];
let selectedIds    = new Set();
let toastTimer     = null;
let _flatOptCounter = 0;

// ════════════════════════════════════════
// INDEXEDDB
// ════════════════════════════════════════
function initDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(); };
    req.onerror   = e => reject(e.target.error);
  });
}

function dbSave(preset) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const now   = Date.now();
    let req;
    if (preset.id) {
      req = store.put({ ...preset, modified: now });
    } else {
      req = store.add({ ...preset, created: now, modified: now });
    }
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbGetAll() {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a,b) => b.created - a.created));
    req.onerror   = () => reject(req.error);
  });
}

function dbDelete(id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// ════════════════════════════════════════
// APP INIT
// ════════════════════════════════════════
async function init() {
  await initDB();
  
  // Load custom categories from database if they exist
  try {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get('__custom_categories__');
    req.onsuccess = () => {
      if (req.result && req.result.savedList) {
        req.result.savedList.forEach(cat => {
          if (!PRESET_CATEGORIES.includes(cat)) {
            PRESET_CATEGORIES.push(cat);
          }
        });
        renderCategoryChips();
      }
    };
  } catch(e) { console.log(e); }

  renderCategoryChips();
  renderFlatOptions();
  renderOptionGroups();
  allPresets = await dbGetAll();

  // Filter out the custom categories row so it doesn't try to render as a saved preset card
  allPresets = allPresets.filter(p => p.id !== '__custom_categories__');

  renderPresetList();
  document.getElementById('search-input').addEventListener('input', e => {
    renderPresetList(e.target.value.trim());
  });
  document.getElementById('custom-cat-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCategory();
    }
  });

  // Initialize enhanced interactions
  initParticles();
  initRippleEffects();
}

// ════════════════════════════════════════
// ENHANCED INTERACTIONS
// ════════════════════════════════════════

// Subtle background particles
function initParticles() {
  const container = document.getElementById('particles-bg');
  if (!container) return;
  
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDuration = (15 + Math.random() * 20) + 's';
    particle.style.animationDelay = (Math.random() * 10) + 's';
    particle.style.width = (1 + Math.random() * 2) + 'px';
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

// Ripple effect on buttons
function initRippleEffects() {
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
}

// ════════════════════════════════════════
// TYPE SELECTOR
// ════════════════════════════════════════
function setType(type) {
  presetType = type;
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === type);
  });

  const isFlat   = type === 'flat-options';
  const isGroups = type === 'option-groups';
  const hasOpts  = isFlat || isGroups;

  document.getElementById('randomize-section').classList.toggle('hidden', !hasOpts);
  document.getElementById('flat-options-section').classList.toggle('hidden', !isFlat);
  document.getElementById('option-groups-section').classList.toggle('hidden', !isGroups);
  document.getElementById('additional-section').classList.toggle('hidden', isGroups);

  const hints = {
    'simple':       'Simple prompt with no options. Exports with <code style="font-family:var(--font-code);font-size:11px;color:var(--orange);">options:[]</code>',
    'flat-options': 'Flat list of selectable options. No group titles. Exports with <code style="font-family:var(--font-code);font-size:11px;color:var(--orange);">options:[{id,text}]</code>',
    'option-groups':'Named option groups each containing multiple options. Exports with <code style="font-family:var(--font-code);font-size:11px;color:var(--orange);">optionGroups:[{title,options}]</code>'
  };
  document.getElementById('type-hint').innerHTML = hints[type] || '';

  if (isFlat && flatOptions.length === 0) addFlatOption();
  if (isGroups && optionGroups.length === 0) addOptionGroup();
}

// ════════════════════════════════════════
// TEMPLATE CHIP HANDLERS
// ════════════════════════════════════════
function applyMsgTemplate(key) {
  const tmpl = PRESET_TEMPLATES[key];
  if (!tmpl) return;
  const ta = document.getElementById('preset-message');
  if (ta.value.trim() && !confirm('Replace the current message with the template?')) return;
  ta.value = tmpl;
  ta.focus();
  ta.setSelectionRange(0, 0);
  showToast('Template inserted — replace the [BRACKETED] parts.', 'success');
}

function appendInstr(key) {
  const snippet = INSTRUCTION_SNIPPETS[key];
  if (!snippet) return;
  const ta = document.getElementById('preset-additional');
  const cur = ta.value.trim();
  ta.value = cur ? cur + '\n\n' + snippet : snippet;
  ta.focus();
  showToast('Snippet appended.', 'success');
}

function clearField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.value.trim() && !confirm('Clear this field?')) return;
  el.value = '';
  el.focus();
}

// ════════════════════════════════════════
// CATEGORIES
// ════════════════════════════════════════
function renderCategoryChips() {
  const container = document.getElementById('cat-chips');
  container.innerHTML = '';

  PRESET_CATEGORIES.forEach(cat => {
    const isSelected = selectedCats.includes(cat);

    const chip = document.createElement('span');
    chip.className = `cat-chip ${isSelected ? 'selected' : ''}`;
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '6px';

    const textSpan = document.createElement('span');
    textSpan.textContent = cat;
    textSpan.style.cursor = 'pointer';
    textSpan.addEventListener('click', () => toggleCat(cat));
    chip.appendChild(textSpan);

    // CORE_CATEGORIES is the permanent snapshot defined at the top of the file.
    // Any category NOT in it is a custom one the user created.
    const isCustom = !CORE_CATEGORIES.includes(cat);

    if (isCustom) {
      const deleteBtn = document.createElement('span');
      deleteBtn.innerHTML = '&times;';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.fontWeight = 'bold';
      deleteBtn.style.padding = '0 2px';
      deleteBtn.style.color = 'var(--red)';
      deleteBtn.style.opacity = '0.7';

      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // Remove from the master list using splice (works with let arrays)
        const idx = PRESET_CATEGORIES.indexOf(cat);
        if (idx !== -1) PRESET_CATEGORIES.splice(idx, 1);

        // Remove from the selected list if it was selected
        const sidx = selectedCats.indexOf(cat);
        if (sidx !== -1) selectedCats.splice(sidx, 1);

        // Save only the custom categories to IndexedDB
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put({
          id: '__custom_categories__',
          savedList: PRESET_CATEGORIES.filter(c => !CORE_CATEGORIES.includes(c))
        });

        renderCategoryChips();
        renderSelectedCats();
        showToast('Custom category removed permanently.', 'info');
      });
      chip.appendChild(deleteBtn);
    }

    container.appendChild(chip);
  });
}

function removeCustomCategoryFromApp(categoryName) {
  // Remove from the master list using splice (works with let arrays)
  const idx = PRESET_CATEGORIES.indexOf(categoryName);
  if (idx !== -1) PRESET_CATEGORIES.splice(idx, 1);

  // Remove from the selected list if it was selected
  const sidx = selectedCats.indexOf(categoryName);
  if (sidx !== -1) selectedCats.splice(sidx, 1);

  // Save only the custom categories to IndexedDB
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).put({
    id: '__custom_categories__',
    savedList: PRESET_CATEGORIES.filter(c => !CORE_CATEGORIES.includes(c))
  });

  renderCategoryChips();
  renderSelectedCats();
  showToast('Custom category deleted successfully.', 'info');
}

function toggleCat(cat) {
  if (selectedCats.includes(cat)) {
    selectedCats = selectedCats.filter(c => c !== cat);
  } else {
    selectedCats.push(cat);
  }
  renderCategoryChips();
  renderSelectedCats();
}

function renderSelectedCats() {
  const container = document.getElementById('selected-cats');
  if (selectedCats.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = selectedCats.map(cat => `
    <span class="selected-cat-tag">
      ${cat}
      <button onclick="toggleCat('${cat.replace(/'/g,"\\'")}')">×</button>
    </span>
  `).join('');
}

function addCustomCategory() {
  const input = document.getElementById('custom-cat-input');
  // Enforce consistent uppercase syntax across the app environment
  const val = input.value.trim().toUpperCase(); 
  if (!val) return;

  // Stop attempts to recreate built-in categories
  if (CORE_CATEGORIES.includes(val)) {
    showToast('This category is built into the system core.', 'error');
    input.value = '';
    return;
  }

  // Inject unique items into memory array and synchronize DB row
  if (!PRESET_CATEGORIES.includes(val)) {
    PRESET_CATEGORIES.push(val);
    
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({
      id: '__custom_categories__',
      savedList: PRESET_CATEGORIES.filter(c => !CORE_CATEGORIES.includes(c))
    });
  }

  if (!selectedCats.includes(val)) {
    selectedCats.push(val);
    renderSelectedCats();
  }
  
  renderCategoryChips();
  input.value = '';
}

// ════════════════════════════════════════
// FLAT OPTIONS (Options Only type)
// ════════════════════════════════════════
function addFlatOption() {
  flatOptions.push({ uid: ++_flatOptCounter, text: '' });
  renderFlatOptions();
}

function removeFlatOption(idx) {
  flatOptions.splice(idx, 1);
  renderFlatOptions();
}

function onFlatOptInput(idx, val) {
  if (flatOptions[idx]) flatOptions[idx].text = val;
}

function syncFlatOptionsFromDOM() {
  document.querySelectorAll('.flat-opt-input').forEach(el => {
    const idx = parseInt(el.dataset.idx);
    if (flatOptions[idx] !== undefined) flatOptions[idx].text = el.value;
  });
}

function renderFlatOptions() {
  syncFlatOptionsFromDOM();
  const container = document.getElementById('flat-options-container');
  if (!container) return;
  container.innerHTML = flatOptions.map((opt, idx) => `
    <div class="option-item">
      <span class="option-id-badge">${String(idx + 1).padStart(3,'0')}</span>
      <input type="text" class="flat-opt-input option-text-input"
             placeholder="Option description..."
             value="${escHtml(opt.text)}"
             data-idx="${idx}"
             oninput="onFlatOptInput(${idx}, this.value)">
      <button class="btn-remove-option" onclick="removeFlatOption(${idx})" title="Remove option">×</button>
    </div>
  `).join('');
}

// ════════════════════════════════════════
// OPTION GROUPS
// ════════════════════════════════════════
let _groupCounter  = 0;
let _optionCounter = 0;

function addOptionGroup() {
  optionGroups.push({ uid: ++_groupCounter, title: '', options: [] });
  addOption(optionGroups.length - 1);
  renderOptionGroups();
}

function removeGroup(gIdx) {
  optionGroups.splice(gIdx, 1);
  renderOptionGroups();
}

function addOption(gIdx) {
  optionGroups[gIdx].options.push({ uid: ++_optionCounter, text: '' });
  renderOptionGroups();
}

function removeOption(gIdx, oIdx) {
  optionGroups[gIdx].options.splice(oIdx, 1);
  renderOptionGroups();
}

function renderOptionGroups() {
  const container = document.getElementById('option-groups-container');

  // Save current input values before re-rendering
  syncGroupsFromDOM();

  // Compute global option counter for IDs
  let globalIdx = 1;
  const groupsHTML = optionGroups.map((group, gIdx) => {
    const optionsHTML = group.options.map((opt, oIdx) => {
      const idStr = String(globalIdx++).padStart(3, '0');
      opt._idPreview = idStr;
      return `
        <div class="option-item" data-g="${gIdx}" data-o="${oIdx}">
          <span class="option-id-badge">${idStr}</span>
          <input type="text" class="option-text-input"
                 placeholder="Option description..."
                 value="${escHtml(opt.text)}"
                 data-g="${gIdx}" data-o="${oIdx}"
                 oninput="onOptionInput(${gIdx},${oIdx},this.value)">
          <button class="btn-remove-option" onclick="removeOption(${gIdx},${oIdx})"
                  title="Remove option">×</button>
        </div>
      `;
    }).join('');

    return `
      <div class="option-group-card" data-g="${gIdx}">
        <div class="group-header">
          <span class="group-num">Group ${gIdx + 1}</span>
          <input type="text" class="group-title-input"
                 placeholder="GROUP TITLE (e.g. COLOR STYLE)"
                 value="${escHtml(group.title)}"
                 oninput="onGroupTitleInput(${gIdx},this.value)">
          <button class="btn-remove-group" onclick="removeGroup(${gIdx})" title="Remove group">×</button>
        </div>
        <div class="group-options">
          ${optionsHTML}
          <button class="btn-add-option" onclick="addOption(${gIdx})">
            ＋ Add Option
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = groupsHTML;
}

function onGroupTitleInput(gIdx, val) {
  if (optionGroups[gIdx]) optionGroups[gIdx].title = val;
}

function onOptionInput(gIdx, oIdx, val) {
  if (optionGroups[gIdx] && optionGroups[gIdx].options[oIdx]) {
    optionGroups[gIdx].options[oIdx].text = val;
  }
}

function syncGroupsFromDOM() {
  // Pull current values from DOM inputs before any re-render
  document.querySelectorAll('.group-title-input').forEach(el => {
    const g = parseInt(el.closest('[data-g]').dataset.g);
    if (optionGroups[g] !== undefined) optionGroups[g].title = el.value;
  });
  document.querySelectorAll('.option-text-input').forEach(el => {
    const g = parseInt(el.dataset.g);
    const o = parseInt(el.dataset.o);
    if (optionGroups[g] && optionGroups[g].options[o]) {
      optionGroups[g].options[o].text = el.value;
    }
  });
}

// ════════════════════════════════════════
// BUILD JSON OBJECT
// ════════════════════════════════════════
function buildPresetObject() {
  const name = document.getElementById('preset-name').value.trim().toUpperCase();
  const msg  = document.getElementById('preset-message').value.trim();

  if (!name)               { showToast('Preset name is required.', 'error');    return null; }
  if (selectedCats.length === 0) { showToast('Select at least one category.', 'error'); return null; }
  if (!msg)                { showToast('Message / Prompt is required.', 'error'); return null; }

  // ── SIMPLE ─────────────────────────────────
  if (presetType === 'simple') {
    return {
      name,
      category: [...selectedCats],
      message: msg,
      options: [],
      randomizeOptions: false,
      additionalInstructions: document.getElementById('preset-additional').value.trim()
    };
  }

  // ── OPTIONS ONLY (flat) ─────────────────────
  if (presetType === 'flat-options') {
    syncFlatOptionsFromDOM();
    const filled = flatOptions.filter(o => o.text.trim());
    if (filled.length === 0) { showToast('Add at least one option.', 'error'); return null; }
    let id = 1;
    return {
      name,
      category: [...selectedCats],
      message: msg,
      options: filled.map(o => ({ id: String(id++).padStart(3,'0'), text: o.text.trim() })),
      randomizeOptions: true,
      additionalInstructions: document.getElementById('preset-additional').value.trim()
    };
  }

  // ── OPTION GROUPS ───────────────────────────
  syncGroupsFromDOM();
  if (optionGroups.length === 0) { showToast('Add at least one option group.', 'error'); return null; }
  for (let g = 0; g < optionGroups.length; g++) {
    const grp = optionGroups[g];
    if (!grp.title.trim()) { showToast(`Option Group ${g+1} needs a title.`, 'error'); return null; }
    if (!grp.options.some(o => o.text.trim())) { showToast(`Option Group "${grp.title}" needs at least one option.`, 'error'); return null; }
  }
  let globalId = 1;
  return {
    name,
    category: [...selectedCats],
    message: msg,
    randomizeOptions: true,
    optionGroups: optionGroups.map(grp => ({
      title: grp.title.trim().toUpperCase(),
      options: grp.options.filter(o => o.text.trim()).map(o => ({
        id: String(globalId++).padStart(3,'0'),
        text: o.text.trim()
      }))
    }))
  };
}

// ════════════════════════════════════════
// SAVE / EDIT / DELETE
// ════════════════════════════════════════
async function savePreset() {
  const obj = buildPresetObject();
  if (!obj) return;

  try {
    const record = editingId
      ? { ...obj, id: editingId }
      : obj;

    await dbSave(record);
    allPresets = await dbGetAll();
    allPresets = allPresets.filter(p => p.id !== '__custom_categories__');
    renderPresetList();
    resetForm();
    showToast(editingId ? 'Preset updated!' : 'Preset saved!', 'success');
  } catch (err) {
    showToast('Save failed: ' + err.message, 'error');
  }
}

function editPreset(id) {
  const preset = allPresets.find(p => p.id === id);
  if (!preset) return;

  editingId = id;

  document.getElementById('preset-name').value    = preset.name || '';
  document.getElementById('preset-message').value = preset.message || '';
  document.getElementById('preset-additional').value = preset.additionalInstructions || '';
  document.getElementById('save-btn-text').textContent = '💾 Update Preset';
  document.getElementById('cancel-btn').classList.remove('hidden');
  document.getElementById('edit-mode-badge').classList.remove('hidden');

  selectedCats = [...(preset.category || [])];
  renderCategoryChips();
  renderSelectedCats();

  // Detect type from the saved preset structure
  const hasGroups   = !!(preset.optionGroups && preset.optionGroups.length);
  const hasFlatOpts = !!(preset.options && preset.options.length);

  if (hasGroups) {
    setType('option-groups');
    optionGroups = preset.optionGroups.map(g => ({
      uid: ++_groupCounter,
      title: g.title || '',
      options: (g.options || []).map(o => ({ uid: ++_optionCounter, text: o.text || '' }))
    }));
    renderOptionGroups();
  } else if (hasFlatOpts) {
    setType('flat-options');
    flatOptions = preset.options.map(o => ({ uid: ++_flatOptCounter, text: o.text || '' }));
    renderFlatOptions();
  } else {
    setType('simple');
    flatOptions   = [];
    optionGroups  = [];
  }

  document.getElementById('builder-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deletePreset(id) {
  if (!confirm('Delete this preset? This cannot be undone.')) return;
  try {
    // Add removing animation
    const card = document.querySelector(`.preset-card[data-id="${id}"]`);
    if (card) {
      card.classList.add('removing');
      await new Promise(resolve => setTimeout(resolve, 280));
    }
    
    await dbDelete(id);
    selectedIds.delete(id);
    allPresets = await dbGetAll();
    allPresets = allPresets.filter(p => p.id !== '__custom_categories__');
    renderPresetList();
    updateExportBar();
    showToast('Preset deleted.', 'success');
  } catch (err) {
    showToast('Delete failed: ' + err.message, 'error');
  }
}

function cancelEdit() {
  editingId = null;
  resetForm();
}

function resetForm() {
  editingId = null;
  presetType = 'simple';
  selectedCats = [];
  flatOptions  = [];
  optionGroups = [];

  document.getElementById('preset-name').value        = '';
  document.getElementById('preset-message').value     = '';
  document.getElementById('preset-additional').value  = '';
  document.getElementById('save-btn-text').textContent = '💾 Save Preset';
  document.getElementById('cancel-btn').classList.add('hidden');
  document.getElementById('edit-mode-badge').classList.add('hidden');

  // Reset sections
  document.getElementById('randomize-section').classList.add('hidden');
  document.getElementById('flat-options-section').classList.add('hidden');
  document.getElementById('option-groups-section').classList.add('hidden');
  document.getElementById('additional-section').classList.remove('hidden');

  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.type === 'simple');
  });
  document.getElementById('type-hint').innerHTML = 'Simple prompt with no options. Exports with <code style="font-family:var(--font-code);font-size:11px;color:var(--orange);">options:[]</code>';
  document.getElementById('flat-options-container').innerHTML  = '';
  document.getElementById('option-groups-container').innerHTML = '';

  renderCategoryChips();
  renderSelectedCats();
}

// ════════════════════════════════════════
// PRESET LIST
// ════════════════════════════════════════
function renderPresetList(search = '') {
  const container = document.getElementById('presets-list');
  const count     = document.getElementById('presets-count');

  let filtered = allPresets;
  if (search) {
    const q = search.toLowerCase();
    filtered = allPresets.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.category || []).some(c => c.toLowerCase().includes(q))
    );
  }

  count.textContent = allPresets.length;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${search ? '<i class="fa-solid fa-magnifying-glass"></i>' : '<i class="fa-solid fa-layer-group"></i>'}</div>
        <h3>${search ? 'No Results' : 'No Presets Yet'}</h3>
        <p>${search ? `No presets match "${escHtml(search)}".` : 'Build your first preset above and it will appear here.'}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const isSelected = selectedIds.has(p.id);
    const hasGroups  = !!(p.optionGroups && p.optionGroups.length);
    const hasFlatOpts = !!(p.options && p.options.length);

    let badgeClass, badgeText, statsText;
    if (hasGroups) {
      const gc = p.optionGroups.length;
      const oc = p.optionGroups.reduce((s,g) => s + (g.options||[]).length, 0);
      badgeClass = 'options'; badgeText = 'OPTION GROUPS';
      statsText  = `${gc} group${gc!==1?'s':''} · ${oc} option${oc!==1?'s':''}`;
    } else if (hasFlatOpts) {
      const oc = p.options.length;
      badgeClass = 'flat'; badgeText = 'OPTIONS ONLY';
      statsText  = `${oc} option${oc!==1?'s':''}`;
    } else {
      badgeClass = 'standard'; badgeText = 'SIMPLE';
      statsText  = 'Simple preset';
    }

    const cats = (p.category || []).map(c =>
      `<span class="preset-cat-pill">${escHtml(c)}</span>`
    ).join('');

    return `
      <div class="preset-card ${isSelected ? 'selected' : ''}" data-id="${p.id}">
        <div class="preset-checkbox ${isSelected ? 'checked' : ''}"
             onclick="toggleSelect(${p.id})"></div>
        <div class="preset-card-body">
          <div class="preset-card-top">
            <span class="preset-name">${escHtml(p.name)}</span>
            <span class="type-badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="preset-meta">
            <div class="preset-cats">${cats}</div>
            <span class="preset-stats">${statsText}</span>
          </div>
        </div>
        <div class="preset-card-actions">
          <button class="icon-btn edit" onclick="editPreset(${p.id})"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
          <button class="icon-btn delete" onclick="deletePreset(${p.id})"><i class="fa-solid fa-trash-can"></i> Del</button>
        </div>
      </div>
    `;
  }).join('');
}

// ════════════════════════════════════════
// SELECTION & EXPORT
// ════════════════════════════════════════
function toggleSelect(id) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
  // Toggle card & checkbox classes without full re-render
  const card = document.querySelector(`.preset-card[data-id="${id}"]`);
  if (card) {
    card.classList.toggle('selected', selectedIds.has(id));
    card.querySelector('.preset-checkbox').classList.toggle('checked', selectedIds.has(id));
  }
  updateExportBar();
}

function toggleSelectAll() {
  const allIds = allPresets.map(p => p.id);
  if (selectedIds.size === allIds.length) {
    deselectAll();
  } else {
    allIds.forEach(id => selectedIds.add(id));
    renderPresetList(document.getElementById('search-input').value.trim());
    updateExportBar();
  }
}

function deselectAll() {
  selectedIds.clear();
  renderPresetList(document.getElementById('search-input').value.trim());
  updateExportBar();
}

function updateExportBar() {
  const bar   = document.getElementById('export-bar');
  const badge = document.getElementById('selected-count');
  const n     = selectedIds.size;
  badge.textContent = n;
  bar.classList.toggle('hidden', n === 0);
}

function exportJSON() {
  if (selectedIds.size === 0) { showToast('Select at least one preset.', 'error'); return; }

  const selected = allPresets.filter(p => selectedIds.has(p.id));

  // Strip internal fields, produce clean output
  const out = selected.map(p => {
    const clean = { ...p };
    delete clean.id;
    delete clean.created;
    delete clean.modified;
    return clean;
  });

  let filename = document.getElementById('filename-input').value.trim() || 'my-presets';
  // Sanitize filename
  filename = filename.replace(/[^a-z0-9_\-]/gi, '-').replace(/-+/g, '-');
  if (!filename) filename = 'my-presets';

  const json = JSON.stringify(out, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename + '.json';
  a.click();
  URL.revokeObjectURL(url);

  showToast(`Exported ${selected.length} preset${selected.length !== 1 ? 's' : ''} as ${filename}.json`, 'success');
}

// ════════════════════════════════════════
// GITHUB GUIDE — ACCORDION
// ════════════════════════════════════════
function toggleStep(id) {
  const el = document.getElementById(id);
  const isOpen = el.classList.contains('open');
  // Close all
  document.querySelectorAll('.guide-step').forEach(s => s.classList.remove('open'));
  // Open clicked if it was closed
  if (!isOpen) el.classList.add('open');
}

// ════════════════════════════════════════
// NAV SCROLL
// ════════════════════════════════════════
function scrollToSection(selector) {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

const SECTIONS = ['builder-section', 'presets-section', 'github-section'];

function updateActiveNav() {
  const threshold = 120;
  let activeIdx = 0;

  for (let i = SECTIONS.length - 1; i >= 0; i--) {
    const el = document.getElementById(SECTIONS[i]);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= threshold) {
        activeIdx = i;
        break;
      }
    }
  }

  // Also catch if the user scrolls near the absolute bottom of the page
  if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 20) {
    activeIdx = SECTIONS.length - 1;
  }

  document.querySelectorAll('.nav-btn').forEach((b, i) => {
    b.classList.toggle('active', i === activeIdx);
  });
}

window.addEventListener('scroll', updateActiveNav, { passive: true });
window.addEventListener('resize', updateActiveNav, { passive: true });
updateActiveNav(); // set correct highlight on page load

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  // Add icon based on type
  let icon = '';
  if (type === 'success') icon = '<i class="fa-solid fa-circle-check"></i> ';
  else if (type === 'error') icon = '<i class="fa-solid fa-circle-xmark"></i> ';
  else icon = '<i class="fa-solid fa-circle-info"></i> ';
  
  el.innerHTML = icon + msg;
  el.className = `show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 3200);
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// ════════════════════════════════════════
// START
// ════════════════════════════════════════
init().catch(err => console.error('Init failed:', err));
