import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { SEO } from './seo/seo-pages';

export const routes: Routes = [
    {
        path: '',
        data: { seo: SEO.HOME },
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
        data: { seo: SEO.AANBOD },
        loadComponent: () => import('./pages/aanbod/aanbod').then(m => m.AanbodComponent),
    },
    {
        path: 'aanpak',
        data: { seo: SEO.AANPAK },
        loadComponent: () => import('./pages/aanpak/aanpak').then(m => m.AanpakComponent),
    },
    {
        path: 'over-mij',
        data: { seo: SEO.OVER_MIJ },
        loadComponent: () => import('./pages/over-mij/over-mij').then(m => m.OverMijComponent),
    },
    {
        path: 'contact',
        data: { seo: SEO.CONTACT },
        loadComponent: () => import('./pages/contact/contact-page').then(m => m.ContactPageComponent),
    },
    {
        path: 'dashboard',
        canActivate: [adminGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
    },
    {
        path: 'dashboard/bezoekers',
        canActivate: [adminGuard],
        loadComponent: () => import('./dashboard/visitors/visitors.component').then(m => m.VisitorsComponent),
    },
    {
        path: ':id', // Catch-all for survey IDs (e.g. survey.p41.be/some-id)
        loadComponent: () => import('./survey/survey.component').then(m => m.SurveyComponent),
    },
    { path: '**', redirectTo: 'login' },
];
