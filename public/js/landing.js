(function () {
  const heroFillstat = document.getElementById('hero-fillstat');
  const heroJump = document.getElementById('heroJump');
  const heroWardSelect = document.getElementById('heroWardSelect');
  const wardList = document.getElementById('wardChips');
  const roleLegendList = document.getElementById('roleLegendGrid');
  const updatedAt = document.getElementById('updatedAt');

  const SPECIALIST_ROLES = [
    'Education Specialist',
    'Family Services Specialist',
    'Health and Nutrition Specialist',
    'GAMA Specialist',
    'My Plan Specialist',
    'Business and Employment Specialist',
    'ATPG Specialist',
  ];

  async function init() {
    const [meta, wards, stats] = await Promise.all([
      fetch('/api/meta').then((r) => r.json()),
      fetch('/api/wards').then((r) => r.json()),
      fetch('/api/stats').then((r) => r.json()),
    ]);

    updatedAt.textContent = 'Directory last updated: ' + new Date(meta.updatedAt).toLocaleString();

    heroFillstat.textContent = `${stats.filledRoleSlots} of ${stats.totalRoleSlots} specialist roles are filled across ${stats.wardsCount} wards right now.`;

    heroWardSelect.innerHTML = '';
    for (const w of wards) {
      const opt = document.createElement('option');
      opt.value = w.slug;
      opt.textContent = w.name;
      heroWardSelect.appendChild(opt);
    }
    heroJump.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = `/directory#${heroWardSelect.value}`;
    });

    wardList.innerHTML = '';
    for (const w of wards) {
      const a = document.createElement('a');
      a.className = 'ward-row';
      a.href = `/directory#${w.slug}`;
      a.innerHTML = `<span>${w.name}</span>`;
      if (w.isStake) {
        const tag = document.createElement('span');
        tag.className = 'stake-tag';
        tag.textContent = 'Stake leadership';
        a.appendChild(tag);
      }
      wardList.appendChild(a);
    }

    roleLegendList.innerHTML = '';
    for (const role of SPECIALIST_ROLES) {
      const desc = meta.roleLegend && meta.roleLegend[role];
      if (!desc) continue;
      const dt = document.createElement('dt');
      dt.textContent = role;
      const dd = document.createElement('dd');
      dd.textContent = desc;
      roleLegendList.appendChild(dt);
      roleLegendList.appendChild(dd);
    }
  }

  init();
})();
