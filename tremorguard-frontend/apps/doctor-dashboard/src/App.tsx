import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
