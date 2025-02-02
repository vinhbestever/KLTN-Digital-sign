import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ConfigProvider } from 'antd';

createRoot(document.getElementById('root')!).render(
  <ConfigProvider
    theme={{
      token: {
        // Seed Token
        colorPrimary: '#573b8a',
      },
    }}
  >
    <App />
  </ConfigProvider>
);
