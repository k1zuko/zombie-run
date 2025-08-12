import { Suspense } from 'react';
import HomePage from './homePage';
import LoadingScreen from '@/components/game/LoadingScreen';

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePage />
    </Suspense>
  );
}