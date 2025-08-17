const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?~';
const AMBIGUOUS = /[Il1O0]/g;
const VOWELS = 'aeiou';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';

function generatePassword(opts){
  let pool = '';
  if (opts.lower) pool += LOWER;
  if (opts.upper) pool += UPPER;
  if (opts.digits) pool += DIGITS;
  if (opts.symbols) pool += SYMBOLS;
  if (!pool) return '';
  if (opts.avoid) pool = pool.replace(AMBIGUOUS, '');
  const arr = new Uint32Array(opts.length);
  crypto.getRandomValues(arr);
  return Array.from(arr, x => pool[x % pool.length]).join('');
}

function generatePronounceable(length){
  let out = '';
  let useCons = true;
  for (let i=0;i<length;i++){
    out += useCons
      ? CONSONANTS[Math.floor(Math.random()*CONSONANTS.length)]
      : VOWELS[Math.floor(Math.random()*VOWELS.length)];
    useCons = !useCons;
  }
  return out;
}

function calcEntropyBits(opts){
  let pool = 0;
  if (opts.lower) pool += LOWER.length;
  if (opts.upper) pool += UPPER.length;
  if (opts.digits) pool += DIGITS.length;
  if (opts.symbols) pool += SYMBOLS.length;
  if (opts.avoid){
    let combined = (opts.lower?LOWER:'')+(opts.upper?UPPER:'')+(opts.digits?DIGITS:'')+(opts.symbols?SYMBOLS:'');
    let set = new Set(combined.split(''));
    let ambiguousCount = 0;
    ['I','l','1','O','0'].forEach(ch => { if (set.has(ch)) ambiguousCount++; });
    pool -= ambiguousCount;
  }
  if (pool <= 1) return 0;
  return Math.log2(pool);
}

function strengthLabel(bits){
  if (bits < 28) return 'Очень слабый';
  if (bits < 36) return 'Слабый';
  if (bits < 60) return 'Средний';
  if (bits < 80) return 'Сильный';
  return 'Очень сильный';
}

const pwdField = document.getElementById('password');
const lenInput = document.getElementById('length');
const lenLabel = document.getElementById('lenLabel');
const entropyLabel = document.getElementById('entropy');
const strengthLabelEl = document.getElementById('strength');

const checkIds = ['lower','upper','digits','symbols','avoid','pronounce'];
const checks = {};
checkIds.forEach(id => checks[id] = document.getElementById(id));

document.getElementById('genBtn').onclick = () => {
  const opts = {
    length: parseInt(lenInput.value),
    lower: checks.lower.checked,
    upper: checks.upper.checked,
    digits: checks.digits.checked,
    symbols: checks.symbols.checked,
    avoid: checks.avoid.checked
  };
  const pwd = checks.pronounce.checked ? generatePronounceable(opts.length) : generatePassword(opts);
  pwdField.value = pwd;
  document.getElementById('copyBtn').disabled = !pwd;
  document.getElementById('dlBtn').disabled = !pwd;
  const bits = Math.round(calcEntropyBits(opts) * opts.length);
  entropyLabel.textContent = bits;
  strengthLabelEl.textContent = strengthLabel(bits);
};

document.getElementById('copyBtn').onclick = () => {
  navigator.clipboard.writeText(pwdField.value).then(()=> alert('Скопировано!'));
};

document.getElementById('dlBtn').onclick = () => {
  const blob = new Blob([pwdField.value], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'password.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

lenInput.oninput = () => {
  lenLabel.textContent = lenInput.value;
};
