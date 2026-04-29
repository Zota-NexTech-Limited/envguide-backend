import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

// ============================================================
// Input data shapes
// ============================================================
export interface PcfReportComponent {
  componentName: string;
  materialNumber: string;
  supplierName: string;
  weightKg: number;
  quantity: number;
  scopeOne: number;
  scopeTwo: number;
  scopeThree: number;
  totalCo2e: number;
  // Lifecycle phase split (kg CO2e per unit)
  material: number;
  production: number;
  packaging: number;
  logistic: number;
  waste: number;
}

export interface PcfReportSupplierAppendix {
  supplierName: string;
  supplierEmail?: string;
  componentsSupplied: string[];
  responses: Array<{
    section: string;
    items: Array<{ label: string; value: string }>;
  }>;
}

export interface PcfReportInput {
  // Cover page
  pcfRequestNumber: string; // e.g. PCF00276
  productName: string;
  clientName: string;
  reportingPeriod: string; // e.g. "FY 2025"
  generationDate: string; // ISO date
  // Executive summary
  totalCo2e: number; // kg CO2e per FU
  functionalUnit: string; // e.g. "1 unit, 1.2 kg"
  systemBoundary: string; // e.g. "Cradle-to-gate"
  gwpSet: string; // e.g. "IPCC AR6, 100-year"
  // Lifecycle totals (sum across all components)
  totalsByPhase: {
    material: number;
    production: number;
    packaging: number;
    logistic: number;
    waste: number;
  };
  // Scope totals (sum across all components)
  totalsByScope: {
    scopeOne: number;
    scopeTwo: number;
    scopeThree: number;
  };
  // Component-level breakdown
  components: PcfReportComponent[];
  // Methodology + sources (free text already prepared)
  methodology: {
    standard: string; // e.g. "ISO 14067:2018 / GHG Protocol Product Standard"
    allocationMethod: string; // e.g. "Mass-based allocation"
    cutoffCriteria: string;
  };
  dataSources: {
    primary: string; // e.g. "Supplier-provided questionnaire responses"
    secondary: string; // e.g. "Ecoinvent v3.10 database"
    backgroundEf: string;
  };
  // Optional supplier appendix
  supplierAppendix: PcfReportSupplierAppendix[];
}

// ============================================================
// Brand colors — EnviGuide
// ============================================================
const COLORS = {
  brand: "#A3E635",
  brandDark: "#65A30D",
  text: "#1F2937",
  textOnBrand: "#111827",
  lightText: "#6B7280",
  border: "#D1D5DB",
  borderLight: "#E5E7EB",
  sectionBg: "#F7FEE7",
  tableHeaderBg: "#A3E635",
  tableAltRow: "#F9FAFB",
  white: "#FFFFFF",
  // Chart palette for lifecycle phases (5 colors, distinct + accessible)
  chart: ["#65A30D", "#0EA5E9", "#F59E0B", "#8B5CF6", "#EF4444"],
};

const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 55;
const FOOTER_HEIGHT = 40;
const FONT_REGULAR = "RobotoRegular";
const FONT_BOLD = "RobotoBold";
const FONT_ITALIC = "RobotoItalic";

// ============================================================
// Utilities
// ============================================================
const sanitizeText = (text: any): string => {
  if (text === null || text === undefined) return "";
  const s = String(text);
  return s
    .replace(/₹/g, "INR")
    .replace(/€/g, "EUR")
    .replace(/¥/g, "JPY")
    .replace(/£/g, "GBP");
};

const formatNumber = (n: number, decimals = 3): string => {
  if (n === null || n === undefined || Number.isNaN(n)) return "0";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

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
export const generatePcfReportPdfBuffer = (
  input: PcfReportInput
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

      const dateStr = new Date(input.generationDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

      // ============================================================
      // COVER PAGE
      // ============================================================
      drawCover(doc, input, contentWidth, pageWidth, pageHeight, dateStr,
        fontRegular, fontBold, fontItalic, logoPath);

      // ============================================================
      // EXECUTIVE SUMMARY
      // ============================================================
      doc.addPage();
      drawSectionHeader(doc, "1. Executive Summary", contentWidth, fontBold, pageHeight);
      drawExecutiveSummary(doc, input, contentWidth, pageHeight, fontRegular, fontBold);

      // ============================================================
      // PRODUCT DETAILS
      // ============================================================
      doc.y += 10;
      drawSectionHeader(doc, "2. Product Details", contentWidth, fontBold, pageHeight);
      drawProductDetails(doc, input, contentWidth, pageHeight, fontRegular, fontBold);

      // ============================================================
      // EMISSIONS BREAKDOWN (with charts)
      // Charts need substantial vertical space, so this is the one
      // section where it's worth forcing a fresh page.
      // ============================================================
      doc.addPage();
      drawSectionHeader(doc, "3. Emissions Breakdown", contentWidth, fontBold, pageHeight);
      drawEmissionsBreakdown(doc, input, contentWidth, pageHeight, fontRegular, fontBold);

      // ============================================================
      // PER-COMPONENT EMISSIONS TABLE
      // ============================================================
      doc.y += 10;
      drawSectionHeader(doc, "4. Per-Component Emissions", contentWidth, fontBold, pageHeight);
      drawComponentEmissionsTable(doc, input, contentWidth, pageHeight, fontRegular, fontBold);

      // ============================================================
      // METHODOLOGY
      // ============================================================
      doc.y += 10;
      drawSectionHeader(doc, "5. Methodology", contentWidth, fontBold, pageHeight);
      drawMethodology(doc, input, contentWidth, pageHeight, fontRegular, fontBold);

      // ============================================================
      // DATA SOURCES
      // ============================================================
      doc.y += 10;
      drawSectionHeader(doc, "6. Data Sources", contentWidth, fontBold, pageHeight);
      drawDataSources(doc, input, contentWidth, pageHeight, fontRegular, fontBold);

      // ============================================================
      // APPENDIX — SUPPLIER RESPONSES
      // ============================================================
      if (input.supplierAppendix && input.supplierAppendix.length > 0) {
        doc.addPage();
        drawSectionHeader(doc, "Appendix A: Supplier Questionnaire Responses",
          contentWidth, fontBold, pageHeight);
        drawSupplierAppendix(doc, input, contentWidth, pageHeight,
          fontRegular, fontBold, fontItalic);
      }

      // ============================================================
      // HEADERS + FOOTERS ON ALL PAGES
      // ============================================================
      const range = doc.bufferedPageRange();
      const totalPages = range.count;
      for (let i = 0; i < totalPages; i++) {
        doc.switchToPage(range.start + i);
        doc.page.margins.top = 0;
        doc.page.margins.bottom = 0;

        // Header bar
        doc.rect(0, 0, pageWidth, HEADER_HEIGHT).fill(COLORS.white);
        doc.rect(0, HEADER_HEIGHT - 3, pageWidth, 3).fill(COLORS.brand);

        const logoHeight = 35;
        const logoY = (HEADER_HEIGHT - 3 - logoHeight) / 2;
        if (logoPath) {
          try {
            doc.image(logoPath, PAGE_MARGIN, logoY, { height: logoHeight });
          } catch {
            fontBold();
            doc.fillColor(COLORS.text).fontSize(14)
              .text("enviguide", PAGE_MARGIN, logoY + 10, { lineBreak: false });
          }
        } else {
          fontBold();
          doc.fillColor(COLORS.text).fontSize(14)
            .text("enviguide", PAGE_MARGIN, logoY + 10, { lineBreak: false });
        }

        // Title in header (right side)
        fontRegular();
        doc.fillColor(COLORS.lightText).fontSize(9)
          .text(`PCF Report ${input.pcfRequestNumber}  |  Page ${i + 1} of ${totalPages}`,
            PAGE_MARGIN, (HEADER_HEIGHT - 3) / 2 - 4,
            { align: "right", width: pageWidth - PAGE_MARGIN * 2, lineBreak: false });

        // Footer
        doc.strokeColor(COLORS.borderLight).lineWidth(0.5)
          .moveTo(PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
          .lineTo(pageWidth - PAGE_MARGIN, pageHeight - FOOTER_HEIGHT)
          .stroke();

        fontItalic();
        doc.fillColor(COLORS.lightText).fontSize(7)
          .text("This document is confidential and intended for the recipient only.",
            PAGE_MARGIN, pageHeight - FOOTER_HEIGHT + 12,
            { lineBreak: false, width: contentWidth * 0.7 });
        fontRegular();
        doc.fillColor(COLORS.lightText).fontSize(7)
          .text(`Generated on ${dateStr}`, PAGE_MARGIN,
            pageHeight - FOOTER_HEIGHT + 12,
            { align: "right", width: contentWidth, lineBreak: false });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// ============================================================
// SECTION RENDERERS
// ============================================================
function drawSectionHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  contentWidth: number,
  fontBold: () => void,
  pageHeight?: number
) {
  // Only force a fresh page if the section header itself + at least one
  // content row (~80px) wouldn't fit on the current page. Otherwise, render
  // here and let the row-level page break handle overflow naturally.
  const ph = pageHeight ?? doc.page.height;
  if (doc.y + 28 + 80 > ph - FOOTER_HEIGHT - 10) {
    doc.addPage();
  }
  const top = doc.y;
  doc.rect(PAGE_MARGIN, top, contentWidth, 28).fill(COLORS.brand);
  fontBold();
  doc.fillColor(COLORS.textOnBrand).fontSize(13)
    .text(sanitizeText(title), PAGE_MARGIN + 12, top + 9,
      { lineBreak: false, width: contentWidth - 24, ellipsis: true });
  doc.y = top + 38;
}

function ensureSpace(doc: PDFKit.PDFDocument, pageHeight: number, needed: number) {
  if (doc.y + needed > pageHeight - FOOTER_HEIGHT - 10) {
    doc.addPage();
  }
}

function drawCover(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageWidth: number,
  pageHeight: number,
  dateStr: string,
  fontRegular: () => void,
  fontBold: () => void,
  fontItalic: () => void,
  logoPath: string | null
) {
  // Hero band
  const heroTop = HEADER_HEIGHT + 60;
  const heroHeight = 180;
  doc.rect(PAGE_MARGIN, heroTop, contentWidth, heroHeight)
    .fillAndStroke(COLORS.sectionBg, COLORS.brandDark);

  // Title
  fontBold();
  doc.fillColor(COLORS.text).fontSize(28)
    .text("Product Carbon Footprint Report", PAGE_MARGIN + 24, heroTop + 30,
      { width: contentWidth - 48, align: "left" });

  fontRegular();
  doc.fillColor(COLORS.lightText).fontSize(13)
    .text("Independent assessment per ISO 14067 / GHG Protocol",
      PAGE_MARGIN + 24, heroTop + 78,
      { width: contentWidth - 48, align: "left" });

  // Product name big
  fontBold();
  doc.fillColor(COLORS.brandDark).fontSize(20)
    .text(sanitizeText(input.productName), PAGE_MARGIN + 24, heroTop + 115,
      { width: contentWidth - 48, ellipsis: true, lineBreak: false });

  // Info box below hero
  const infoTop = heroTop + heroHeight + 30;
  const rows: Array<[string, string]> = [
    ["PCF REQUEST NUMBER", input.pcfRequestNumber],
    ["CLIENT", input.clientName],
    ["REPORTING PERIOD", input.reportingPeriod],
    ["TOTAL CARBON FOOTPRINT", `${formatNumber(input.totalCo2e, 3)} kg CO2e`],
    ["FUNCTIONAL UNIT", input.functionalUnit],
    ["SYSTEM BOUNDARY", input.systemBoundary],
    ["GENERATED ON", dateStr],
  ];

  const rowHeight = 24;
  const boxPadding = 18;
  const infoHeight = boxPadding * 2 + rows.length * rowHeight;

  doc.roundedRect(PAGE_MARGIN, infoTop, contentWidth, infoHeight, 5)
    .fillAndStroke(COLORS.white, COLORS.border);

  let y = infoTop + boxPadding;
  for (const [label, value] of rows) {
    fontBold();
    doc.fillColor(COLORS.lightText).fontSize(8)
      .text(label, PAGE_MARGIN + 20, y, { lineBreak: false });
    fontRegular();
    doc.fillColor(COLORS.text).fontSize(11)
      .text(sanitizeText(value), PAGE_MARGIN + 200, y - 1,
        { lineBreak: false, width: contentWidth - 220, ellipsis: true });
    y += rowHeight;
  }

  // Confidentiality notice
  const noticeTop = infoTop + infoHeight + 30;
  fontItalic();
  doc.fillColor(COLORS.lightText).fontSize(9)
    .text("This report is confidential. It is intended for the named client and must not be redistributed without written consent from EnviGuide.",
      PAGE_MARGIN, noticeTop, { width: contentWidth, align: "center" });
}

function drawExecutiveSummary(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  // KPI tile — total emissions, prominent
  const tileTop = doc.y;
  const tileHeight = 80;
  doc.roundedRect(PAGE_MARGIN, tileTop, contentWidth, tileHeight, 6)
    .fillAndStroke(COLORS.sectionBg, COLORS.brandDark);

  fontBold();
  doc.fillColor(COLORS.lightText).fontSize(9)
    .text("TOTAL PRODUCT CARBON FOOTPRINT", PAGE_MARGIN + 20, tileTop + 16,
      { lineBreak: false });

  fontBold();
  doc.fillColor(COLORS.brandDark).fontSize(28)
    .text(`${formatNumber(input.totalCo2e, 3)} kg CO2e`,
      PAGE_MARGIN + 20, tileTop + 30, { lineBreak: false });

  fontRegular();
  doc.fillColor(COLORS.text).fontSize(10)
    .text(`per ${input.functionalUnit}`, PAGE_MARGIN + 20, tileTop + 60,
      { lineBreak: false });

  doc.y = tileTop + tileHeight + 16;

  // Headline narrative
  fontRegular();
  doc.fillColor(COLORS.text).fontSize(10)
    .text(
      `One unit of ${input.productName} is associated with ${formatNumber(input.totalCo2e, 3)} kg CO2-equivalent emissions, assessed under a ${input.systemBoundary.toLowerCase()} system boundary using ${input.gwpSet}.`,
      PAGE_MARGIN, doc.y, { width: contentWidth, align: "left" }
    );
  doc.y += 14;

  // Quick scope summary
  const scope1 = input.totalsByScope.scopeOne;
  const scope2 = input.totalsByScope.scopeTwo;
  const scope3 = input.totalsByScope.scopeThree;
  const totalScopes = scope1 + scope2 + scope3 || 1;

  drawScopeMiniBar(doc, scope1, scope2, scope3, totalScopes, contentWidth,
    fontRegular, fontBold);
}

function drawScopeMiniBar(
  doc: PDFKit.PDFDocument,
  s1: number, s2: number, s3: number, total: number,
  contentWidth: number,
  fontRegular: () => void, fontBold: () => void
) {
  fontBold();
  doc.fillColor(COLORS.text).fontSize(10)
    .text("Scope 1 / 2 / 3 split (%)", PAGE_MARGIN, doc.y);
  doc.y += 6;

  const barTop = doc.y;
  const barHeight = 22;

  // Allocate widths: any non-zero scope gets at least MIN_WIDTH px so it remains
  // visible even when the dominant scope swallows the rest of the bar.
  const segments = allocateMinWidthSegments(
    [s1, s2, s3],
    contentWidth,
    /* minPx */ 6
  );
  const [p1, p2, p3] = segments;

  doc.rect(PAGE_MARGIN, barTop, p1, barHeight).fill(COLORS.chart[0]);
  doc.rect(PAGE_MARGIN + p1, barTop, p2, barHeight).fill(COLORS.chart[1]);
  doc.rect(PAGE_MARGIN + p1 + p2, barTop, p3, barHeight).fill(COLORS.chart[2]);
  // White dividers between segments for clarity when adjacent colors are bright
  doc.strokeColor(COLORS.white).lineWidth(1);
  if (p1 > 0 && p2 > 0)
    doc.moveTo(PAGE_MARGIN + p1, barTop)
      .lineTo(PAGE_MARGIN + p1, barTop + barHeight).stroke();
  if (p2 > 0 && p3 > 0)
    doc.moveTo(PAGE_MARGIN + p1 + p2, barTop)
      .lineTo(PAGE_MARGIN + p1 + p2, barTop + barHeight).stroke();
  doc.strokeColor(COLORS.border).lineWidth(0.5)
    .rect(PAGE_MARGIN, barTop, contentWidth, barHeight).stroke();

  doc.y = barTop + barHeight + 8;

  // Legend with absolute kg values + percentages.
  // Snapshot Y once so each text() call doesn't drift the next item downward.
  const legendItems = [
    { label: `Scope 1: ${formatNumber((s1 / total) * 100, 1)}%  (${formatNumber(s1, 2)} kg)`, color: COLORS.chart[0] },
    { label: `Scope 2: ${formatNumber((s2 / total) * 100, 1)}%  (${formatNumber(s2, 2)} kg)`, color: COLORS.chart[1] },
    { label: `Scope 3: ${formatNumber((s3 / total) * 100, 1)}%  (${formatNumber(s3, 2)} kg)`, color: COLORS.chart[2] },
  ];
  const legendY = doc.y;
  const legendColW = contentWidth / 3;
  for (let i = 0; i < legendItems.length; i++) {
    const it = legendItems[i];
    const lx = PAGE_MARGIN + i * legendColW;
    doc.rect(lx, legendY + 3, 10, 10).fill(it.color);
    fontRegular();
    doc.fillColor(COLORS.text).fontSize(9)
      .text(it.label, lx + 14, legendY + 2,
        { lineBreak: false, width: legendColW - 18, ellipsis: true });
  }
  doc.y = legendY + 22;
}

// Distribute total width across positive-valued segments so each non-zero
// segment gets at least minPx visible width. The largest segment absorbs the
// shortfall. Zero segments remain at width 0 (they're not part of the data).
function allocateMinWidthSegments(values: number[], totalWidth: number, minPx: number): number[] {
  const total = values.reduce((s, v) => s + Math.max(0, v), 0);
  if (total <= 0) return values.map(() => 0);

  const raw = values.map(v => (Math.max(0, v) / total) * totalWidth);
  const positiveIdx = values
    .map((v, i) => (v > 0 ? i : -1))
    .filter(i => i >= 0);

  if (positiveIdx.length === 0) return raw.map(() => 0);

  // Bump up tiny positive segments to minPx, track shortfall
  let shortfall = 0;
  for (const i of positiveIdx) {
    if (raw[i] < minPx) {
      shortfall += minPx - raw[i];
      raw[i] = minPx;
    }
  }

  // Take shortfall from the largest segment
  if (shortfall > 0) {
    let biggestIdx = positiveIdx[0];
    for (const i of positiveIdx) {
      if (raw[i] > raw[biggestIdx]) biggestIdx = i;
    }
    raw[biggestIdx] = Math.max(minPx, raw[biggestIdx] - shortfall);
  }
  return raw;
}

function drawProductDetails(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  // Quick header info
  const lines: Array<[string, string]> = [
    ["Product", input.productName],
    ["Client", input.clientName],
    ["PCF Request", input.pcfRequestNumber],
    ["Reporting Period", input.reportingPeriod],
    ["Component count", String(input.components.length)],
  ];
  drawKeyValueGrid(doc, lines, contentWidth, fontRegular, fontBold);
  doc.y += 8;

  // BOM table
  fontBold();
  doc.fillColor(COLORS.text).fontSize(11).text("Bill of Materials", PAGE_MARGIN, doc.y);
  doc.y += 6;

  const cols = ["Component", "MPN", "Supplier", "Weight (kg)", "Qty"];
  const rows = input.components.map(c => [
    c.componentName,
    c.materialNumber,
    c.supplierName,
    formatNumber(c.weightKg, 3),
    String(c.quantity),
  ]);
  // Custom column widths — Component and Supplier need more room than the
  // numeric trailing columns.
  const widths = [
    contentWidth * 0.28,
    contentWidth * 0.20,
    contentWidth * 0.27,
    contentWidth * 0.15,
    contentWidth * 0.10,
  ];
  drawTable(doc, cols, rows, contentWidth, pageHeight, fontRegular, fontBold, widths);
}

function drawEmissionsBreakdown(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  // Section explanation
  fontRegular();
  doc.fillColor(COLORS.text).fontSize(10)
    .text(
      "Emissions are presented two ways. The donut chart shows lifecycle phase distribution, which is the standard view for product-level PCF reports per ISO 14067. The horizontal bar chart highlights the top components by total CO2e contribution to identify hotspots for reduction.",
      PAGE_MARGIN, doc.y, { width: contentWidth, align: "left" }
    );
  doc.y += 12;

  // Donut chart
  ensureSpace(doc, pageHeight, 240);
  drawDonutChart(doc, input, contentWidth, fontRegular, fontBold);

  // Top components horizontal bar chart
  doc.y += 10;
  ensureSpace(doc, pageHeight, 240);
  drawTopComponentsBarChart(doc, input, contentWidth, fontRegular, fontBold);
}

function drawDonutChart(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  const t = input.totalsByPhase;
  // Negative values (e.g. credits from recycling) cannot be drawn as positive
  // arcs — clamp to 0 for chart purposes. The legend still shows the true value.
  const phases = [
    { label: "Materials", rawValue: t.material, value: Math.max(0, t.material), color: COLORS.chart[0] },
    { label: "Production", rawValue: t.production, value: Math.max(0, t.production), color: COLORS.chart[1] },
    { label: "Packaging", rawValue: t.packaging, value: Math.max(0, t.packaging), color: COLORS.chart[2] },
    { label: "Logistics", rawValue: t.logistic, value: Math.max(0, t.logistic), color: COLORS.chart[3] },
    { label: "Waste", rawValue: t.waste, value: Math.max(0, t.waste), color: COLORS.chart[4] },
  ];
  const total = phases.reduce((s, p) => s + p.value, 0) || 1;
  // Use raw values for the % shown in the legend so negative values display correctly
  const rawTotal = phases.reduce((s, p) => s + p.rawValue, 0) || 1;

  fontBold();
  doc.fillColor(COLORS.text).fontSize(11)
    .text("Lifecycle Phase Breakdown", PAGE_MARGIN, doc.y);
  doc.y += 8;

  // Chart geometry
  const chartTop = doc.y;
  const cx = PAGE_MARGIN + 90;
  const cy = chartTop + 90;
  const rOuter = 72;
  const rInner = 38;

  // Compute sweep per slice with a minimum visible angle so tiny phases
  // (e.g. 0.1%) still render as a thin band rather than being invisible.
  const sweeps = allocateMinWidthSegments(
    phases.map(p => p.value),
    Math.PI * 2,
    /* minRad */ (Math.PI * 2) * 0.012, // ~4.3 degrees minimum
  );

  // Draw arcs
  let startAngle = -Math.PI / 2;
  for (let i = 0; i < phases.length; i++) {
    const p = phases[i];
    const sweep = sweeps[i];
    if (sweep <= 0) continue;
    drawDonutSlice(doc, cx, cy, rInner, rOuter, startAngle, startAngle + sweep, p.color);
    startAngle += sweep;
  }

  // Center label — total (uses raw total so it matches the executive summary)
  fontBold();
  doc.fillColor(COLORS.text).fontSize(11)
    .text("Total", cx - 40, cy - 12, { width: 80, align: "center", lineBreak: false });
  fontBold();
  doc.fillColor(COLORS.brandDark).fontSize(10)
    .text(`${formatNumber(rawTotal, 2)}`, cx - 40, cy + 1,
      { width: 80, align: "center", lineBreak: false });
  fontRegular();
  doc.fillColor(COLORS.lightText).fontSize(7)
    .text("kg CO2e", cx - 40, cy + 14,
      { width: 80, align: "center", lineBreak: false });

  // Legend on right — show raw kg + % computed against raw total so negative
  // values (e.g. recycling credits) are visible to the reader.
  let ly = chartTop + 14;
  const legendX = PAGE_MARGIN + 200;
  for (const p of phases) {
    doc.rect(legendX, ly + 3, 11, 11).fill(p.color);
    fontBold();
    doc.fillColor(COLORS.text).fontSize(10)
      .text(p.label, legendX + 18, ly + 1,
        { lineBreak: false, width: 100, ellipsis: true });
    fontRegular();
    const pct = (p.rawValue / rawTotal) * 100;
    doc.fillColor(COLORS.lightText).fontSize(9)
      .text(`${formatNumber(p.rawValue, 3)} kg CO2e  (${formatNumber(pct, 1)}%)`,
        legendX + 18, ly + 14,
        { lineBreak: false, width: contentWidth - 200, ellipsis: true });
    ly += 30;
  }

  doc.y = Math.max(chartTop + 200, ly + 6);
}

function drawDonutSlice(
  doc: PDFKit.PDFDocument,
  cx: number, cy: number,
  rInner: number, rOuter: number,
  startAngle: number, endAngle: number,
  color: string
) {
  // Outer arc start point
  const x1 = cx + rOuter * Math.cos(startAngle);
  const y1 = cy + rOuter * Math.sin(startAngle);
  const x2 = cx + rOuter * Math.cos(endAngle);
  const y2 = cy + rOuter * Math.sin(endAngle);
  // Inner arc points
  const x3 = cx + rInner * Math.cos(endAngle);
  const y3 = cy + rInner * Math.sin(endAngle);
  const x4 = cx + rInner * Math.cos(startAngle);
  const y4 = cy + rInner * Math.sin(startAngle);

  const sweep = endAngle - startAngle;
  const largeArc = sweep > Math.PI ? 1 : 0;

  // SVG path for donut slice. Flag 1=large arc, 1=clockwise
  const path =
    `M ${x1} ${y1} ` +
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2} ${y2} ` +
    `L ${x3} ${y3} ` +
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x4} ${y4} ` +
    `Z`;

  doc.path(path).fill(color);
}

function drawTopComponentsBarChart(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  fontBold();
  doc.fillColor(COLORS.text).fontSize(11)
    .text("Top Components by CO2e Contribution", PAGE_MARGIN, doc.y);
  doc.y += 8;

  const sorted = [...input.components]
    .sort((a, b) => b.totalCo2e - a.totalCo2e)
    .slice(0, 8);

  if (sorted.length === 0) {
    fontRegular();
    doc.fillColor(COLORS.lightText).fontSize(9)
      .text("No component data available.", PAGE_MARGIN, doc.y);
    doc.y += 16;
    return;
  }

  const max = sorted[0].totalCo2e || 1;
  const labelW = 160;
  const valueW = 90;
  const barAreaX = PAGE_MARGIN + labelW + 4;
  const barAreaW = contentWidth - labelW - valueW - 8;
  const rowHeight = 22;
  const top = doc.y;

  sorted.forEach((c, idx) => {
    const y = top + idx * rowHeight;
    // Label
    fontRegular();
    doc.fillColor(COLORS.text).fontSize(9)
      .text(sanitizeText(c.componentName), PAGE_MARGIN, y + 6,
        { width: labelW - 6, lineBreak: false, ellipsis: true });

    // Bar background
    doc.rect(barAreaX, y + 4, barAreaW, 14)
      .fill(COLORS.tableAltRow);
    // Bar fill
    const fillW = Math.max(2, (c.totalCo2e / max) * barAreaW);
    doc.rect(barAreaX, y + 4, fillW, 14)
      .fill(COLORS.chart[1]);

    // Value
    fontBold();
    doc.fillColor(COLORS.text).fontSize(9)
      .text(`${formatNumber(c.totalCo2e, 3)} kg`,
        barAreaX + barAreaW + 4, y + 6,
        { width: valueW, lineBreak: false, align: "right" });
  });

  doc.y = top + sorted.length * rowHeight + 6;
}

function drawComponentEmissionsTable(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  fontRegular();
  doc.fillColor(COLORS.text).fontSize(10)
    .text("Per-component emissions split by lifecycle phase. Values in kg CO2e per unit.",
      PAGE_MARGIN, doc.y, { width: contentWidth });
  doc.y += 10;

  const cols = ["Component", "Material", "Production", "Packaging", "Logistics", "Waste", "Total"];
  const rows = [...input.components]
    .sort((a, b) => b.totalCo2e - a.totalCo2e)
    .map(c => [
      c.componentName,
      formatNumber(c.material, 3),
      formatNumber(c.production, 3),
      formatNumber(c.packaging, 3),
      formatNumber(c.logistic, 3),
      formatNumber(c.waste, 3),
      formatNumber(c.totalCo2e, 3),
    ]);
  drawTable(doc, cols, rows, contentWidth, pageHeight, fontRegular, fontBold);
}

function drawMethodology(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  const lines: Array<[string, string]> = [
    ["Standard followed", input.methodology.standard],
    ["GWP characterization set", input.gwpSet],
    ["Functional unit", input.functionalUnit],
    ["System boundary", input.systemBoundary],
    ["Allocation method", input.methodology.allocationMethod],
    ["Cut-off criteria", input.methodology.cutoffCriteria],
  ];
  drawKeyValueGrid(doc, lines, contentWidth, fontRegular, fontBold);
}

function drawDataSources(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  const lines: Array<[string, string]> = [
    ["Primary data", input.dataSources.primary],
    ["Secondary database", input.dataSources.secondary],
    ["Background emission factors", input.dataSources.backgroundEf],
  ];
  drawKeyValueGrid(doc, lines, contentWidth, fontRegular, fontBold);
}

function drawSupplierAppendix(
  doc: PDFKit.PDFDocument,
  input: PcfReportInput,
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void,
  fontItalic: () => void
) {
  for (let idx = 0; idx < input.supplierAppendix.length; idx++) {
    const sup = input.supplierAppendix[idx];

    if (idx > 0) {
      ensureSpace(doc, pageHeight, 100);
      doc.y += 10;
    }

    // Supplier sub-header
    const top = doc.y;
    doc.rect(PAGE_MARGIN, top, contentWidth, 22)
      .fill(COLORS.brandDark);
    fontBold();
    doc.fillColor(COLORS.white).fontSize(11)
      .text(`A.${idx + 1}  ${sanitizeText(sup.supplierName)}`,
        PAGE_MARGIN + 10, top + 6,
        { lineBreak: false, width: contentWidth - 20, ellipsis: true });
    doc.y = top + 30;

    // Components supplied
    fontItalic();
    doc.fillColor(COLORS.lightText).fontSize(9)
      .text(`Components supplied: ${sup.componentsSupplied.join(", ") || "—"}`,
        PAGE_MARGIN, doc.y, { width: contentWidth });
    doc.y += 14;

    // Sections
    for (const sec of sup.responses) {
      ensureSpace(doc, pageHeight, 60);
      fontBold();
      doc.fillColor(COLORS.text).fontSize(10)
        .text(sanitizeText(sec.section), PAGE_MARGIN, doc.y, { width: contentWidth });
      doc.y += 6;

      const cols = ["Question", "Response"];
      const rows = sec.items.map(it => [it.label, it.value || "—"]);
      drawTable(doc, cols, rows, contentWidth, pageHeight, fontRegular, fontBold,
        [contentWidth * 0.55, contentWidth * 0.45]);
      doc.y += 8;
    }
  }
}

// ============================================================
// SHARED COMPONENTS
// ============================================================
function drawKeyValueGrid(
  doc: PDFKit.PDFDocument,
  rows: Array<[string, string]>,
  contentWidth: number,
  fontRegular: () => void,
  fontBold: () => void
) {
  const labelW = contentWidth * 0.32;
  const valueW = contentWidth * 0.68;
  const cellPadding = 7;
  const pageHeight = doc.page.height;

  for (const [label, value] of rows) {
    const labelText = sanitizeText(label);
    const valueText = sanitizeText(value || "—");

    fontBold();
    doc.fontSize(9);
    const labelHeight = doc.heightOfString(labelText, { width: labelW - cellPadding * 2 });
    fontRegular();
    doc.fontSize(9);
    const valueHeight = doc.heightOfString(valueText, { width: valueW - cellPadding * 2 });
    const rowHeight = Math.max(labelHeight, valueHeight, 16) + cellPadding * 2;

    // Per-row page break: if this row would overflow, push the entire row to
    // a new page so label and value never split.
    if (doc.y + rowHeight > pageHeight - FOOTER_HEIGHT - 10) {
      doc.addPage();
    }

    const top = doc.y;
    doc.rect(PAGE_MARGIN, top, labelW, rowHeight)
      .fillAndStroke(COLORS.tableAltRow, COLORS.border);
    doc.rect(PAGE_MARGIN + labelW, top, valueW, rowHeight)
      .fillAndStroke(COLORS.white, COLORS.border);

    fontBold();
    doc.fillColor(COLORS.text).fontSize(9)
      .text(labelText, PAGE_MARGIN + cellPadding, top + (rowHeight - labelHeight) / 2,
        { width: labelW - cellPadding * 2 });
    fontRegular();
    doc.fillColor(COLORS.text).fontSize(9)
      .text(valueText, PAGE_MARGIN + labelW + cellPadding, top + (rowHeight - valueHeight) / 2,
        { width: valueW - cellPadding * 2, align: "left" });

    doc.y = top + rowHeight;
  }
}

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: string[],
  rows: string[][],
  contentWidth: number,
  pageHeight: number,
  fontRegular: () => void,
  fontBold: () => void,
  customColWidths?: number[]
) {
  if (columns.length === 0) return;
  const colWidths = customColWidths && customColWidths.length === columns.length
    ? customColWidths
    : columns.map(() => contentWidth / columns.length);
  const xOffsets = colWidths.reduce<number[]>((acc, w, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + colWidths[i - 1]);
    return acc;
  }, []);
  const cellPadding = 5;

  fontBold();
  doc.fontSize(8);
  const colHeights = columns.map((c, i) =>
    doc.heightOfString(c, { width: colWidths[i] - cellPadding * 2 })
  );
  const headerHeight = Math.max(...colHeights) + cellPadding * 2;

  let y = doc.y;
  if (y + headerHeight > pageHeight - FOOTER_HEIGHT - 30) {
    doc.addPage();
    y = doc.y;
  }

  const drawHeader = (startY: number) => {
    doc.rect(PAGE_MARGIN, startY, contentWidth, headerHeight)
      .fill(COLORS.tableHeaderBg);
    doc.strokeColor(COLORS.white).lineWidth(0.8);
    for (let i = 1; i < columns.length; i++) {
      doc.moveTo(PAGE_MARGIN + xOffsets[i], startY)
        .lineTo(PAGE_MARGIN + xOffsets[i], startY + headerHeight).stroke();
    }
    fontBold();
    columns.forEach((col, i) => {
      const textY = startY + (headerHeight - colHeights[i]) / 2;
      doc.fillColor(COLORS.white).fontSize(8)
        .text(col, PAGE_MARGIN + xOffsets[i] + cellPadding, textY,
          { width: colWidths[i] - cellPadding * 2, align: "left" });
    });
  };

  drawHeader(y);
  y += headerHeight;

  rows.forEach((row, rowIndex) => {
    fontRegular();
    doc.fontSize(8);
    const cellHeights = row.map((cell, i) =>
      doc.heightOfString(String(cell || "-"),
        { width: colWidths[i] - cellPadding * 2 })
    );
    const rowHeight = Math.max(...cellHeights, 12) + cellPadding * 2;

    if (y + rowHeight > pageHeight - FOOTER_HEIGHT - 30) {
      doc.addPage();
      y = doc.y;
      drawHeader(y);
      y += headerHeight;
    }

    const bgColor = rowIndex % 2 === 0 ? COLORS.white : COLORS.tableAltRow;
    doc.rect(PAGE_MARGIN, y, contentWidth, rowHeight).fill(bgColor);
    doc.strokeColor(COLORS.border).lineWidth(0.5)
      .rect(PAGE_MARGIN, y, contentWidth, rowHeight).stroke();
    for (let i = 1; i < columns.length; i++) {
      doc.moveTo(PAGE_MARGIN + xOffsets[i], y)
        .lineTo(PAGE_MARGIN + xOffsets[i], y + rowHeight).stroke();
    }

    fontRegular();
    row.forEach((cell, i) => {
      const cellText = String(cell || "-");
      const textY = y + (rowHeight - cellHeights[i]) / 2;
      doc.fillColor(COLORS.text).fontSize(8)
        .text(cellText, PAGE_MARGIN + xOffsets[i] + cellPadding, textY,
          { width: colWidths[i] - cellPadding * 2, align: "left" });
    });
    y += rowHeight;
  });

  doc.y = y;
}
