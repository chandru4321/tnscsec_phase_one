import { Injectable, signal } from '@angular/core';

// App-wide message dialog — same look as Form5B's submit dialogs — used by
// the form pages instead of the browser's alert(). One DialogHost (in the
// layout) renders it, so it stays on screen even when the page navigates
// away right after a successful save.

export type DialogKind = 'success' | 'error' | 'warning';

export interface DialogState {
  kind: DialogKind;
  title: string;
  message: string;
  resolve: () => void;
}

const TITLES: Record<DialogKind, string> = {
  success: 'வெற்றிகரமாக முடிந்தது',
  error: 'பிழை',
  warning: 'கவனிக்கவும்'
};

@Injectable({ providedIn: 'root' })
export class DialogService {

  readonly current = signal<DialogState | null>(null);

  success(message: string, title = TITLES.success): Promise<void> {
    return this.open('success', message, title);
  }

  error(message: string, title = TITLES.error): Promise<void> {
    return this.open('error', message, title);
  }

  warning(message: string, title = TITLES.warning): Promise<void> {
    return this.open('warning', message, title);
  }

  /**
   * Drop-in replacement for alert(message): picks the style from the text —
   * ✔ / "Successfully" / "வெற்றிகரமாக" … → success, ✘ / "failed" / "error"
   * → error, anything else (validation hints) → warning. The ✔ / ✘ marks
   * are removed because the dialog shows its own icon.
   */
  show(message: any): Promise<void> {
    const text = String(message ?? '');
    const kind: DialogKind =
      /^\s*✘|fail|error|பிழை|முடியவில்லை/i.test(text) ? 'error'
        : /^\s*✔|success|வெற்றிகரமாக|சேமிக்கப்பட்டது|நிறுத்தப்பட்டது|finali[sz]ed/i.test(text) ? 'success'
          : 'warning';
    return this.open(kind, text.replace(/^\s*[✔✘⚠️]+\s*/u, ''), TITLES[kind]);
  }

  close(): void {
    const state = this.current();
    this.current.set(null);
    state?.resolve();
  }

  private open(kind: DialogKind, message: string, title: string): Promise<void> {
    // a dialog already open is closed first (its promise resolves)
    this.close();
    return new Promise<void>(resolve => this.current.set({ kind, title, message, resolve }));
  }
}
