/* Sabine Research Desk 95 — original human-facing application shell. */
'use strict';

(() => {
  const D = window.SABINE_RESEARCH_DESK;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const workspace = $('#workspace');
  const statusMessage = $('#statusMessage');
  const routeStatus = $('#routeStatus');
  const progressStatus = $('#progressStatus');
  const networkStatus = $('#networkStatus');
  const bookmarkButton = $('#bookmarkButton');
  const studyButton = $('#studyButton');
  const themeButton = $('#themeButton');
  const searchDialog = $('#searchDialog');
  const globalSearch = $('#globalSearch');
  const searchResults = $('#searchResults');
  const toast = $('#toast');

  if (!D || !workspace) {
    if (workspace) {
      workspace.innerHTML = '<article class="document-window"><div class="document-body"><h1>Research data unavailable</h1><p>The generated public snapshot could not be loaded.</p></div></article>';
    }
    return;
  }

  const escapeHTML = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
  const normalize = (value) => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();
  const titleCase = (value) => String(value ?? '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const safeExternalLink = (url, label) => `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHTML(label)}</a>`;

  const papers = D.publications.publications;
  const focusAreas = [...D.research.focus_areas].sort((a, b) => a.priority - b.priority);
  const sources = D.sources.sources;
  const paperById = new Map(papers.map((paper) => [paper.id, paper]));
  const focusById = new Map(focusAreas.map((focus) => [focus.id, focus]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const STORAGE = {
    favourites: 'sabine-desk-favourites-v1',
    reviewed: 'sabine-desk-reviewed-v1',
    briefPapers: 'sabine-desk-brief-papers-v1',
    theme: 'sabine-desk-theme-v1'
  };

  const loadSet = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (_) {
      return new Set();
    }
  };
  const saveSet = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify([...value].sort()));
    } catch (_) {
      setStatus('Local preferences are unavailable in this browser');
    }
  };

  const state = {
    favourites: loadSet(STORAGE.favourites),
    reviewed: loadSet(STORAGE.reviewed),
    briefPapers: loadSet(STORAGE.briefPapers),
    route: { name: 'home', id: null },
    toastTimer: null
  };

  function setStatus(message) {
    statusMessage.textContent = message;
  }

  function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function navigate(route) {
    const next = `#/${route.replace(/^\/+/, '')}`;
    if (location.hash === next) {
      renderRoute();
    } else {
      location.hash = next;
    }
  }

  function decodeRoutePart(part) {
    try {
      return decodeURIComponent(part);
    } catch (_) {
      return null;
    }
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, '') || 'home';
    const decoded = raw.split('/').map(decodeRoutePart);
    if (decoded.includes(null)) return { name: 'not-found', id: null };
    const [name, ...rest] = decoded;
    return { name: name || 'home', id: rest.join('/') || null };
  }

  function routeTitle(route = state.route) {
    if (route.name === 'focus' && focusById.has(route.id)) return focusById.get(route.id).label;
    if (route.name === 'paper' && paperById.has(route.id)) return paperById.get(route.id).title;
    if (route.name === 'papers' && route.id) return titleCase(route.id);
    return ({
      home: 'Home', work: 'Public research snapshot', papers: 'Selected papers',
      atlas: 'Concept atlas', brief: 'Research brief', sources: 'Source desk', help: 'Help and boundaries'
    })[route.name] || 'Not found';
  }

  function currentRecordKey() {
    if (state.route.name === 'focus' && focusById.has(state.route.id)) return `focus:${state.route.id}`;
    if (state.route.name === 'paper' && paperById.has(state.route.id)) return `paper:${state.route.id}`;
    return null;
  }

  function recordLabel(key) {
    const [kind, id] = key.split(':');
    if (kind === 'focus') return focusById.get(id)?.label || id;
    if (kind === 'paper') return paperById.get(id)?.title || id;
    return key;
  }

  function recordRoute(key) {
    const [kind, id] = key.split(':');
    return `${kind}/${id}`;
  }

  function updateChrome() {
    const key = currentRecordKey();
    bookmarkButton.disabled = !key;
    studyButton.disabled = !key;
    bookmarkButton.setAttribute('aria-pressed', key && state.favourites.has(key) ? 'true' : 'false');
    studyButton.setAttribute('aria-pressed', key && state.reviewed.has(key) ? 'true' : 'false');
    bookmarkButton.querySelector('span').textContent = key && state.favourites.has(key) ? '★' : '☆';
    routeStatus.textContent = routeTitle();
    progressStatus.textContent = `${[...state.reviewed].filter((keyName) => keyName.startsWith('paper:')).length} papers reviewed`;
    $$('[data-route]').forEach((button) => {
      const active = button.dataset.route === state.route.name || (button.dataset.route === 'work' && state.route.name === 'focus');
      if (active) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    renderContentsTree();
  }

  function renderContentsTree() {
    const current = `${state.route.name}${state.route.id ? `/${state.route.id}` : ''}`;
    const general = [
      ['home', 'Start here'], ['work', 'Public research snapshot'], ['papers', 'Selected papers'],
      ['atlas', 'Concept atlas'], ['brief', 'Build a research brief'], ['sources', 'Source desk'], ['help', 'Help and boundaries']
    ];
    const link = (route, label) => `<button class="tree-link" type="button" data-nav="${escapeHTML(route)}"${current === route ? ' aria-current="page"' : ''}>${escapeHTML(label)}</button>`;
    $('#contentsTree').innerHTML = `
      <section class="tree-group"><h2 class="tree-heading">Desk</h2>${general.map(([route, label]) => link(route, label)).join('')}</section>
      <section class="tree-group"><h2 class="tree-heading">Research themes</h2>${focusAreas.map((focus) => link(`focus/${focus.id}`, focus.label)).join('')}</section>
      <section class="tree-group"><h2 class="tree-heading">Paper index</h2>${papers.map((paper) => link(`paper/${paper.id}`, `${paper.year} · ${paper.title}`)).join('')}</section>`;
    renderFavourites();
  }

  function renderFavourites() {
    const list = $('#favoritesList');
    const keys = [...state.favourites].filter((key) => key.startsWith('focus:') || key.startsWith('paper:'));
    list.innerHTML = keys.length
      ? keys.map((key) => `<button class="favourite-link" type="button" data-nav="${escapeHTML(recordRoute(key))}">${escapeHTML(recordLabel(key))}</button>`).join('')
      : '<p class="empty-state">Open a focus area or paper and choose Favourite.</p>';
  }

  function shell(eyebrow, title, lead, body) {
    return `<article class="document-window">
      <header class="document-title"><p class="eyebrow">${escapeHTML(eyebrow)}</p><h1>${escapeHTML(title)}</h1><p>${escapeHTML(lead)}</p></header>
      <div class="document-body">${body}</div>
    </article>`;
  }

  function paperCard(paper) {
    const source = sourceById.get(paper.id);
    return `<article class="paper-card">
      <p class="eyebrow">${escapeHTML(paper.year)} · ${escapeHTML(paper.status.replaceAll('_', ' '))}</p>
      <h3>${escapeHTML(paper.title)}</h3>
      <p>${escapeHTML(paper.summary)}</p>
      <p><small>Claim-local source: ${safeExternalLink(source?.url || paper.url, source ? sourceLabel(source) : 'public paper record')}</small></p>
      <div class="metadata">${paper.relevance.slice(0, 4).map((tag) => `<span class="pill">${escapeHTML(titleCase(tag))}</span>`).join('')}</div>
      <button type="button" data-nav="paper/${escapeHTML(paper.id)}">Open paper record</button>
    </article>`;
  }

  function renderHome() {
    const claims = D.profile.claims.map((claim) => {
      const claimSources = claim.sources
        .map((sourceId) => sourceById.get(sourceId))
        .filter(Boolean)
        .map((source) => safeExternalLink(source.url, sourceLabel(source)))
        .join('; ');
      return `<li>${escapeHTML(claim.claim)}<br><small>Claim-local sources: ${claimSources}</small></li>`;
    }).join('');
    const body = `
      <div class="human-boundary"><strong>Unofficial, human-facing edition.</strong> This desk is built only from public records. It is not authored or endorsed by Sabine Hossenfelder, and it does not infer private views or unpublished work.</div>
      <h2>What would you like to do?</h2>
      <div class="card-grid">
        <article class="feature-card"><span class="card-icon" aria-hidden="true">⌁</span><h3>See the public research snapshot</h3><p>Four sourced themes, each linked to the papers loaded for that theme.</p><button type="button" data-nav="work">Open current themes</button></article>
        <article class="feature-card"><span class="card-icon" aria-hidden="true">▤</span><h3>Find a paper</h3><p>Browse exact arXiv revisions, journal identifiers, short summaries, and concept tags.</p><button type="button" data-nav="papers">Open paper index</button></article>
        <article class="feature-card"><span class="card-icon" aria-hidden="true">⌘</span><h3>Build a research brief</h3><p>Select the minimum relevant papers, describe the question, then copy or download a packet.</p><button type="button" data-nav="brief">Open brief builder</button></article>
        <article class="feature-card"><span class="card-icon" aria-hidden="true">◎</span><h3>Check the evidence</h3><p>See which official, institutional, arXiv, and journal records support this snapshot.</p><button type="button" data-nav="sources">Open source desk</button></article>
      </div>
      <h2>At a glance</h2>
      <ul class="plain-list">${claims}</ul>
      <p><strong>Snapshot date:</strong> ${escapeHTML(D.research.snapshot_date)}. This is a selective public research aid, not a complete or continuously live account of anyone's work.</p>`;
    workspace.innerHTML = shell('Welcome', 'Everything in one research desk', 'Browse the public context like a 1990s multimedia encyclopedia—without cloning a repository, running code, or learning GitHub.', body);
  }

  function renderWork() {
    const cards = focusAreas.map((focus) => `<article class="focus-card">
      <p class="eyebrow">Priority ${escapeHTML(focus.priority)} · ${escapeHTML(focus.papers.length)} selected papers</p>
      <h3>${escapeHTML(focus.label)}</h3>
      <p>${escapeHTML(focus.description)}</p>
      <button type="button" data-nav="focus/${escapeHTML(focus.id)}">Open research theme</button>
    </article>`).join('');
    const body = `
      <div class="source-boundary"><strong>Selective, not exhaustive.</strong> These themes reproduce the repository's source-attributed snapshot as of ${escapeHTML(D.research.snapshot_date)}. A neighbouring supported statement does not make an unsupported statement true.</div>
      <div class="card-grid">${cards}</div>
      <h2>How this page stays honest</h2>
      <p>Every theme keeps its own paper links and public basis. Labels such as “current” refer only to the cited public pages and verification date; they are not claims about private plans or unpublished work.</p>`;
    workspace.innerHTML = shell('Public research context', 'Research themes', 'A readable map of the areas selected by the canonical context pack.', body);
  }

  function renderFocus(id) {
    const focus = focusById.get(id);
    if (!focus) return renderNotFound();
    const linked = focus.papers.map((paperId) => paperById.get(paperId)).filter(Boolean);
    const basis = D.research.basis.map((sourceId) => {
      const source = sourceById.get(sourceId);
      return source ? `<li>${safeExternalLink(source.url, sourceLabel(source))}</li>` : '';
    }).join('');
    const body = `
      <div class="source-boundary"><strong>Membership only.</strong> A paper appears here because the canonical focus record links it to this theme. That link does not claim that every result in the paper is established, nor that the list is exhaustive.</div>
      <p>${escapeHTML(focus.description)}</p>
      <div class="document-actions">
        <button type="button" data-action="select-focus" data-focus-id="${escapeHTML(focus.id)}">Add this theme's papers to Research Brief</button>
        <button type="button" data-nav="atlas/${escapeHTML(focus.id)}">View in concept atlas</button>
      </div>
      <h2>Selected papers</h2>
      <div class="card-grid">${linked.map(paperCard).join('')}</div>
      <h2>Public basis for the snapshot</h2>
      <ul class="source-list">${basis}</ul>`;
    workspace.innerHTML = shell(`Research theme · Priority ${focus.priority}`, focus.label, 'Source-attributed context, kept separate from private or inferred research plans.', body);
  }

  function renderPapers(filter) {
    const visible = filter ? papers.filter((paper) => paper.relevance.includes(filter)) : papers;
    const title = filter ? `Papers tagged “${titleCase(filter)}”` : 'Selected paper index';
    const body = `
      <div class="source-boundary"><strong>Selected registry, not a complete bibliography.</strong> Exact arXiv revisions are preserved. Check the live primary source before making a current-status claim.</div>
      ${filter ? '<div class="document-actions"><button type="button" data-nav="papers">Show all selected papers</button></div>' : ''}
      <div class="card-grid">${visible.length ? visible.map(paperCard).join('') : '<p>No selected paper carries this tag.</p>'}</div>`;
    workspace.innerHTML = shell('Reference shelf', title, `${visible.length} public paper record${visible.length === 1 ? '' : 's'} in this view.`, body);
  }

  function renderPaper(id) {
    const paper = paperById.get(id);
    if (!paper) return renderNotFound();
    const authors = paper.authors.join(', ');
    const source = sourceById.get(paper.id);
    const doi = paper.doi ? safeExternalLink(`https://doi.org/${paper.doi}`, paper.doi) : 'Not listed';
    const tags = paper.relevance.map((tag) => `<button class="pill" type="button" data-nav="papers/${escapeHTML(tag)}">${escapeHTML(titleCase(tag))}</button>`).join('');
    const inBrief = state.briefPapers.has(paper.id);
    const body = `
      <div class="source-boundary"><strong>Cached public record.</strong> This summary is an orientation aid, not a substitute for reading the paper. Its epistemic state is ${escapeHTML(paper.epistemic_state)} and the link is pinned to an exact public revision where available.</div>
      <table class="snapshot-table"><tbody>
        <tr><th scope="row">Authors</th><td>${escapeHTML(authors)}</td></tr>
        <tr><th scope="row">Year</th><td>${escapeHTML(paper.year)}</td></tr>
        <tr><th scope="row">Status</th><td>${escapeHTML(titleCase(paper.status))}</td></tr>
        <tr><th scope="row">ArXiv</th><td>${paper.arxiv ? escapeHTML(`${paper.arxiv}${paper.arxiv_version}`) : 'Not listed'}</td></tr>
        <tr><th scope="row">Journal</th><td>${escapeHTML(paper.journal || 'Not listed')}</td></tr>
        <tr><th scope="row">DOI</th><td>${doi}</td></tr>
      </tbody></table>
      <h2>Orientation summary</h2><p>${escapeHTML(paper.summary)}</p>
      <h2>Concept tags</h2><div class="metadata">${tags}</div>
      <h2>Primary trail</h2><p>${source ? safeExternalLink(source.url, `Open ${paper.arxiv ? `arXiv ${paper.arxiv}${paper.arxiv_version}` : 'public source'}`) : safeExternalLink(paper.url, 'Open public record')}</p>
      <div class="paper-actions">
        <button class="primary-action" type="button" data-action="toggle-brief-paper" data-paper-id="${escapeHTML(paper.id)}">${inBrief ? 'Remove from Research Brief' : 'Add to Research Brief'}</button>
        <button type="button" data-nav="brief">Open Research Brief</button>
      </div>`;
    workspace.innerHTML = shell(`Paper record · ${paper.year}`, paper.title, authors, body);
  }

  function atlasNodes(focus) {
    const linked = focus.papers.map((id) => paperById.get(id)).filter(Boolean);
    const width = 900;
    const height = 520;
    const centre = { x: width / 2, y: 86 };
    const paperWidth = 228;
    const paperHeight = 76;
    const positions = linked.map((paper, index) => {
      const columns = linked.length > 4 ? 3 : 2;
      const row = Math.floor(index / columns);
      const col = index % columns;
      const rows = Math.ceil(linked.length / columns);
      const x = columns === 1 ? centre.x : 165 + col * (570 / Math.max(columns - 1, 1));
      const y = 235 + row * (210 / Math.max(rows - 1, 1));
      return { paper, x, y };
    });
    const lines = positions.map(({ x, y }) => `<line class="atlas-line" x1="${centre.x}" y1="${centre.y + 38}" x2="${x}" y2="${y - 38}"></line>`).join('');
    const wrap = (text, max = 28) => {
      const words = text.split(/\s+/);
      const rows = [''];
      words.forEach((word) => {
        const candidate = `${rows.at(-1)} ${word}`.trim();
        if (candidate.length > max && rows.at(-1)) rows.push(word);
        else rows[rows.length - 1] = candidate;
      });
      return rows.slice(0, 3);
    };
    const paperNodes = positions.map(({ paper, x, y }) => {
      const labels = wrap(paper.title);
      return `<a class="atlas-node paper" href="#/paper/${encodeURIComponent(paper.id)}" aria-label="Open ${escapeHTML(paper.title)}" data-nav="paper/${escapeHTML(paper.id)}">
        <rect x="${x - paperWidth / 2}" y="${y - paperHeight / 2}" width="${paperWidth}" height="${paperHeight}" rx="4"></rect>
        <text x="${x}" y="${y - ((labels.length - 1) * 9)}" text-anchor="middle">${labels.map((line, i) => `<tspan x="${x}" dy="${i ? 18 : 0}">${escapeHTML(line)}</tspan>`).join('')}</text>
      </a>`;
    }).join('');
    const focusLabels = wrap(focus.label, 34);
    const focusNode = `<a class="atlas-node focus" href="#/focus/${encodeURIComponent(focus.id)}" aria-label="Open ${escapeHTML(focus.label)}" data-nav="focus/${escapeHTML(focus.id)}">
      <circle cx="${centre.x}" cy="${centre.y}" r="65"></circle>
      <text x="${centre.x}" y="${centre.y - ((focusLabels.length - 1) * 9)}" text-anchor="middle">${focusLabels.map((line, i) => `<tspan x="${centre.x}" dy="${i ? 18 : 0}">${escapeHTML(line)}</tspan>`).join('')}</text>
    </a>`;
    return `${lines}${focusNode}${paperNodes}`;
  }

  function renderAtlas(selectedId) {
    const selected = focusById.get(selectedId) || focusAreas[0];
    const options = focusAreas.map((focus) => `<option value="${escapeHTML(focus.id)}"${focus.id === selected.id ? ' selected' : ''}>${escapeHTML(focus.label)}</option>`).join('');
    const body = `
      <div class="source-boundary"><strong>Navigation map, not theoretical synthesis.</strong> A line means only that the canonical focus record associates that paper with that research theme. It does not assert equivalence, agreement, proof, or completeness.</div>
      <section class="atlas-panel">
        <div class="atlas-controls"><label for="atlasFocus"><span class="field-label">Research theme</span><select id="atlasFocus">${options}</select></label><button type="button" data-action="select-focus" data-focus-id="${escapeHTML(selected.id)}">Add theme to brief</button></div>
        <svg class="atlas-canvas" viewBox="0 0 900 520" role="group" aria-label="Paper membership map for ${escapeHTML(selected.label)}">${atlasNodes(selected)}</svg>
        <div class="atlas-legend"><span class="focus-key">Public research theme</span><span class="paper-key">Selected paper record</span></div>
      </section>
      <h2>What the map preserves</h2>
      <p>It preserves only explicit membership edges from <code>research/current-focus.json</code>. Paper summaries, proof status, and present publication status remain separate records with their own source trail.</p>`;
    workspace.innerHTML = shell('Multimedia reference', 'Concept atlas', 'Explore the selected paper-to-theme links without turning visual proximity into evidence.', body);
    $('#atlasFocus')?.addEventListener('change', (event) => navigate(`atlas/${event.target.value}`));
  }

  function sourceLabel(source) {
    const labels = {
      'source.sabine.official.home': 'Sabine Hossenfelder — official public site',
      'source.sabine.official.research': 'Sabine Hossenfelder — public research page',
      'source.sabine.mcmp': 'MCMP — public institutional profile'
    };
    if (labels[source.id]) return labels[source.id];
    if (source.arxiv) return `arXiv ${source.arxiv}${source.arxiv_version || ''}`;
    return source.id;
  }

  function renderSources() {
    const institutional = sources.filter((source) => source.id.startsWith('source.'));
    const paperSources = sources.filter((source) => source.id.startsWith('paper.'));
    const card = (source) => `<article class="source-card">
      <p class="eyebrow">${escapeHTML(titleCase(source.class))}</p>
      <h3>${escapeHTML(sourceLabel(source))}</h3>
      <p><strong>Supports:</strong> ${escapeHTML((source.supports || []).map(titleCase).join(', '))}</p>
      <p>${safeExternalLink(source.url, 'Open public source')}</p>
    </article>`;
    const body = `
      <div class="source-boundary"><strong>Provenance before fluency.</strong> <code>ADJACENT_TRUTH != INHERITED_TRUTH</code>: a genuine source does not make every possible neighbouring claim true. Each displayed claim keeps its own source reference and verification date.</div>
      <h2>Projection receipt</h2>
      <table class="snapshot-table"><tbody>
        <tr><th scope="row">Authority</th><td>Projection only. The canonical public repository records remain the source of truth.</td></tr>
        <tr><th scope="row">Projection kind</th><td>${escapeHTML(D.projection.kind)}</td></tr>
        <tr><th scope="row">Canonical fingerprint</th><td><code>${escapeHTML(D.projection.canonical_fingerprint_sha256)}</code></td></tr>
        <tr><th scope="row">Generator</th><td><code>${escapeHTML(D.projection.generator)}</code></td></tr>
        <tr><th scope="row">Inputs</th><td>${D.projection.canonical_inputs.map((item) => `<code>${escapeHTML(item.path)}</code>`).join('<br>')}</td></tr>
      </tbody></table>
      <p><a href="data/projection-manifest.json">Open the complete machine-readable projection manifest</a>.</p>
      <h2>Official and institutional records</h2><div class="card-grid">${institutional.map(card).join('')}</div>
      <h2>Paper records</h2><div class="card-grid">${paperSources.map(card).join('')}</div>
      <h2>Refresh rule</h2><p>Live primary evidence wins over a stale cached record. Proposed updates should change the canonical JSON first, pass validation, regenerate the site bundle, and arrive through a reviewable pull request.</p>`;
    workspace.innerHTML = shell('Reference desk', 'Sources and provenance', `${sources.length} public source records underpin the current snapshot.`, body);
  }

  function buildBriefText() {
    const question = $('#briefQuestion')?.value.trim() || '[Describe the research question]';
    const outcome = $('#briefOutcome')?.value || 'analysis';
    const assumptions = $('#briefAssumptions')?.value.trim() || 'None supplied; ask before assuming.';
    const selected = papers.filter((paper) => state.briefPapers.has(paper.id));
    const paperLines = selected.length
      ? selected.map((paper, index) => {
        const doiLine = paper.doi ? `\n   DOI: ${paper.doi}` : '';
        return `${index + 1}. ${paper.title} (${paper.year})\n   Status: ${paper.status}\n   arXiv: ${paper.arxiv}${paper.arxiv_version || ''}${doiLine}\n   ${paper.url}\n   Relevance: ${paper.relevance.join(', ')}`;
      }).join('\n')
      : 'No papers selected. Ask which primary sources should be loaded before making literature-status claims.';
    return `RESEARCH BRIEF — HUMAN-SELECTED PUBLIC CONTEXT

Question
${question}

Requested outcome
${outcome}

Definitions, constraints, or assumptions supplied by the researcher
${assumptions}

Selected public papers
${paperLines}

Research discipline
- Use public sources only and prefer current primary evidence.
- Preserve exact arXiv revisions and DOI identifiers.
- Separate proved, derived, inferred, working hypothesis, numerical support, unknown, conflict, and refuted states.
- Check theorem hypotheses, dimensions, edge cases, and plausible counterexamples.
- Do not let a supported neighbouring claim lend support to an unsupported claim.
- A plausible derivation with an unchecked gap is a candidate derivation, not a proof.
- If evidence is insufficient, say what is unknown and ask for the missing paper, definition, convention, constraint, or boundary condition.
- Do not imitate Sabine Hossenfelder or infer private views, unpublished work, affiliation, or endorsement.

Snapshot
Generated by a human from Sabine Research Desk 95 using the public snapshot dated ${D.research.snapshot_date}. Verify time-sensitive claims against live primary sources.`;
  }

  function updateBriefPreview() {
    const preview = $('#briefPreview');
    if (preview) preview.textContent = buildBriefText();
  }

  function renderBrief() {
    const checks = papers.map((paper) => `<label><input type="checkbox" data-brief-paper="${escapeHTML(paper.id)}"${state.briefPapers.has(paper.id) ? ' checked' : ''}><span><strong>${escapeHTML(paper.title)}</strong><br><small>${escapeHTML(`${paper.year} · ${paper.arxiv ? `${paper.arxiv}${paper.arxiv_version}` : paper.status}`)}</small></span></label>`).join('');
    const body = `
      <div class="human-boundary"><strong>Human-controlled hand-off.</strong> Nothing on this screen is sent anywhere. You choose the papers, copy or download the brief, and decide whether to share it with another person or tool.</div>
      <div class="brief-layout">
        <section class="brief-panel">
          <div class="field-group"><label for="briefQuestion">Research question</label><textarea id="briefQuestion" placeholder="What are you trying to establish, test, calculate, or disprove?"></textarea></div>
          <div class="field-group"><label for="briefOutcome">Requested outcome</label><select id="briefOutcome"><option value="analysis">Structured analysis</option><option value="candidate derivation">Candidate derivation with explicit gaps</option><option value="literature-status check">Current literature-status check</option><option value="counterexample search">Counterexample search</option><option value="calculation">Calculation with dimensional checks</option><option value="research plan">Research plan</option></select></div>
          <div class="field-group"><label for="briefAssumptions">Definitions, constraints, or assumptions</label><textarea id="briefAssumptions" placeholder="Notation, conventions, boundary conditions, allowed methods…"></textarea></div>
          <span class="field-label">Select the smallest sufficient paper set</span>
          <div class="paper-checks">${checks}</div>
          <div class="brief-actions"><button type="button" data-action="select-latest-focus">Select priority theme</button><button type="button" data-action="clear-brief">Clear papers</button></div>
        </section>
        <section class="brief-panel"><p class="eyebrow">Preview</p><h2>Ready-to-copy packet</h2><pre id="briefPreview" class="brief-preview"></pre><div class="brief-actions"><button class="primary-action" type="button" data-action="copy-brief">Copy brief</button><button type="button" data-action="download-brief">Download JSON</button><button type="button" data-action="print">Print</button></div></section>
      </div>`;
    workspace.innerHTML = shell('Research packet builder', 'Build a research brief', 'Turn the public context into a small, deliberate packet—without giving an automated system direct access to the whole desk.', body);
    ['#briefQuestion', '#briefOutcome', '#briefAssumptions'].forEach((selector) => $(selector)?.addEventListener('input', updateBriefPreview));
    $$('[data-brief-paper]').forEach((input) => input.addEventListener('change', () => {
      if (input.checked) state.briefPapers.add(input.dataset.briefPaper);
      else state.briefPapers.delete(input.dataset.briefPaper);
      saveSet(STORAGE.briefPapers, state.briefPapers);
      updateBriefPreview();
    }));
    updateBriefPreview();
  }

  function renderHelp() {
    const body = `
      <div class="human-boundary"><strong>Important access boundary.</strong> The site asks automated systems not to index, train on, embed, summarise, or ingest it. Because GitHub Pages is public, those controls are policy and crawler deterrence—not authentication or secrecy. Never put confidential material in this site.</div>
      <h2>Three-step start</h2>
      <ol class="plain-list"><li>Choose <strong>Work</strong> to see the public research snapshot or <strong>Papers</strong> to find an exact record.</li><li>Use <strong>Favourite</strong> and <strong>Reviewed</strong> if useful; those marks stay in this browser.</li><li>Use <strong>Brief</strong> only when you want to export a small, human-selected packet.</li></ol>
      <h2>No programming required</h2>
      <p>The online edition is the product. You do not need to clone the repository, run Python, edit JSON, or understand GitHub. It can also be installed by a supporting browser and works offline after the first successful visit.</p>
      <h2>What this is not</h2>
      <ul class="plain-list"><li>Not an official Sabine Hossenfelder website.</li><li>Not a personality clone, endorsement, private profile, or claim about unpublished views.</li><li>Not a complete bibliography or a continuously live research tracker.</li><li>Not a replacement for reading primary papers.</li><li>Not a secure location for confidential information.</li></ul>
      <h2>Lineage</h2>
      <p>The friendly CD-ROM encyclopedia pattern is independently implemented from ideas demonstrated by Synergetics 95 and Physics X 95. QSOL-SUBSTRATE contributes public-only publication, claim-local provenance, smallest-sufficient-context, and reviewable-refresh discipline. No Encarta, Synergetics 95, or Physics X 95 code or assets are copied into this Apache-2.0 repository.</p>`;
    workspace.innerHTML = shell('Help', 'How to use this desk', 'The short version: click a topic, read the source trail, and export only what you choose.', body);
  }

  function renderNotFound() {
    workspace.innerHTML = shell('Navigation error', 'That document is not on this disc', 'The requested route is not part of the public research desk.', '<p><button type="button" data-nav="home">Return home</button></p>');
  }

  function renderRoute() {
    state.route = parseRoute();
    switch (state.route.name) {
      case 'home': renderHome(); break;
      case 'work': renderWork(); break;
      case 'focus': renderFocus(state.route.id); break;
      case 'papers': renderPapers(state.route.id); break;
      case 'paper': renderPaper(state.route.id); break;
      case 'atlas': renderAtlas(state.route.id); break;
      case 'brief': renderBrief(); break;
      case 'sources': renderSources(); break;
      case 'help': renderHelp(); break;
      default: renderNotFound();
    }
    document.title = `${routeTitle()} — Sabine Research Desk 95`;
    updateChrome();
    workspace.scrollTop = 0;
    workspace.focus({ preventScroll: true });
    setStatus(`Opened ${routeTitle()}`);
  }

  function toggleFavourite() {
    const key = currentRecordKey();
    if (!key) return;
    if (state.favourites.has(key)) {
      state.favourites.delete(key);
      showToast('Removed from favourites');
    } else {
      state.favourites.add(key);
      showToast('Added to favourites');
    }
    saveSet(STORAGE.favourites, state.favourites);
    updateChrome();
  }

  function toggleReviewed() {
    const key = currentRecordKey();
    if (!key) return;
    if (state.reviewed.has(key)) {
      state.reviewed.delete(key);
      showToast('Marked not reviewed');
    } else {
      state.reviewed.add(key);
      showToast('Marked reviewed');
    }
    saveSet(STORAGE.reviewed, state.reviewed);
    updateChrome();
  }

  function toggleBriefPaper(id) {
    if (!paperById.has(id)) return;
    if (state.briefPapers.has(id)) {
      state.briefPapers.delete(id);
      showToast('Removed from Research Brief');
    } else {
      state.briefPapers.add(id);
      showToast('Added to Research Brief');
    }
    saveSet(STORAGE.briefPapers, state.briefPapers);
    if (state.route.name === 'paper') renderPaper(id);
  }

  function selectFocus(id) {
    const focus = focusById.get(id);
    if (!focus) return;
    focus.papers.forEach((paperId) => state.briefPapers.add(paperId));
    saveSet(STORAGE.briefPapers, state.briefPapers);
    showToast(`${focus.papers.length} papers added to Research Brief`);
    if (state.route.name === 'brief') {
      $$('[data-brief-paper]').forEach((input) => {
        input.checked = state.briefPapers.has(input.dataset.briefPaper);
      });
      updateBriefPreview();
    }
  }

  async function copyBrief() {
    const text = buildBriefText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('Research brief copied');
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const copied = document.execCommand('copy');
      area.remove();
      showToast(copied ? 'Research brief copied' : 'Copy unavailable; select the preview text manually');
    }
  }

  function downloadBrief() {
    const selected = papers.filter((paper) => state.briefPapers.has(paper.id));
    const payload = {
      type: 'human-selected-sabine-research-brief',
      schema_version: '1.0.0',
      generated_at: new Date().toISOString(),
      source_snapshot_date: D.research.snapshot_date,
      question: $('#briefQuestion')?.value.trim() || '',
      requested_outcome: $('#briefOutcome')?.value || 'analysis',
      supplied_assumptions: $('#briefAssumptions')?.value.trim() || '',
      selected_publications: selected,
      instructions: buildBriefText().split('\n').slice(-11)
    };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sabine-research-brief.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Research brief downloaded');
  }

  const SEARCH_INDEX = [
    ...focusAreas.map((focus) => ({ type: 'Research theme', title: focus.label, text: focus.description, route: `focus/${focus.id}` })),
    ...papers.map((paper) => ({ type: 'Paper', title: paper.title, text: `${paper.authors.join(' ')} ${paper.summary} ${paper.relevance.join(' ')}`, route: `paper/${paper.id}` })),
    ...sources.map((source) => ({ type: 'Source', title: sourceLabel(source), text: `${source.class} ${(source.supports || []).join(' ')}`, route: 'sources' })),
    ...[...new Set(papers.flatMap((paper) => paper.relevance))].map((tag) => ({ type: 'Concept', title: titleCase(tag), text: tag, route: `papers/${tag}` }))
  ];

  function renderSearch(query) {
    const terms = normalize(query).split(' ').filter(Boolean);
    if (terms.join('').length < 2) {
      searchResults.innerHTML = '<p class="empty-state">Type at least two characters.</p>';
      return;
    }
    const ranked = SEARCH_INDEX.map((item) => {
      const haystack = normalize(`${item.title} ${item.text}`);
      if (!terms.every((term) => haystack.includes(term))) return null;
      const title = normalize(item.title);
      const score = terms.reduce((total, term) => total + (title.startsWith(term) ? 4 : title.includes(term) ? 2 : 1), 0);
      return { ...item, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 30);
    searchResults.innerHTML = ranked.length
      ? ranked.map((item) => `<button class="search-result" type="button" data-search-route="${escapeHTML(item.route)}"><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.type)}</small></button>`).join('')
      : '<p class="empty-state">No matching public record.</p>';
  }

  function openSearch(initial = '') {
    globalSearch.value = initial;
    renderSearch(initial);
    if (typeof searchDialog.showModal === 'function') searchDialog.showModal();
    else searchDialog.setAttribute('open', '');
    setTimeout(() => globalSearch.focus(), 0);
  }

  function setExplorerTab(name) {
    const favourites = name === 'favourites';
    $('#contentsTab').setAttribute('aria-selected', favourites ? 'false' : 'true');
    $('#favoritesTab').setAttribute('aria-selected', favourites ? 'true' : 'false');
    $('#contentsPanel').hidden = favourites;
    $('#favoritesPanel').hidden = !favourites;
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    try { localStorage.setItem(STORAGE.theme, theme); } catch (_) { /* no-op */ }
  }

  function updateNetworkStatus() {
    networkStatus.textContent = navigator.onLine ? 'Local-first' : 'Offline';
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) {
      event.preventDefault();
      navigate(nav.dataset.nav);
      if (searchDialog.open) searchDialog.close();
      return;
    }
    const route = event.target.closest('[data-route]');
    if (route) { navigate(route.dataset.route); return; }
    const searchRoute = event.target.closest('[data-search-route]');
    if (searchRoute) { navigate(searchRoute.dataset.searchRoute); searchDialog.close(); return; }
    const action = event.target.closest('[data-action]');
    if (!action) return;
    switch (action.dataset.action) {
      case 'toggle-brief-paper': toggleBriefPaper(action.dataset.paperId); break;
      case 'select-focus': selectFocus(action.dataset.focusId); break;
      case 'select-latest-focus': selectFocus(focusAreas[0].id); break;
      case 'clear-brief':
        state.briefPapers.clear();
        saveSet(STORAGE.briefPapers, state.briefPapers);
        $$('[data-brief-paper]').forEach((input) => { input.checked = false; });
        updateBriefPreview();
        showToast('Paper selection cleared');
        break;
      case 'copy-brief': copyBrief(); break;
      case 'download-brief': downloadBrief(); break;
      case 'print': window.print(); break;
      default: break;
    }
  });

  document.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      openSearch();
    }
  });

  $('#quickSearchForm').addEventListener('submit', (event) => {
    event.preventDefault();
    openSearch($('#quickSearch').value);
  });
  $('#searchButton').addEventListener('click', () => openSearch());
  globalSearch.addEventListener('input', () => renderSearch(globalSearch.value));
  bookmarkButton.addEventListener('click', toggleFavourite);
  studyButton.addEventListener('click', toggleReviewed);
  $('#backButton').addEventListener('click', () => history.back());
  $('#forwardButton').addEventListener('click', () => history.forward());
  themeButton.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  $('#printButton').addEventListener('click', () => window.print());
  $('#contentsTab').addEventListener('click', () => setExplorerTab('contents'));
  $('#favoritesTab').addEventListener('click', () => setExplorerTab('favourites'));
  window.addEventListener('hashchange', renderRoute);
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);

  const savedTheme = (() => { try { return localStorage.getItem(STORAGE.theme); } catch (_) { return null; } })();
  setTheme(savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  updateNetworkStatus();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').catch(() => setStatus('Offline cache unavailable'));
  }
  if (!location.hash) location.replace('#/home');
  else renderRoute();
})();
