document.addEventListener('DOMContentLoaded', () => {

/* =======================================
 * Sticky Header
 * ======================================= */
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
    } else {
        header.classList.remove('header--scrolled');
    }
});

/* =======================================
 * Melting Discount
 * ======================================= */
(function(){
  var amountEl = document.getElementById('meltAmount');
  var floatEl = document.getElementById('floatAmount');
  var barEl = document.getElementById('meltBar');
  var floatMelt = document.getElementById('floatMelt');
  if(!amountEl || !barEl) return;

  var START = 500;
  var wheelShown = false;

  var KEY = 'meltStart';
  var startTime = sessionStorage.getItem(KEY);
  if(!startTime){ startTime = Date.now(); sessionStorage.setItem(KEY, startTime); }
  else { startTime = parseInt(startTime); }

  function update(){
    var elapsed = Math.floor((Date.now() - startTime) / 1000);
    var current = Math.max(0, START - elapsed);

    amountEl.textContent = current;
    barEl.style.width = (current / START * 100) + '%';
    if(floatEl) floatEl.textContent = current;

    amountEl.classList.add('pulse');
    setTimeout(function(){ amountEl.classList.remove('pulse'); }, 200);

    // Trigger wheel of fortune when reaches 0
    if(current === 0 && !wheelShown && !sessionStorage.getItem('wheelUsed')){
      wheelShown = true;
      setTimeout(function(){ openWheelModal(); }, 800);
    }
  }

  // Force zero button
  window.meltForceZero = function(){
    startTime = Date.now() - (START + 10) * 1000;
    sessionStorage.setItem(KEY, startTime);
    sessionStorage.removeItem('wheelUsed');
    wheelShown = false;
    update();
  };

  update();
  setInterval(update, 1000);

  // Show floating badge after scrolling past hero
  if(floatMelt){
    var hero = document.querySelector('.hero');
    window.addEventListener('scroll', function(){
      if(!hero) return;
      var bottom = hero.getBoundingClientRect().bottom;
      if(bottom < 0){
        floatMelt.classList.add('visible');
      } else {
        floatMelt.classList.remove('visible');
      }
    });
  }
})();

/* =======================================
 * Wheel of Fortune
 * ======================================= */
(function(){
  var segments = [
    { label:'100', value:100, bg:'#d91f26', text:'#fff' },
    { label:'150', value:150, bg:'#f5f5f7', text:'#1f1f24' },
    { label:'200', value:200, bg:'#d91f26', text:'#fff' },
    { label:'120', value:120, bg:'#f5f5f7', text:'#1f1f24' },
    { label:'250', value:250, bg:'#d91f26', text:'#fff' },
    { label:'180', value:180, bg:'#f5f5f7', text:'#1f1f24' },
    { label:'300', value:300, bg:'#d91f26', text:'#fff' },
    { label:'130', value:130, bg:'#f5f5f7', text:'#1f1f24' }
  ];
  var canvas = document.getElementById('wheelCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var size = canvas.width;
  var cx = size/2, cy = size/2, r = size/2 - 4;
  var arc = (2*Math.PI) / segments.length;
  var angle = 0;
  var spinning = false;
  var wonValue = 0;

  function drawWheel(rot){
    ctx.clearRect(0,0,size,size);
    for(var i=0;i<segments.length;i++){
      var a = rot + i*arc;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,r,a,a+arc);
      ctx.closePath();
      ctx.fillStyle = segments[i].bg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Text
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(a + arc/2);
      ctx.textAlign = 'center';
      ctx.fillStyle = segments[i].text;
      ctx.font = '800 15px Inter, sans-serif';
      ctx.fillText(segments[i].label, r*0.62, 5);
      ctx.font = '600 9px Inter, sans-serif';
      ctx.globalAlpha = 0.6;
      ctx.fillText('BYN', r*0.62, 17);
      ctx.globalAlpha = 1;
      ctx.restore();
    }
    // Center circle
    ctx.beginPath();
    ctx.arc(cx,cy,24,0,2*Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.1)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#d91f26';
    ctx.font = '800 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPIN', cx, cy + 4);
  }

  drawWheel(0);

  window.openWheelModal = function(){
    var modal = document.getElementById('wheelModal');
    if(modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    drawWheel(0);
  };

  window.closeWheel = function(){
    var modal = document.getElementById('wheelModal');
    if(modal) modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  window.spinWheel = function(){
    if(spinning) return;
    spinning = true;
    var btn = document.getElementById('wheelSpinBtn');
    if(btn) btn.disabled = true;

    // Pick random result (100-300)
    var targetIdx = Math.floor(Math.random() * segments.length);
    wonValue = segments[targetIdx].value;

    // Calculate rotation: at least 5 full spins + land on target segment
    // Pointer is at top (270°), segment center = targetIdx * arc + arc/2
    var segAngle = targetIdx * arc + arc/2;
    // We need the segment to be at the top (3π/2), rotating clockwise means negative angle
    var targetAngle = -(segAngle - 3*Math.PI/2) - (5 * 2*Math.PI);

    var startAngle = angle;
    var totalRotation = targetAngle - startAngle;
    var duration = 4000;
    var startTime = performance.now();

    function easeOut(t){
      return 1 - Math.pow(1 - t, 3);
    }

    function animateSpin(now){
      var elapsed = now - startTime;
      var t = Math.min(elapsed / duration, 1);
      var eased = easeOut(t);
      var current = startAngle + totalRotation * eased;
      drawWheel(current);
      if(t < 1){
        requestAnimationFrame(animateSpin);
      } else {
        angle = current;
        spinning = false;
        sessionStorage.setItem('wheelUsed', '1');
        showWheelResult(wonValue);
      }
    }
    requestAnimationFrame(animateSpin);
  };

  function showWheelResult(val){
    var content = document.getElementById('wheelContent');
    if(!content) return;
    content.innerHTML =
      '<div class="wheel-modal__badge">Вы выиграли</div>' +
      '<div class="wheel-modal__title">Ваша скидка</div>' +
      '<div class="wheel-result">' +
        '<div class="wheel-result__amount">-' + val + ' BYN</div>' +
        '<div class="wheel-result__label">Закрепите скидку за собой — оставьте номер</div>' +
      '</div>' +
      '<form class="wheel-form" id="wheelForm">' +
        '<input type="tel" placeholder="+375 (__) ___-__-__" required id="wheelPhone">' +
        '<button type="submit">Забронировать -' + val + ' BYN</button>' +
      '</form>';
    document.getElementById('wheelForm').addEventListener('submit', function(e){
      e.preventDefault();
      var phone = document.getElementById('wheelPhone').value;
      content.innerHTML =
        '<div style="width:56px;height:56px;border-radius:50%;background:rgba(217,31,38,0.08);color:#d91f26;display:grid;place-items:center;margin:0 auto 16px;font-size:28px;">&#10003;</div>' +
        '<div class="wheel-modal__title">Скидка ' + val + ' BYN<br>закреплена!</div>' +
        '<div class="wheel-modal__sub">Номер: <b style="color:#d91f26;">' + phone + '</b><br>Перезвоним в ближайшее время</div>' +
        '<button class="wheel-spin-btn" onclick="closeWheel()" style="margin-top:16px;">Отлично</button>';
      var amountEl = document.getElementById('meltAmount');
      var floatEl = document.getElementById('floatAmount');
      if(amountEl) amountEl.textContent = val;
      if(floatEl) floatEl.textContent = val;
    });
  }
})();

/* =======================================
 * FAQ Accordion
 * ======================================= */
const faqCards = document.querySelectorAll('[data-faq]');
faqCards.forEach(card => {
    const btn = card.querySelector('.faq-card__q');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const isActive = card.classList.contains('active');
        faqCards.forEach(el => el.classList.remove('active'));
        if (!isActive) card.classList.add('active');
    });
});

/* =======================================
 * Installment Logic (Рассрочка)
 * ======================================= */
const amountRange = document.getElementById('amountRange');
const termRange = document.getElementById('termRange');
const amountVal = document.getElementById('amountVal');
const termVal = document.getElementById('termVal');
const resultPayment = document.getElementById('resultPayment');
const paymentNote = document.getElementById('paymentNote');

const TERM_STEPS = [2, 3, 4, 12, 18, 24];

function calculateInstallment() {
    if(!amountRange || !termRange) return;
    const amount = parseInt(amountRange.value);
    const term = TERM_STEPS[parseInt(termRange.value)];

    amountVal.textContent = amount + ' BYN';
    termVal.textContent = term + ' мес.';

    const payment = Math.round(amount / term);
    resultPayment.textContent = payment + ' руб/мес';

    if (paymentNote) {
        if (payment > 400) {
            paymentNote.style.display = 'none';
        } else {
            paymentNote.style.display = '';
            let comparison;
            if (payment <= 60) {
                comparison = 'Как стоимость 2-х пицц!';
            } else if (payment <= 120) {
                comparison = 'Как стоимость 3-х пицц!';
            } else if (payment <= 250) {
                comparison = 'Как один поход в ресторан!';
            } else {
                comparison = 'Вполне комфортный платёж!';
            }
            paymentNote.textContent = comparison;
        }
    }
}
if(amountRange && termRange) {
    amountRange.addEventListener('input', calculateInstallment);
    termRange.addEventListener('input', calculateInstallment);
    calculateInstallment();
}

/* =======================================
 * Quiz Logic (Калькулятор)
 * ======================================= */
const QI = {
    /* Окно — рама с двумя створками и ручкой */
    window: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="24" height="24" rx="2.5"/><line x1="16" y1="4" x2="16" y2="28"/><line x1="4" y1="16" x2="16" y2="16"/><line x1="14" y1="13" x2="14" y2="15" stroke-width="2"/><rect x="5" y="5" width="10" height="10" rx="1" fill="currentColor" opacity=".07" stroke="none"/></svg>',

    /* Одностворчатое окно */
    win1: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="4" width="18" height="24" rx="2.5"/><line x1="7" y1="16" x2="25" y2="16"/><line x1="23" y1="13" x2="23" y2="15" stroke-width="2"/><rect x="8" y="5" width="16" height="10" rx="1" fill="currentColor" opacity=".07" stroke="none"/></svg>',

    /* Двухстворчатое окно */
    win2: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="24" height="24" rx="2.5"/><line x1="16" y1="4" x2="16" y2="28"/><line x1="14" y1="14" x2="14" y2="16" stroke-width="2"/><line x1="18" y1="14" x2="18" y2="16" stroke-width="2"/></svg>',

    /* Трёхстворчатое окно */
    win3: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="26" height="24" rx="2.5"/><line x1="12" y1="4" x2="12" y2="28"/><line x1="21" y1="4" x2="21" y2="28"/><line x1="19" y1="14" x2="19" y2="16" stroke-width="2"/></svg>',

    /* Балконный блок — дверь + окно */
    balconyBlock: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="12" height="26" rx="2"/><line x1="3" y1="16" x2="15" y2="16"/><line x1="13" y1="18" x2="13" y2="20" stroke-width="2"/><rect x="17" y="3" width="12" height="16" rx="2"/><line x1="23" y1="3" x2="23" y2="19"/><line x1="17" y1="11" x2="29" y2="11"/></svg>',

    /* Балкон — остекление */
    balcony: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="26" height="14" rx="2"/><line x1="11" y1="4" x2="11" y2="18"/><line x1="21" y1="4" x2="21" y2="18"/><line x1="3" y1="21" x2="29" y2="21" stroke-width="2"/><line x1="6" y1="21" x2="6" y2="28"/><line x1="16" y1="21" x2="16" y2="28"/><line x1="26" y1="21" x2="26" y2="28"/></svg>',

    /* Дверь ПВХ — с ручкой и филёнкой */
    door: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="18" height="28" rx="2.5"/><rect x="10" y="5" width="12" height="10" rx="1.5" fill="currentColor" opacity=".07"/><rect x="10" y="18" width="12" height="8" rx="1.5" fill="currentColor" opacity=".07"/><line x1="22" y1="15" x2="22" y2="18" stroke-width="2.2"/></svg>',

    /* Многоэтажка — квартира */
    apartment: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="20" height="26" rx="2"/><rect x="10" y="7" width="4" height="3" rx=".8"/><rect x="18" y="7" width="4" height="3" rx=".8"/><rect x="10" y="13" width="4" height="3" rx=".8"/><rect x="18" y="13" width="4" height="3" rx=".8"/><rect x="10" y="19" width="4" height="3" rx=".8"/><rect x="18" y="19" width="4" height="3" rx=".8"/><rect x="13" y="25" width="6" height="4" rx="1"/></svg>',

    /* Частный дом — коттедж с крышей */
    house: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15l12-10 12 10"/><rect x="7" y="14" width="18" height="14" rx="1.5"/><rect x="12" y="19" width="8" height="9" rx="1"/><rect x="19" y="7" width="5" height="8" rx=".5"/></svg>',

    /* Дача — домик с деревом */
    dacha: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18l9-8 9 8"/><rect x="5" y="17" width="14" height="11" rx="1.5"/><rect x="9" y="21" width="5" height="7" rx=".8"/><line x1="27" y1="28" x2="27" y2="14"/><circle cx="27" cy="10" r="5" fill="currentColor" opacity=".1"/><path d="M25 13c-1-1.5-1-4 0-5.5M29 13c1-1.5 1-4 0-5.5"/></svg>',

    /* Замена — гаечный ключ */
    replace: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 7.5a6 6 0 00-8.2 8.2l-6.8 6.8a2.1 2.1 0 003 3l6.8-6.8a6 6 0 008.2-8.2l-3.5 3.5-2.1-2.1 3.5-3.5z"/></svg>',

    /* Новый проём — плюс в квадрате */
    newBuild: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="22" height="22" rx="4"/><line x1="16" y1="11" x2="16" y2="21"/><line x1="11" y1="16" x2="21" y2="16"/></svg>',

    /* Прямой балкон */
    straight: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="26" height="12" rx="2"/><line x1="11" y1="8" x2="11" y2="20"/><line x1="21" y1="8" x2="21" y2="20"/><line x1="3" y1="23" x2="29" y2="23" stroke-width="2"/></svg>',

    /* Угловой балкон */
    corner: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h18v12H3z" /><path d="M21 14h8v6h-8z"/><line x1="11" y1="8" x2="11" y2="20"/><line x1="25" y1="14" x2="25" y2="20"/><path d="M3 23h26" stroke-width="2"/></svg>',

    /* П-образный балкон */
    ushape: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h6v16H5zM13 10h6v12h-6zM21 6h6v16h-6z"/><path d="M3 25h26" stroke-width="2"/></svg>',

    /* На улицу — дверь с солнцем */
    outdoor: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="8" width="14" height="22" rx="2"/><line x1="16" y1="18" x2="16" y2="21" stroke-width="2"/><circle cx="25" cy="8" r="4"/><line x1="25" y1="1" x2="25" y2="3"/><line x1="25" y1="13" x2="25" y2="15"/><line x1="19" y1="8" x2="21" y2="8"/><line x1="29" y1="8" x2="31" y2="8"/></svg>',

    /* Внутри помещения — дверной проём */
    indoor: '<svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 28V5a2 2 0 012-2h20a2 2 0 012 2v23"/><rect x="10" y="8" width="12" height="20" rx="2" fill="currentColor" opacity=".07"/><path d="M10 28V10a2 2 0 012-2h8a2 2 0 012 2v18"/><line x1="20" y1="17" x2="20" y2="20" stroke-width="2"/></svg>',
};
const ICON_MAP = {
    windows:'window', balconyBlock:'balconyBlock', balconyWindows:'balcony', doors:'door',
    'Квартира':'apartment', 'Дом':'house', 'Дача':'dacha',
    'Одностворчатое':'win1', 'Двухстворчатое':'win2', 'Трёхстворчатое':'win3',
    'Замена':'replace', 'Новый':'newBuild',
    'Прямой':'straight', 'Угловой':'corner', 'П-образный':'ushape',
    'Улица':'outdoor', 'Балкон':'balcony', 'Внутри':'indoor',
};
function getQuizIcon(v) { return QI[ICON_MAP[v]] || QI.window; }

const QUIZ = {
    product: {
      title: 'Что вас интересует?',
      description: 'Выберите продукт — и квиз покажет только нужные шаги без мусора и технички.',
      hint: 'Выбор продукта',
      options: [
        { value: 'windows', label: 'Окна', sub: 'Квартира, дом, дача' },
        { value: 'balconyBlock', label: 'Балконный блок', sub: 'Дверь + окно на балкон' },
        { value: 'balconyWindows', label: 'Окна на балкон', sub: 'Остекление балкона' },
        { value: 'doors', label: 'Двери ПВХ', sub: 'На улицу или внутрь' }
      ]
    },
    branches: {
      windows: [
        {
          key: 'place', title: 'Куда нужны окна?', hint: 'Окна · место',
          options: [
            { value: 'Квартира', label: 'В квартиру' },
            { value: 'Дом', label: 'В частный дом' },
            { value: 'Дача', label: 'На дачу' }
          ]
        },
        {
          key: 'type', title: 'Какое окно нужно?', hint: 'Окна · тип',
          options: [
            { value: 'Одностворчатое', label: 'Одностворчатое' },
            { value: 'Двухстворчатое', label: 'Двухстворчатое' },
            { value: 'Трёхстворчатое', label: 'Трёхстворчатое' }
          ]
        }
      ],
      balconyBlock: [
        {
          key: 'condition', title: 'Замена или новый?', hint: 'Балконный блок',
          options: [
            { value: 'Замена', label: 'Замена старого блока' },
            { value: 'Новый', label: 'Новый проём' }
          ]
        }
      ],
      balconyWindows: [
        {
          key: 'shape', title: 'Форма балкона?', hint: 'Балкон · форма',
          options: [
            { value: 'Прямой', label: 'Прямой' },
            { value: 'Угловой', label: 'Угловой' },
            { value: 'П-образный', label: 'П-образный' }
          ]
        }
      ],
      doors: [
        {
          key: 'place', title: 'Куда нужна дверь?', hint: 'Двери · место',
          options: [
            { value: 'Улица', label: 'На улицу' },
            { value: 'Балкон', label: 'На балкон' },
            { value: 'Внутри', label: 'Внутри помещения' }
          ]
        }
      ]
    }
};

/* ===============================================
   QUIZ CALCULATOR
   =============================================== */
(function(){
  const gsApp = document.getElementById('gsApp');
  if(!gsApp) return;

  const LETTERS = ['A','B','C','D','E','F'];
  const gs = { product:null, stepIndex:0, answers:{}, submitted:false, phone:'', selected:null };

  function gsBranch(){ return gs.product ? QUIZ.branches[gs.product] : []; }
  function gsTotal(){ return 1 + gsBranch().length + 1; }
  function gsCurrent(){ return gs.product ? gs.stepIndex + 2 : 1; }

  function gsGoBack(){
    gs.selected = null;
    if(gs.stepIndex > 0){
      gs.stepIndex--;
      const steps = gsBranch();
      if(steps[gs.stepIndex]) delete gs.answers[steps[gs.stepIndex].key];
    } else {
      gs.product = null; gs.answers = {}; gs.stepIndex = 0;
    }
    renderGS();
  }
  window.gsGoBack = gsGoBack;

  function stepsHTML(){
    const total = gsTotal();
    const cur = gsCurrent();
    let h = '';
    for(let i=1;i<=total;i++){
      const cls = i < cur ? 'done' : i === cur ? 'current' : 'upcoming';
      h += `<div class="gs-step-dot ${cls}">${i}</div>`;
    }
    return h;
  }

  function optsHTML(options, withSub){
    let h = '<div class="gs-opts">';
    options.forEach((opt, i) => {
      const label = opt.label || opt.value;
      const sub = withSub && opt.sub ? `<div class="gs-opt__sub">${opt.sub}</div>` : '';
      h += `<div class="gs-opt" data-val="${opt.value}">
        <div class="gs-opt__letter">${LETTERS[i]}</div>
        <div><div class="gs-opt__text">${label}</div>${sub}</div>
      </div>`;
    });
    h += '</div>';
    return h;
  }

  function backBtn(show){
    return show ? `<div style="position:relative;z-index:1;margin-top:8px;"><button class="gs-back-link" onclick="gsGoBack()">&larr; Назад</button></div>` : '';
  }

  function bindOpts(onConfirm){
    const opts = gsApp.querySelectorAll('.gs-opt');
    opts.forEach(el => {
      el.addEventListener('click', () => {
        opts.forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
        const val = el.getAttribute('data-val');
        setTimeout(() => onConfirm(val), 300);
      });
    });
  }

  function renderGS(){
    if(gs.submitted){
      gsApp.innerHTML = `
        <div class="gs-steps">${stepsHTML()}</div>
        <div style="text-align:center;padding:40px 0;">
          <div style="width:72px;height:72px;border-radius:50%;background:#dc2626;color:#fff;display:grid;place-items:center;margin:0 auto 20px;font-size:32px;">&#10003;</div>
          <h3 style="font-size:26px;font-weight:900;color:#fff;margin-bottom:10px;">Заявка принята!</h3>
          <p style="color:rgba(255,255,255,0.5);">Мы получили ваш номер: <b style="color:#f87171;">${gs.phone}</b>.<br>Скоро перезвоним с расчётом.</p>
          <button class="gs-answer-btn" style="margin-top:28px;" onclick="location.reload()">Ок</button>
        </div>`;
      return;
    }

    if(!gs.product){
      gs.selected = null;
      let h = `<div class="gs-steps">${stepsHTML()}</div>`;
      h += `<div class="gs-question"><div class="gs-question__text">${QUIZ.product.title}</div></div>`;
      h += optsHTML(QUIZ.product.options, true);
      gsApp.innerHTML = h;
      bindOpts(val => {
        gs.product = val;
        gs.stepIndex = 0; gs.answers = {};
        gs.selected = null;
        renderGS();
      });
      return;
    }

    const steps = gsBranch();
    if(gs.stepIndex < steps.length){
      gs.selected = null;
      const step = steps[gs.stepIndex];
      let h = `<div class="gs-steps">${stepsHTML()}</div>`;
      h += `<div class="gs-question"><div class="gs-question__text">${step.title}</div></div>`;
      h += optsHTML(step.options, false);
      h += backBtn(true);
      gsApp.innerHTML = h;
      bindOpts(val => {
        gs.answers[step.key] = val;
        gs.stepIndex++; gs.selected = null;
        renderGS();
      });

    } else {
      let h = `<div class="gs-steps">${stepsHTML()}</div>`;
      h += `<div class="gs-question"><div class="gs-question__text">Оставьте номер телефона</div></div>`;
      h += `<p style="color:rgba(255,255,255,0.4);margin-bottom:24px;font-size:15px;">Мы перезвоним, уточним детали и подскажем точную стоимость.</p>`;
      h += `<form id="gsForm" style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:20px;">
        <input class="gs-form-input" id="gsPhone" type="tel" placeholder="+375 (__) ___-__-__" required style="flex:1;min-width:220px;">
        <button type="submit" class="gs-answer-btn">Получить расчёт</button>
      </form>`;
      h += `<button class="gs-back-link" onclick="gsGoBack()">&larr; Назад</button>`;
      gsApp.innerHTML = h;
      document.getElementById('gsForm').addEventListener('submit', e => {
        e.preventDefault();
        gs.phone = document.getElementById('gsPhone').value;
        gs.submitted = true;
        renderGS();
      });
    }
  }
  renderGS();
})();

/* ===============================================
   PHONE MODAL — on every CTA button
   =============================================== */
const phoneOverlay = document.getElementById('phoneModal');
const phoneContent = document.getElementById('phoneModalContent');
const phoneForm = document.getElementById('phoneModalForm');
const phoneInput = document.getElementById('phoneModalInput');

function openPhoneModal() {
  if (!phoneOverlay) return;
  phoneContent.innerHTML = `
    <div class="phone-modal__title">Оставьте номер телефона</div>
    <div class="phone-modal__sub">Мы перезвоним в течение 5 минут и ответим на все вопросы</div>
    <form class="phone-modal__form" id="phoneModalForm">
      <input class="phone-modal__input" type="tel" id="phoneModalInput" placeholder="+375 (__) ___-__-__" required>
      <button type="submit" class="phone-modal__btn">Перезвоните мне</button>
    </form>`;
  phoneOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    const inp = document.getElementById('phoneModalInput');
    if (inp) inp.focus();
  }, 100);
  document.getElementById('phoneModalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const phone = document.getElementById('phoneModalInput').value;
    phoneContent.innerHTML = `
      <div class="phone-modal__success">
        <div style="width:64px;height:64px;border-radius:50%;background:#dc2626;color:#fff;display:grid;place-items:center;margin:0 auto 20px;font-size:28px;box-shadow:0 0 30px rgba(220,38,38,0.4);">&#10003;</div>
        <div class="phone-modal__title">Заявка принята!</div>
        <div class="phone-modal__sub">Номер: <b style="color:#f87171;">${phone}</b><br>Перезвоним в ближайшее время</div>
        <button type="button" class="phone-modal__btn" style="margin-top:12px;" onclick="closePhoneModal()">Хорошо</button>
      </div>`;
  });
}
window.openPhoneModal = openPhoneModal;

function closePhoneModal() {
  if (!phoneOverlay) return;
  phoneOverlay.classList.remove('active');
  document.body.style.overflow = '';
}
window.closePhoneModal = closePhoneModal;

if (phoneOverlay) {
  phoneOverlay.addEventListener('click', function(e) {
    if (e.target === phoneOverlay) closePhoneModal();
  });
}
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closePhoneModal();
});

// Attach to all CTA buttons (except quiz internal, modal internal, and "Наверх")
document.querySelectorAll('.btn-primary').forEach(function(btn) {
  if (btn.closest('#gsApp') || btn.closest('.phone-modal') || btn.closest('#phoneModal')) return;
  if (btn.textContent.trim() === '→') return;
  if (btn.onclick && btn.onclick.toString().includes('scrollTo')) return;
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    openPhoneModal();
  });
});

/* ===============================================
   JOURNEY — step-by-step unlock
   =============================================== */
(function(){
  const timeline = document.getElementById('journeyTimeline');
  const steps = document.querySelectorAll('.journey-step');
  const lineFill = document.getElementById('journeyLineFill');
  const cta = document.getElementById('journeyCta');
  if(!steps.length || !timeline) return;

  let unlocked = 1;
  let tapIcon = null;

  function updateJourney(){
    const total = steps.length;

    steps.forEach(function(step){
      const n = parseInt(step.getAttribute('data-step'));
      step.classList.remove('j-open','j-locked','j-next');
      if(n <= unlocked){
        step.classList.add('j-open');
      } else if(n === unlocked + 1){
        step.classList.add('j-next');
      } else {
        step.classList.add('j-locked');
      }
    });

    // Tap icon — outside blurred element
    if(tapIcon){ tapIcon.remove(); tapIcon = null; }
    var nextStep = timeline.querySelector('.j-next');
    if(nextStep){
      tapIcon = document.createElement('img');
      tapIcon.src = 'assets/img/нажать.png';
      tapIcon.className = 'j-tap-icon';
      timeline.appendChild(tapIcon);
      var rect = nextStep.getBoundingClientRect();
      var parentRect = timeline.getBoundingClientRect();
      tapIcon.style.left = (rect.left - parentRect.left + rect.width / 2) + 'px';
      tapIcon.style.top = (rect.top - parentRect.top + rect.height / 2) + 'px';
    }

    if(lineFill){
      var pct = ((unlocked - 1) / (total - 1)) * 100;
      lineFill.style.width = pct + '%';
    }

    if(cta){
      if(unlocked >= total){
        setTimeout(function(){
          cta.style.opacity = '1';
          cta.style.transform = 'translateY(0)';
          cta.style.pointerEvents = 'auto';
        }, 400);
      } else {
        cta.style.opacity = '0';
        cta.style.transform = 'translateY(20px)';
        cta.style.pointerEvents = 'none';
      }
    }
  }

  steps.forEach(function(step){
    step.addEventListener('click', function(){
      var n = parseInt(step.getAttribute('data-step'));
      if(n === unlocked + 1){
        unlocked = n;
        updateJourney();
      }
    });
  });

  updateJourney();
})();

/* =======================================
 * Mobile Burger Menu
 * ======================================= */
const burgerBtn = document.getElementById('burgerBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (burgerBtn && mobileMenu) {
  burgerBtn.addEventListener('click', () => {
    burgerBtn.classList.toggle('active');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
  });
}

window.closeMobileMenu = function() {
  if (burgerBtn && mobileMenu) {
    burgerBtn.classList.remove('active');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }
};

});
