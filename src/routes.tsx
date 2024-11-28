import { RouteObject } from 'react-router-dom';
import { Home } from '@/pages/Home';
import { SignIn } from '@/pages/auth/SignIn';
import { SignUp } from '@/pages/auth/SignUp';
import { Dashboard } from '@/pages/Dashboard';
import { AuthGuard } from '@/components/auth/AuthGuard';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/signup',
    element: <SignUp />,
  },
  {
    path: '/dashboard/*',
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
  },
];