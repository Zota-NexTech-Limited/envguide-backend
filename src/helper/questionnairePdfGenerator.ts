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
// Brand colors
// ============================================================
const COLORS = {
  header: "#115E59",
  accent: "#10B981",
  text: "#1F2937",
  lightText: "#6B7280",
  border: "#E5E7EB",
  sectionBg: "#F0FDFA",
  tableHeaderBg: "#115E59",
  tableAltRow: "#F9FAFB",
  white: "#FFFFFF",
};

// Layout constants
const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 50;
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

// Sanitize text for PDF rendering.
// Replace characters that may not render correctly in the bundled font
// with ASCII-safe equivalents. (Roboto cmap may lack ₹ etc.)
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

      // Register Unicode fonts (supports ₹, €, ¥, etc.)
      const regularPath = resolveAssetPath("fonts/Roboto-Regular.ttf");
      const boldPath = resolveAssetPath("fonts/Roboto-Bold.ttf");
      const italicPath = resolveAssetPath("fonts/Roboto-Italic.ttf");
      if (regularPath) doc.registerFont(FONT_REGULAR, regularPath);
      if (boldPath) doc.registerFont(FONT_BOLD, boldPath);
      if (italicPath) doc.registerFont(FONT_ITALIC, italicPath);

      // Safe font helpers — fall back to Helvetica if font registration failed
      const useFont = (name: string) => {
        try {
          doc.font(name);
        } catch {
          doc.font("Helvetica");
        }
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
        .fillColor(COLORS.header)
        .fontSize(22)
        .text("Supplier Sustainability", PAGE_MARGIN, doc.y);
      doc.fontSize(22).text("Questionnaire Report", PAGE_MARGIN, doc.y);
      doc.moveDown(0.8);

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
      const rowHeight = 22;
      const boxPadding = 18;
      const infoBoxHeight = boxPadding * 2 + infoRows.length * rowHeight;

      doc
        .roundedRect(PAGE_MARGIN, infoBoxTop, contentWidth, infoBoxHeight, 5)
        .fillAndStroke(COLORS.sectionBg, COLORS.accent);

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
          doc.font("Courier"); // Courier has ASCII which is fine for reference IDs
        } else {
          fontRegular();
        }
        doc
          .fillColor(COLORS.text)
          .fontSize(11)
          .text(sanitizeText(value), valueX, infoY - 1, { lineBreak: false });
        infoY += rowHeight;
      }

      doc.y = infoBoxTop + infoBoxHeight + 25;

      // ============================================================
      // SECTIONS
      // ============================================================
      for (const section of input.sections) {
        if (section.items.length === 0) continue;

        // Page break if not enough room for header + first item
        if (doc.y > pageHeight - FOOTER_HEIGHT - 120) {
          doc.addPage();
        }

        // Section header bar
        const sHeaderTop = doc.y;
        doc.rect(PAGE_MARGIN, sHeaderTop, contentWidth, 28).fill(COLORS.header);
        fontBold();
        doc
          .fillColor(COLORS.white)
          .fontSize(12)
          .text(sanitizeText(section.title), PAGE_MARGIN + 12, sHeaderTop + 9, {
            lineBreak: false,
            width: contentWidth - 24,
            ellipsis: true,
          });
        doc.y = sHeaderTop + 38;

        // Items
        for (let itemIdx = 0; itemIdx < section.items.length; itemIdx++) {
          const item = section.items[itemIdx];

          // Page break if needed
          if (doc.y > pageHeight - FOOTER_HEIGHT - 80) {
            doc.addPage();
          }

          if (item.type === "field") {
            renderField(doc, item, contentWidth, fontRegular, fontBold);
            // Small gap after a simple field
            doc.y += 4;
          } else {
            renderTableItem(
              doc,
              item,
              contentWidth,
              pageHeight,
              fontRegular,
              fontBold
            );
            // Larger gap after a table (tables need more breathing room
            // before the next question — especially sub-questions like 15.1)
            doc.y += 14;
          }
        }

        // Larger gap between sections
        doc.y += 12;
      }

      // ============================================================
      // APPLY HEADERS + FOOTERS TO ALL PAGES
      // ============================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);

        // CRITICAL: Drop margins to 0 so drawing in the margin area
        // (logo at top, footer at bottom) does NOT trigger pdfkit to
        // auto-create new pages. Without this, every text() call below
        // the content area creates a phantom page.
        doc.page.margins.top = 0;
        doc.page.margins.bottom = 0;

        // Header bar
        doc.rect(0, 0, pageWidth, HEADER_HEIGHT).fill(COLORS.header);

        // Logo (left)
        if (logoPath) {
          try {
            doc.image(logoPath, PAGE_MARGIN, 10, { height: 30 });
          } catch {
            fontBold();
            doc
              .fillColor(COLORS.white)
              .fontSize(13)
              .text("EnviGuide", PAGE_MARGIN, 18, { lineBreak: false });
          }
        } else {
          fontBold();
          doc
            .fillColor(COLORS.white)
            .fontSize(13)
            .text("EnviGuide", PAGE_MARGIN, 18, { lineBreak: false });
        }

        // Center title
        fontRegular();
        doc
          .fillColor(COLORS.white)
          .fontSize(10)
          .text("Supplier Questionnaire Report", 0, 22, {
            align: "center",
            width: pageWidth,
            lineBreak: false,
          });

        // Page number (right)
        fontRegular();
        doc
          .fillColor(COLORS.white)
          .fontSize(8)
          .text(
            `Page ${i + 1} of ${totalPages}`,
            PAGE_MARGIN,
            30,
            {
              align: "right",
              width: pageWidth - PAGE_MARGIN * 2,
              lineBreak: false,
            }
          );

        // Footer separator line
        doc
          .strokeColor(COLORS.border)
          .lineWidth(0.5)
          .moveTo(PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
          .lineTo(pageWidth - PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
          .stroke();

        // Footer: confidentiality note (left) + generation date (right)
        // Both use lineBreak:false to prevent phantom page overflow
        fontItalic();
        doc
          .fillColor(COLORS.lightText)
          .fontSize(7)
          .text(
            "This document is confidential and intended for internal use only.",
            PAGE_MARGIN,
            pageHeight - FOOTER_HEIGHT + 12,
            {
              lineBreak: false,
              width: contentWidth * 0.7,
            }
          );
        fontRegular();
        doc
          .fillColor(COLORS.lightText)
          .fontSize(7)
          .text(
            `Generated on ${dateStr}`,
            PAGE_MARGIN,
            pageHeight - FOOTER_HEIGHT + 12,
            {
              align: "right",
              width: contentWidth,
              lineBreak: false,
            }
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

  // Label
  fontBold();
  doc
    .fillColor(COLORS.text)
    .fontSize(9)
    .text(labelText, PAGE_MARGIN + cellPadding, rowTop + cellPadding, {
      width: labelWidth - cellPadding * 2,
    });

  // Value
  fontRegular();
  doc
    .fillColor(COLORS.text)
    .fontSize(9)
    .text(
      valueText,
      PAGE_MARGIN + labelWidth + cellPadding,
      rowTop + cellPadding,
      { width: valueWidth - cellPadding * 2 }
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
  // Table label (question)
  fontBold();
  doc.fillColor(COLORS.text).fontSize(10);
  const labelText = sanitizeText(item.label);
  const labelHeight = doc.heightOfString(labelText, { width: contentWidth });

  // Ensure room for label + at least header + one row
  if (doc.y + labelHeight + 60 > pageHeight - FOOTER_HEIGHT - 10) {
    doc.addPage();
  }

  doc.text(labelText, PAGE_MARGIN, doc.y, { width: contentWidth });
  doc.y += 6;

  // Sanitize columns and rows before drawing
  const safeCols = item.columns.map((c) => sanitizeText(c));
  const safeRows = item.rows.map((r) => r.map((c) => sanitizeText(c)));
  drawTable(doc, safeCols, safeRows, contentWidth, pageHeight, fontRegular, fontBold);
}

// ============================================================
// TABLE DRAWING
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

  // Header height
  fontBold();
  doc.fontSize(8);
  const headerHeight =
    Math.max(
      ...columns.map((c) =>
        doc.heightOfString(c, { width: colWidth - cellPadding * 2 })
      )
    ) +
    cellPadding * 2;

  let y = doc.y;
  if (y + headerHeight > pageHeight - FOOTER_HEIGHT - 30) {
    doc.addPage();
    y = doc.y;
  }

  // Header row
  const drawHeader = (startY: number) => {
    doc
      .rect(PAGE_MARGIN, startY, contentWidth, headerHeight)
      .fill(COLORS.tableHeaderBg);
    fontBold();
    columns.forEach((col, i) => {
      doc
        .fillColor(COLORS.white)
        .fontSize(8)
        .text(
          col,
          PAGE_MARGIN + i * colWidth + cellPadding,
          startY + cellPadding,
          { width: colWidth - cellPadding * 2 }
        );
    });
  };

  drawHeader(y);
  y += headerHeight;

  // Body rows
  rows.forEach((row, rowIndex) => {
    fontRegular();
    doc.fontSize(8);

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
      .lineWidth(0.3)
      .rect(PAGE_MARGIN, y, contentWidth, rowHeight)
      .stroke();

    // Vertical column dividers
    for (let i = 1; i < columns.length; i++) {
      doc
        .moveTo(PAGE_MARGIN + i * colWidth, y)
        .lineTo(PAGE_MARGIN + i * colWidth, y + rowHeight)
        .stroke();
    }

    // Cell text
    fontRegular();
    row.forEach((cell, i) => {
      doc
        .fillColor(COLORS.text)
        .fontSize(8)
        .text(
          String(cell || "-"),
          PAGE_MARGIN + i * colWidth + cellPadding,
          y + cellPadding,
          { width: colWidth - cellPadding * 2 }
        );
    });

    y += rowHeight;
  });

  doc.y = y;
}
