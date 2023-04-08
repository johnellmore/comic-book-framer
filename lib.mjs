const STROKE_COLOR = 'black'; // CSS color
const STROKE_WIDTH = 0.01; // percentage of page width
const SEPARATORS = ['/', '|', '\\'];

export function generateRandomBook(numPages) {
  const rowsPerPage = [2, 3];
  const pages = range(numPages).map(p => {
    const numRows = pickRandom(rowsPerPage);
    const rows = range(numRows).map(generateRandomPageRow);
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

export function parseTemplate(tmpl) {
  const PAGE_INNER_MARGIN = 0.05; // as percentage of page width
  const PAGE_OUTER_MARGIN = 0.1; // as percentage of page width
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
      const panelPt = (x, y) => [rowOffsetXPx + x, offsetYPx + y];
      const panelWidth = availablePanelWidth / row.totalWidth * panel.width;
      const frame = [
        panelPt(0, 0),
        panelPt(0, panelHeight),
        panelPt(panelWidth, panelHeight),
        panelPt(panelWidth, 0),
      ];
      rowOffsetXPx += panelWidth + innerMarginPx;
      return frame;
    });
    return rowFrames;
  });
  return frames;
}

export function renderPageFrames(polygons, pageSizeWH) {
  const [wPx, hPx] = pageSizeWH;

  const cv = document.createElement('canvas');
  cv.width = wPx;
  cv.height = hPx;
  const ctx = cv.getContext('2d');
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = STROKE_WIDTH * wPx;
  polygons.forEach(points => {
    ctx.beginPath();
    const start = points.shift();
    ctx.moveTo(...start);
    points.forEach(p => ctx.lineTo(...p));
    ctx.closePath();
    ctx.stroke();
  });

  return cv;
}
