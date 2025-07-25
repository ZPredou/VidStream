import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'player',
    loadComponent: () => import('./components/player.component').then(m => m.PlayerComponent)
  },
  {
    path: 'comparison',
    loadComponent: () => import('./components/comparison.component').then(m => m.ComparisonComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
