import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { sharedAdviceClient } from './ui/advice/advice-client';
import App from './ui/App';
import './ui/styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root element');
}

// Starts the app-wide advice worker now, so it is warm before the first table asks for a bot decision.
sharedAdviceClient();

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
