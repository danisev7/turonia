/**************************************************************
* PI - SCRIPT (V11.9) ✅
* Fixos d’aquest pas:
*  - Arregla error setNotes (1 vs 35) a PI_applyModelToOrientacions
*  - DADES: DV nivell competència només D22:D41 (i C10)
*  - MAT mesures: multiselecció SENSE nota
*  - MAT Instruments d’avaluació: F22:F37 DV de _LLISTES!J + multiselecció
**************************************************************/

var CFG = {
  sheets: {
    dades: "1_DADES",
    orient: "3_ORIENTACIONS",
    trans: "4_COMP_TRANSVERSALS",
    tpl: "_MAT_TPL",
    llistes: "_LLISTES",
    models: "_MODELS",
    mapaTrans: "_MAPA_TRANSVERSALS",
    sabersDig: "_SABERS_DIG",
    dvTrans: "_DV_TRANS",
    mapaESO: "_MAPA_CURRICULUM",
    mapaPRI: "_MAPA_CURRICULUM_PRI"
  },

  modelCell: "G11",
  cursCell: "C10",

  // ✅ Nivell actual de competència a DADES (segons el que dius ara)
  dadesNivellGrid: { rangeA1: "D22:D41" },

  // llista MAT_ a DADES
  subjects: { startRow: 22, endRow: 41, colMateria: 2 }, // B

  // ORIENTACIONS
  orientGrid: { startRow: 5, endRow: 39, colTipus: 2, colOrient: 3 }, // B,C

  // TRANSVERSALS
  transGrid: {
    startRow: 5,
    endRow: 24,
    colNivell: 2,
    colTrans: 3,
    colEspec: 4,
    colCrit: 5,
    colSaber: 6,
    colAvaluacio: 7
  },

  // MAT_* graella curricular -> 15 files: 22..37
  matGrid: {
    startRow: 22,
    endRow: 37,
    colNivell: 2,      // B
    colComp: 3,        // C
    colCrit: 4,        // D
    colSaber: 5,       // E
    colInstr: 6,       // ✅ F (Instruments d’avaluació)
    colAvaluacio: 7    // G (Nivells 1-4)
  },

  // MAT_* mesures (bloc superior)
  matMeasures: { startRow: 6, endRow: 18, colTipus: 2, colMesura: 3 } // B,C
};


/* =========================
   MENU
========================= */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("PI Tools")
    .addItem("1) Configurar (DV + models)", "PI_setup")
    .addItem("2) Crear/actualitzar pestanyes MAT_*", "PI_createOrUpdateMatSheets")
    .addItem("3) Aplicar MODEL a orientacions", "PI_applyModelToOrientacions")
    .addItem("4) HARD reset DV", "PI_hardResetDVs")
    .addItem("5) Treure triangles/avisos (neteja DV i reescriu)", "PI_hardRemoveDVAndWarnings")
    .addToUi();
}

function PI_setup() {
  var ss = SpreadsheetApp.getActive();
  applyGlobalValidations_(ss);
  applyOrientacionsValidations_(ss);
  applyTransversalBaseValidations_(ss);
  try { PI_setupTransversals(); } catch(e) {}
  applyModelMeasuresDVEverywhere_(ss);
  PI_applyModelToOrientacions();
  PI_hardResetDVs();
  SpreadsheetApp.getUi().alert("OK. Configuració feta.");
}


/* =========================
   VALIDACIONS GLOBALS (segons _LLISTES)
========================= */
function applyGlobalValidations_(ss){
  var shL = ss.getSheetByName(CFG.sheets.llistes);
  if (!shL) throw new Error("Falta _LLISTES");

  // H = NIVELL COMP (curs)
  var dvNivellCurs = SpreadsheetApp.newDataValidation()
    .requireValueInRange(shL.getRange("H2:H200"), true)
    .setAllowInvalid(true)
    .build();

  // G = NIVELLS 1-4 (avaluació)
  var dvAvaluacio14 = SpreadsheetApp.newDataValidation()
    .requireValueInRange(shL.getRange("G2:G200"), true)
    .setAllowInvalid(true)
    .build();

  // J = Instruments d’avaluació
  var dvInstruments = SpreadsheetApp.newDataValidation()
    .requireValueInRange(shL.getRange("J2:J200"), true)
    .setAllowInvalid(true)
    .build();

  // DADES: C10 + D22:D41
  var shD = ss.getSheetByName(CFG.sheets.dades);
  if (shD){
    shD.getRange(CFG.cursCell).setDataValidation(dvNivellCurs); // C10
    shD.getRange(CFG.dadesNivellGrid.rangeA1).setDataValidation(dvNivellCurs); // D22:D41
  }

  // TRANSVERSALS: B (nivell) i G (avaluació 1-4)
  var shT = ss.getSheetByName(CFG.sheets.trans);
  if (shT){
    var nrowsT = CFG.transGrid.endRow - CFG.transGrid.startRow + 1;
    shT.getRange(CFG.transGrid.startRow, CFG.transGrid.colNivell, nrowsT, 1).setDataValidation(dvNivellCurs);
    shT.getRange(CFG.transGrid.startRow, CFG.transGrid.colAvaluacio, nrowsT, 1).setDataValidation(dvAvaluacio14);
  }

  // MAT_TPL i MAT_*: DV només 22..37
  ss.getSheets().forEach(function(sh){
    var n = sh.getName();
    if (n === CFG.sheets.tpl || n.indexOf("MAT_")===0){
      var rows = CFG.matGrid.endRow - CFG.matGrid.startRow + 1;

      sh.getRange(CFG.matGrid.startRow, CFG.matGrid.colNivell, rows, 1).setDataValidation(dvNivellCurs);        // B
      sh.getRange(CFG.matGrid.startRow, CFG.matGrid.colAvaluacio, rows, 1).setDataValidation(dvAvaluacio14);    // G
      sh.getRange(CFG.matGrid.startRow, CFG.matGrid.colInstr, rows, 1).setDataValidation(dvInstruments);        // ✅ F

      // Treu DV per sota (38 endavant) de la graella curricular (sense esborrar contingut)
      try{
        sh.getRange(CFG.matGrid.endRow+1, CFG.matGrid.colNivell, 1000, 1).clearDataValidations();
        sh.getRange(CFG.matGrid.endRow+1, CFG.matGrid.colComp,   1000, 1).clearDataValidations();
        sh.getRange(CFG.matGrid.endRow+1, CFG.matGrid.colCrit,   1000, 1).clearDataValidations();
        sh.getRange(CFG.matGrid.endRow+1, CFG.matGrid.colSaber,  1000, 1).clearDataValidations();
        sh.getRange(CFG.matGrid.endRow+1, CFG.matGrid.colInstr,  1000, 1).clearDataValidations();
        sh.getRange(CFG.matGrid.endRow+1, CFG.matGrid.colAvaluacio, 1000, 1).clearDataValidations();
      }catch(e){}
    }
  });
}


/* =========================
   ORIENTACIONS (Tipus _LLISTES!D + MODELS filtrat)
========================= */
function applyOrientacionsValidations_(ss){
  var shO = ss.getSheetByName(CFG.sheets.orient);
  var shL = ss.getSheetByName(CFG.sheets.llistes);
  if (!shO || !shL) return;

  var dvTipus = SpreadsheetApp.newDataValidation()
    .requireValueInRange(shL.getRange("D2:D200"), true)
    .setAllowInvalid(true)
    .build();

  var nrows = CFG.orientGrid.endRow - CFG.orientGrid.startRow + 1;
  shO.getRange(CFG.orientGrid.startRow, CFG.orientGrid.colTipus, nrows, 1).setDataValidation(dvTipus);

  var all = getAllMeasures_(ss);
  if (all.length){
    shO.getRange(CFG.orientGrid.startRow, CFG.orientGrid.colOrient, nrows, 1)
      .setDataValidation(dvList_(all));
  }
}


/* =========================
   TRANSVERSALS base (C de _LLISTES!I)
========================= */
function applyTransversalBaseValidations_(ss){
  var shT = ss.getSheetByName(CFG.sheets.trans);
  var shL = ss.getSheetByName(CFG.sheets.llistes);
  if (!shT || !shL) return;

  var nrows = CFG.transGrid.endRow - CFG.transGrid.startRow + 1;
  shT.getRange(CFG.transGrid.startRow, CFG.transGrid.colTrans, nrows, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInRange(shL.getRange("I2:I200"), true)
      .setAllowInvalid(true)
      .build()
  );
}


/* =========================
   MODELS -> ORIENTACIONS + MESURES
========================= */
function PI_applyModelToOrientacions(){
  var ss = SpreadsheetApp.getActive();
  var shD = ss.getSheetByName(CFG.sheets.dades);
  if (!shD) return;

  var model = String(shD.getRange(CFG.modelCell).getValue()||"").trim();
  if (!model) return;

  var shO = ss.getSheetByName(CFG.sheets.orient);
  if (!shO) return;

  // ✅ Neteja B i C sense setNotes (evita l'error 1 vs 35)
  shO.getRange(CFG.orientGrid.startRow, CFG.orientGrid.colTipus,
               (CFG.orientGrid.endRow-CFG.orientGrid.startRow+1), 2).clearContent();
  // (no toco notes aquí)

  var items = getModelItems_(ss, model);
  var max = CFG.orientGrid.endRow - CFG.orientGrid.startRow + 1;
  for (var i=0;i<Math.min(items.length, max);i++){
    shO.getRange(CFG.orientGrid.startRow+i, CFG.orientGrid.colTipus).setValue(items[i].tipus);
    shO.getRange(CFG.orientGrid.startRow+i, CFG.orientGrid.colOrient).setValue(items[i].text);
  }

  applyModelMeasuresDVEverywhere_(ss);
}

function getModelItems_(ss, model){
  var sh = ss.getSheetByName(CFG.sheets.models);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||"").trim()!==model) continue;
    var tipus = String(data[i][1]||"").trim();
    var text  = String(data[i][2]||"").trim();
    if (tipus && text) out.push({tipus:tipus, text:text});
  }
  return out;
}

function getAllMeasures_(ss){
  var sh = ss.getSheetByName(CFG.sheets.models);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i=1;i<data.length;i++){
    var text = String(data[i][2]||"").trim();
    if (text) out.push(text);
  }
  return uniq_(out);
}

function getMeasuresByTipus_(ss, tipus){
  var sh = ss.getSheetByName(CFG.sheets.models);
  if (!sh) return [];
  tipus = String(tipus||"").trim();
  if (!tipus) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i=1;i<data.length;i++){
    if (String(data[i][1]||"").trim() !== tipus) continue;
    var text = String(data[i][2]||"").trim();
    if (text) out.push(text);
  }
  return uniq_(out);
}

function applyModelMeasuresDVEverywhere_(ss){
  var all = getAllMeasures_(ss);
  if (!all.length) return;

  ss.getSheets().forEach(function(sh){
    var n = sh.getName();
    if (n === CFG.sheets.tpl || n.indexOf("MAT_")===0){
      sh.getRange(CFG.matMeasures.startRow, CFG.matMeasures.colMesura,
                  (CFG.matMeasures.endRow-CFG.matMeasures.startRow+1), 1)
        .setDataValidation(dvList_(all));
    }
  });

  var shO = ss.getSheetByName(CFG.sheets.orient);
  if (shO){
    var nrows = CFG.orientGrid.endRow - CFG.orientGrid.startRow + 1;
    shO.getRange(CFG.orientGrid.startRow, CFG.orientGrid.colOrient, nrows, 1)
      .setDataValidation(dvList_(all));
  }
}


/* =========================
   SETUP TRANSVERSALS (NamedRanges)
========================= */
function PI_setupTransversals(){
  var ss = SpreadsheetApp.getActive();
  var shMap = ss.getSheetByName(CFG.sheets.mapaTrans);
  var shSab = ss.getSheetByName(CFG.sheets.sabersDig);
  if (!shMap) throw new Error("Falta _MAPA_TRANSVERSALS");
  if (!shSab) throw new Error("Falta _SABERS_DIG");

  var shDV = ss.getSheetByName(CFG.sheets.dvTrans);
  if (!shDV) shDV = ss.insertSheet(CFG.sheets.dvTrans);
  shDV.clear();
  shDV.hideSheet();

  var data = shMap.getDataRange().getValues();
  var especByArea = {};
  for (var i=1;i<data.length;i++){
    var area = String(data[i][0]||"").trim();
    var especShort = String(data[i][3]||"").trim();
    if (!area || !especShort) continue;
    (especByArea[area] = especByArea[area] || []).push(especShort);
  }

  var AREAS = ["Ciutadana","Digital","Emprenedora","Personal, social i aprendre a aprendre"];

  ss.getNamedRanges().forEach(function(nr){
    if (nr.getName().indexOf("DV_TRANS_")===0) nr.remove();
  });

  var col = 1;
  AREAS.forEach(function(areaName){
    var items = uniq_(especByArea[areaName] || []);
    shDV.getRange(1,col).setValue(areaName+" - ESPEC");
    if (items.length){
      shDV.getRange(2,col,items.length,1).setValues(items.map(function(x){return [x];}));
      ss.setNamedRange("DV_TRANS_ESPEC_"+slug_(areaName), shDV.getRange(2,col,items.length,1));
    }
    col++;
  });

  shDV.getRange(1,col).setValue("Digital - SABERS");
  var sabData = shSab.getDataRange().getValues();
  var sabShort = [];
  for (var s=1;s<sabData.length;s++){
    var v = String(sabData[s][1]||"").trim();
    if (v) sabShort.push(v);
  }
  sabShort = uniq_(sabShort);
  if (sabShort.length){
    shDV.getRange(2,col,sabShort.length,1).setValues(sabShort.map(function(x){return [x];}));
    ss.setNamedRange("DV_TRANS_SABERS_DIG", shDV.getRange(2,col,sabShort.length,1));
  }
}


/* =========================
   ONEDIT
========================= */
function onEdit(e){
  try{
    if (!e || !e.range) return;
    var ss = e.source;
    var sh = e.range.getSheet();
    var name = sh.getName();
    var row = e.range.getRow();
    var col = e.range.getColumn();
    var a1  = e.range.getA1Notation();

    if (name === CFG.sheets.dades && a1 === CFG.modelCell){
      PI_applyModelToOrientacions();
      PI_hardResetDVs();
      return;
    }

    // ORIENTACIONS
    if (name === CFG.sheets.orient){
      if (row < CFG.orientGrid.startRow || row > CFG.orientGrid.endRow) return;

      if (col === CFG.orientGrid.colTipus){
        var tipus = String(e.range.getValue()||"").trim();
        var cellO = sh.getRange(row, CFG.orientGrid.colOrient);
        cellO.setDataValidation(null);
        var list = tipus ? getMeasuresByTipus_(ss, tipus) : getAllMeasures_(ss);
        if (list.length) cellO.setDataValidation(dvList_(list));
        return;
      }

      if (col === CFG.orientGrid.colOrient){
        var tipus2 = String(sh.getRange(row, CFG.orientGrid.colTipus).getValue()||"").trim();
        var list2 = tipus2 ? getMeasuresByTipus_(ss, tipus2) : getAllMeasures_(ss);
        if (list2.length) e.range.setDataValidation(dvList_(list2));
        // aquí podem mantenir nota (si vols després també la traiem)
        multiSelectBulletsToggle_(e, null);
        return;
      }
      return;
    }

    // MAT_TPL i MAT_*
    if (name === CFG.sheets.tpl || name.indexOf("MAT_")===0){

      // Tipus -> Mesura
      if (row>=CFG.matMeasures.startRow && row<=CFG.matMeasures.endRow && col===CFG.matMeasures.colTipus){
        var tipusM = String(e.range.getValue()||"").trim();
        var cellMes = sh.getRange(row, CFG.matMeasures.colMesura);
        cellMes.setDataValidation(null);
        var listM = tipusM ? getMeasuresByTipus_(ss, tipusM) : getAllMeasures_(ss);
        if (listM.length) cellMes.setDataValidation(dvList_(listM));
        return;
      }

      // ✅ Multiselecció MESURA (sense nota)
      if (row>=CFG.matMeasures.startRow && row<=CFG.matMeasures.endRow && col===CFG.matMeasures.colMesura){
        var tipusM2 = String(sh.getRange(row, CFG.matMeasures.colTipus).getValue()||"").trim();
        var listM2 = tipusM2 ? getMeasuresByTipus_(ss, tipusM2) : getAllMeasures_(ss);
        if (listM2.length) e.range.setDataValidation(dvList_(listM2));
        multiSelectBulletsToggleNoNote_(e);
        return;
      }

      // ✅ Instruments (F) multiselecció (dins 22..37)
      if (row>=CFG.matGrid.startRow && row<=CFG.matGrid.endRow && col===CFG.matGrid.colInstr){
        // reconstrueix DV sempre
        var shL = ss.getSheetByName(CFG.sheets.llistes);
        if (shL){
          e.range.setDataValidation(
            SpreadsheetApp.newDataValidation()
              .requireValueInRange(shL.getRange("J2:J200"), true)
              .setAllowInvalid(true)
              .build()
          );
        }
        multiSelectBulletsToggleNoNote_(e);
        return;
      }

      // ===== MOTOR CURRICULAR (es manté igual que abans) =====
      if (row>=CFG.matGrid.startRow && row<=CFG.matGrid.endRow && col===CFG.matGrid.colNivell){
        var nivell = String(e.range.getValue()||"").trim();
        var subj = getSubjectFromSheetName_(name);
        sh.getRange(row, CFG.matGrid.colComp, 1, 3).clearContent().setNote("").clearDataValidations();
        if (!nivell || !subj) return;

        var comps = getMatCompetenciesShort_(ss, subj, nivell);
        if (comps.length){
          sh.getRange(row, CFG.matGrid.colComp).setDataValidation(dvList_(comps));
        }
        return;
      }

      if (row>=CFG.matGrid.startRow && row<=CFG.matGrid.endRow && col===CFG.matGrid.colComp){
        var nivell3 = String(sh.getRange(row, CFG.matGrid.colNivell).getValue()||"").trim();
        var compShort = String(e.range.getValue()||"").trim();
        var subj3 = getSubjectFromSheetName_(name);

        sh.getRange(row, CFG.matGrid.colCrit, 1, 2).clearContent().setNote("").clearDataValidations();
        if (!nivell3 || !compShort || !subj3) return;

        var crits = getMatCriterisShort_(ss, subj3, nivell3, compShort);
        if (crits.length) sh.getRange(row, CFG.matGrid.colCrit).setDataValidation(dvList_(crits));

        var sabers = getMatSabersShort_(ss, subj3, nivell3);
        if (sabers.length) sh.getRange(row, CFG.matGrid.colSaber).setDataValidation(dvList_(sabers));
        return;
      }

      if (row>=CFG.matGrid.startRow && row<=CFG.matGrid.endRow && col===CFG.matGrid.colCrit){
        var nivC = String(sh.getRange(row, CFG.matGrid.colNivell).getValue()||"").trim();
        var compC = String(sh.getRange(row, CFG.matGrid.colComp).getValue()||"").trim();
        var subjC = getSubjectFromSheetName_(name);
        if (nivC && compC && subjC){
          var crits2 = getMatCriterisShort_(ss, subjC, nivC, compC);
          if (crits2.length) e.range.setDataValidation(dvList_(crits2));
        }
        multiSelectBulletsToggle_(e, function(shortCrit){
          return lookupMatCriteriFull_(ss, subjC, nivC, compC, shortCrit);
        });
        return;
      }

      if (row>=CFG.matGrid.startRow && row<=CFG.matGrid.endRow && col===CFG.matGrid.colSaber){
        var nivS = String(sh.getRange(row, CFG.matGrid.colNivell).getValue()||"").trim();
        var subjS = getSubjectFromSheetName_(name);
        if (nivS && subjS){
          var sab2 = getMatSabersShort_(ss, subjS, nivS);
          if (sab2.length) e.range.setDataValidation(dvList_(sab2));
        }
        multiSelectBulletsToggle_(e, function(shortS){
          return lookupMatSaberFull_(ss, subjS, nivS, shortS);
        });
        return;
      }
    }

   // TRANSVERSALS (PRI + ESO)
if (name === CFG.sheets.trans){
  if (row < CFG.transGrid.startRow || row > CFG.transGrid.endRow) return;

  // nivell de competència de la fila (columna B)
  var nivellRow = String(sh.getRange(row, CFG.transGrid.colNivell).getValue() || "").trim();
  var isPRI = isPRILevel_(nivellRow);
  var groupPRI = isPRI ? groupPRI_(nivellRow) : "";

  // === C (Àrea transversal) -> carrega D (espec) i F (sabers si Digital) ===
  if (col === CFG.transGrid.colTrans){
    var area = canonicalTrans_(String(e.range.getValue()||"").trim());

    sh.getRange(row, CFG.transGrid.colEspec).clearContent().setNote("").setDataValidation(null);
    sh.getRange(row, CFG.transGrid.colCrit ).clearContent().setNote("").setDataValidation(null);
    sh.getRange(row, CFG.transGrid.colSaber).clearContent().setNote("").setDataValidation(null);

    if (!area) return;

    if (isPRI){
      var especsPRI = getTransEspecsPRI_(ss, area, groupPRI);
      if (especsPRI.length){
        sh.getRange(row, CFG.transGrid.colEspec).setDataValidation(dvList_(especsPRI));
      }

      // Sabers només per Digital (PRI) i depèn del curs
      if (area === "Digital"){
        var sabPRI = getDigitalSabersPRI_(ss, groupPRI);
        if (sabPRI.length){
          sh.getRange(row, CFG.transGrid.colSaber).setDataValidation(dvList_(sabPRI));
        }
      }

    } else {
      // ESO (com ho tenies)
      var named = ss.getRangeByName("DV_TRANS_ESPEC_" + slug_(area));
      if (named){
        sh.getRange(row, CFG.transGrid.colEspec)
          .setDataValidation(
            SpreadsheetApp.newDataValidation()
              .requireValueInRange(named, true)
              .setAllowInvalid(true)
              .build()
          );
      } else {
        var especs = getTransEspecs_(ss, area);
        if (especs.length) sh.getRange(row, CFG.transGrid.colEspec).setDataValidation(dvList_(especs));
      }

      if (area === "Digital"){
        var sab = ss.getRangeByName("DV_TRANS_SABERS_DIG");
        if (sab){
          sh.getRange(row, CFG.transGrid.colSaber)
            .setDataValidation(
              SpreadsheetApp.newDataValidation()
                .requireValueInRange(sab, true)
                .setAllowInvalid(true)
                .build()
            );
        } else {
          var sab2 = getDigitalSabers_(ss);
          if (sab2.length) sh.getRange(row, CFG.transGrid.colSaber).setDataValidation(dvList_(sab2));
        }
      }
    }
    return;
  }

  // === D (Específica) -> carrega E (criteris) ===
  if (col === CFG.transGrid.colEspec){
    var area2 = canonicalTrans_(String(sh.getRange(row, CFG.transGrid.colTrans).getValue()||"").trim());
    var espec = String(e.range.getValue()||"").trim();

    sh.getRange(row, CFG.transGrid.colCrit).clearContent().setNote("").setDataValidation(null);
    if (!area2 || !espec) return;

    if (isPRI){
      var critsPRI = getTransCriterisPRI_(ss, area2, espec, groupPRI);
      if (critsPRI.length) sh.getRange(row, CFG.transGrid.colCrit).setDataValidation(dvList_(critsPRI));
    } else {
      var groupESO = getESOGroup_(ss);
      var crits = getTransCriteris_(ss, area2, espec, groupESO);
      if (crits.length) sh.getRange(row, CFG.transGrid.colCrit).setDataValidation(dvList_(crits));
    }
    return;
  }

  // === E (Criteris) -> multiselecció + nota ===
  if (col === CFG.transGrid.colCrit){
    var areaD = canonicalTrans_(String(sh.getRange(row, CFG.transGrid.colTrans).getValue()||"").trim());
    var especD = String(sh.getRange(row, CFG.transGrid.colEspec).getValue()||"").trim();

    if (areaD && especD){
      if (isPRI){
        var critsDPRI = getTransCriterisPRI_(ss, areaD, especD, groupPRI);
        if (critsDPRI.length) e.range.setDataValidation(dvList_(critsDPRI));
      } else {
        var groupDESO = getESOGroup_(ss);
        var critsDESO = getTransCriteris_(ss, areaD, especD, groupDESO);
        if (critsDESO.length) e.range.setDataValidation(dvList_(critsDESO));
      }
    }

    if (isPRI){
      multiSelectBulletsToggle_(e, function(shortCrit){
        return lookupCritFullByShortPRI_(ss, areaD, especD, groupPRI, shortCrit);
      });
    } else {
      multiSelectBulletsToggle_(e, function(shortCrit){
        return lookupCritFullByShort_(ss, areaD, shortCrit);
      });
    }
    return;
  }

  // === F (Sabers) -> només Digital, multiselecció + nota ===
  if (col === CFG.transGrid.colSaber){
    var areaE = canonicalTrans_(String(sh.getRange(row, CFG.transGrid.colTrans).getValue()||"").trim());

    e.range.setDataValidation(null);

    if (areaE === "Digital"){
      if (isPRI){
        var sabPRI2 = getDigitalSabersPRI_(ss, groupPRI);
        if (sabPRI2.length) e.range.setDataValidation(dvList_(sabPRI2));
      } else {
        var sabNR = ss.getRangeByName("DV_TRANS_SABERS_DIG");
        if (sabNR){
          e.range.setDataValidation(
            SpreadsheetApp.newDataValidation().requireValueInRange(sabNR, true).setAllowInvalid(true).build()
          );
        } else {
          var sabL = getDigitalSabers_(ss);
          if (sabL.length) e.range.setDataValidation(dvList_(sabL));
        }
      }
    }

    if (isPRI){
      multiSelectBulletsToggle_(e, function(shortSaber){
        return lookupSaberFullByShortPRI_(ss, groupPRI, shortSaber);
      });
    } else {
      multiSelectBulletsToggle_(e, function(shortSaber){
        return lookupSaberFullByShort_(ss, shortSaber);
      });
    }
    return;
  }
}

  }catch(err){}
}


/* =========================
   MOTOR MAT_* (MAPA ESO / PRI) — (igual que V11.7)
========================= */
// subject de "MAT_xxx"
function getSubjectFromSheetName_(sheetName){
  if (sheetName === CFG.sheets.tpl) return "";
  if (sheetName.indexOf("MAT_") !== 0) return "";
  return String(sheetName).slice(4).trim();
}
function isESOLevel_(nivell){
  var x = String(nivell||"").toUpperCase().replace(/\s+/g,"");
  return x.indexOf("ESO") >= 0;
}

// --- MAT: Competències (SHORT)
function getMatCompetenciesShort_(ss, subject, nivell){
  subject = String(subject||"").trim();
  nivell = String(nivell||"").trim();
  if (!subject || !nivell) return [];

  if (isESOLevel_(nivell)){
    var sh = ss.getSheetByName(CFG.sheets.mapaESO);
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var out = [];
    for (var i=2;i<data.length;i++){
      if (!sameSubject_(data[i][0], subject)) continue;
      if (String(data[i][1]||"").trim() !== nivell) continue;
      if (String(data[i][2]||"").trim() !== "COMP_ESPEC") continue;
      var shrt = String(data[i][5]||"").trim();
      if (shrt) out.push(shrt);
    }
    return uniq_(out);
  } else {
    var sh2 = ss.getSheetByName(CFG.sheets.mapaPRI);
    if (!sh2) return [];
    var data2 = sh2.getDataRange().getValues();
    var out2 = [];
    for (var r=3;r<data2.length;r++){
      if (!sameSubject_(data2[r][0], subject)) continue;
      if (String(data2[r][5]||"").trim() !== nivell) continue;
      if (String(data2[r][1]||"").trim() !== "COMP_ESPEC") continue;
      var shrt2 = String(data2[r][6]||"").trim();
      if (shrt2) out2.push(shrt2);
    }
    return uniq_(out2);
  }
}

// --- MAT: Criteris (SHORT)
function getMatCriterisShort_(ss, subject, nivell, compShort){
  subject = String(subject||"").trim();
  nivell = String(nivell||"").trim();
  compShort = String(compShort||"").trim();
  if (!subject || !nivell || !compShort) return [];

  if (isESOLevel_(nivell)){
    var sh = ss.getSheetByName(CFG.sheets.mapaESO);
    if (!sh) return [];

    var data = sh.getDataRange().getValues();
    var compCode = "";
    for (var i=2;i<data.length;i++){
      if (!sameSubject_(data[i][0], subject)) continue;
      if (String(data[i][1]||"").trim() !== nivell) continue;
      if (String(data[i][2]||"").trim() !== "COMP_ESPEC") continue;
      if (String(data[i][5]||"").trim() === compShort){
        compCode = String(data[i][3]||"").trim();
        break;
      }
    }
    if (!compCode) return [];

    var out = [];
    for (var r=2;r<data.length;r++){
      if (!sameSubject_(data[r][0], subject)) continue;
      if (String(data[r][1]||"").trim() !== nivell) continue;
      if (String(data[r][2]||"").trim() !== "CRIT") continue;
      var code = String(data[r][3]||"").trim();
      if (code && code.indexOf(compCode) === 0){
        var shrt = String(data[r][5]||"").trim();
        if (shrt) out.push(shrt);
      }
    }
    return uniq_(out);
  } else {
    var sh2 = ss.getSheetByName(CFG.sheets.mapaPRI);
    if (!sh2) return [];

    var data2 = sh2.getDataRange().getValues();
    var compNum = "";
    for (var i2=3;i2<data2.length;i2++){
      if (!sameSubject_(data2[i2][0], subject)) continue;
      if (String(data2[i2][5]||"").trim() !== nivell) continue;
      if (String(data2[i2][1]||"").trim() !== "COMP_ESPEC") continue;
      if (String(data2[i2][6]||"").trim() === compShort){
        var ccode = String(data2[i2][2]||"").trim(); // CE1
        compNum = (ccode.match(/\d+/)||[""])[0];
        break;
      }
    }
    if (!compNum) return [];

    var out2 = [];
    for (var r2=3;r2<data2.length;r2++){
      if (!sameSubject_(data2[r2][0], subject)) continue;
      if (String(data2[r2][5]||"").trim() !== nivell) continue;
      if (String(data2[r2][1]||"").trim() !== "CRIT") continue;
      var c = String(data2[r2][2]||"").trim(); // 1.1
      if (c && c.indexOf(compNum + ".") === 0){
        var shrt2 = String(data2[r2][6]||"").trim();
        if (shrt2) out2.push(shrt2);
      }
    }
    return uniq_(out2);
  }
}

// --- MAT: Sabers (SHORT)
function getMatSabersShort_(ss, subject, nivell){
  subject = String(subject||"").trim();
  nivell = String(nivell||"").trim();
  if (!subject || !nivell) return [];

  if (isESOLevel_(nivell)){
    var sh = ss.getSheetByName(CFG.sheets.mapaESO);
    if (!sh) return [];
    var data = sh.getDataRange().getValues();
    var out = [];
    for (var i=2;i<data.length;i++){
      if (!sameSubject_(data[i][0], subject)) continue;
      if (String(data[i][1]||"").trim() !== nivell) continue;
      if (String(data[i][2]||"").trim() !== "SABER") continue;
      var shrt = String(data[i][5]||"").trim();
      if (shrt) out.push(shrt);
    }
    return uniq_(out);
  } else {
    var sh2 = ss.getSheetByName(CFG.sheets.mapaPRI);
    if (!sh2) return [];
    var data2 = sh2.getDataRange().getValues();
    var out2 = [];
    for (var r=3;r<data2.length;r++){
      if (!sameSubject_(data2[r][0], subject)) continue;
      if (String(data2[r][5]||"").trim() !== nivell) continue;
      if (String(data2[r][1]||"").trim() !== "SABER") continue;
      var shrt2 = String(data2[r][6]||"").trim();
      if (shrt2 && shrt2.toLowerCase() !== "sabers") out2.push(shrt2);
    }
    return uniq_(out2);
  }
}

// FULL lookups (notes útils)
function lookupMatCriteriFull_(ss, subject, nivell, compShort, critShort){
  critShort = String(critShort||"").trim();
  if (!critShort) return "";
  if (isESOLevel_(nivell)){
    var sh = ss.getSheetByName(CFG.sheets.mapaESO);
    if (!sh) return critShort;
    var data = sh.getDataRange().getValues();
    for (var i=2;i<data.length;i++){
      if (!sameSubject_(data[i][0], subject)) continue;
      if (String(data[i][1]||"").trim() !== nivell) continue;
      if (String(data[i][2]||"").trim() !== "CRIT") continue;
      if (String(data[i][5]||"").trim() === critShort) return String(data[i][4]||"").trim() || critShort;
    }
    return critShort;
  } else {
    var sh2 = ss.getSheetByName(CFG.sheets.mapaPRI);
    if (!sh2) return critShort;
    var data2 = sh2.getDataRange().getValues();
    for (var r=3;r<data2.length;r++){
      if (!sameSubject_(data2[r][0], subject)) continue;
      if (String(data2[r][5]||"").trim() !== nivell) continue;
      if (String(data2[r][1]||"").trim() !== "CRIT") continue;
      if (String(data2[r][6]||"").trim() === critShort) return String(data2[r][3]||"").trim() || critShort;
    }
    return critShort;
  }
}

function lookupMatSaberFull_(ss, subject, nivell, saberShort){
  saberShort = String(saberShort||"").trim();
  if (!saberShort) return "";
  if (isESOLevel_(nivell)){
    var sh = ss.getSheetByName(CFG.sheets.mapaESO);
    if (!sh) return saberShort;
    var data = sh.getDataRange().getValues();
    for (var i=2;i<data.length;i++){
      if (!sameSubject_(data[i][0], subject)) continue;
      if (String(data[i][1]||"").trim() !== nivell) continue;
      if (String(data[i][2]||"").trim() !== "SABER") continue;
      if (String(data[i][5]||"").trim() === saberShort) return String(data[i][4]||"").trim() || saberShort;
    }
    return saberShort;
  } else {
    var sh2 = ss.getSheetByName(CFG.sheets.mapaPRI);
    if (!sh2) return saberShort;
    var data2 = sh2.getDataRange().getValues();
    for (var r=3;r<data2.length;r++){
      if (!sameSubject_(data2[r][0], subject)) continue;
      if (String(data2[r][5]||"").trim() !== nivell) continue;
      if (String(data2[r][1]||"").trim() !== "SABER") continue;
      if (String(data2[r][6]||"").trim() === saberShort) return String(data2[r][3]||"").trim() || saberShort;
    }
    return saberShort;
  }
}


/* =========================
   SUBJECT MATCH ROBUST
========================= */
function sameSubject_(a, b){ return normSubject_(a) === normSubject_(b); }
function normSubject_(s){
  s = String(s||"").trim().toLowerCase();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  s = s.replace(/[\.\,\;\:\(\)\[\]\/\\\-\_]+/g," ");
  s = s.replace(/\s+/g," ").trim();
  return s;
}


/* =========================
   TRANSVERSALS helpers
========================= */
function getESOGroup_(ss){
  var shD = ss.getSheetByName(CFG.sheets.dades);
  var curs = shD ? String(shD.getRange(CFG.cursCell).getValue()||"").trim() : "";
  var x = curs.toUpperCase().replace(/\s+/g,"");
  if (x.indexOf("3ESO")>=0 || x.indexOf("4ESO")>=0) return "3-4ESO";
  return "1-2ESO";
}
function getTransCriteris_(ss, area, especShort, group){
  var sh = ss.getSheetByName(CFG.sheets.mapaTrans);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||"").trim() !== String(area||"").trim()) continue;
    if (String(data[i][3]||"").trim() !== String(especShort||"").trim()) continue;
    var curs = String(data[i][4]||"").trim();
    var ok = true;
    if (curs){
      var c = curs.toUpperCase().replace(/\s+/g,"");
      var want12 = (group==="1-2ESO"), want34 = (group==="3-4ESO");
      var is12 = (c.indexOf("1ESO")>=0 || c.indexOf("2ESO")>=0 || c.indexOf("1-2")>=0);
      var is34 = (c.indexOf("3ESO")>=0 || c.indexOf("4ESO")>=0 || c.indexOf("3-4")>=0);
      ok = (want12 && is12 && !is34) || (want34 && is34 && !is12) || (c === group.replace(/\s+/g,"").toUpperCase());
    }
    if (!ok) continue;
    var critShort = String(data[i][6]||"").trim();
    if (critShort) out.push(critShort);
  }
  return uniq_(out);
}
function getTransEspecs_(ss, area){
  var sh = ss.getSheetByName(CFG.sheets.mapaTrans);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||"").trim() === String(area||"").trim()){
      out.push(String(data[i][3]||"").trim());
    }
  }
  return uniq_(out);
}
function getDigitalSabers_(ss){
  var sh = ss.getSheetByName(CFG.sheets.sabersDig);
  if (!sh) return [];
  var data = sh.getDataRange().getValues();
  var out = [];
  for (var i=1;i<data.length;i++) out.push(String(data[i][1]||"").trim());
  return uniq_(out);
}
function lookupCritFullByShort_(ss, area, critShort){
  area = String(area||"").trim();
  critShort = String(critShort||"").trim();
  if (!area || !critShort) return "";
  var sh = ss.getSheetByName(CFG.sheets.mapaTrans);
  if (!sh) return "";
  var data = sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||"").trim() !== area) continue;
    if (String(data[i][6]||"").trim() !== critShort) continue;
    return String(data[i][5]||"").trim();
  }
  return "";
}
function lookupSaberFullByShort_(ss, saberShort){
  saberShort = String(saberShort||"").trim();
  if (!saberShort) return "";
  var sh = ss.getSheetByName(CFG.sheets.sabersDig);
  if (!sh) return "";
  var data = sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++){
    if (String(data[i][1]||"").trim() === saberShort) return String(data[i][0]||"").trim();
  }
  return "";
}


/* =========================
   MULTISELECT (amb i sense notes)
========================= */
function parseBullets_(text){
  text = String(text||"");
  if (!text.trim()) return [];
  return text.split("\n").map(function(l){
    return String(l||"").trim().replace(/^•\s*/,"").replace(/^\-\s*/,"").trim();
  }).filter(function(x){ return x; });
}
function formatBullets_(items){
  return (items||[]).map(function(x){ return "• " + String(x||"").trim(); }).join("\n");
}
function buildNoteFromShorts_(shorts, fullLookupFn){
  var parts = [];
  (shorts||[]).forEach(function(s){
    s = String(s||"").trim();
    if (!s) return;
    var full = "";
    try{ full = fullLookupFn ? String(fullLookupFn(s)||"").trim() : ""; }catch(e){}
    if (!full) full = s;
    parts.push(full);
  });
  return parts.join("\n\n");
}

// ✅ Amb nota (per criteris/sabers)
function multiSelectBulletsToggle_(e, fullLookupFn){
  if (!e || !e.range || typeof e.value === "undefined") return;
  var rng  = e.range;
  var pick = String(e.value || "").trim();
  if (!pick) return;

  var prevText = (typeof e.oldValue === "undefined") ? "" : String(e.oldValue || "");
  var prev = parseBullets_(prevText);

  var idx = prev.indexOf(pick);
  if (idx >= 0) prev.splice(idx, 1);
  else prev.push(pick);

  rng.setValue(formatBullets_(prev));
  rng.setNote(buildNoteFromShorts_(prev, fullLookupFn));
}

// ✅ Sense nota (per mesures i instruments)
function multiSelectBulletsToggleNoNote_(e){
  if (!e || !e.range || typeof e.value === "undefined") return;
  var rng  = e.range;
  var pick = String(e.value || "").trim();
  if (!pick) return;

  var prevText = (typeof e.oldValue === "undefined") ? "" : String(e.oldValue || "");
  var prev = parseBullets_(prevText);

  var idx = prev.indexOf(pick);
  if (idx >= 0) prev.splice(idx, 1);
  else prev.push(pick);

  rng.setValue(formatBullets_(prev));
  rng.setNote(""); // assegura que no queda nota antiga
}


/* =========================
   DV helpers
========================= */
function dvList_(items){
  items = (items||[]).map(function(x){return String(x||"").trim();}).filter(function(x){return x;});
  if (!items.length) return null;
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(items, true)
    .setAllowInvalid(true)
    .build();
}
function uniq_(arr){
  var seen = {}, out=[];
  (arr||[]).forEach(function(x){
    x = String(x||"").trim();
    if (!x || seen[x]) return;
    seen[x]=true; out.push(x);
  });
  return out;
}
function norm_(s){
  s = String(s||"").trim().toLowerCase();
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  return s;
}
function canonicalTrans_(v){
  var x = norm_(v);
  if (x.indexOf("ciutad")>=0) return "Ciutadana";
  if (x.indexOf("digit")>=0) return "Digital";
  if (x.indexOf("empren")>=0) return "Emprenedora";
  if (x.indexOf("personal")>=0 || x.indexOf("social")>=0 || x.indexOf("aprendre")>=0) return "Personal, social i aprendre a aprendre";
  return String(v||"").trim();
}
function slug_(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
}


/* =========================
   HARD RESET DV
========================= */
function PI_hardResetDVs(){
  var ss = SpreadsheetApp.getActive();
  applyGlobalValidations_(ss);
  applyOrientacionsValidations_(ss);
  applyTransversalBaseValidations_(ss);
  applyModelMeasuresDVEverywhere_(ss);
}


/* =========================
   NETEJA triangles/avisos
========================= */
function PI_hardRemoveDVAndWarnings(){
  var ss = SpreadsheetApp.getActive();

  var shT = ss.getSheetByName(CFG.sheets.trans);
  if (shT) clearDVAndRewrite_(shT.getRange("E5:F1000"));

  var shO = ss.getSheetByName(CFG.sheets.orient);
  if (shO) clearDVAndRewrite_(shO.getRange("C5:C200"));

  ss.getSheets().forEach(function(sh){
    var n = sh.getName();
    if (n === CFG.sheets.tpl || n.indexOf("MAT_")===0){
      clearDVAndRewrite_(sh.getRange("C6:C1000"));
      clearDVAndRewrite_(sh.getRange("D22:F200")); // criteris/sabers/instruments
    }
  });

  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert("OK. DV eliminada + valors reescrits (triangles fora).");
}

function clearDVAndRewrite_(range){
  var vals = range.getValues();
  var notes = range.getNotes();
  range.clearDataValidations();
  range.setValues(vals);
  range.setNotes(notes);
}


/* =========================
   MAT_* creation + B2 auto + sempre visible
========================= */
function PI_createOrUpdateMatSheets(){
  var ss = SpreadsheetApp.getActive();
  var tpl = ss.getSheetByName(CFG.sheets.tpl);
  var shD = ss.getSheetByName(CFG.sheets.dades);
  if (!tpl || !shD) throw new Error("Falta _MAT_TPL o 1_DADES");

  var subs = [];
  for (var r=CFG.subjects.startRow;r<=CFG.subjects.endRow;r++){
    var v = String(shD.getRange(r, CFG.subjects.colMateria).getValue()||"").trim();
    if (v) subs.push(v);
  }
  subs = uniq_(subs);

  for (var i=0;i<subs.length;i++){
    var subj = subs[i];
    var name = ("MAT_"+subj).replace(/[\\\/\?\*\[\]\:]/g," ").replace(/\s+/g," ").trim().slice(0,90);
    var sh = ss.getSheetByName(name);
    if (!sh) sh = tpl.copyTo(ss).setName(name);

    try { sh.showSheet(); } catch(e) {}
    try { sh.getRange("B2").setValue("PI-MATÈRIA: " + subj); } catch(e) {}
  }

  PI_hardResetDVs();
  SpreadsheetApp.getUi().alert("OK. MAT_* actualitzades.");
}
function isPRILevel_(nivell){
  var x = String(nivell||"").toUpperCase().replace(/\s+/g,"");
  return (x.indexOf("PRI") >= 0) && (x.indexOf("ESO") < 0);
}

function groupPRI_(nivell){
  var x = String(nivell||"").toUpperCase().replace(/\s+/g,"");
  if (x.indexOf("1-2PRI")>=0) return "1-2PRI";
  if (x.indexOf("3-4PRI")>=0) return "3-4PRI";
  if (x.indexOf("5-6PRI")>=0) return "5-6PRI";
  // fallback per si entra "1PRI", "2PRI", etc.
  if (x.indexOf("1")>=0 || x.indexOf("2")>=0) return "1-2PRI";
  if (x.indexOf("3")>=0 || x.indexOf("4")>=0) return "3-4PRI";
  return "5-6PRI";
}

// ===== LECTURA PRI (mapa + DV) =====

function getTransEspecsPRI_(ss, area, groupPRI){
  var sh = ss.getSheetByName("MAPA_TRANSVERSALS_PRI") || ss.getSheetByName("_MAPA_TRANSVERSALS_PRI");
  if (!sh) return [];
  area = String(area||"").trim();
  var data = sh.getDataRange().getValues();
  var out = [];

  // Esperat: A=AREA, D=COMP_ESPE_SHORT, E=CURS (1-2PRI/3-4PRI/5-6PRI)
  for (var i=1;i<data.length;i++){
    var a = String(data[i][0]||"").trim();
    if (a !== area) continue;

    var curs = String(data[i][4]||"").trim();
    // si hi ha curs, el respectem; si no, l’acceptem
    if (curs && groupPRI && curs !== groupPRI) continue;

    var especShort = String(data[i][3]||"").trim();
    if (especShort) out.push(especShort);
  }
  return uniq_(out);
}

function getTransCriterisPRI_(ss, area, especShort, groupPRI){
  var sh = ss.getSheetByName("MAPA_TRANSVERSALS_PRI") || ss.getSheetByName("_MAPA_TRANSVERSALS_PRI");
  if (!sh) return [];
  area = String(area||"").trim();
  especShort = String(especShort||"").trim();

  var data = sh.getDataRange().getValues();
  var out = [];

  // Esperat: A=AREA, D=COMP_ESPE_SHORT, E=CURS, F=CRIT_FULL, G=CRIT_SHORT
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||"").trim() !== area) continue;
    if (String(data[i][3]||"").trim() !== especShort) continue;

    var curs = String(data[i][4]||"").trim();
    if (groupPRI && curs && curs !== groupPRI) continue;

    var critShort = String(data[i][6]||"").trim();
    if (critShort) out.push(critShort);
  }
  return uniq_(out);
}

function lookupCritFullByShortPRI_(ss, area, especShort, groupPRI, critShort){
  var sh = ss.getSheetByName("MAPA_TRANSVERSALS_PRI") || ss.getSheetByName("_MAPA_TRANSVERSALS_PRI");
  if (!sh) return critShort;
  area = String(area||"").trim();
  especShort = String(especShort||"").trim();
  critShort = String(critShort||"").trim();

  var data = sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++){
    if (String(data[i][0]||"").trim() !== area) continue;
    if (String(data[i][3]||"").trim() !== especShort) continue;

    var curs = String(data[i][4]||"").trim();
    if (groupPRI && curs && curs !== groupPRI) continue;

    if (String(data[i][6]||"").trim() === critShort){
      return String(data[i][5]||"").trim() || critShort;
    }
  }
  return critShort;
}

// Sabers Digital PRI depenent del curs: _DV_TRANS_PRI (AREA/CURS/SABER_FULL/SABER_SHORT)
function getDigitalSabersPRI_(ss, groupPRI){
  var sh = ss.getSheetByName("DV_TRANS_PRI") || ss.getSheetByName("_DV_TRANS_PRI");
  if (!sh) return [];
  groupPRI = String(groupPRI||"").trim();

  var data = sh.getDataRange().getValues();
  var out = [];

  // Esperat: E=AREA, F=CURS, G=SABER_FULL, H=SABER_SHORT (a partir de fila 2)
  for (var i=1;i<data.length;i++){
    if (String(data[i][4]||"").trim() !== "Digital") continue;
    if (groupPRI && String(data[i][5]||"").trim() !== groupPRI) continue;

    var s = String(data[i][7]||"").trim(); // SABER_SHORT
    if (s) out.push(s);
  }
  return uniq_(out);
}

function lookupSaberFullByShortPRI_(ss, groupPRI, saberShort){
  var sh = ss.getSheetByName("DV_TRANS_PRI") || ss.getSheetByName("_DV_TRANS_PRI");
  if (!sh) return saberShort;
  groupPRI = String(groupPRI||"").trim();
  saberShort = String(saberShort||"").trim();

  var data = sh.getDataRange().getValues();
  for (var i=1;i<data.length;i++){
    if (String(data[i][4]||"").trim() !== "Digital") continue;
    if (groupPRI && String(data[i][5]||"").trim() !== groupPRI) continue;

    if (String(data[i][7]||"").trim() === saberShort){
      return String(data[i][6]||"").trim() || saberShort; // SABER_FULL
    }
  }
  return saberShort;
}