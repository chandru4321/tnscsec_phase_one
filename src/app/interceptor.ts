import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  // PDF downloads: tell the backend which heading to print —
  // "Abstract Report" from the admin dashboard pages, "Entry Report" elsewhere
  if (req.responseType === 'blob') {
    const reportType = router.url.startsWith('/layout/admin') ? 'abstract' : 'entry';
    req = req.clone({ setParams: { report_type: reportType } });
  }

  if (token) {
    // console.log("token",token);
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req);
};
