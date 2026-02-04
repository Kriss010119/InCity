import { createBrowserRouter } from 'react-router-dom';
import {Home, Map} from '../pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/map',
    element: <Map />
  }
]);
