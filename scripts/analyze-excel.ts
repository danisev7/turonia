import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  "../docs/examples/INF - 24-25 a 25-26_Traspàs de tutories INFANTIL .xlsx",
  "../docs/examples/24-25 a 25-26_Traspàs de tutories PRIMÀRIA.xlsx",
  "../docs/examples/24-25 a 25-26_Traspàs de tutories ESO.xlsx",
  "../docs/examples/INF_Alumnat NESE 24-25.xlsx",
  "../docs/examples/PRI_Alumnat NESE 24-25.xlsx",
  "../docs/examples/ESO_Alumnat NESE 24-25.xlsx",
];

async function analyze() {
  for (const file of files) {
    const filePath = path.resolve(__dirname, file);
    console.log(`\n${"=".repeat(80)}`);
    console.log(`FILE: ${path.basename(filePath)}`);
    console.log("=".repeat(80));

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((sheet) => {
      console.log(`\n  Sheet: "${sheet.name}" (rows: ${sheet.rowCount})`);

      // Find header row (first row with content)
      let headerRow: (string | undefined)[] = [];
      let headerRowNum = 0;
      for (let i = 1; i <= Math.min(5, sheet.rowCount); i++) {
        const row = sheet.getRow(i);
        const values = row.values as (string | { text?: string; richText?: { text: string }[] } | undefined)[];
        if (values && values.some(v => v !== undefined && v !== null)) {
          headerRow = values.map(v => {
            if (v === undefined || v === null) return undefined;
            if (typeof v === "object" && "richText" in v && v.richText) {
              return v.richText.map(r => r.text).join("");
            }
            if (typeof v === "object" && "text" in v) return v.text;
            return String(v);
          });
          headerRowNum = i;
          break;
        }
      }

      console.log(`  Header row #${headerRowNum}:`);
      headerRow.forEach((h, idx) => {
        if (h) console.log(`    Col ${idx}: "${h}"`);
      });

      // Show first 3 data rows
      console.log(`\n  First 3 data rows:`);
      for (let i = headerRowNum + 1; i <= Math.min(headerRowNum + 3, sheet.rowCount); i++) {
        const row = sheet.getRow(i);
        const values = row.values as (string | { text?: string; richText?: { text: string }[] } | undefined)[];
        if (!values) continue;
        const mapped = values.map((v, idx) => {
          if (v === undefined || v === null) return "";
          if (typeof v === "object" && "richText" in v && v.richText) {
            return v.richText.map(r => r.text).join("");
          }
          if (typeof v === "object" && "text" in v) return v.text;
          return String(v);
        });
        console.log(`    Row ${i}: ${JSON.stringify(mapped.filter(Boolean).slice(0, 8))}`);
      }
    });
  }
}

analyze().catch(console.error);
