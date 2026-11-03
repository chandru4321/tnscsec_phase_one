import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header/header';
import { Footer } from './footer/footer';
import { DialogHost } from '../shared/dialog/dialog-host';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Header, Footer, DialogHost],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css']
})
export class Layout {}
