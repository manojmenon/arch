import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const Bootstrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  React.useEffect(() => {
    const url = new URL(window.location.href)
    const token = url.searchParams.get('session_token')
    if (token) {
      const store: any = useAuthStore.getState()
      // set token and mark authenticated; profile will load on demand
      store.sessionToken = token
      store.isAuthenticated = true
    }
  }, [])
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Bootstrapper>
          <App />
        </Bootstrapper>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)

