import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './legacy-encode-policy.css';
import './uk-chat.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
