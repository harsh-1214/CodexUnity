import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App' // Ensure this import is correct and there are no circular dependencies
import { PersistGate } from "redux-persist/integration/react"
import { Provider } from 'react-redux'
import { store } from './app/store'
import { persistStore } from "redux-persist"
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

export const queryClient = new QueryClient()

let persister = persistStore(store);
ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Provider store={store}>
      <PersistGate persistor={persister}>
        <App />
      </PersistGate>
    </Provider>
  </QueryClientProvider>
)

// const updateSW = registerSW({
//   onNeedRefresh() {
//     console.log('Service Worker needs refresh');
//   },
//   onOfflineReady() {
//     console.log('Service Worker is ready for offline use');
//   },
// });

// register();
// registerSync();

