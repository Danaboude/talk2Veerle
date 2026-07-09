import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent),
    },
    {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
    },
    {
        path: 'create',
        canActivate: [adminGuard],
        loadComponent: () => import('./creator/creator.component').then(m => m.CreatorComponent),
    },
    {
        path: 'create/:id',
        canActivate: [adminGuard],
        loadComponent: () => import('./creator/creator.component').then(m => m.CreatorComponent),
    },
    {
        path: 'survey/:id', // Public path
        loadComponent: () => import('./survey/survey.component').then(m => m.SurveyComponent),
    },
    {
        path: 'aanbod',
        loadComponent: () => import('./pages/aanbod/aanbod').then(m => m.AanbodComponent),
    },
    {
        path: 'aanpak',
        loadComponent: () => import('./pages/aanpak/aanpak').then(m => m.AanpakComponent),
    },
    {
        path: 'over-mij',
        loadComponent: () => import('./pages/over-mij/over-mij').then(m => m.OverMijComponent),
    },
    {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact-page').then(m => m.ContactPageComponent),
    },
    {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    },
    {
        path: ':id', // Catch-all for survey IDs (e.g. survey.p41.be/some-id)
        loadComponent: () => import('./survey/survey.component').then(m => m.SurveyComponent),
    },
    { path: '**', redirectTo: 'login' },
];
