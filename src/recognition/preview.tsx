import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../globals.css';
import { RecognitionPreview } from './RecognitionPreview';

createRoot(document.getElementById('root')!).render(
  <StrictMode><RecognitionPreview /></StrictMode>,
);
