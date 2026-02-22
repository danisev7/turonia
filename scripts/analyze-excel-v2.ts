import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function cellValue(cell: ExcelJS.CellValue): string {
  if (cell === undefined || cell === null) return "";
  if (typeof cell === "object" && "richText" in (cell as any)) {
    return ((cell as any).richText as { text: string }[]).map(r => r.text).join("").trim();
  }
  if (typeof cell === "object" && "text" in (cell as any)) return (cell as any).text;
  return String(cell).trim();
}

async function analyzeFile(filePath: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  console.log(`\n${"=".repeat(80)}`);
  console.log(`FILE: ${path.basename(filePath)}`);
  console.log("=".repeat(80));

  workbook.eachSheet((sheet) => {
    console.log(`\n  Sheet: "${sheet.name}" (rows: ${sheet.rowCount})`);

    // Scan rows 1-20 to find actual data structure
    for (let r = 1; r <= Math.min(20, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      const vals: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        const v = cellValue(cell.value);
        if (v && v.length < 80) {
          vals.push(`[${col}]${v}`);
        } else if (v) {
          vals.push(`[${col}]${v.substring(0, 40)}...`);
        }
      });
      if (vals.length > 0) {
        console.log(`    Row ${r}: ${vals.join(" | ")}`);
      }
    }

    // Show a sample data row (rows 10-30)
    console.log(`\n  Sample data rows:`);
    for (let r = 10; r <= Math.min(35, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      const vals: string[] = [];
      row.eachCell({ includeEmpty: false }, (cell, col) => {
        const v = cellValue(cell.value);
        if (v) {
          vals.push(`[${col}]${v.substring(0, 50)}`);
        }
      });
      if (vals.length > 1) {  // Only show rows with actual data
        console.log(`    Row ${r}: ${vals.join(" | ")}`);
      }
    }
  });
}

const files = [
  "../docs/examples/INF - 24-25 a 25-26_Traspàs de tutories INFANTIL .xlsx",
  "../docs/examples/24-25 a 25-26_Traspàs de tutories ESO.xlsx",
  "../docs/examples/INF_Alumnat NESE 24-25.xlsx",
  "../docs/examples/ESO_Alumnat NESE 24-25.xlsx",
];

async function main() {
  for (const f of files) {
    await analyzeFile(path.resolve(__dirname, f));
  }
}

main().catch(console.error);
