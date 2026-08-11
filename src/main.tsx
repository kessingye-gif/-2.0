import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {BrowserRouter} from 'react-router-dom';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={window.location.pathname.startsWith('/houtai') ? '/houtai' : '/'}><App /></BrowserRouter>
  </StrictMode>,
);
