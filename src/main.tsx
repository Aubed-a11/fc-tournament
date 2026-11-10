import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ensureDataVersionSynced } from './services/dataStore.ts';

// Ensure browser cache does not block newly deployed code source modifications
ensureDataVersionSynced();

createRoot(document.getElementById('root')!).render(<App />);
