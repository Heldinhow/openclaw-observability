import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.tsx'

Sentry.init({
  dsn: 'https://e7bdb5f0a5c94f5f8efc164fc75f3287@o4508799327653888.ingest.us.sentry.io/4508799329452032',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})

const SentryErrorBoundary = Sentry.ErrorBoundary as any

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<p>An error has occurred</p>}>
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
)
