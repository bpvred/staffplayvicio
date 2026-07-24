async function enviarCandidaturaAPI(payload){

 const api = window.BPV_CONFIG.API_URL.trim();


 if(!api){
  throw new Error("API não configurada");
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
   `Erro API ${response.status}: ${texto}`
  );
 }


 return true;
}
