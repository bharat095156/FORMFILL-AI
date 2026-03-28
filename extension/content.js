// FormFillAI Chrome Extension — Content Script
// Runs on all pages to detect and fill form fields

// ===== Smart Field Mapping Dictionary =====
const FIELD_MAP = {
  // Personal
  firstname: ['first name','firstname','first','fname','given name','forename','first_name'],
  middlename: ['middle name','middlename','middle','second name'],
  lastname: ['last name','lastname','last','lname','surname','family name','last_name'],
  fullname: ['full name','fullname','name','your name','complete name','candidate name','applicant name'],
  email: ['email','e-mail','email address','your email','mail'],
  phone: ['phone','mobile','telephone','cell','contact number','phone number','mobile number','mob no','contact no'],
  altphone: ['alternate phone','alternate mobile','alternative phone','emergency contact','second phone','other phone'],
  dob: ['date of birth','dob','birth date','birthday','birthdate','date of birth (dd/mm/yyyy)'],
  gender: ['gender','sex'],
  marital: ['marital status','marital','marriage status'],
  fathername: ["father's name","father name","father","paternal name","f/o","s/o w/o d/o"],
  mothername: ["mother's name","mother name","mother","maternal name"],
  nationality: ['nationality','citizenship','citizen'],
  religion: ['religion','faith'],
  languages: ['languages known','languages','language','mother tongue'],
  website: ['website','url','web','portfolio','personal website','site'],

  // Address
  address: ['address','street','street address','house no','flat no','door no','h no','permanent address'],
  area: ['area','locality','village','sector','colony','ward','nagar'],
  postoffice: ['post office','po name','po','post'],
  district: ['district','dist'],
  taluka: ['taluka','tehsil','mandal','block','sub district','taluk'],
  city: ['city','town','municipality'],
  state: ['state','province'],
  zip: ['zip','postal','postcode','postal code','zip code','pin code','pincode','pin'],
  country: ['country','nation'],
  domicile: ['domicile','home state','state of domicile','permanent state','native state'],
  corraddress: ['correspondence address','current address','mailing address','temporary address'],
  corrcity: ['correspondence city','current city','mailing city'],
  corrstate: ['correspondence state','current state','mailing state'],
  corrzip: ['correspondence pin','current pin','mailing pin'],

  // Identity
  category: ['category','caste category','reservation category','social category'],
  caste: ['caste','sub caste','sub-category','community'],
  pwd: ['physically handicapped','pwd','disability','handicapped','differently abled','ph'],
  exserviceman: ['ex-serviceman','ex serviceman','exserviceman','defence','armed forces'],
  aadhar: ['aadhar','aadhaar','uid','unique id','aadhar number','aadhaar number','aadhar no'],
  pan: ['pan','pan number','pan card','permanent account number','pan no'],
  voterid: ['voter id','voter card','epic','election card','voter id number'],
  passport: ['passport','passport number','passport no'],
  drivinglicence: ['driving licence','driving license','dl number','dl no','licence number'],
  rollno: ['roll number','registration number','application number','roll no','reg no','app no'],

  // 10th
  school10: ['school name','name of school','10th school','ssc school','high school name','secondary school'],
  board10: ['10th board','ssc board','matriculation board','secondary board'],
  year10: ['10th passing year','year of passing 10th','ssc passing year','10th year'],
  marks10: ['10th marks','ssc marks','marks in 10th','10th marks obtained'],
  maxmarks10: ['10th max marks','ssc max marks','maximum marks (10th)','10th out of'],
  percent10: ['10th percentage','ssc percentage','10th %','percentage in 10th','ssc %'],
  rollno10: ['10th roll no','ssc roll number','matriculation roll no'],

  // 12th
  school12: ['12th school','intermediate college','hsc college','12th institute','junior college','inter college'],
  board12: ['12th board','intermediate board','hsc board','inter board','bie'],
  stream12: ['stream','12th stream','group','science/arts/commerce'],
  year12: ['12th passing year','intermediate passing year','hsc passing year','inter year'],
  marks12: ['12th marks','intermediate marks','hsc marks','inter marks'],
  maxmarks12: ['12th max marks','intermediate max marks','12th out of'],
  percent12: ['12th percentage','intermediate percentage','hsc %','12th %','intermediate %','inter %'],
  rollno12: ['12th roll no','intermediate roll no','hsc roll number'],

  // Graduation
  college: ['college','college name','institute','institution','name of college'],
  university: ['university','university name','affiliating university'],
  degree: ['degree','graduation','course','programme','bachelor degree','ug degree'],
  branch: ['branch','specialization','discipline','subject','major'],
  yeardegree: ['graduation year','degree year','passing year','year of passing','ug passing year'],
  durationdegree: ['duration','course duration'],
  marksdegree: ['graduation marks','degree marks','ug marks'],
  maxmarksdegree: ['graduation max marks','degree max marks','ug max marks'],
  percentdegree: ['graduation percentage','degree percentage','ug percentage','cgpa','aggregate percentage','overall percentage'],
  enrolldegree: ['enrolment number','enrollment no','college roll no','ug roll no'],

  // PG
  pgcollege: ['pg college','post graduation college','pg institute','master college'],
  pguniversity: ['pg university','post graduation university','master university'],
  pgdegree: ['pg degree','post graduation degree','master degree','pg course'],
  pgbranch: ['pg branch','pg specialization','master specialization'],
  yearpg: ['pg passing year','pg year','post graduation year','master year'],
  percentpg: ['pg percentage','pg cgpa','pg %','post graduation %','master percentage'],

  // Other qualifications
  diploma: ['diploma','iti','certificate','other qualification','other degree'],
  diplomainstitute: ['diploma institute','iti centre','certificate institute'],
  diplomayear: ['diploma year','iti year','certificate year'],
  diplomascore: ['diploma score','iti score','diploma grade'],

  // Professional
  company: ['company','organization','employer','firm','office','workplace'],
  jobtitle: ['job title','designation','position','post','role','current post'],
  experience: ['experience','total experience','work experience','years of experience','service period'],
  emptype: ['employment type','type of employment','nature of employment','sector'],
  servicestart: ['service start','joining date','date of joining','from date'],
  serviceend: ['service end','relieving date','date of leaving','to date'],
  skills: ['skills','expertise','technologies','competencies','technical skills'],
  linkedin: ['linkedin','linkedin url','linkedin profile'],
  bio: ['bio','about','about me','summary','description','cover letter','profile summary'],

  // Banking
  bankname: ['bank name','bank','name of bank'],
  bankbranch: ['branch','bank branch','branch name'],
  accountnum: ['account number','account no','account #','acct no','bank account number'],
  ifsc: ['ifsc','ifsc code','ifsc number','bank ifsc','rtgs code','neft code'],
  accounttype: ['account type','type of account'],
  micr: ['micr','micr code'],
  cardholder: ['account holder','account holder name','name as per bank','bank account name','cardholder','name on card'],
  upi: ['upi','upi id','upi address','google pay','paytm','phonepe'],
  cardnum: ['card number','credit card','debit card','card no'],
  expiry: ['expiry','expiration','card expiry','exp date'],
  routing: ['routing','swift','swift code','routing number','iban'],
};

// Build reverse lookup: keyword → profileKey
const KEYWORD_TO_FIELD = {};
for (const [key, keywords] of Object.entries(FIELD_MAP)) {
  for (const kw of keywords) {
    KEYWORD_TO_FIELD[kw] = key;
  }
}

// ===== Listen for Autofill Message =====
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'AUTOFILL') {
    const result = autofill(msg.profile);
    sendResponse(result);
  }
  if (msg.type === 'COUNT_FIELDS') {
    const fields = getFormFields();
    sendResponse({ count: fields.length });
  }
  return true;
});

// ===== Get all form fields on page =====
function getFormFields() {
  return Array.from(document.querySelectorAll('input, textarea, select')).filter(el => {
    const type = (el.type || '').toLowerCase();
    return !['hidden','submit','button','reset','image','file','checkbox','radio'].includes(type)
      && el.offsetParent !== null  // visible
      && !el.disabled
      && !el.readOnly;
  });
}

// ===== Core Autofill Logic =====
function autofill(profile) {
  const fields = getFormFields();
  let filled = 0;
  const skipped = [];

  for (const el of fields) {
    const key = detectField(el);
    if (!key) { skipped.push(getLabel(el)); continue; }

    // Resolve the value — try exact key, then full name fallback
    let value = profile[key];
    if (!value && key === 'fullname') {
      value = [profile.firstname, profile.lastname].filter(Boolean).join(' ');
    }
    if (!value) continue;

    fillField(el, value);
    filled++;
  }

  return {
    success: true,
    filled,
    total: fields.length,
    skipped: skipped.filter(Boolean).slice(0, 5),
  };
}

// ===== Detect what profile field an element maps to =====
function detectField(el) {
  const hints = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute('aria-label'),
    el.getAttribute('autocomplete'),
    getLabelText(el),
    el.getAttribute('data-field'),
    el.closest('[data-field]')?.getAttribute('data-field'),
  ].filter(Boolean).map(h => h.toLowerCase().trim());

  // Check autocomplete values first (most reliable)
  const autocompleteMap = {
    'name': 'fullname', 'given-name': 'firstname', 'family-name': 'lastname',
    'email': 'email', 'tel': 'phone', 'tel-national': 'phone',
    'street-address': 'address', 'address-line1': 'address',
    'address-level2': 'city', 'address-level1': 'state',
    'postal-code': 'zip', 'country': 'country', 'country-name': 'country',
    'organization': 'company', 'organization-title': 'jobtitle',
    'cc-name': 'cardholder', 'cc-number': 'cardnum', 'cc-exp': 'expiry',
    'bday': 'dob', 'url': 'website',
  };
  const ac = el.getAttribute('autocomplete');
  if (ac && autocompleteMap[ac]) return autocompleteMap[ac];

  // Check against keyword dictionary
  for (const hint of hints) {
    // Direct match
    if (KEYWORD_TO_FIELD[hint]) return KEYWORD_TO_FIELD[hint];
    // Partial match
    for (const [kw, field] of Object.entries(KEYWORD_TO_FIELD)) {
      if (hint.includes(kw) || kw.includes(hint)) return field;
    }
  }

  return null;
}

// ===== Get associated label text =====
function getLabelText(el) {
  // Explicit label[for]
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return label.textContent;
  }
  // Wrapping label
  const parent = el.closest('label');
  if (parent) return parent.textContent;
  // aria-labelledby
  const labelId = el.getAttribute('aria-labelledby');
  if (labelId) {
    const labelEl = document.getElementById(labelId);
    if (labelEl) return labelEl.textContent;
  }
  // Previous sibling text
  const prev = el.previousElementSibling;
  if (prev && ['LABEL','SPAN','P','DIV','LEGEND'].includes(prev.tagName)) {
    return prev.textContent;
  }
  return '';
}

// ===== Get readable label for skipped logging =====
function getLabel(el) {
  return getLabelText(el) || el.placeholder || el.name || el.id || '';
}

// ===== Fill a field and fire events =====
function fillField(el, value) {
  if (el.tagName === 'SELECT') {
    // Try to match option
    const lower = value.toLowerCase();
    for (const opt of el.options) {
      if (opt.text.toLowerCase().includes(lower) || opt.value.toLowerCase().includes(lower)) {
        el.value = opt.value;
        fireEvents(el);
        return;
      }
    }
    return;
  }

  // Native input value setter (React/Vue compatibility)
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;

  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }

  fireEvents(el);
}

// ===== Fire input events for framework compatibility =====
function fireEvents(el) {
  ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
    el.dispatchEvent(new Event(eventType, { bubbles: true }));
  });
}
