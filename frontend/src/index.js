import React from 'react';
import ReactDOM from 'react-dom/client';

// استيراد ملفات التنسيق الرئيسية
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css'; // استيراد بوتستراب الأساسي
import './index.css'; // استيراد التعديلات الاحترافية التي كتبناها

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
