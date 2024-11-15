let isServiceWorkerRegistered;

export async function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log(
                "Service Worker registered with scope:",
                registration.scope
              );
            })
            .catch((error) => {
              console.error("Service Worker registration failed:", error);
            });
        }
      });
    });
  }
}

// export function registerSync() {
//   if ("serviceWorker" in navigator && "SyncManager" in window) {
//     navigator.serviceWorker.ready
//       .then((registration) => {
//         // @ts-ignore
//         return registration.sync.register("sync-documents");
//       })
//       .then(() => {
//         console.log("Sync registered");
//       })
//       .catch((error) => {
//         console.error("Sync registration failed:", error);
//       });
//   }
// }

export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister();
    });
  }
}
