const form = document.getElementById('staffForm');
const steps = [...document.querySelectorAll('.form-step')];
const navItems = [...document.querySelectorAll('.step-item')];
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const stepLabel = document.getElementById('stepLabel');
const pageTitle = document.getElementById('pageTitle');
const toast = document.getElementById('toast');
const loadingOverlay = document.getElementById('loadingOverlay');
const successScreen = document.getElementById('successScreen');
const elapsedTime = document.getElementById('elapsedTime');
const answeredCount = document.getElementById('answeredCount');

let currentStep = 0;
let startedAt = Date.now();
const STORAGE_KEY = 'bpv_staff_application_v1';
const titles = ['Recrutamento Staff','Informações pessoais','Conhecimentos de RP','Situações administrativas','Atendimento ao jogador','Compromisso e disponibilidade','Finalização'];

function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3200)}
function updateUI(){
  steps.forEach((step,i)=>step.classList.toggle('active',i===currentStep));
  navItems.forEach((item,i)=>{item.classList.toggle('active',i===currentStep);item.classList.toggle('done',i<currentStep)});
  const pct=Math.round((currentStep/(steps.length-1))*100);
  progressBar.style.width=`${pct}%`;progressPercent.textContent=`${pct}%`;stepLabel.textContent=`Etapa ${currentStep+1} de ${steps.length}`;pageTitle.textContent=titles[currentStep];
  prevBtn.disabled=currentStep===0;
  nextBtn.classList.toggle('hidden',currentStep===steps.length-1);
  submitBtn.classList.toggle('hidden',currentStep!==steps.length-1);
  nextBtn.textContent=currentStep===0?'Iniciar candidatura →':'Próxima etapa →';
  window.scrollTo({top:0,behavior:'smooth'});
  updateAnswered();
}
function validateStep(index){
  const required=[...steps[index].querySelectorAll('[required]')];
  let firstInvalid=null;
  required.forEach(el=>{
    let valid=el.type==='radio'?[...steps[index].querySelectorAll(`[name="${el.name}"]`)].some(r=>r.checked):el.checkValidity();
    el.classList.toggle('invalid',!valid);
    if(!valid&&!firstInvalid) firstInvalid=el;
  });
  if(firstInvalid){showToast('Preencha todos os campos obrigatórios antes de continuar.');firstInvalid.focus?.();return false}
  return true;
}
nextBtn.addEventListener('click',()=>{if(!validateStep(currentStep))return;if(currentStep<steps.length-1){currentStep++;updateUI();saveDraft()}});
prevBtn.addEventListener('click',()=>{if(currentStep>0){currentStep--;updateUI()}});

function saveDraft(){
  const data={};new FormData(form).forEach((v,k)=>data[k]=v);localStorage.setItem(STORAGE_KEY,JSON.stringify({data,currentStep,startedAt}));
}
function loadDraft(){
  try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));if(!saved)return;Object.entries(saved.data||{}).forEach(([k,v])=>{const fields=form.querySelectorAll(`[name="${k}"]`);fields.forEach(f=>{if(f.type==='radio'||f.type==='checkbox')f.checked=f.value===v;else f.value=v})});startedAt=saved.startedAt||Date.now();currentStep=Math.min(saved.currentStep||0,steps.length-1);updateCounters()}catch(e){console.warn('Rascunho inválido',e)}
}
form.addEventListener('input',e=>{e.target.classList.remove('invalid');updateCounters();updateAnswered();saveDraft()});
form.addEventListener('change',()=>{updateAnswered();saveDraft()});
function updateCounters(){document.querySelectorAll('textarea').forEach(t=>{const c=t.parentElement.querySelector('.counter');if(c)c.textContent=`${t.value.length} / ${t.maxLength}`})}
function updateAnswered(){
  const names=[...new Set([...form.querySelectorAll('[name]')].map(e=>e.name))];
  let done=0;names.forEach(name=>{const els=[...form.querySelectorAll(`[name="${name}"]`)];if(els.some(e=>(e.type==='radio'||e.type==='checkbox')?e.checked:String(e.value).trim().length>0))done++});
  answeredCount.textContent=`${done} / ${names.length}`;
}
setInterval(()=>{const sec=Math.floor((Date.now()-startedAt)/1000);elapsedTime.textContent=`${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`},1000);

function buildPayload(){
  const d=Object.fromEntries(new FormData(form).entries());
  const seconds=Math.floor((Date.now()-startedAt)/1000);
  return {protocol:`BPV-${Date.now().toString().slice(-8)}`,submittedAt:new Date().toISOString(),durationSeconds:seconds,...d};
}

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clean=value=>String(value??'Não informado').trim()||'Não informado';

function buildDiscordMessages(d){
  const color=14818093;
  const footerText=`${d.protocol} • ${new Date(d.submittedAt).toLocaleString('pt-BR')} • Tempo: ${Math.max(1,Math.floor(d.durationSeconds/60))} min`;
  const embed=(title,description,footer=false)=>({
    title,
    description:description.slice(0,4000),
    color,
    footer:footer?{text:footerText}:undefined
  });

  return [
    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed(`📩 Nova candidatura Staff • ${d.protocol}`,
`**Nick:** ${clean(d.nick)}\n**ID:** ${clean(d.id)}\n**Idade:** ${clean(d.idade)}\n**Discord:** ${clean(d.discord)}\n**Tempo no servidor:** ${clean(d.tempo_servidor)}\n\n**Experiência em Staff:**\n${clean(d.experiencia_staff)}`)]},

    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed('📚 Conhecimentos de Roleplay',
`**Roleplay:**\n${clean(d.rp)}\n\n**Meta Gaming (MG):**\n${clean(d.mg)}\n\n**Power Gaming (PG):**\n${clean(d.pg)}\n\n**Death Match (DM):**\n${clean(d.dm)}\n\n**Vehicle Death Match (VDM):**\n${clean(d.vdm)}\n\n**Jogador desrespeitoso:**\n${clean(d.jogador_desrespeitoso)}`)]},

    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed('🛡️ Situações administrativas • Parte 1',
`**Bug envolvendo veículo:**\n${clean(d.bug_veiculo)}\n\n**Discussão entre jogadores:**\n${clean(d.discussao_jogadores)}\n\n**Erro de um membro da Staff:**\n${clean(d.erro_staff)}`)]},

    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed('🛡️ Situações administrativas • Parte 2',
`**Denúncia sem provas:**\n${clean(d.denuncia_sem_provas)}\n\n**Possível uso de cheat:**\n${clean(d.possivel_cheat)}`)]},

    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed('🎧 Atendimento e postura',
`**Bom atendimento:**\n${clean(d.bom_atendimento)}\n\n**Jogador nervoso ou ofensivo:**\n${clean(d.jogador_nervoso)}\n\n**Calma sob pressão:**\n${clean(d.calma_pressao)}`)]},

    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed('⏰ Compromisso e disponibilidade',
`**Horas por dia:** ${clean(d.horas_dia)}\n**Dias e horários:** ${clean(d.dias_horarios)}\n**Microfone funcional:** ${clean(d.microfone)}\n**Regras e sigilo:** ${clean(d.sigilo)}\n\n**Por que deseja entrar:**\n${clean(d.motivo_staff)}\n\n**O que pode agregar:**\n${clean(d.agregar_equipe)}`)]},

    {username:'Recrutamento BPV',allowed_mentions:{parse:[]},embeds:[embed('⭐ Resposta final',clean(d.pergunta_final),true)]}
  ];
}

async function postWebhook(webhook,payload){
  const url=webhook.includes('?')?`${webhook}&wait=true`:`${webhook}?wait=true`;
  let response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if(response.status===429){
    const rate=await response.json().catch(()=>({}));
    await sleep(Math.ceil((rate.retry_after||1)*1000)+250);
    response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  }
  if(!response.ok)throw new Error(`Discord ${response.status}`);
}

form.addEventListener('submit',async e=>{
  e.preventDefault();if(!validateStep(currentStep))return;
  const webhook=window.BPV_CONFIG?.DISCORD_WEBHOOK_URL?.trim();
  if(!webhook){showToast('O webhook do Discord não está configurado.');return}
  loadingOverlay.classList.remove('hidden');submitBtn.disabled=true;
  try{
    const payload=buildPayload();
    const messages=buildDiscordMessages(payload);
    for(let i=0;i<messages.length;i++){
      await postWebhook(webhook,messages[i]);
      if(i<messages.length-1)await sleep(700);
    }
    document.getElementById('protocolNumber').textContent=payload.protocol;
    form.classList.add('hidden');document.querySelector('.topbar').classList.add('hidden');successScreen.classList.remove('hidden');localStorage.removeItem(STORAGE_KEY);
  }catch(err){console.error(err);showToast('Não foi possível enviar ao Discord. Tente novamente em alguns instantes.')}finally{loadingOverlay.classList.add('hidden');submitBtn.disabled=false}
});
document.getElementById('newApplication').addEventListener('click',()=>{localStorage.removeItem(STORAGE_KEY);location.reload()});

loadDraft();updateCounters();updateUI();
