(function () {
  const wardSelect = document.getElementById('wardSelect');
  const wardEdit = document.getElementById('wardEdit');
  const whoami = document.getElementById('whoami');

  let wards = [];
  let activeSlug = null;
  let uploadTargetId = null;

  function initials(name) {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  }

  async function api(url, options) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (res.status === 401) {
      location.href = '/admin/login';
      throw new Error('Not authenticated');
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Request failed');
    }
    return res.json();
  }

  const CAMERA_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z"/><circle cx="12" cy="12.5" r="3.2"/></svg>';

  function avatarEl(p) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'avatar-btn';
    btn.title = 'Click to change photo';
    btn.setAttribute('aria-label', `Change photo for ${p.name}`);
    let av;
    if (p.photo) {
      av = document.createElement('img');
      av.className = 'avatar';
      av.src = p.photo;
    } else {
      av = document.createElement('div');
      av.className = 'avatar';
      av.textContent = initials(p.name);
    }
    btn.appendChild(av);
    const badge = document.createElement('span');
    badge.className = 'avatar-edit-badge';
    badge.innerHTML = CAMERA_ICON;
    btn.appendChild(badge);
    btn.addEventListener('click', () => openPhotoDialog(p.id));
    return btn;
  }

  function fieldInput(placeholder, value, onSave) {
    const input = document.createElement('input');
    input.placeholder = placeholder;
    input.value = value || '';
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => onSave(input.value), 500);
    });
    input.addEventListener('blur', () => onSave(input.value));
    return input;
  }

  function personRow(p, ward) {
    const row = document.createElement('div');
    row.className = 'admin-person';

    row.appendChild(avatarEl(p));

    const fields = document.createElement('div');
    fields.className = 'admin-person-fields';

    const save = async (patch) => {
      try {
        await api(`/admin/api/person/${p.id}`, { method: 'PUT', body: JSON.stringify(patch) });
        flashSaved(row);
      } catch (e) {
        alert('Could not save: ' + e.message);
      }
    };

    fields.appendChild(fieldInput('Full name', p.name, (v) => save({ name: v })));
    fields.appendChild(fieldInput('Messenger username or link', p.messenger, (v) => save({ messenger: v })));
    fields.appendChild(fieldInput('Phone number', p.phone, (v) => save({ phone: v })));
    fields.appendChild(fieldInput('Email (optional)', p.email, (v) => save({ email: v })));

    const saveTag = document.createElement('span');
    saveTag.className = 'save-indicator';
    fields.appendChild(saveTag);

    const actions = document.createElement('div');
    actions.className = 'admin-person-actions';
    const delBtn = document.createElement('button');
    delBtn.className = 'small-btn danger';
    delBtn.type = 'button';
    delBtn.textContent = 'Remove';
    delBtn.addEventListener('click', async () => {
      if (!confirm(`Remove ${p.name}?`)) return;
      await api(`/admin/api/person/${p.id}`, { method: 'DELETE' });
      loadWard(activeSlug);
    });
    actions.appendChild(delBtn);

    row.appendChild(fields);
    row.appendChild(actions);
    row._saveTag = saveTag;
    return row;
  }

  function flashSaved(row) {
    const tag = row.querySelector('.save-indicator');
    if (!tag) return;
    tag.textContent = 'Saved ✓';
    tag.classList.add('ok');
    setTimeout(() => { tag.textContent = ''; tag.classList.remove('ok'); }, 1500);
  }

  function appendPeopleEditor(container, group, ward, groupKind, roleIndex) {
    for (const p of group.people) container.appendChild(personRow(p, ward));

    const addRow = document.createElement('div');
    addRow.className = 'add-person-row';
    const input = document.createElement('input');
    input.placeholder = 'Add a person by name…';
    const btn = document.createElement('button');
    btn.className = 'small-btn';
    btn.type = 'button';
    btn.textContent = 'Add';
    btn.addEventListener('click', async () => {
      if (!input.value.trim()) return;
      await api(`/admin/api/ward/${ward.slug}/add-person`, {
        method: 'POST',
        body: JSON.stringify({ groupKind, roleIndex, name: input.value }),
      });
      loadWard(activeSlug);
    });
    addRow.appendChild(input);
    addRow.appendChild(btn);
    container.appendChild(addRow);
  }

  function roleBlock(group, ward, groupKind, roleIndex) {
    const block = document.createElement('div');
    block.className = 'admin-role-block';

    const titleRow = document.createElement('div');
    titleRow.className = 'admin-role-title';
    const h = document.createElement('h3');
    h.textContent = group.role;
    titleRow.appendChild(h);
    block.appendChild(titleRow);

    appendPeopleEditor(block, group, ward, groupKind, roleIndex);

    // Each specialist role chairs its own area, so it carries its own
    // optional Vice Chairman / Co-Chairman, editable inline here.
    if (group.viceChair) {
      const sub = document.createElement('div');
      sub.className = 'admin-subblock';
      const subTitle = document.createElement('h4');
      subTitle.className = 'admin-subblock-title';
      subTitle.textContent = group.viceChair.role;
      sub.appendChild(subTitle);
      appendPeopleEditor(sub, group.viceChair, ward, 'roleViceChair', roleIndex);
      block.appendChild(sub);
    }

    return block;
  }

  function renderWard(ward) {
    wardEdit.innerHTML = '';
    (ward.leadership || []).forEach((g, i) => wardEdit.appendChild(roleBlock(g, ward, 'leadership', i)));
    wardEdit.appendChild(roleBlock(ward.lead, ward, 'lead', null));
    if (ward.secretary) wardEdit.appendChild(roleBlock(ward.secretary, ward, 'secretary', null));
    ward.roles.forEach((g, i) => wardEdit.appendChild(roleBlock(g, ward, 'role', i)));
  }

  async function loadWard(slug) {
    activeSlug = slug;
    const all = await api('/admin/api/wards');
    wards = all;
    const ward = all.find((w) => w.slug === slug);
    renderWard(ward);
  }

  async function init() {
    try {
      const who = await api('/admin/api/whoami');
      whoami.textContent = `Signed in as ${who.username}`;
    } catch (e) {
      return;
    }
    const all = await api('/admin/api/wards');
    wards = all;
    wardSelect.innerHTML = '';
    for (const w of all) {
      const opt = document.createElement('option');
      opt.value = w.slug;
      opt.textContent = w.name;
      wardSelect.appendChild(opt);
    }
    activeSlug = all[0].slug;
    wardSelect.value = activeSlug;
    renderWard(all[0]);
    wardSelect.addEventListener('change', () => loadWard(wardSelect.value));
  }

  // ---- Photo dialog ----
  const photoDialog = document.getElementById('photoDialog');
  const photoForm = document.getElementById('photoForm');
  const photoInput = document.getElementById('photoInput');
  document.getElementById('photoCancel').addEventListener('click', () => photoDialog.close());

  function openPhotoDialog(personId) {
    uploadTargetId = personId;
    photoInput.value = '';
    photoDialog.showModal();
  }

  photoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!photoInput.files[0]) return;
    const fd = new FormData();
    fd.append('photo', photoInput.files[0]);
    const res = await fetch(`/admin/api/person/${uploadTargetId}/photo`, { method: 'POST', body: fd });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert('Upload failed: ' + (body.error || res.statusText));
      return;
    }
    photoDialog.close();
    loadWard(activeSlug);
  });

  // ---- Change password dialog ----
  const pwDialog = document.getElementById('pwDialog');
  const pwError = document.getElementById('pwError');
  document.getElementById('changePwBtn').addEventListener('click', () => {
    pwError.classList.add('hidden');
    document.getElementById('curPw').value = '';
    document.getElementById('newPw').value = '';
    pwDialog.showModal();
  });
  document.getElementById('pwCancel').addEventListener('click', () => pwDialog.close());
  document.getElementById('pwForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/admin/api/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: document.getElementById('curPw').value,
          newPassword: document.getElementById('newPw').value,
        }),
      });
      pwDialog.close();
      alert('Password updated.');
    } catch (err) {
      pwError.textContent = err.message;
      pwError.classList.remove('hidden');
    }
  });

  init();
})();
