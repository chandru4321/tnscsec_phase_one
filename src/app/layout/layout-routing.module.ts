import { Routes } from '@angular/router';
import { Layout } from './layout';
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';
import { ElectionProgramme } from '../electionprogramme/electionprogramme';
import { ElectionSchedule } from '../electionschedule/electionschedule';
import { Form8Names } from '../form8names/form8names';
import { Form8OverallStoppedSocieties } from '../form8overallstoppedsocieties/form8overallstoppedsocieties';
import { Form8Counts } from '../form8counts/form8counts';
import { Form8Incomplete } from '../form8incomplete/form8incomplete';
import { Form8Office } from '../form8office/form8office';

const routes: Routes = [
  {
    path: '',
    component: Layout,
    children: [

      {
        path: 'totalforms',
        loadChildren: () =>
          import('../totalforms/totalforms-routingmodule')
            .then(m => m.default)
      },

      {
        path: 'electionprogramme',
        component: ElectionProgramme
      },

      {
        path: 'form8names',
        component: Form8Names
      },
      {
        path: 'form8overallstoppedsocieties',
        component: Form8OverallStoppedSocieties
      },
      {
        path: 'form8counts',
        component: Form8Counts
      },
      {
        path: 'form8incomplete',
        component: Form8Incomplete
      },
      {
        path: 'form8office',
        component: Form8Office
      },
      {
        path: 'electionschedule',
        component: ElectionSchedule
      },

      // ✅ ADMIN ROUTE (PUT YOUR CODE HERE)

      {
        path: 'admin-dashboard',
        component: AdminDashboard,
        canActivate: [() => {
          const role = localStorage.getItem('role');
          if (role === 'admin') {
            return true;
          } else {
            window.location.href = '/layout/totalforms';
            return false;
          }
        }]
      },
      {
        path: 'form1to10',
        loadChildren: () =>
          import('../form1to10/form1to10-routing.module')
            .then(m => m.default)
      },
      {
        path: 'admintable',
        loadChildren: () =>
          import('../admintable/admintable.routing.module')
            .then(m => m.default)

      },

      {
        path: 'formtables',
        loadChildren: () =>
          import('../formtables/formtables-routing.module')
            .then(m => m.default)
      },

      { path: '', redirectTo: 'totalforms', pathMatch: 'full' }
    ]
  }
];

export default routes;