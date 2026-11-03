import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header {

  username: string | null = localStorage.getItem('username');
  dropdownOpen = false;

  private router = inject(Router);
  private auth = inject(AuthService);

  private loggingOut = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Revokes the token on the server (POST /api/auth/logout), then clears the
  // session and goes to login. The local session is cleared even if the API
  // call fails (offline, token already expired), so the user is never stuck.
  logout() {
    if (this.loggingOut) return;
    this.loggingOut = true;

    this.dropdownOpen = false;   // 🔥 closes dropdown automatically

    this.auth.logout()
      .pipe(finalize(() => {
        this.auth.clearSession();
        this.loggingOut = false;
        this.router.navigate(['/login']);
      }))
      .subscribe({ error: () => { /* handled in finalize */ } });
  }
}
