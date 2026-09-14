(function () {
  const wardSelect = document.getElementById('wardSelect');
  const wardView = document.getElementById('wardView');
  const updatedAt = document.getElementById('updatedAt');

  let roleLegend = {};
  let selectedBoxEl = null;

  // Vector icons (no emoji as structural UI elements — inconsistent across
  // platforms and can't be themed). 18x18, 1.75px stroke, currentColor.
  const ICONS = {
    message:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.9-.94L4 20l1.06-3.53A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5Z"/></svg>',
    phone:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4.5 4h3.4l1.4 4.2-2.1 1.6a12.4 12.4 0 0 0 5 5l1.6-2.1L18 14.1v3.4c0 1-.8 1.5-1.7 1.4A16.5 16.5 0 0 1 3.1 5.7C3 4.8 3.5 4 4.5 4Z"/></svg>',
    mail:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4.5 6.5 12 12l7.5-5.5"/></svg>',
    camera:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="12.5" r="3.2"/></svg>',
  };

  function iconEl(name) {
    const span = document.createElement('span');
    span.className = 'btn-icon';
    span.innerHTML = ICONS[name] || '';
    return span;
  }

  function initials(name) {
    return (name || '?')
      .replace(/^(Bro\.|Sis\.)\s*/i, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  function messengerUrl(value) {
    if (!value) return null;
    const v = value.trim();
    if (!v) return null;
    if (/^https?:\/\//i.test(v)) return v;
    return `https://m.me/${v.replace(/^@/, '')}`;
  }

  function avatarEl(person) {
    if (person && person.photo) {
      const img = document.createElement('img');
      img.className = 'avatar';
      img.src = person.photo;
      img.alt = person.name;
      return img;
    }
    const div = document.createElement('div');
    div.className = 'avatar';
    div.textContent = person ? initials(person.name) : '—';
    return div;
  }

  // ---------- Tree building ----------
  // Node shape: { kind: 'person' | 'vacant' | 'label', role, person, children: [] }

  function personLeaf(person, role) {
    return { kind: 'person', role, person, children: [] };
  }

  function personOrVacant(group) {
    const person = group.people[0] || null;
    return { kind: person ? 'person' : 'vacant', role: group.role, person, children: [] };
  }

  // A specialist role chairs its own area, so it can carry its own
  // Vice Chairman / Co-Chairman as a child, alongside the specialist(s).
  function roleLabelNode(group) {
    const children = group.people.length
      ? group.people.map((p) => personLeaf(p, group.role))
      : [{ kind: 'vacant', role: group.role, person: null, children: [] }];
    if (group.viceChair) children.push(personOrVacant(group.viceChair));
    return { kind: 'label', role: group.role, person: null, children };
  }

  function wsrSubtreeRoot(ward) {
    const node = personOrVacant(ward.lead);
    node.children = ward.roles.map(roleLabelNode);
    if (ward.secretary) {
      const secretaryNode = personOrVacant(ward.secretary);
      secretaryNode.dashedLink = true; // support role, shown with a broken connector
      node.children.push(secretaryNode);
    }
    return node;
  }

  // Leadership (President + High Councilors) stays its own compact tree.
  // The WSR branch is *not* nested inside it: nesting it under a High
  // Councilor would force that councilor's box to center over the whole
  // wide WSR subtree, dragging it (and its siblings) far apart. Instead
  // the reporting relationship is shown with a connector caption between
  // the two trees, keeping the leadership row tight.
  function buildLeadershipTree(ward) {
    const topNode = personOrVacant(ward.leadership[0]);
    for (let i = 1; i < ward.leadership.length; i++) {
      const g = ward.leadership[i];
      for (const p of g.people) topNode.children.push(personLeaf(p, g.role));
    }
    return topNode;
  }

  function reportsToPerson(ward) {
    if (!ward.leadership || ward.leadership.length < 2) return null;
    const hcs = ward.leadership[1].people;
    if (!hcs.length) return null;
    return hcs[Math.floor((hcs.length - 1) / 2)];
  }

  // ---------- Rendering ----------
  function boxEl(node) {
    const box = document.createElement('div');
    box.className = 'org-node';
    box.tabIndex = 0;
    box.setAttribute('role', 'button');

    if (node.kind === 'label') {
      box.classList.add('label-node');
      const role = document.createElement('div');
      role.className = 'org-role';
      role.textContent = node.role;
      box.appendChild(role);
      box.addEventListener('click', () => selectBox(box, () => showRoleInfo(node.role)));
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter') box.click(); });
      return box;
    }

    if (node.kind === 'vacant') {
      box.classList.add('vacant');
      box.appendChild(avatarEl(null));
      const name = document.createElement('div');
      name.className = 'org-name';
      name.textContent = 'Vacant';
      box.appendChild(name);
      const role = document.createElement('div');
      role.className = 'org-role';
      role.textContent = node.role;
      box.appendChild(role);
      box.addEventListener('click', () => selectBox(box, () => showVacant(node.role)));
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter') box.click(); });
      return box;
    }

    box.dataset.personId = node.person.id;
    box.appendChild(avatarEl(node.person));
    const name = document.createElement('div');
    name.className = 'org-name';
    name.textContent = node.person.name;
    box.appendChild(name);
    const role = document.createElement('div');
    role.className = 'org-role';
    role.textContent = node.role;
    box.appendChild(role);
    box.addEventListener('click', () => selectBox(box, () => showProfile(node.person, node.role)));
    box.addEventListener('keydown', (e) => { if (e.key === 'Enter') box.click(); });
    return box;
  }

  // Center the WSR tree's root box directly under the High Councilor it
  // reports through, so the two separately-sized trees read as one chain
  // instead of drifting apart (a narrow tree centers in the viewport while
  // a much wider one left-aligns once it overflows).
  //
  // Only ever shift things *rightward*. A negative margin on the wide WSR
  // tree would push its leftmost boxes (Education, Family Services, ...)
  // past scrollLeft:0 — permanently unreachable, since scroll can't go
  // negative. So when the anchor sits left of the WSR tree's natural
  // center, nudge the (narrower, safer) leadership tree right instead.
  function alignTrees(chartWrap, leadershipTreeEl, wsrTreeEl, reportsTo, stemEl) {
    if (!reportsTo) return;
    const anchorBox = chartWrap.querySelector(`[data-person-id="${reportsTo.id}"]`);
    const rootBox = wsrTreeEl.querySelector(':scope > li > .org-node');
    if (!anchorBox || !rootBox) return;
    const anchorCenter = anchorBox.getBoundingClientRect().left + anchorBox.offsetWidth / 2;
    const rootCenter = rootBox.getBoundingClientRect().left + rootBox.offsetWidth / 2;
    const delta = anchorCenter - rootCenter;
    if (delta >= 0) {
      const cur = parseFloat(getComputedStyle(wsrTreeEl).marginLeft) || 0;
      wsrTreeEl.style.marginLeft = cur + delta + 'px';
      wsrTreeEl.style.marginRight = '0';
    } else {
      const cur = parseFloat(getComputedStyle(leadershipTreeEl).marginLeft) || 0;
      leadershipTreeEl.style.marginLeft = cur - delta + 'px';
      leadershipTreeEl.style.marginRight = '0';
    }
    // Draw the connector stem at the same x the two boxes now share (thin
    // and always inside the already-reachable range, so shifting it either
    // direction is safe — unlike the wide WSR tree).
    if (stemEl) {
      const stemCenter = stemEl.getBoundingClientRect().left + stemEl.offsetWidth / 2;
      const finalAnchorCenter = anchorBox.getBoundingClientRect().left + anchorBox.offsetWidth / 2;
      const curStemMargin = parseFloat(getComputedStyle(stemEl).marginLeft) || 0;
      stemEl.style.marginLeft = curStemMargin + (finalAnchorCenter - stemCenter) + 'px';
      stemEl.style.marginRight = '0';
    }
  }

  function selectBox(box, showFn) {
    if (selectedBoxEl) selectedBoxEl.classList.remove('selected');
    box.classList.add('selected');
    selectedBoxEl = box;
    showFn();
    document.getElementById('profilePanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderNode(node) {
    const li = document.createElement('li');
    if (node.dashedLink) li.classList.add('dashed-link');
    li.appendChild(boxEl(node));
    if (node.children && node.children.length) {
      const ul = document.createElement('ul');
      for (const child of node.children) ul.appendChild(renderNode(child));
      li.appendChild(ul);
    }
    return li;
  }

  // ---------- Profile panel ----------
  function panelEl() {
    return document.getElementById('profilePanel');
  }

  function showPlaceholder() {
    const panel = panelEl();
    panel.className = 'profile-panel placeholder';
    panel.innerHTML = 'Tap a name in the chart above to see their contact info.';
  }

  function showProfile(person, role) {
    const panel = panelEl();
    panel.className = 'profile-panel';
    panel.innerHTML = '';
    panel.appendChild(avatarEl(person));

    const body = document.createElement('div');
    body.className = 'profile-body';

    const name = document.createElement('p');
    name.className = 'profile-name';
    name.textContent = person.name;
    body.appendChild(name);

    const roleEl = document.createElement('p');
    roleEl.className = 'profile-role';
    roleEl.textContent = role;
    body.appendChild(roleEl);

    if (roleLegend[role]) {
      const desc = document.createElement('p');
      desc.className = 'profile-desc';
      desc.textContent = roleLegend[role];
      body.appendChild(desc);
    }

    const actions = document.createElement('div');
    actions.className = 'profile-actions';

    const mUrl = messengerUrl(person.messenger);
    if (mUrl) {
      const a = document.createElement('a');
      a.className = 'btn btn-messenger';
      a.href = mUrl;
      a.target = '_blank';
      a.rel = 'noopener';
      a.setAttribute('aria-label', `Message ${person.name} on Messenger`);
      a.appendChild(iconEl('message'));
      a.appendChild(document.createTextNode('Message'));
      actions.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.className = 'btn btn-disabled';
      span.textContent = 'No Messenger';
      actions.appendChild(span);
    }

    if (person.phone) {
      const a = document.createElement('a');
      a.className = 'btn btn-phone';
      a.href = `tel:${person.phone}`;
      a.setAttribute('aria-label', `Call ${person.name} at ${person.phone}`);
      a.appendChild(iconEl('phone'));
      a.appendChild(document.createTextNode(person.phone));
      actions.appendChild(a);
    }

    if (person.email) {
      const a = document.createElement('a');
      a.className = 'btn btn-phone';
      a.href = `mailto:${person.email}`;
      a.setAttribute('aria-label', `Email ${person.name} at ${person.email}`);
      a.appendChild(iconEl('mail'));
      a.appendChild(document.createTextNode(person.email));
      actions.appendChild(a);
    }

    body.appendChild(actions);
    panel.appendChild(body);
  }

  function showVacant(role) {
    const panel = panelEl();
    panel.className = 'profile-panel';
    panel.innerHTML = '';
    panel.appendChild(avatarEl(null));
    const body = document.createElement('div');
    body.className = 'profile-body';
    const name = document.createElement('p');
    name.className = 'profile-name';
    name.textContent = 'Vacant';
    body.appendChild(name);
    const roleEl = document.createElement('p');
    roleEl.className = 'profile-role';
    roleEl.textContent = role;
    body.appendChild(roleEl);
    const desc = document.createElement('p');
    desc.className = 'profile-desc';
    desc.textContent = (roleLegend[role] || '') + ' This role is currently unassigned — contact the ward WSR Specialist if you can serve.';
    body.appendChild(desc);
    panel.appendChild(body);
  }

  function showRoleInfo(role) {
    const panel = panelEl();
    panel.className = 'profile-panel';
    panel.innerHTML = '';
    const body = document.createElement('div');
    body.className = 'profile-body';
    const name = document.createElement('p');
    name.className = 'profile-name';
    name.textContent = role;
    body.appendChild(name);
    const desc = document.createElement('p');
    desc.className = 'profile-desc';
    desc.textContent = roleLegend[role] || 'Tap the name below this role to see their contact info.';
    body.appendChild(desc);
    panel.appendChild(body);
  }

  // ---------- Ward view ----------
  function renderWard(ward) {
    wardView.innerHTML = '';
    selectedBoxEl = null;

    const title = document.createElement('h2');
    title.className = 'ward-title';
    title.textContent = ward.name;
    wardView.appendChild(title);

    const sub = document.createElement('p');
    sub.className = 'ward-sub';
    sub.textContent = ward.isStake
      ? 'Stake leadership and Welfare & Self-Reliance committee'
      : 'Welfare & Self-Reliance committee';
    wardView.appendChild(sub);

    const hint = document.createElement('p');
    hint.className = 'scroll-hint';
    hint.textContent = '↔ Scroll sideways to see the full chart';
    wardView.appendChild(hint);

    const chartWrap = document.createElement('div');
    chartWrap.className = 'org-chart-wrap';

    let reportsTo = null;
    let leadershipTreeEl = null;
    let stemEl = null;
    if (ward.leadership && ward.leadership.length) {
      leadershipTreeEl = document.createElement('ul');
      leadershipTreeEl.className = 'org-tree';
      leadershipTreeEl.appendChild(renderNode(buildLeadershipTree(ward)));
      chartWrap.appendChild(leadershipTreeEl);

      reportsTo = reportsToPerson(ward);

      stemEl = document.createElement('div');
      stemEl.className = 'connector-stem';
      chartWrap.appendChild(stemEl);
    }

    const wsrTreeEl = document.createElement('ul');
    wsrTreeEl.className = 'org-tree';
    wsrTreeEl.appendChild(renderNode(wsrSubtreeRoot(ward)));
    chartWrap.appendChild(wsrTreeEl);

    wardView.appendChild(chartWrap);
    if (reportsTo) alignTrees(chartWrap, leadershipTreeEl, wsrTreeEl, reportsTo, stemEl);

    const panel = document.createElement('div');
    panel.id = 'profilePanel';
    wardView.appendChild(panel);
    showPlaceholder();
  }

  async function loadWard(slug) {
    wardView.innerHTML = '<p class="loading">Loading…</p>';
    const res = await fetch(`/api/wards/${slug}`);
    const ward = await res.json();
    renderWard(ward);
    history.replaceState(null, '', `#${slug}`);
  }

  async function init() {
    const [meta, wards] = await Promise.all([
      fetch('/api/meta').then((r) => r.json()),
      fetch('/api/wards').then((r) => r.json()),
    ]);
    roleLegend = meta.roleLegend || {};
    updatedAt.textContent = 'Last updated: ' + new Date(meta.updatedAt).toLocaleString();

    wardSelect.innerHTML = '';
    for (const w of wards) {
      const opt = document.createElement('option');
      opt.value = w.slug;
      opt.textContent = w.name;
      wardSelect.appendChild(opt);
    }

    const initialSlug = (location.hash || '').replace('#', '') || wards[0].slug;
    wardSelect.value = wards.some((w) => w.slug === initialSlug) ? initialSlug : wards[0].slug;
    loadWard(wardSelect.value);

    wardSelect.addEventListener('change', () => loadWard(wardSelect.value));
  }

  init();
})();
