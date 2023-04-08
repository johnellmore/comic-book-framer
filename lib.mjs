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

  const separators = ['/', '|', '\\'];
  let row = '' + thisRowWidth.shift();
  for (const width of thisRowWidth) {
    const sep = pickRandom(separators);
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

export class ComicPage {

}