import { AfterViewInit, Directive, ElementRef, OnDestroy } from '@angular/core';

// <table mobileCards> — on phones (styles.css, ≤ 768px) each body row is
// shown as a card: one line per column, "header : value". This directive
// works out each column's header text from the table's own <thead> (it
// handles colspan / rowspan headers, e.g. "மொத்தம் · ப.இ/பகு") and writes it
// on every body cell as data-label, re-labelling whenever rows change.
@Directive({
  selector: 'table[mobileCards]',
  standalone: true,
  host: { class: 'm-cards' }
})
export class MobileCardsDirective implements AfterViewInit, OnDestroy {

  private observer?: MutationObserver;
  private labelling = false;

  constructor(private el: ElementRef<HTMLTableElement>) { }

  ngAfterViewInit(): void {
    this.label();
    this.observer = new MutationObserver(() => this.label());
    this.observer.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  // Column index → header text, built from the header grid
  private headerLabels(): string[] {
    const thead = this.el.nativeElement.tHead;
    if (!thead) return [];
    const grid: string[][] = [];
    Array.from(thead.rows).forEach((row, r) => {
      grid[r] = grid[r] || [];
      let c = 0;
      Array.from(row.cells).forEach(cell => {
        while (grid[r][c] !== undefined) c++;
        const text = (cell.textContent || '').replace(/\s+/g, ' ').trim();
        for (let dr = 0; dr < (cell.rowSpan || 1); dr++) {
          grid[r + dr] = grid[r + dr] || [];
          for (let dc = 0; dc < (cell.colSpan || 1); dc++) grid[r + dr][c + dc] = text;
        }
        c += cell.colSpan || 1;
      });
    });
    const cols = Math.max(0, ...grid.map(row => row.length));
    const labels: string[] = [];
    for (let c = 0; c < cols; c++) {
      // distinct header texts down the column, e.g. "group · sub-header"
      const parts: string[] = [];
      grid.forEach(row => { const t = row[c]; if (t && !parts.includes(t)) parts.push(t); });
      labels[c] = parts.join(' · ');
    }
    return labels;
  }

  private label(): void {
    if (this.labelling) return;
    this.labelling = true;
    try {
      const labels = this.headerLabels();
      Array.from(this.el.nativeElement.tBodies).forEach(tbody =>
        Array.from(tbody.rows).forEach(row => {
          let c = 0;
          Array.from(row.cells).forEach(cell => {
            const label = labels[c] || '';
            if (cell.getAttribute('data-label') !== label) cell.setAttribute('data-label', label);
            c += cell.colSpan || 1;
          });
        })
      );
    } finally {
      this.labelling = false;
    }
  }
}
