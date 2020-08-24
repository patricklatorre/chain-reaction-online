export function initBoardState(maxRowIndex: number, maxColIndex: number) {
  const board: ICell[][] = [];
  const cellPrototype: ICell = { count: 0, owner: -1 };

  for (let i = 0; i <= maxRowIndex; i++) {
    const row: ICell[] = [];

    for (let j = 0; j <= maxColIndex; j++) {
      row.push({ ...cellPrototype });
    }

    board.push(row);
  }

  return board;
}

export function initExplodeMap(
  maxRowIndex: number,
  maxColIndex: number,
  corner: number,
  edge: number,
  middle: number
) {
  const map: number[][] = [];
  const endRows = [];
  const middleRows = [];

  for (let i = 0; i <= maxColIndex; i++) {
    if (i === 0 || i === maxColIndex) {
      endRows.push(corner);
      middleRows.push(edge);
    } else {
      endRows.push(edge);
      middleRows.push(middle);
    }
  }

  for (let i = 0; i <= maxRowIndex; i++) {
    if (i === 0 || i === maxRowIndex) {
      map.push([...endRows]);
    } else {
      map.push([...middleRows]);
    }
  }

  return map;
}