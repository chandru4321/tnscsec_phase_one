import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Formt1 } from './formt1/formt1';
import { Formt2 } from './formt2/formt2';
import { Formt3 } from './formt3/formt3';
import { Formt5 } from './formt5/formt5';
import { Formt6 } from './formt6/formt6';
import { Formt6List } from './formt6list/formt6list';
import { Formt7 } from './formt7/formt7';
import { Formt8 } from './formt8/formt8';
import { Formt10 } from './formt10/formt10';
import { Formt4 } from './formt4/formt4';
import { formt9 } from './formt9/formt9';
import { Formt5b } from './formt5b/formt5b';

const routes: Routes = [
  {
    path: 'formt1', component: Formt1
  },
  {
    path: 'formt2', component: Formt2
  },
  {
    path: 'formt3', component: Formt3
  },
  {
    path: 'formt4', component: Formt4
  },
  {
    path: 'formt5', component: Formt5
  },
  {
    path: 'formt5b', component: Formt5b
  },
  {
    path: 'formt6', component: Formt6
  },
  {
    path: 'formt6list', component: Formt6List
  },
  {
    path: 'formt7', component: Formt7
  },
  {

    path: 'formt8', component: Formt8
  },
  {
    path: 'formt9', component: formt9, data: { part: 'a' }   // படிவம் 14 (a)
  },
  {
    path: 'formt9b', component: formt9, data: { part: 'b' }  // படிவம் 14 (b)
  },
  {

    path: 'Formt10', component: Formt10, data: { part: 'a' }   // படிவம் 15 (a)
  },
  {
    path: 'formt10b', component: Formt10, data: { part: 'b' }  // படிவம் 15 (b)
  }




];



export default routes;
