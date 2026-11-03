import { Routes } from "@angular/router";
import { Table1 } from "./table1/table1";
import { Table2 } from "./table2/table2";
import { Table3 } from "./table3/table3";
import { Table4 } from "./table4/table4";
import { Table5 } from "./table5/table5";
import { Table6 } from "./table6/table6";
import { Table7 } from "./table7/table7";
import { Table8 } from "./table8/table8";
import { Table9 } from "./table9/table9";
import { Table10 } from "./table10/table10";
import { table5b } from "./table5b/table5b";
import { Table6List } from "./table6list/table6list";
import { Table8Names } from "./table8names/table8names";
import { Table8Stopped } from "./table8stopped/table8stopped";
import { Table8Counts } from "./table8counts/table8counts";
import { Table8Incomplete } from "./table8incomplete/table8incomplete";
import { Table8Office } from "./table8office/table8office";

const routes: Routes = [
    {
        path: 'table1', component: Table1
    },
    {
        path: 'table2', component: Table2
    },
    {
        path: 'table3', component: Table3
    },
    {
        path: 'table4', component: Table4
    },
    {
        path: 'table5', component: Table5
    },
    {
        path: 'table5b', component: table5b

    },
    {
        path: 'table6', component: Table6
    },
    {
        path: 'table7', component: Table7
    },
    {
        path: 'table8', component: Table8
    },
    {
        path: 'table9', component: Table9, data: { part: 'a' }    // படிவம் 14 (a)
    },
    {
        path: 'table9b', component: Table9, data: { part: 'b' }   // படிவம் 14 (b)
    },
    {
        path: 'table10', component: Table10, data: { part: 'a' }   // படிவம் 15 (a)
    },
    {
        path: 'table10b', component: Table10, data: { part: 'b' }  // படிவம் 15 (b)
    },
    {
        path: 'table6list', component: Table6List          // Form8
    },
    {
        path: 'table8names', component: Table8Names        // Form11
    },
    {
        path: 'table8stopped', component: Table8Stopped    // Form12
    },
    {
        path: 'table8counts', component: Table8Counts      // Form13
    },
    {
        path: 'table8incomplete', component: Table8Incomplete   // Form14
    },
    {
        path: 'table8office', component: Table8Office      // Form17
    }
];


export default routes;


