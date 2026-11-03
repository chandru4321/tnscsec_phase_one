import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterModule } from '@angular/router';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: './totalforms.html',
  styleUrls: ['./totalforms.css']
})
export class totalforms {

  formsList = [
    {
      title: 'மாவட்ட தேர்தல் அலுவலரால் தேர்தல் அறிவிப்பு வழங்கப்பட்ட விவரம்',
      code: 'Form1',
      formLink: '/layout/form1to10/form1',
      tableLink: '/layout/formtables/formt1'

    },
    {
      title: 'சங்கம் உறுப்பினர் பட்டியல் வெளியிடுதல் மற்றும் வாக்காளர் பட்டியல் அலுவலருக்கு உறுப்பினர் பட்டியல் அளித்த/அளிக்காத சங்கங்கள் விவரம்',
      code: 'Form2',
      formLink: '/layout/form1to10/form2',
      tableLink: '/layout/formtables/formt2'

    },
    {
      title: 'இறுதி வாக்காளர் பட்டியல் வாக்காளர் பட்டியல் அலுவலரால் வெளியிடப்பட்ட விபரம்',
      code: 'Form3',
      formLink: '/layout/form1to10/form3',
      tableLink: '/layout/formtables/formt3'
    },
    {
      title: 'வேட்புமனு தாக்கல் பற்றிய விபரம்',
      code: 'Form4',

      formLink: '/layout/form1to10/form4',
      tableLink: '/layout/formtables/formt4'


    },
    {
      title: 'வேட்புமனு தாக்கல் செய்தவர்களின் பெயர் மற்றும் ஆதார் விவரங்கள்',
      code: 'Form5',

      formLink: '/layout/form1to10/form5',
      tableLink: '/layout/formtables/formt5'

    },

    {
      title: 'வேட்புமனு பரிசீலனை மற்றும் தகுதிபெற்ற வேட்புமனுக்கள் பட்டியல் பற்றிய விவரங்கள்',
      code: 'Form5b',
      label: 'Form6',

      formLink: '/layout/form1to10/form5b',
      tableLink: '/layout/formtables/formt5b'

    },

    {
      title: 'வேட்புமனு திரும்பப் பெறுதல் மற்றும் போட்டியிடும் வேட்பாளர் இறுதிப் பட்டியல் பற்றிய எண்ணிக்கை விவரங்கள்', code: 'Form6',
      label: 'Form7',

      formLink: '/layout/form1to10/form6',
      tableLink: '/layout/formtables/formt6'
    },
    {
      title: 'போட்டியின்றி தேர்ந்தெடுக்கப்பட்ட வேட்பாளர் பெயர் மற்றும் விவரம்',
      code: 'Form6List',

      formLink: '/layout/form1to10/form6',
      tableLink: '/layout/formtables/formt6list'
    },
    {
      title: 'தேர்தலில் போட்டியிடும் நிர்வாகக்குழு உறுப்பினர்களின் வாக்குப்பதிவு விவரங்கள்', code: 'Form7',
      label: 'Form9',
      formLink: '/layout/form1to10/form7',
      tableLink: '/layout/formtables/formt7'
    },
    {
      title: 'வாக்கு எண்ணிக்கை மற்றும் தேர்தல் முடிவுகள் விபரம்', code: 'Form8',
      label: 'Form10',
      formLink: '/layout/form1to10/form8',
      tableLink: '/layout/formtables/formt8'
    },
    {
      title: 'சங்கத்தின் நிர்வாகக்குழு உறுப்பினர் தேர்தல் முழுமையாக முடிவுற்று தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்களின் பெயர் பட்டியல்', code: 'Form8Names',
      formLink: '',
      tableLink: '/layout/form8names'
    },
    {
      title: 'தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள் எண்ணிக்கை விபரம்', code: 'Form8Counts',
      formLink: '',
      tableLink: '/layout/form8counts'
    },
    {
      title: 'தேர்தல் முடிவடையாத சங்கங்கள் விபரம்', code: 'Form8Incomplete',
      formLink: '',
      tableLink: '/layout/form8incomplete'
    },
    {
      title: 'தலைவர் தேர்தல் விவரம் — வேட்புமனு, பரிசீலனை, திரும்பப் பெறுதல், இறுதி வேட்பாளர் பட்டியல்', code: 'Form9',
      label: 'Form14 (a)',
      formLink: '/layout/form1to10/form9',
      tableLink: '/layout/formtables/formt9'
    },
    {
      title: 'தலைவர் தேர்தல் விவரம் — வாக்குப்பதிவு, பெற்ற வாக்குகள், தேர்ந்தெடுக்கப்பட்ட தலைவர்', code: 'Form9b',
      label: 'Form14 (b)',
      formLink: '/layout/form1to10/form9b',
      tableLink: '/layout/formtables/formt9b'
    },
    {
      title: 'துணைத் தலைவர் தேர்தல் விவரம் — வேட்புமனு, பரிசீலனை, திரும்பப் பெறுதல், இறுதி வேட்பாளர் பட்டியல்', code: 'Form10',
      label: 'Form15 (a)',
      formLink: '/layout/form1to10/form10',
      tableLink: '/layout/formtables/Formt10'
    },
    {
      title: 'துணைத் தலைவர் தேர்தல் விவரம் — வாக்குப்பதிவு, பெற்ற வாக்குகள், தேர்ந்தெடுக்கப்பட்ட துணைத் தலைவர்', code: 'Form10b',
      label: 'Form15 (b)',
      formLink: '/layout/form1to10/form10b',
      tableLink: '/layout/formtables/formt10b'
    },
    {
      title: 'தேர்ந்தெடுக்கப்பட்ட நிர்வாகக்குழு உறுப்பினர்கள், தலைவர், துணைத்தலைவர் விவரம்', code: 'Form8Office',
      label: 'Form16',
      formLink: '',
      tableLink: '/layout/form8office'
    }
  ];

  // /** ✅ Check Form-1 completion */
  // isForm1Completed(): boolean {
  //   return localStorage.getItem('form1_completed') === 'true';
  // }

  // isForm2Completed(): boolean {
  //   return !!localStorage.getItem('form2Completed');
  // }
}