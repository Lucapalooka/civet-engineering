/* Civet Engineering: site settings and the built-in copy of the product sheet.

   HOW THE GOOGLE SHEET CONNECTS
   1. In the Google Sheet: File > Share > Publish to web > choose the "Products" tab > "Comma-separated values (.csv)" > Publish.
   2. Paste that link into sheetCsvUrl below (and the normal sheet link into sheetEditUrl).
   3. The site reads the sheet every time a page loads, so edits show up on the next refresh
      (Google can take up to about 5 minutes to republish a change).
   If the sheet can't be reached, the site falls back to the copy in BUILTIN_SHEET_CSV so it never shows an empty shop. */

window.CIVET_CONFIG = {
  sheetCsvUrl: '',   // e.g. https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv
  sheetEditUrl: '',  // the sheet's normal link, used by the "Open the Google Sheet" button in admin
  company: 'Civet Engineering (Pty) Ltd',
  phone: '[phone number]',
  email: '[sales email]',
  address: '[street address], Bellville, Cape Town',
  hours: '[Mon–Fri hours]'
};

/* Same columns as the Google Sheet, in the same order. Sample rows, not real prices or stock. */
window.BUILTIN_SHEET_CSV = `Part number,Product name,Category,Description,Price (R ex VAT),Show price,Stock qty,Condition,Lead time,Featured,Image link
6ES7214-1AG40-0XB0,CPU 1214C DC/DC/DC,SIMATIC S7-1200,"14 DI, 10 DO, 2 AI, PROFINET onboard",9800,No,6,New,Ex stock,Yes,
6ES7212-1BE40-0XB0,CPU 1212C AC/DC/Relay,SIMATIC S7-1200,"8 DI, 6 relay DO, 2 AI",6900,No,3,New,Ex stock,No,
6ES7241-1CH32-0XB0,CM 1241 RS422/485,SIMATIC S7-1200,"Point-to-point comms, Modbus RTU",4300,No,0,New,1–2 weeks,No,
6ES7511-1AK02-0AB0,CPU 1511-1 PN,SIMATIC S7-1500,1 × PROFINET interface,24500,No,2,New,Ex stock,Yes,
6ES7515-2AM02-0AB0,CPU 1515-2 PN,SIMATIC S7-1500,2 × PROFINET interfaces,52000,No,0,New,3–4 weeks,No,
6ES7954-8LC03-0AA0,SIMATIC Memory Card 4 MB,SIMATIC S7-1500,For S7-1200 and S7-1500 CPUs,1350,Yes,12,New,Ex stock,No,
6ES7155-6AU01-0BN0,IM 155-6 PN ST interface module,ET 200SP I/O,PROFINET head for ET 200SP,4900,No,4,New,Ex stock,No,
6ES7131-6BH01-0BA0,DI 16×24VDC ST,ET 200SP I/O,16 digital inputs,2600,No,20,New,Ex stock,No,
6AV2123-2GB03-0AX0,KTP700 Basic PN,SIMATIC HMI,"7"" touch panel, 8 function keys",16800,No,2,New,Ex stock,Yes,
6SL3210-5BE17-5UV0,"SINAMICS V20, 0.75 kW",SINAMICS drives,"400 V 3-phase, unfiltered",5400,No,5,New,Ex stock,Yes,
6SL3210-1KE11-8UF2,"SINAMICS G120C, 0.55 kW",SINAMICS drives,"400 V, PROFINET, unfiltered",9900,No,0,New,1–2 weeks,No,
3RT2016-1AP01,"Contactor 3RT2016, S00",SIRIUS controls,"4 kW / 400 V, 230 V AC coil, 1 NO",560,Yes,40,New,Ex stock,No,
3RV2011-1HA10,"Motor starter protector 3RV2011, S00",SIRIUS controls,Setting range 5.5–8 A,1250,Yes,18,New,Ex stock,No,
6EP1333-2BA20,SITOP PSU100S 24 V / 5 A,SITOP power,"1-phase input, DIN rail mount",3100,Yes,9,New,Ex stock,Yes,
6ED1052-1MD08-0BA1,LOGO! 12/24RCE,LOGO!,"8 DI, 4 relay DO, display, Ethernet",3400,No,11,New,Ex stock,No,
6ES5944-7UB11,S5-115U CPU 944,Legacy S5,Bench-tested before it ships,8500,No,2,Used,Ex stock,Yes,
6ES5951-7LD21,S5 power supply PS 951,Legacy S5,Bench-tested before it ships,4200,No,1,Used,Ex stock,No,
`;
