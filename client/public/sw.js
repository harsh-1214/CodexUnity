
// const CACHE_NAME = "app-cache";
// const OFFLINE_URL = [
//   '/',
//   "/index.html",
//   "/favicon.ico",
//   // "manifest.json",
//   // "/static/js/bundle.js",
// ];

// self.addEventListener("install", (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(OFFLINE_URL);
//     })
//   );
  
//   self.skipWaiting();
// });

// // self.addEventListener('activate' , (event) => {

// // })


// self.addEventListener("fetch", (event) => {

//   const url = new URL(event.request.url);
//   console.log(event.request)

//   // if(event.request.url.includes('localhost:3001')){
//   //   return;
//   // }
//   // Exclude Socket.IO requests
//   // if (url.pathname.startsWith('/socket.io/') || url.pathname.includes('ws')) {
//   //   return;
//   // }

//   // Network-first caching strategy

//   if(event.request.url.startsWith(location.origin) 
//     // || event.request.url.startsWith(`${location.origin}/documents`)
//   ){
//     event.respondWith(
//       fetch(event.request)
//       .then( fetchResponse => {
  
//         if(!fetchResponse){
//           console.log('No response from server');
//           return new Response('ok');
//         }
  
  
//         // Resource not found on server
//         console.log('Response : ', fetchResponse);
  
//          // Clone the response
//          const responseClone = fetchResponse.clone();
//          // Open the cache
//          caches.open(CACHE_NAME)
//          .then(cache => {
//              // Put the fetched response in the cache
//              cache.put(event.request.url, responseClone);
//          });
//          return fetchResponse;
//       })
//       .catch( () => {
//         return caches.match(event.request.url)
//         .then( cacheResponse => {
//           if(!!cacheResponse) return cacheResponse;
          
//           else{
//             // Return offline, if you found Nothing online and offline
//             // caches.match("/offline")
//             return new Response('Here is 404 HTML Page')
//           }
//         })
//       })
//     )
  
//   }
// });

// self.addEventListener('sync', event => {
//   if (event.tag === 'sync-documents') {
//     event.waitUntil(syncDocuments());
//   }
// });

// function syncDocuments() {
//   console.log('syncDocuments function called');
//   return new Promise((resolve, reject) => {
//     // Open the database
//     const request = indexedDB.open('documentEditorDB', 1);

//     request.onsuccess = event => {
//       const db = event.target.result;
//       const transaction = db.transaction(['documents'], 'readonly');
//       const store = transaction.objectStore('documents');
//       const getAllRequest = store.getAll();

//       getAllRequest.onsuccess = () => {
//         const documents = getAllRequest.result;
//         console.log(documents)
//         // Send documents to the server
//         fetch('http://localhost:3001/sync-data', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify(documents)
//         })
//         .then(response => response.json())
//         .then(data => {
//           console.log('Documents synced successfully:', data);
//           resolve();
//         })
//         .catch(error => {
//           console.error('Error syncing documents:', error);
//           reject();
//         });
//       };

//       getAllRequest.onerror = () => {
//         console.error('Error retrieving documents');
//         reject();
//       };
//     };

//     request.onerror = () => {
//       console.error('Error opening database');
//       reject();
//     };
//   });
// }