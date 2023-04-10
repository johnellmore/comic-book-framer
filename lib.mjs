const PAGE_INNER_MARGIN = 0.03; // as percentage of page width
const PAGE_OUTER_MARGIN = 0.08; // as percentage of page width
const STROKE_COLOR = 'black'; // CSS color
const STROKE_WIDTH = 0.005; // percentage of page width
const SEPARATORS = ['/', '|', '\\', '>', '<'];

export function generateRandomBook(numPages) {
  const pages = range(numPages).map(p => {
    const rows = range(3).map(generateRandomPageRow);
    return rows.join("\n");
  });
  return pages.join("\n\n");
}

function generateRandomPageRow() {
  const rowWidths = [
    [1],
    [1, 1],
    [1, 2],
    [2, 1],
    [1, 1, 1],
  ];
  const thisRowWidth = pickRandom(rowWidths);

  let row = '' + thisRowWidth.shift();
  for (const width of thisRowWidth) {
    const sep = pickRandom(SEPARATORS);
    row += sep + width;
  }
  return row;
}

function range(num) {
  return [...Array(num).keys()];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

class Page {
  constructor(rows, innerMargin, outerMargin) {
    this.rows = rows;
    this.innerMargin = innerMargin;
    this.outerMargin = outerMargin;
  }
}

class PageRow {
  constructor(panels) {
    this.panels = panels;
  }

  get totalWidth() {
    return this.panels.reduce((sum, panel) => sum + panel.width, 0);
  }
}

class Panel {
  constructor(width, leftBorderType, rightBorderType) {
    if (typeof width !== 'number') {
      throw new Error('width is not a number');
    }
    this.width = width;
    this.leftBorderType = leftBorderType;
    this.rightBorderType = rightBorderType;
  }
}

export class BookPrinterSingle {
  constructor(widthInches, heightInches) {
    this.widthInches = widthInches;
    this.heightInches = heightInches;
  }

  renderPreview(ast) {
    const dpi = 30;
    return ast.map((page) => {
      const pageFrames = pageToFrames(page, this.#pagePxSize(dpi));
      const canvas = makeCanvas(...this.#pagePxSize(dpi))
      renderFramesToCanvas(canvas, pageFrames, this.#pagePxSize(dpi)[0]);
      return canvas;
    });
  }

  async renderPrintable(ast) {
    const doc = await PDFLib.PDFDocument.create();
    ast.forEach((page) => {
      const docPage = doc.addPage(this.#pagePxSize(72));
      const pageFrames = pageToFrames(page, this.#pagePxSize(72));
      renderFramesToPdf(docPage, pageFrames, this.widthInches);
    });
    return doc;
  }

  #pagePxSize(dpi) {
    return [this.widthInches * dpi, this.heightInches * dpi];
  }
}

export function parseTemplate(tmpl) {
  return tmpl.split("\n\n").map(
    pageTmpl => new Page(pageTmpl.split("\n").map(
      rowTmpl => {
        const chars = (rowTmpl + '|').split('');
        let lastBorderType = '|';
        let lastPanelWidth = null;
        const panels = [];
        for (const ch of chars) {
          if (!isNaN(+ch)) { // if is numeric
            lastPanelWidth = +ch;
          } else if (SEPARATORS.includes(ch)) {
            panels.push(new Panel(lastPanelWidth, lastBorderType, ch));
            lastPanelWidth = null;
            lastBorderType = ch;
          } else {
            console.log(rowTmpl);
            console.log(ch);
            throw new Error('Parse error');
          }
        }
        return new PageRow(panels);
      }),
      PAGE_INNER_MARGIN,
      PAGE_OUTER_MARGIN
    ));
}

export function pageToFrames(page, pageSizeWH) {
  const [wPx, hPx] = pageSizeWH;
  const outerMarginPx = page.outerMargin * wPx;
  const innerMarginPx = page.innerMargin * wPx;
  const offsetXPx = outerMarginPx;
  const panelHeight = (hPx - (2 * outerMarginPx) - ((page.rows.length - 1) * innerMarginPx)) / page.rows.length;
  const frames = page.rows.flatMap((row, i) => {
    const offsetYPx = outerMarginPx + (i * (panelHeight + innerMarginPx));
    const availablePanelWidth = wPx - (2 * outerMarginPx) - ((row.panels.length - 1) * innerMarginPx);
    let rowOffsetXPx = offsetXPx;
    const rowFrames = row.panels.map(panel => {
      const [x, y] = [rowOffsetXPx, offsetYPx];
      const panelWidth = availablePanelWidth / row.totalWidth * panel.width;
      const leftEdge = new Edger(x, y, y + panelHeight, innerMarginPx);
      const rightEdge = new Edger(x + panelWidth, y, y + panelHeight, innerMarginPx);
      const frame = [
        ...(leftEdge.for(panel.leftBorderType)),
        ...(rightEdge.for(panel.rightBorderType).reverse()),
      ];
      rowOffsetXPx += panelWidth + innerMarginPx;
      return frame;
    });
    return rowFrames;
  });
  return frames;
}

class Edger {
  constructor(x, yMin, yMax, gutter) {
    this.x = x;
    this.yMin = yMin;
    this.yMax = yMax;
    this.gutter = gutter;
  }

  for(char) {
    if (char === '|') {
      return this.straight();
    } else if (char === '/') {
      return this.forwardDiag();
    } else if (char === '\\') {
      return this.backwardDiag();
    } else if (char === '>') {
      return this.rightAngle();
    } else if (char === '<') {
      return this.leftAngle();
    }
    throw new Error('Invalid separator type');
  }

  straight() {
    return [
      [this.x, this.yMin],
      [this.x, this.yMax],
    ];
  }

  forwardDiag() {
    return [
      [this.x + this.gutter, this.yMin],
      [this.x - this.gutter, this.yMax],
    ];
  }

  backwardDiag() {
    return [
      [this.x - this.gutter, this.yMin],
      [this.x + this.gutter, this.yMax],
    ];
  }

  rightAngle() {
    return [
      [this.x - this.gutter / 2, this.yMin],
      [this.x + this.gutter / 2, (this.yMax - this.yMin) / 2 + this.yMin],
      [this.x - this.gutter / 2, this.yMax],
    ];
  }

  leftAngle() {
    return [
      [this.x + this.gutter / 2, this.yMin],
      [this.x - this.gutter / 2, (this.yMax - this.yMin) / 2 + this.yMin],
      [this.x + this.gutter / 2, this.yMax],
    ];
  }
}

function makeCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv;
}

export function renderFramesToCanvas(canvas, polygons, wPx) {
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = STROKE_COLOR;
  ctx.lineWidth = STROKE_WIDTH * wPx;
  polygons.forEach(points => {
    ctx.beginPath();
    const start = points.shift();
    ctx.moveTo(...start);
    points.forEach(p => ctx.lineTo(...p));
    ctx.closePath();
    ctx.stroke();
  });
}

export function renderFramesToPdf(page, polygons, wIn) {
  let svgCommands = [];
  polygons.forEach(points => {
    const start = points.shift();
    svgCommands.push(`M ${start[0]},${start[1]}`);
    points.forEach(p => svgCommands.push(`L ${p[0]},${p[1]}`));
    svgCommands.push(`Z`);
  });
  const svgPath = svgCommands.join(' ');
  page.drawSvgPath(svgPath, {
    x: 0,
    y: page.getSize().height,
    borderWidth: STROKE_WIDTH * (wIn * 72),
  });
}
