import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';


@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="login-root">
        <div class="login-card">
            <div class="login-logo-wrap">
                <img src="/logo.png" alt="Talk2 Logo" class="login-logo">
            </div>
            <h1 class="login-title">Admin Inloggen</h1>
            <p class="login-sub">Log in om leads en afspraken te beheren</p>

            <form (ngSubmit)="onSubmit()" class="login-form">
                <div class="form-group">
                    <label>E-mailadres</label>
                    <input type="email" [(ngModel)]="email" name="email" required placeholder="admin@p41.be" [disabled]="loading()">
                </div>
                <div class="form-group">
                    <label>Wachtwoord</label>
                    <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" [disabled]="loading()">
                </div>
                
                <div class="login-error" *ngIf="error()">{{ error() }}</div>

                <button type="submit" class="btn-login" [disabled]="!email() || !password() || loading()">
                    {{ loading() ? 'Bezig met inloggen...' : 'Inloggen' }}
                </button>
            </form>
        </div>
    </div>
    `,
    styles: [`
    .login-root {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: var(--color-cream);
        padding: 24px;
        font-family: var(--font-sans);
    }
    .login-card {
        background: var(--color-warm-white);
        padding: 40px;
        border-radius: 3px;
        box-shadow: 0 4px 20px rgba(30, 53, 32, 0.06);
        width: 100%;
        max-width: 400px;
        border: 1px solid var(--color-sage-pale);
    }
    .login-logo-wrap {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 24px;
    }
    .login-logo {
        height: 60px;
        display: block;
    }
    .login-title {
        font-family: var(--font-heading);
        font-size: 26px;
        font-weight: 400;
        color: var(--color-sage-darkest);
        text-align: center;
        margin: 0 0 8px;
    }
    .login-sub {
        color: var(--color-text-muted);
        text-align: center;
        font-size: 14px;
        margin: 0 0 32px;
    }
    .form-group {
        margin-bottom: 20px;
    }
    .form-group label {
        display: block;
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--color-sage-dark);
    }
    .form-group input {
        width: 100%;
        padding: 12px;
        border: 1px solid var(--color-sage-pale);
        border-radius: 2px;
        font-family: var(--font-sans);
        font-size: 15px;
        color: var(--color-text);
        background: white;
        transition: border-color 0.2s;
    }
    .form-group input:focus {
        outline: none;
        border-color: var(--color-sage-mid);
        box-shadow: 0 0 0 3px var(--color-sage-mist);
    }
    .btn-login {
        width: 100%;
        padding: 14px;
        background: var(--color-sage-dark);
        color: white;
        font-family: var(--font-sans);
        font-weight: 500;
        font-size: 13px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        transition: background-color 0.2s;
        margin-top: 12px;
    }
    .btn-login:hover:not(:disabled) {
        background: var(--color-sage);
    }
    .btn-login:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    .login-error {
        color: #a54848;
        background: var(--color-sage-mist);
        border: 1px solid var(--color-sage-pale);
        padding: 12px;
        border-radius: 2px;
        font-size: 14px;
        margin-bottom: 20px;
        text-align: center;
    }
    `]
})
export class LoginComponent {
    email = signal('');
    password = signal('');
    loading = signal(false);
    error = signal('');

    private authService = inject(AuthService);
    private router = inject(Router);

    onSubmit() {
        if (!this.email() || !this.password()) return;

        this.loading.set(true);
        this.error.set('');

        this.authService.login(this.email(), this.password()).subscribe({
            next: () => {
                // Navigate immediately after successful login
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.loading.set(false);
                this.error.set(err.error?.error || 'Ongeldige inloggegevens of serverfout.');
            }
        });
    }
}
