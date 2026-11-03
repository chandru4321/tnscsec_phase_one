import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  // private baseUrl = 'https://jk901cnt-5000.inc1.devtunnels.ms/api';
  // private baseUrl = 'https://72bnm96r-5000.inc1.devtunnels.ms/api';
  private baseUrl = 'http://localhost:4000/api';

  // http://localhost:5000/


  constructor(private http: HttpClient) { }


  /** GET → Master Zones */
  getdepartment(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/departments`);
  }
  getdistrict(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/districts`);
  }












  /** =========================
   * FORM-1 APIs
   * ========================= */


  /** GET → Master Zones */
  getMasterZones(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form1/master-zones`);
  }

  /** POST → Checkpoint Zones */
  PostCheckpointZones(body: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/form1/checkpoint-zones`, body);
  }

  /** POST → Get Rural Society Details */
  getRuralSocietyDetails(body: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/form1/rural-details`, body);
  }

  /** POST → FORM-1 FINAL SUBMIT */
  submitForm1(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/form1/submit`, data);
  }

  /** GET → FORM-1 TABLE / LIST */
  getForm1Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form1`, { params });
  }

  getForm1Filtered(departmentId?: number, districtId?: number): Observable<any> {

    let params: any = {
      pageNumber: 1,
      pageSize: 1000
    };

    if (departmentId) params.department_id = departmentId;
    if (districtId) params.district_id = districtId;

    return this.http.get<any>(`${this.baseUrl}/form1`, { params });
  }







  /** =========================
   * FORM-1 EDIT APIs
   * ========================= */

  /** GET → Get Form1 By ID (For Edit Load) */
  getForm1ById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form1/${id}`);
  }

  /** POST → FORM-1 EDIT SUBMIT */
  // editForm1(data: any): Observable<any> {
  //   return this.http.put<any>(`${this.baseUrl}/form1/edit`, data);
  // }


  getForm1Pdf(department_id?: number, district_id?: number) {
    const params: string[] = [];
    if (department_id) params.push(`department_id=${department_id}`);
    if (district_id) params.push(`district_id=${district_id}`);
    const query = params.length ? `?${params.join('&')}` : '';

    return this.http.get(
      `${this.baseUrl}/form1/pdf${query}`,
      {
        responseType: 'blob'   // 🔥 VERY IMPORTANT for PDF
      }
    );
  }

  getForm1AbstractPdf(department_id?: number, district_id?: number) {
    const params: string[] = [];
    if (department_id) params.push(`department_id=${department_id}`);
    if (district_id) params.push(`district_id=${district_id}`);
    const query = params.length ? `?${params.join('&')}` : '';

    return this.http.get(
      `${this.baseUrl}/form1/abstract-pdf${query}`,
      {
        responseType: 'blob'
      }
    );
  }
















  /** =========================
   * FORM-2 APIs
   * ========================= */

  // /** GET → Form-1 Selected Societies */
  // getForm1Selected(form1_id: number): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/form2/form1-selected/${form1_id}`);
  // }


  getForm1Selected(form1_id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/form2/form1-selected`,
      {
        params: { form1_id: form1_id }   // 👈 send as query param
      }
    );
  }












  // getEditableForm1(): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/form1/editable`);
  // }

  getEditableForm1(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/form1/editable/${id}`
    );
  }


  // editForm1(data: any): Observable<any> {
  //   return this.http.put<any>(`${this.baseUrl}/form1/edit`, data);
  // }

  editForm1(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form1/edit/${id}`, data);
  }














  // /** POST → Checkbox (Published / Not Published) */
  // getForm2Checkbox(form1_id: number): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}/form2/checkbox/${form1_id}`, {});
  // }

  // getForm2Checkbox(form1_id: number): Observable<any> {
  //   return this.http.post<any>(
  //     `${this.baseUrl}/form2/checkbox`,
  //     { form1_id }
  //   );
  // }
  getForm2Checkbox(form2_id: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form2/checkbox`,
      { form2_id }
    );
  }




  //   /** POST → FORM-2 FINAL SUBMIT */
  //   submitForm2(form1_id: number, payload: any): Observable<any> {
  //     return this.http.post<any>(`${this.baseUrl}/form2/submit/${form1_id}`, payload);
  //   }
  // }
  submitForm2(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form2/submit`,
      payload
    );
  }
  // /** GET → FORM-2 LIST / TABLE */
  // getForm2Table(): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/form2`);
  // }

  getForm2Table(): Observable<any> {
    const token = localStorage.getItem('token');

    return this.http.get<any>(`${this.baseUrl}/form2`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }



  loadForm2Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form2`, { params });
  }

  loadForm2Filtered(departmentId?: number, districtId?: number): Observable<any> {

    let params: any = {};

    if (departmentId) params.department_id = departmentId;
    if (districtId) params.district_id = districtId;

    return this.http.get<any>(`${this.baseUrl}/form2`, { params });
  }


  getForm2Pdf(department_id: number) {
    return this.http.get(
      `${this.baseUrl}/form2/pdf?department_id=${department_id}`,
      { responseType: 'blob' }
    );
  }

  getForm2AbstractPdf(department_id?: number, district_id?: number) {
    const params: string[] = [];
    if (department_id) params.push(`department_id=${department_id}`);
    if (district_id) params.push(`district_id=${district_id}`);
    const query = params.length ? `?${params.join('&')}` : '';

    return this.http.get(
      `${this.baseUrl}/form2/abstract-pdf${query}`,
      { responseType: 'blob' }
    );
  }






  getEditableForm2(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form2/editable`);
  }

  editForm2(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form2/edit/${id}`, data);
  }
  // editForm2(data: any): Observable<any> {
  //   return this.http.put<any>(`${this.baseUrl}/form2/edit`, data);
  // }





  //form3


  // getForm3Form2List(form1_id: number): Observable<any> {
  //   return this.http.get<any>(
  //     `${this.baseUrl}/api/form3/form2-list/${form1_id}`
  //   );
  // }
  // getForm3Form2List(form1_id: number): Observable<any> {
  //   return this.http.get<any>(
  //     `${this.baseUrl}/form3/form2-list`,
  //     { params: { form1_id } }
  //   );
  // }


  getForm3Form2List(form1_id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/form2`,
      { params: { form1_id } }
    );
  }







  // ---------- FORM 3 SUBMIT ----------
  submitForm3(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form3/submit`,
      payload
    );
  }


  //form3 table 

  getForm3Table(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form3`);
  }

  loadForm3Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form3`, { params });
  }

  loadForm3Filtered(departmentId?: number, districtId?: number): Observable<any> {

    let params: any = {};

    if (departmentId) params.department_id = departmentId;
    if (districtId) params.district_id = districtId;

    return this.http.get<any>(`${this.baseUrl}/form3`, { params });
  }


  // getForm3Pdf(department_id: number) {
  //   return this.http.get(
  //     `${this.baseUrl}/form3/pdf?department_id=${department_id}`,
  //     { responseType: 'blob' }
  //   );
  // }

  getForm3Pdf(department_id?: number, district_id?: number) {

    let params: any = {};

    if (department_id) {
      params.department_id = department_id;
    }

    if (district_id) {
      params.district_id = district_id;
    }

    return this.http.get(
      `${this.baseUrl}/form3/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  getForm3AbstractPdf(department_id?: number, district_id?: number) {

    let params: any = {};

    if (department_id) {
      params.department_id = department_id;
    }

    if (district_id) {
      params.district_id = district_id;
    }

    return this.http.get(
      `${this.baseUrl}/form3/abstract-pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }


  getEditableForm3(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form3/editable`);
  }


  editForm3(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form3/edit`, data);
  }























  // 1️⃣ LOAD FORM-4 DATA (for F3 + base list)
  getForm4(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form4`);
  }

  // SAVE checkbox selection (PREVIEW)  do not dellete tisone 



  // 2️⃣ CHECKBOX STATUS (published / not-published)
  getForm4Checkbox(form4_id: number): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form4/checkbox`,
      { form4_id }
    );
  }
  saveForm4Checkbox(payload: { selected_ids: number[] }): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form4/checkbox`,
      payload
    );
  }




  // 4️⃣ FINAL submit
  submitForm4(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form4/submit`,
      payload
    );
  }


  getForm4Table(selectedDepartment?: any, selectedDistrict?: any): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form4/list?department_id=${selectedDepartment}&district_id=${selectedDistrict}`);
  }



  loadForm4Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form4`, { params });
  }

  loadForm4Filtered(departmentId?: number, districtId?: number): Observable<any> {

    let params: any = {};

    if (departmentId) params.department_id = departmentId;
    if (districtId) params.district_id = districtId;

    return this.http.get<any>(`${this.baseUrl}/form4`, { params });
  }


  // getForm4Pdf(department_id: number) {
  //   return this.http.get(
  //     `${this.baseUrl}/form4/pdf?department_id=${department_id}`,
  //     { responseType: 'blob' }
  //   );
  // }


  getForm4Pdf(department_id?: number, district_id?: number) {

    let params: any = {};

    if (department_id) {
      params.department_id = department_id;
    }

    if (district_id) {
      params.district_id = district_id;
    }

    return this.http.get(
      `${this.baseUrl}/form4/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  getForm4AbstractPdf(department_id?: number, district_id?: number) {

    let params: any = {};

    if (department_id) {
      params.department_id = department_id;
    }

    if (district_id) {
      params.district_id = district_id;
    }

    return this.http.get(
      `${this.baseUrl}/form4/abstract-pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }








  getEditableForm4(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form4/editable`);
  }


  editForm4(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form4/edit`, data);
  }
















  // 2️⃣ LOAD FORM-5 DATA (for F5 – unselected societies)
  // 3️⃣ LOAD FORM-5 ELIGIBLE DATA
  getForm5Eligible(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5/eligible`);
  }

  submitForm5(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form5/submit`,
      payload
    );
  }
  getForm5Table(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5`);
  }




  loadForm5Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form5`, { params });
  }
  loadForm5Filtered(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(`${this.baseUrl}/form5`, {
      params
    });

  }

  getForm5Pdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(`${this.baseUrl}/form5/pdf`, {
      params,
      responseType: 'blob'
    });

  }

  getForm5AbstractPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(`${this.baseUrl}/form5/abstract-pdf`, {
      params,
      responseType: 'blob'
    });

  }
  getEditableForm5(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5/editable`);
  }


  editForm5(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form5/edit`, data);
  }











  getForm5bpreview(form4_id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5b/preview/${form4_id}`);
  }

  postsocietystop(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form5b/stop-society`,
      payload
    );
  }
  postcandidatestop(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form5b/stop-candidates`,
      payload
    );

  }
  getForm5blisttable(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5b/list`);
  }



  submitForm5b(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form5b/submit`,
      payload
    );
  }

  getForm5bTable(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5b`);
  }




  loadForm5bTable(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form5b`, { params });
  }
  loadForm5bFiltered(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form5b/list`,
      { params }
    );
  }
  getForm5bPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form5b/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }

  getForm5bAbstractPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form5b/abstract-pdf`,
      {
        params,
        responseType: 'blob'
      }
    );
  }




  getEditableForm5b(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form5b/editable`);
  }


  editForm5b(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form5b/edit`, data);
  }































  // ================= FORM 6 =================

  // TABLE / PREVIEW DATA
  // FORM 6 INIT  ✅ GET (not POST)
  initForm6(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form6/init`);
  }

  // FORM 6 PREVIEW
  getForm6Preview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form6/preview`);
  }

  simulateForm6(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form6/simulate`,
      payload
    );
  }
  stopElectionForm6(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form6/stop-election`,
      payload
    );
  }



  withdrawForm6(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form6/withdraw`,
      payload
    );
  }
  getForm6Table(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form6/list`);
  }


  submitForm6(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form6/submit`,
      payload
    );
  }


  loadForm6Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form6/list`, { params });
  }
  loadForm6Filtered(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form6/list`,
      { params }
    );

  }

  getForm6Pdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form6/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }

  getForm6AbstractPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form6/abstract-pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }

  getForm6ListPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form6/list-pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }
  getEditableForm6(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form6/editable`);
  }


  editForm6(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form6/edit`, data);
  }







  // FORM 6 PREVIEW
  getForm7Preview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form7/preview`);
  }



  submitForm7(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/form7/submit`, payload);
  }

  getForm7Table(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form7`);
  }

  loadForm7Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form7`, { params });
  }

  loadForm7Filtered(departmentId?: number, districtId?: number): Observable<any> {

    let params: any = {};

    if (departmentId) params.department_id = departmentId;
    if (districtId) params.district_id = districtId;

    return this.http.get<any>(`${this.baseUrl}/form7`, { params });
  }



  // getForm7Pdf(departmentId: number) {
  //   return this.http.get(
  //     `${this.baseUrl}/form7/pdf/${departmentId}`,
  //     {
  //       responseType: 'blob'
  //     }
  //   );
  // }


  getForm7Pdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form7/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }

  getForm7AbstractPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form7/abstract-pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }




  getEditableForm7(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form7/editable`);
  }


  editForm7(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form7/edit`, data);
  }










  getForm8Preview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8/preview`);
  }
  saveForm8Checkbox(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form8/checkbox`,
      payload
    );
  }


  submitForm8(payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/form8/submit`,
      payload
    );
  }
  getForm8Table(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8`);
  }


  loadForm8Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form8`, { params });
  }

  loadForm8Filtered(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId)
      params.department_id = departmentId;

    if (districtId)
      params.district_id = districtId;

    return this.http.get<any>(
      `${this.baseUrl}/form8`,
      { params }
    );

  }
  getForm8Pdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId)
      params.department_id = departmentId;

    if (districtId)
      params.district_id = districtId;

    return this.http.get(
      `${this.baseUrl}/form8/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }
  getForm8StoppedPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId)
      params.department_id = departmentId;

    if (districtId)
      params.district_id = districtId;

    return this.http.get(
      `${this.baseUrl}/form8/stopped/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }
  getForm8NamesPdf(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId)
      params.department_id = departmentId;

    if (districtId)
      params.district_id = districtId;

    return this.http.get(
      `${this.baseUrl}/form8/name/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }

  /* ===== Admin reports: Form8 / Form10 / Form11 / Form12 ===== */

  private reportParams(departmentId?: number, districtId?: number): any {
    const params: any = {};
    if (departmentId) params.department_id = departmentId;
    if (districtId) params.district_id = districtId;
    return params;
  }

  // Form11 — elected committee names (same rows as its PDFs)
  getForm11List(departmentId?: number, districtId?: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8/name/list`,
      { params: this.reportParams(departmentId, districtId) });
  }

  // Form12 — stopped societies (same rows as its PDFs)
  getForm12List(departmentId?: number, districtId?: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8/stopped/list`,
      { params: this.reportParams(departmentId, districtId) });
  }

  // படிவம் 16 — elected members, president, vice-president (form8office page)
  getForm8OfficeList(departmentId?: number, districtId?: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8/office/list`,
      { params: this.reportParams(departmentId, districtId) });
  }

  getForm8OfficePdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/office/pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  // Societies whose election did not complete — reason-wise (form8incomplete page)
  getForm8IncompleteList(departmentId?: number, districtId?: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8/incomplete/list`,
      { params: this.reportParams(departmentId, districtId) });
  }

  getForm8IncompletePdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/incomplete/pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  // Elected committee member counts (form8counts page)
  // Admin overview dashboard — one summary across every form
  getDashboardSummary(departmentId?: number, districtId?: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/summary`,
      { params: this.reportParams(departmentId, districtId) });
  }

  // படிவம் 12 – 16 abstract PDFs (district/zone-wise summary)
  getCountAbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/count/abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  getIncompleteAbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/incomplete/abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  getOfficeAbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/office/abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  // part 'a' / 'b' — படிவம் 14 (president) and 15 (vice-president)
  getPresidentAbstractPdf(departmentId?: number, districtId?: number, part: 'a' | 'b' = 'a') {
    return this.http.get(`${this.baseUrl}/form8/president/abstract-pdf`,
      { params: { ...this.reportParams(departmentId, districtId), part }, responseType: 'blob' });
  }

  getVicePresidentAbstractPdf(departmentId?: number, districtId?: number, part: 'a' | 'b' = 'a') {
    return this.http.get(`${this.baseUrl}/form8/vice-president/abstract-pdf`,
      { params: { ...this.reportParams(departmentId, districtId), part }, responseType: 'blob' });
  }

  getForm8CountPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/count/pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  getForm8ListAbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/list-abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  getForm10AbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  getForm11AbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/name/abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }

  getForm12AbstractPdf(departmentId?: number, districtId?: number) {
    return this.http.get(`${this.baseUrl}/form8/stopped/abstract-pdf`,
      { params: this.reportParams(departmentId, districtId), responseType: 'blob' });
  }
  getEditableForm8(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form8/editable`);
  }


  editForm8(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/form8/edit`, data);
  }












  form9init(payload: any) {
    return this.http.post(`${this.baseUrl}/form9/init`, payload);
  }

  getForm9Preview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form9/preview`);
  }

  form9reject(payload: any) {
    return this.http.post(`${this.baseUrl}/form9/reject`, payload);
  }
  form9withdraw(payload: any) {
    return this.http.post(`${this.baseUrl}/form9/withdraw`, payload);
  }
  form9societyfinalize(payload: any) {
    return this.http.post(`${this.baseUrl}/form9/society-finalize`, payload);
  }
  // Stop / resume a society's president election (Form15 column 10)
  form9stop(payload: { form9_society_id: number; stop_reason: string; stop_other_reason_text?: string }) {
    return this.http.post(`${this.baseUrl}/form9/stop`, payload);
  }
  form9resume(payload: { form9_society_id: number }) {
    return this.http.post(`${this.baseUrl}/form9/resume`, payload);
  }
  // Edit a submitted Form9: reopen it as a draft / reset one society
  form9reopen() {
    return this.http.post(`${this.baseUrl}/form9/reopen`, {});
  }
  form9societyreset(payload: { form9_society_id: number }) {
    return this.http.post(`${this.baseUrl}/form9/society-reset`, payload);
  }
  form9submit(payload: any) {
    return this.http.post(`${this.baseUrl}/form9/submit`, payload);
  }
  getForm9List() {
    return this.http.get<any>(`${this.baseUrl}/form9`);
  }

  loadForm9Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form9`, { params });
  }



  loadForm9Filtered(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form9`,
      { params }
    );

  }

  // part: 'a' = படிவம் 14 (a), 'b' = படிவம் 14 (b)
  getForm9Pdf(departmentId?: number, districtId?: number, part: 'a' | 'b' = 'a') {

    let params: any = { part };

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form9/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }








  form10init(payload: any) {
    return this.http.post(`${this.baseUrl}/form10/init`, payload);
  }

  getForm10Preview(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/form10/preview`);
  }

  form10reject(payload: any) {
    return this.http.post(`${this.baseUrl}/form10/reject`, payload);
  }
  form10withdraw(payload: any) {
    return this.http.post(`${this.baseUrl}/form10/withdraw`, payload);
  }
  form10societyfinalize(payload: any) {
    return this.http.post(`${this.baseUrl}/form10/society-finalize`, payload);
  }
  // Stop / resume a society's vice-president election (Form16 column 10)
  form10stop(payload: { form10_society_id: number; stop_reason: string; stop_other_reason_text?: string }) {
    return this.http.post(`${this.baseUrl}/form10/stop`, payload);
  }
  form10resume(payload: { form10_society_id: number }) {
    return this.http.post(`${this.baseUrl}/form10/resume`, payload);
  }
  // Edit a submitted Form10: reopen it as a draft / reset one society
  form10reopen() {
    return this.http.post(`${this.baseUrl}/form10/reopen`, {});
  }
  form10societyreset(payload: { form10_society_id: number }) {
    return this.http.post(`${this.baseUrl}/form10/society-reset`, payload);
  }
  form10submit(payload: any) {
    return this.http.post(`${this.baseUrl}/form10/submit`, payload);
  }
  getForm10List() {
    return this.http.get<any>(`${this.baseUrl}/form10`);
  }
  loadForm10Table(pageNumber: number = 1, pageSize: number = 50): Observable<any> {

    const params = {
      pageNumber: pageNumber,
      pageSize: pageSize
    };

    return this.http.get<any>(`${this.baseUrl}/form10`, { params });
  }

  loadForm10Filtered(departmentId?: number, districtId?: number) {

    let params: any = {};

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form10`,
      { params }
    );

  }

  // part: 'a' = படிவம் 15 (a), 'b' = படிவம் 15 (b)
  getForm10Pdf(departmentId?: number, districtId?: number, part: 'a' | 'b' = 'a') {

    let params: any = { part };

    if (departmentId) {
      params.department_id = departmentId;
    }

    if (districtId) {
      params.district_id = districtId;
    }

    return this.http.get(
      `${this.baseUrl}/form10/pdf`,
      {
        params,
        responseType: 'blob'
      }
    );

  }

  // ==========================================
  // ELECTION PROGRAMME
  // ==========================================

  getElectionProgrammes(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/election-programmes`);
  }

  getElectionProgramme(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/election-programmes/${id}`);
  }

  createElectionProgramme(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/election-programmes`, payload);
  }

  updateElectionProgramme(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/election-programmes/${id}`, payload);
  }

  // ==========================================
  // ELECTION SCHEDULE
  // ==========================================

  generateElectionSchedule(payload: { poll_date: string; title?: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/election-schedule/generate`, payload);
  }

  regenerateElectionSchedule(id: number, payload: { poll_date: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/election-schedule/${id}/regenerate`, payload);
  }

  getElectionSchedules(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/election-schedule/`);
  }

  getElectionSchedule(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/election-schedule/${id}`);
  }

  updateElectionScheduleStage(stageId: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/election-schedule/stage/${stageId}`, payload);
  }

  deactivateElectionSchedule(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/election-schedule/${id}`);
  }

  getElectionScheduleHolidays(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/election-schedule/holidays/list`);
  }

  addElectionScheduleHoliday(payload: { holiday_date: string; description: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/election-schedule/holidays`, payload);
  }

  deleteElectionScheduleHoliday(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/election-schedule/holidays/${id}`);
  }










































}






















