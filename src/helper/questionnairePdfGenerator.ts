import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

// ============================================================
// Input data shapes
// ============================================================
export interface PdfFieldItem {
  type: "field";
  label: string;
  value: string;
}

export interface PdfTableItem {
  type: "table";
  label: string;
  columns: string[];
  rows: string[][];
}

export type PdfItem = PdfFieldItem | PdfTableItem;

export interface PdfSection {
  title: string;
  items: PdfItem[];
}

export interface PdfGenerationInput {
  sections: PdfSection[];
  supplierName: string;
  clientName?: string;
  submissionDate: string;
  referenceId?: string;
}

// ============================================================
// Brand colors — EnviGuide
// White header (logo needs white bg) + lime green accents
// ============================================================
const COLORS = {
  brand: "#A3E635", // lime green for section bars, table headers, accents
  brandDark: "#65A30D", // deeper green for borders/depth
  text: "#1F2937", // near-black body text
  textOnBrand: "#111827", // dark text on lime green backgrounds
  lightText: "#6B7280",
  border: "#D1D5DB", // slightly darker gray for visible borders
  borderLight: "#E5E7EB",
  sectionBg: "#F7FEE7", // very light lime tint for info box
  tableHeaderBg: "#A3E635",
  tableAltRow: "#F9FAFB",
  white: "#FFFFFF",
};

// Layout constants
const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 55;
const FOOTER_HEIGHT = 40;
const FONT_REGULAR = "RobotoRegular";
const FONT_BOLD = "RobotoBold";
const FONT_ITALIC = "RobotoItalic";

// ============================================================
// Helpers
// ============================================================
const formatReferenceId = (id: string): string => {
  if (!id) return "N/A";
  return id.match(/.{1,4}/g)?.join("-") || id;
};

const sanitizeText = (text: any): string => {
  if (text === null || text === undefined) return "";
  const s = String(text);
  return s
    .replace(/₹/g, "INR")
    .replace(/€/g, "EUR")
    .replace(/¥/g, "JPY")
    .replace(/£/g, "GBP");
};

// Resolve asset paths (works in both src/ and dist/ runs)
const resolveAssetPath = (relativePath: string): string | null => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const candidates = [
      join(__dirname, "..", "assets", relativePath),
      join(__dirname, "..", "..", "assets", relativePath),
    ];
    for (const c of candidates) {
      if (existsSync(c)) return c;
    }
    return null;
  } catch {
    return null;
  }
};

// ============================================================
// Main generator
// ============================================================
export const generateQuestionnairePdfBuffer = (
  input: PdfGenerationInput
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: {
          top: HEADER_HEIGHT + 20,
          bottom: FOOTER_HEIGHT + 10,
          left: PAGE_MARGIN,
          right: PAGE_MARGIN,
        },
        bufferPages: true,
      });

      // Register Unicode fonts
      const regularPath = resolveAssetPath("fonts/Roboto-Regular.ttf");
      const boldPath = resolveAssetPath("fonts/Roboto-Bold.ttf");
      const italicPath = resolveAssetPath("fonts/Roboto-Italic.ttf");
      if (regularPath) doc.registerFont(FONT_REGULAR, regularPath);
      if (boldPath) doc.registerFont(FONT_BOLD, boldPath);
      if (italicPath) doc.registerFont(FONT_ITALIC, italicPath);

      const useFont = (name: string) => {
        try { doc.font(name); } catch { doc.font("Helvetica"); }
      };
      const fontRegular = () => useFont(regularPath ? FONT_REGULAR : "Helvetica");
      const fontBold = () => useFont(boldPath ? FONT_BOLD : "Helvetica-Bold");
      const fontItalic = () => useFont(italicPath ? FONT_ITALIC : "Helvetica-Oblique");

      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - PAGE_MARGIN * 2;
      const logoPath = resolveAssetPath("logo.png");

      // ============================================================
      // COVER TITLE
      // ============================================================
      fontBold();
      doc
        .fillColor(COLORS.text)
        .fontSize(18)
        .text("Supplier Sustainability Questionnaire Report", PAGE_MARGIN, doc.y, {
          width: contentWidth,
          lineBreak: false,
          ellipsis: true,
        });
      doc.moveDown(1);

      // INFO BOX
      const infoRows: Array<[string, string, boolean]> = [];
      infoRows.push(["SUBMITTED BY (Supplier)", input.supplierName || "N/A", false]);
      if (input.clientName) {
        infoRows.push(["SUBMITTED TO (Client)", input.clientName, false]);
      }
      const dateStr = new Date(input.submissionDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      infoRows.push(["SUBMISSION DATE", dateStr, false]);
      if (input.referenceId) {
        infoRows.push(["REPORT REFERENCE", formatReferenceId(input.referenceId), true]);
      }

      const infoBoxTop = doc.y;
      const infoRowHeight = 22;
      const boxPadding = 18;
      const infoBoxHeight = boxPadding * 2 + infoRows.length * infoRowHeight;

      doc
        .roundedRect(PAGE_MARGIN, infoBoxTop, contentWidth, infoBoxHeight, 5)
        .fillAndStroke(COLORS.sectionBg, COLORS.brandDark);

      let infoY = infoBoxTop + boxPadding;
      const labelX = PAGE_MARGIN + 20;
      const valueX = PAGE_MARGIN + 180;

      for (const [label, value, isMonospace] of infoRows) {
        fontBold();
        doc
          .fillColor(COLORS.lightText)
          .fontSize(8)
          .text(sanitizeText(label), labelX, infoY, { lineBreak: false });

        if (isMonospace) {
          doc.font("Courier");
        } else {
          fontRegular();
        }
        doc
          .fillColor(COLORS.text)
          .fontSize(11)
          .text(sanitizeText(value), valueX, infoY - 1, { lineBreak: false });
        infoY += infoRowHeight;
      }

      doc.y = infoBoxTop + infoBoxHeight + 25;

      // ============================================================
      // SECTIONS
      // ============================================================
      for (const section of input.sections) {
        if (section.items.length === 0) continue;

        if (doc.y > pageHeight - FOOTER_HEIGHT - 120) {
          doc.addPage();
        }

        // Section header bar — lime green with dark text
        const sHeaderTop = doc.y;
        doc.rect(PAGE_MARGIN, sHeaderTop, contentWidth, 28).fill(COLORS.brand);
        fontBold();
        doc
          .fillColor(COLORS.textOnBrand)
          .fontSize(12)
          .text(sanitizeText(section.title), PAGE_MARGIN + 12, sHeaderTop + 9, {
            lineBreak: false,
            width: contentWidth - 24,
            ellipsis: true,
          });
        doc.y = sHeaderTop + 38;

        for (let itemIdx = 0; itemIdx < section.items.length; itemIdx++) {
          const item = section.items[itemIdx];

          if (doc.y > pageHeight - FOOTER_HEIGHT - 80) {
            doc.addPage();
          }

          if (item.type === "field") {
            renderField(doc, item, contentWidth, fontRegular, fontBold);
            doc.y += 4;
          } else {
            renderTableItem(doc, item, contentWidth, pageHeight, fontRegular, fontBold);
            doc.y += 14;
          }
        }

        doc.y += 12;
      }

      // ============================================================
      // APPLY HEADERS + FOOTERS TO ALL PAGES
      // ============================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);

        // Drop margins to prevent phantom pages
        doc.page.margins.top = 0;
        doc.page.margins.bottom = 0;

        // Header bar — WHITE background so logo renders perfectly
        doc.rect(0, 0, pageWidth, HEADER_HEIGHT).fill(COLORS.white);
        // Thin lime green accent line below header
        doc
          .rect(0, HEADER_HEIGHT - 3, pageWidth, 3)
          .fill(COLORS.brand);

        // Logo (left) — full wordmark on white background
        const logoHeight = 35;
        const logoY = (HEADER_HEIGHT - 3 - logoHeight) / 2;
        if (logoPath) {
          try {
            doc.image(logoPath, PAGE_MARGIN, logoY, { height: logoHeight });
          } catch {
            fontBold();
            doc
              .fillColor(COLORS.text)
              .fontSize(14)
              .text("enviguide", PAGE_MARGIN, logoY + 10, { lineBreak: false });
          }
        } else {
          fontBold();
          doc
            .fillColor(COLORS.text)
            .fontSize(14)
            .text("enviguide", PAGE_MARGIN, logoY + 10, { lineBreak: false });
        }

        // Page number (right)
        fontRegular();
        doc
          .fillColor(COLORS.lightText)
          .fontSize(9)
          .text(
            `Page ${i + 1} of ${totalPages}`,
            PAGE_MARGIN,
            (HEADER_HEIGHT - 3) / 2 - 4,
            {
              align: "right",
              width: pageWidth - PAGE_MARGIN * 2,
              lineBreak: false,
            }
          );

        // Footer separator line
        doc
          .strokeColor(COLORS.borderLight)
          .lineWidth(0.5)
          .moveTo(PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
          .lineTo(pageWidth - PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
          .stroke();

        // Footer text
        fontItalic();
        doc
          .fillColor(COLORS.lightText)
          .fontSize(7)
          .text(
            "This document is confidential and intended for internal use only.",
            PAGE_MARGIN,
            pageHeight - FOOTER_HEIGHT + 12,
            { lineBreak: false, width: contentWidth * 0.7 }
          );
        fontRegular();
        doc
          .fillColor(COLORS.lightText)
          .fontSize(7)
          .text(
            `Generated on ${dateStr}`,
            PAGE_MARGIN,
            pageHeight - FOOTER_HEIGHT + 12,
            { align: "right", width: contentWidth, lineBreak: false }
          );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ============================================================
// FIELD RENDERER (key-value row)
// All values left-aligned for consistency
// ============================================================
function renderField(
  doc: PDFKit.PDFDocument,
  item: PdfFieldItem,
  contentWidth: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  const rowTop = doc.y;
  const labelWidth = contentWidth * 0.55;
  const valueWidth = contentWidth * 0.45;
  const cellPadding = 7;
  const labelText = sanitizeText(item.label);
  const valueText = sanitizeText(item.value || "-");

  // Measure heights
  fontBold();
  doc.fontSize(9);
  const labelHeight = doc.heightOfString(labelText, {
    width: labelWidth - cellPadding * 2,
  });
  fontRegular();
  doc.fontSize(9);
  const valueHeight = doc.heightOfString(valueText, {
    width: valueWidth - cellPadding * 2,
  });
  const rowHeight = Math.max(labelHeight, valueHeight, 16) + cellPadding * 2;

  // Backgrounds
  doc
    .rect(PAGE_MARGIN, rowTop, labelWidth, rowHeight)
    .fillAndStroke(COLORS.tableAltRow, COLORS.border);
  doc
    .rect(PAGE_MARGIN + labelWidth, rowTop, valueWidth, rowHeight)
    .fillAndStroke(COLORS.white, COLORS.border);

  // Label — vertically centered
  const labelTextHeight = labelHeight;
  const labelYOffset = (rowHeight - labelTextHeight) / 2;
  fontBold();
  doc
    .fillColor(COLORS.text)
    .fontSize(9)
    .text(labelText, PAGE_MARGIN + cellPadding, rowTop + labelYOffset, {
      width: labelWidth - cellPadding * 2,
    });

  // Value — vertically centered, always left-aligned
  const valueTextHeight = valueHeight;
  const valueYOffset = (rowHeight - valueTextHeight) / 2;
  fontRegular();
  doc
    .fillColor(COLORS.text)
    .fontSize(9)
    .text(
      valueText,
      PAGE_MARGIN + labelWidth + cellPadding,
      rowTop + valueYOffset,
      { width: valueWidth - cellPadding * 2, align: "left" }
    );

  doc.y = rowTop + rowHeight;
}

// ============================================================
// TABLE ITEM RENDERER (label + table)
// ============================================================
function renderTableItem(
  doc: PDFKit.PDFDocument,
  item: PdfTableItem,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  fontBold();
  doc.fillColor(COLORS.text).fontSize(10);
  const labelText = sanitizeText(item.label);
  const labelHeight = doc.heightOfString(labelText, { width: contentWidth });

  if (doc.y + labelHeight + 60 > pageHeight - FOOTER_HEIGHT - 10) {
    doc.addPage();
  }

  doc.text(labelText, PAGE_MARGIN, doc.y, { width: contentWidth });
  doc.y += 6;

  const safeCols = item.columns.map((c) => sanitizeText(c));
  const safeRows = item.rows.map((r) => r.map((c) => sanitizeText(c)));
  drawTable(doc, safeCols, safeRows, contentWidth, pageHeight, fontRegular, fontBold);
}

// ============================================================
// TABLE DRAWING
// - White dividers on green header rows
// - Visible gray dividers on data rows
// - All cell text LEFT-aligned and VERTICALLY CENTERED
// ============================================================
function drawTable(
  doc: PDFKit.PDFDocument,
  columns: string[],
  rows: string[][],
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  if (columns.length === 0) return;
  const colWidth = contentWidth / columns.length;
  const cellPadding = 5;

  // Measure header height
  fontBold();
  doc.fontSize(8);
  const colHeights = columns.map((c) =>
    doc.heightOfString(c, { width: colWidth - cellPadding * 2 })
  );
  const headerHeight = Math.max(...colHeights) + cellPadding * 2;

  let y = doc.y;
  if (y + headerHeight > pageHeight - FOOTER_HEIGHT - 30) {
    doc.addPage();
    y = doc.y;
  }

  // Draw header row
  const drawHeader = (startY: number) => {
    // Green background
    doc
      .rect(PAGE_MARGIN, startY, contentWidth, headerHeight)
      .fill(COLORS.tableHeaderBg);

    // WHITE vertical dividers on green header (visible on green)
    doc.strokeColor(COLORS.white).lineWidth(0.8);
    for (let i = 1; i < columns.length; i++) {
      doc
        .moveTo(PAGE_MARGIN + i * colWidth, startY)
        .lineTo(PAGE_MARGIN + i * colWidth, startY + headerHeight)
        .stroke();
    }

    // Column header text — vertically centered, white, left-aligned
    fontBold();
    columns.forEach((col, i) => {
      const textH = colHeights[i];
      const textY = startY + (headerHeight - textH) / 2;
      doc
        .fillColor(COLORS.white)
        .fontSize(8)
        .text(
          col,
          PAGE_MARGIN + i * colWidth + cellPadding,
          textY,
          { width: colWidth - cellPadding * 2, align: "left" }
        );
    });
  };

  drawHeader(y);
  y += headerHeight;

  // Body rows
  rows.forEach((row, rowIndex) => {
    fontRegular();
    doc.fontSize(8);

    // Measure each cell's text height
    const cellHeights = row.map((cell) =>
      doc.heightOfString(String(cell || "-"), {
        width: colWidth - cellPadding * 2,
      })
    );
    const rowHeight = Math.max(...cellHeights, 12) + cellPadding * 2;

    // Page break
    if (y + rowHeight > pageHeight - FOOTER_HEIGHT - 30) {
      doc.addPage();
      y = doc.y;
      drawHeader(y);
      y += headerHeight;
    }

    // Alternate row color
    const bgColor = rowIndex % 2 === 0 ? COLORS.white : COLORS.tableAltRow;
    doc.rect(PAGE_MARGIN, y, contentWidth, rowHeight).fill(bgColor);

    // Outer border
    doc
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .rect(PAGE_MARGIN, y, contentWidth, rowHeight)
      .stroke();

    // Vertical column dividers — darker gray, visible
    for (let i = 1; i < columns.length; i++) {
      doc
        .moveTo(PAGE_MARGIN + i * colWidth, y)
        .lineTo(PAGE_MARGIN + i * colWidth, y + rowHeight)
        .stroke();
    }

    // Cell text — ALL LEFT-ALIGNED, VERTICALLY CENTERED
    fontRegular();
    row.forEach((cell, i) => {
      const cellText = String(cell || "-");
      const textH = cellHeights[i];
      const textY = y + (rowHeight - textH) / 2;
      doc
        .fillColor(COLORS.text)
        .fontSize(8)
        .text(
          cellText,
          PAGE_MARGIN + i * colWidth + cellPadding,
          textY,
          { width: colWidth - cellPadding * 2, align: "left" }
        );
    });

    y += rowHeight;
  });

  doc.y = y;
}
