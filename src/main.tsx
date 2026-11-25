import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { sharedHandStore } from './storage/hand-store';
import { browserPersist, requestPersistenceOnce } from './storage/persistent-storage';
import { sharedAdviceClient } from './ui/advice/advice-client';
import { AppRoot } from './ui/AppRoot';
import './ui/styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

// Starts the app-wide advice worker now, so it is warm before the first table asks for a bot decision.
sharedAdviceClient();

createRoot(root).render(
  <StrictMode>
    <AppRoot />
  </StrictMode>,
);

// After the first render and not awaited, so it never delays Home; it never rejects (TASK-13.2 A-1, A-6).
void requestPersistenceOnce(sharedHandStore(), browserPersist(navigator));
