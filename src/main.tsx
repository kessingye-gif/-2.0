import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {BrowserRouter} from 'react-router-dom';
import './index.css';
import {MasterDataProvider} from './masterData/MasterDataContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}><MasterDataProvider><App /></MasterDataProvider></BrowserRouter>
  </StrictMode>,
);
