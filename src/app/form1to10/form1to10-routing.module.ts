import { Component, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Form1 } from './form1/form1';
import { Form2 } from './form2/form2';
import { Form3 } from './form3/form3';
import { Form4 } from './form4/form4';
import { Form5Component } from './form5/form5';
import { Form6 } from './form6/form6';
import { Form7 } from './form7/form7';
import { Form8 } from './form8/form8';
import { Form9 } from './form9/form9';
import { Form10 } from './form10/form10';
import { Form5b } from './form5b/form5b';

const routes: Routes = [
  {
    path: 'form1', component: Form1
  },
  {
    path: 'form2', component: Form2
  },
  { path: 'form3', component: Form3 },
  {
    path: 'form4', component: Form4
  }, {
    path: 'form5', component: Form5Component
  },
  {
    path: 'form5b', component: Form5b
  },
  {
    path: 'form6', component: Form6
  },
  {
    path: 'form7', component: Form7
  },
  {
    path: 'form8', component: Form8
  },
  {
    path: 'form9', component: Form9, data: { part: 'a' }    // படிவம் 14 (a)
  },
  {
    path: 'form9b', component: Form9, data: { part: 'b' }   // படிவம் 14 (b)
  },
  {
    path: 'form10', component: Form10, data: { part: 'a' }    // படிவம் 15 (a)
  },
  {
    path: 'form10b', component: Form10, data: { part: 'b' }   // படிவம் 15 (b)
  }
];


export default routes;
