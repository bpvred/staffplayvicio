const form = document.querySelector("form");
const submitBtn = document.getElementById("submitBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const successScreen = document.getElementById("successScreen");

const STORAGE_KEY = "bpv_candidatura";

let currentStep = 0;


// ================= CONFIG =================

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


// ================= TOAST =================

function showToast(msg){

 const toast = document.getElementById("toast");

 if(!toast) return;

 toast.textContent = msg;

 toast.classList.add("show");


 setTimeout(()=>{

  toast.classList.remove("show");

 },3000);

}



// ================= PAYLOAD =================

function buildPayload(){

 const data = new FormData(form);

 const obj = Object.fromEntries(data.entries());


 obj.protocol =
 "BPV-" + Date.now();


 obj.server =
 window.BPV_CONFIG.SERVER_NAME;


 obj.created =
 new Date().toISOString();


 return obj;

}



// ================= ENVIO API =================

async function enviarCandidaturaAPI(payload){


 const api = window.BPV_CONFIG.API_URL.trim();



 if(!api){

  throw new Error(
   "API não configurada"
  );

 }



 const response = await fetch(api,{

  method:"POST",

  headers:{

   "Content-Type":"application/json"

  },

  body:JSON.stringify(payload)

 });



 const texto = await response.text();



 if(!response.ok){

  throw new Error(
   `Erro ${response.status}: ${texto}`
  );

 }



 return true;

}




// ================= CONTADORES =================


function updateCounters(){

 document
 .querySelectorAll("textarea")
 .forEach(t=>{

  const counter =
  t.parentElement.querySelector(".counter");


  if(counter){

   counter.textContent =
   `${t.value.length}/${t.maxLength}`;

  }

 });

}
// ================= SUBMIT =================

form.addEventListener("submit", async e=>{

 e.preventDefault();


 loadingOverlay.classList.remove("hidden");

 submitBtn.disabled = true;



 try{


  const payload = buildPayload();



  await enviarCandidaturaAPI(payload);



  const protocolo =
  document.getElementById("protocolNumber");


  if(protocolo){

   protocolo.textContent =
   payload.protocol;

  }



  form.classList.add("hidden");



  if(successScreen){

   successScreen.classList.remove("hidden");

  }



  localStorage.removeItem(STORAGE_KEY);



 }catch(err){


  console.error(err);


  showToast(
   "Não foi possível enviar a candidatura: "
   + err.message
  );



 }finally{


  loadingOverlay.classList.add("hidden");


  submitBtn.disabled = false;


 }

});



// ================= SALVAR RASCUNHO =================


form.addEventListener("input",()=>{


 const data =
 Object.fromEntries(
  new FormData(form).entries()
 );


 localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify(data)
 );


 updateCounters();


});




// ================= CARREGAR RASCUNHO =================


window.addEventListener("load",()=>{


 const saved =
 localStorage.getItem(STORAGE_KEY);



 if(!saved) return;



 try{


  const data =
  JSON.parse(saved);



  Object.entries(data)
  .forEach(([key,value])=>{


   const input =
   form.querySelector(
    `[name="${key}"]`
   );


   if(input){

    input.value = value;

   }


  });



 }catch(e){

  console.log(e);

 }



 updateCounters();


});
