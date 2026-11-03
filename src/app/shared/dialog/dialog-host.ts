import { Component, HostListener, inject } from '@angular/core';
import { DialogService } from './dialog.service';

// Renders the DialogService dialog. Placed once in the layout.
@Component({
  selector: 'app-dialog-host',
  standalone: true,
  templateUrl: './dialog-host.html',
  styleUrls: ['./dialog-host.css']
})
export class DialogHost {

  readonly dialog = inject(DialogService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog.current()) this.dialog.close();
  }
}
