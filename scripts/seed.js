// One-time generator for data/directory.json from the source Excel org charts.
const fs = require('fs');
const path = require('path');

let nextId = 1;
function person(name, extra = {}) {
  if (!name) return null;
  return { id: 'p' + nextId++, name, photo: '', messenger: '', phone: '', email: '', ...extra };
}
function people(...names) {
  return names.filter(Boolean).map((n) => person(n));
}

const ROLE_ORDER = [
  'Education Specialist',
  'Family Services Specialist',
  'Health and Nutrition Specialist',
  'GAMA Specialist',
  'My Plan Specialist',
  'Business and Employment Specialist',
  'ATPG Specialist',
];

// At the stake level these same 7 areas are titled "Chairman" (each chairs
// their stake subcommittee), and only at that level do they carry a Vice
// Chairman / Co-Chairman slot. Ward-level roles keep the plain "Specialist"
// title and have no vice chair.
const CHAIRMAN_ROLE_ORDER = ROLE_ORDER.map((r) => r.replace(/Specialist$/, 'Chairman'));

function roles(map, { chairman = false } = {}) {
  const titles = chairman ? CHAIRMAN_ROLE_ORDER : ROLE_ORDER;
  return ROLE_ORDER.map((baseKey, i) => {
    const entry = { role: titles[i], people: people(...(map[baseKey] || [])) };
    if (chairman) entry.viceChair = { role: 'Vice Chairman / Co-Chairman', people: [] };
    return entry;
  });
}

const wards = [
  {
    slug: 'stake',
    name: 'Talisay Stake WSR',
    isStake: true,
    leadership: [
      { role: '1st Counselor, Stake Presidency', people: people('President Adonis Magsino') },
      {
        role: 'High Councilor',
        people: people('Diony Garcia', 'Jesus Victorillo', 'Ruben Genterone'),
      },
    ],
    lead: { role: 'Stake Welfare and Self-Reliance Specialist', people: people('Shiela Garcia') },
    roles: roles(
      {
        'Education Specialist': ['Sis. Chealsea Gonzales'],
        'Family Services Specialist': ['Sis. Ruth Diane Estrada'],
        'Health and Nutrition Specialist': ['Bro. Moroni Uy'],
        'GAMA Specialist': ['Bro. Ruben & Sis. Jean Genterone'],
        'My Plan Specialist': ['Bro. Feljoy Osores'],
        'Business and Employment Specialist': [],
        'ATPG Specialist': ['Bro. Julio Candelario'],
      },
      { chairman: true }
    ),
    secretary: { role: 'Stake WSR Secretary', people: [] },
  },
  {
    slug: 'carcar',
    name: 'Carcar Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Ivona Mausisa') },
    roles: roles({
      'Education Specialist': ['Cris Rheanne Sacay and Sarah Alchea Responso'],
      'Family Services Specialist': ['Ivona Mausisa & Erlwin Abanggan'],
      'Health and Nutrition Specialist': ['Emmalinda Ortega and Alma Santa Cruz'],
      'GAMA Specialist': ['Emmalinda Ortega, Alma Santa Cruz and Josephine Sabala'],
      'My Plan Specialist': ['Erlwin, Cris Rheanne, Brent Mausisa and Sarah Alchea'],
      'Business and Employment Specialist': ['Randy Ortega and Erlwin Abanggan'],
      'ATPG Specialist': ['Josephine and Maritoni Sabala'],
    }),
  },
  {
    slug: 'lawaan-1st',
    name: 'Lawaan 1st Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Aniceta Pongase') },
    roles: roles({}),
  },
  {
    slug: 'lawaan-2nd',
    name: 'Lawaan 2nd Ward',
    lead: { role: 'WSR Specialist', people: people('Bro. Jeffrey Traya') },
    roles: roles({
      'Education Specialist': ['Sis. Alquida Canedo'],
      'Health and Nutrition Specialist': ['Sis. Lilibeth Jagunap'],
      'GAMA Specialist': ['Sis. Lovely Giua'],
      'ATPG Specialist': ['Bro. Joey Alcantara'],
    }),
  },
  {
    slug: 'linao',
    name: 'Linao Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Rossvet Lopez') },
    roles: roles({
      'Family Services Specialist': ['Sis. Nilda Padua'],
    }),
  },
  {
    slug: 'minglanilla',
    name: 'Minglanilla Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Mary Ann Silim') },
    roles: roles({
      'Education Specialist': ['Sis. Maricel Destacamento'],
      'Family Services Specialist': ['Sis. Bebeth Alfeche'],
      'Health and Nutrition Specialist': ['Sis. Ban Ayade'],
      'GAMA Specialist': ['Bro. Marco Daclan'],
      'My Plan Specialist': ['Sis. Elaine Gel Alfeche'],
      'Business and Employment Specialist': ['Bro. Alfer Secadas'],
      'ATPG Specialist': ['Bro. Edgar Alfeche'],
    }),
  },
  {
    slug: 'naga',
    name: 'Naga Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Alicia Gaa') },
    roles: roles({
      'Education Specialist': ['Bro. Cleford Garing'],
      'Family Services Specialist': ['Bro. Bryan Cuevas'],
      'Health and Nutrition Specialist': ['Sis. Stacey Ann Umbay'],
      'GAMA Specialist': ['Sis. Hanily Cuevas'],
      'My Plan Specialist': ['Sis. Jelyn Rosell'],
      'Business and Employment Specialist': ['Bro. Robin Rosalita'],
    }),
  },
  {
    slug: 'pardo',
    name: 'Pardo Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Louriz Calica') },
    roles: roles({
      'Education Specialist': ['Sis. Trisha Mae Gagelonia'],
      'Family Services Specialist': ['Bro. Dominic & Sis. Thata Villanueva'],
      'Health and Nutrition Specialist': ['Sis. Kathrine Mendiola'],
      'GAMA Specialist': ['Sis. Raquel Tan'],
      'My Plan Specialist': ['Bro. Jerome Quisido'],
      'Business and Employment Specialist': ['Sis. Elia Segovia'],
      'ATPG Specialist': ['Bro. Richard Hernandez'],
    }),
  },
  {
    slug: 'talisay-1st',
    name: 'Talisay 1st Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Hazel Tausa') },
    roles: roles({}),
  },
  {
    slug: 'talisay-2nd',
    name: 'Talisay 2nd Ward',
    lead: { role: 'WSR Specialist', people: people('Sis. Shiela Garcia') },
    roles: roles({
      'Education Specialist': ['Sis. Memelie Munoz'],
      'Family Services Specialist': ['Sis. Judylyn Gonzales'],
      'Health and Nutrition Specialist': ['Sis. Joan Uy'],
      'GAMA Specialist': ['Bro. Ruben Genterone'],
      'My Plan Specialist': ['Bro. Jericho Genterone'],
      'Business and Employment Specialist': ['Bro. Lucresio Codilla'],
      'ATPG Specialist': ['Bro. Jerald Munoz'],
    }),
  },
];

// Known phone numbers from the source workbook's Directory table.
const phones = {
  'Bro. Marco Daclan': '9352873592',
  'Bro. Edgar Alfeche': '9773830107',
};
for (const ward of wards) {
  for (const r of ward.roles) {
    for (const p of r.people) {
      if (phones[p.name]) p.phone = phones[p.name];
    }
  }
}

const roleLegend = {
  'WSR Specialist': 'Leads the ward Welfare & Self-Reliance committee.',
  'Stake Welfare and Self-Reliance Specialist': 'Leads the stake Welfare & Self-Reliance committee.',
  'Vice Chairman / Co-Chairman': 'Assists and co-leads the stake WSR committee alongside the WSR Specialist.',
  'Stake WSR Secretary': 'Keeps committee records and supports the Stake WSR Specialist.',
  'Education Specialist': 'Helps members pursue education and skills training.',
  'Family Services Specialist': 'Connects members with counseling and family support resources.',
  'Health and Nutrition Specialist': 'Supports members on health, nutrition, and emergency preparedness.',
  'GAMA Specialist': 'GAMA = Guide to Administering Medical Assistance. Helps members access medical assistance guidance.',
  'My Plan Specialist': 'Helps Returned Missionaries build their personal My Plan for continued self-reliance.',
  'Business and Employment Specialist': 'Assists with job search, resumes, and small business support.',
  'ATPG Specialist': 'ATPG = Area Temporal Preparedness Guide. Coordinates emergency and temporal preparedness planning.',
  '1st Counselor, Stake Presidency': 'Serves as First Counselor in the Stake Presidency.',
  'High Councilor': 'Assigned stake leader supporting wards and stake committees.',
};
for (const base of ROLE_ORDER) {
  roleLegend[base.replace(/Specialist$/, 'Chairman')] = roleLegend[base];
}

const out = {
  meta: {
    title: 'Talisay Stake — Know Your Specialist',
    updatedAt: new Date().toISOString(),
    roleLegend,
  },
  wards,
};

const outPath = path.join(__dirname, '..', 'data', 'directory.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('Wrote', outPath, 'with', wards.length, 'wards and', nextId - 1, 'people');
