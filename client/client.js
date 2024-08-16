const publicVapidKey  = 'BCgJqWRVIM3B2lyWqILZ8cBKJXEWW9IOAEliQhSaZxcR8YpjYMR9q9EoMNC56XRHVfzF4eLdv1FlADrrh47PDuA';
if('serviceWorker' in navigator){
  send().catch(err => console.error(err))
}

// /Register SW, Register pushSubscription
async function send() {
  console.log("Registering server worker...")
  const register = await navigator.serviceWorker.register('/worker.js',{
    scope: '/'
  }) 
  console.log('service worker registed...')
}