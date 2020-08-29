import * as React from 'react';
import { interval } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';
import { initBoardState, initExplodeMap } from './BoardInitializers';
import gState from './globalState';
import ioClient from './ioClient';
import { getColor } from './playerColors';

class Board extends React.Component<any, IBoardState> {

  /**
   * Board dimensions.
   */
  maxRowIndex = 8;
  maxColIndex = 6;

  /**
   * A matrix of when a cell should explode.
   */
  explodeAtMap = initExplodeMap(this.maxRowIndex, this.maxColIndex, 1, 2, 3);

  constructor(props: any) {
    super(props);

    this.state = {
      board: initBoardState(this.maxRowIndex, this.maxColIndex),
      fx: { x: -1, y: -1 },
      hasMadeFirstMove: false,
      isReacting: false,
      isRunning: false,
      isWaitingMoveResponse: false,
      roomInfo: undefined, /* ! DEPRECATED -- currently unused */
    };
  }

  componentDidMount = () => {

    /**
     * START_ROOM LISTENER
     * Set isRunning to true, and update roomInfo
     */
    ioClient.on('start_room', (args: IRoom) => {
      gState.roomInfo = args;
      this.setState({ isRunning: args.isRunning });
      console.log(`start_room ${JSON.stringify(args, null, 4)}`);
    });

    /**
     * BROADCAST_MOVE LISTENER
     * Update roomInfo (usually only currentNextTurn is changed)
     * If move is enemy's, it processes the move on this board.
     * If move is your own, remove board lock.
     */
    ioClient.on('broadcast_move', (args: IDoMoveResponse) => {
      const { roomInfo, playerInfo, x, y } = args;

      console.log(`broadcast_move ${JSON.stringify(args, null, 4)}`);

      gState.roomInfo = roomInfo;
      this.forceUpdate();

      /* Don't activateCell() if own move received. Just update roomInfo. */
      if (
        playerInfo.name === gState.playerInfo.name
        && playerInfo.idx === gState.playerInfo.idx
      ) {
        this.setState({ isWaitingMoveResponse: false });
        this.forceUpdate();
        return;
      }

      /* Process move on this board */
      this.activateCell(x, y, playerInfo.idx);
    });

    /**
     * BROADCAST_SKIP LISTENER
     * Updates roomInfo on who next turn is.
     */
    ioClient.on('broadcast_skip', (args: IDoMoveResponse) => {
      const { roomInfo, playerInfo } = args;

      console.log(`broadcast_skip ${JSON.stringify(args, null, 4)}`);

      gState.roomInfo = roomInfo;
      this.forceUpdate();
    });

    /**
     * DECLARE_WINNER LISTENER
     * Enable board lock and alert winner.
     */
    ioClient.on('declare_winner', (args: IWinCheckResponse) => {
      /* Don't continue if game was already done. */
      if (gState.roomInfo.isDone) { return; }

      const { roomInfo, playerInfo } = args;

      console.log(`declare_winner ${JSON.stringify(args, null, 4)}`);

      gState.roomInfo = roomInfo;
      this.forceUpdate();

      /* Leave socket room */
      const leaveArgs: ILeaveGameArgs = {
        roomId: gState.roomInfo.id
      };

      ioClient.emit('leave_game', leaveArgs);

      alert(`${playerInfo.name} (Player ${playerInfo.idx + 1}) has won! 🎉`);
    });
  };

  activateCell = (clickedX: number, clickedY: number, owner: number) => {
    /* Lock board when processing and animating. */
    this.setState({ isReacting: true });

    const oldOwner = this.state.board[clickedY][clickedX].owner;

    /**
     * Job queue for processing move and chain reactions.
     * Push activated coordinates into job queue as first job.
     */
    const jobQ: IJob[] = [];
    jobQ.push({ x: clickedX, y: clickedY, owner: oldOwner });

    /**
     * Emits a job every 70ms. Acts as a staggered loop.
     */
    const job$ = interval(70).pipe(
      takeWhile(() => jobQ.length !== 0),
      map(() => jobQ.shift() as IJob)
    );

    /**
     * Handle the jobs emitted from job$. Acts as loop body.
     */
    const onJob = (job: IJob) => {
      const { x, y } = job;

      this.state.board[y][x].owner = owner;
      this.state.fx.x = x;
      this.state.fx.y = y;

      if (this.state.board[y][x].count === this.explodeAtMap[y][x]) {
        this.state.board[y][x].count = 0;
        this.state.board[y][x].owner = -1;

        /* Left */
        if (x > 0) {
          jobQ.push({ owner: oldOwner, x: x - 1, y });
        }

        /* Up */
        if (y > 0) {
          jobQ.push({ owner: oldOwner, x, y: y - 1 });
        }

        /* Right */
        if (x < this.maxColIndex) {
          jobQ.push({ owner: oldOwner, x: x + 1, y });
        }

        /* Down */
        if (y < this.maxRowIndex) {
          jobQ.push({ owner: oldOwner, x, y: y + 1 });
        }
      } else {
        this.state.board[y][x].count++;
      }

      this.forceUpdate();
    };

    /**
     * When job queue is emptied, turn off running
     * effects and remove board lock.
     */
    const onComplete = () => {
      /**
       * Check after processing if player is dead.
       */
      /* @ts-ignore */
      const isDead = this.state.hasMadeFirstMove && this.state.board.flat()
        .every((cell: ICell) => (cell.owner !== gState.playerInfo.idx));

      /**
       * If player is dead, and it is player's turn, skip.
       */
      const isTurn = gState.roomInfo.currentPlayerTurn === gState.playerInfo.idx;
      if (isDead && isTurn) {
        ioClient.emit('skip_dead_player', {
          roomId: gState.roomInfo.id,
          playerInfo: gState.playerInfo,
        });
      }

      ioClient.emit('win_check', {
        roomId: gState.roomInfo.id,
      });

      this.state.fx.x = -1;
      this.state.fx.y = -1;
      this.setState({ isReacting: false });
    };

    /**
     * Start job queue loop
     */
    job$.subscribe({
      next: onJob,
      complete: onComplete,
    });
  };

  /**
   * Helper: Gives 'reacting' class name 
   * if this cell coords matches fx's.
   */
  getCellClass(x: number, y: number, x1: number, y1: number) {
    return (x === x1 && y === y1)
      ? 'reacting'
      : '';
  };

  /**
   * Helper: Checks if this cell is considered unstable.
   */
  isUnstable = (x: number, y: number, count: number) => {
    return this.explodeAtMap[y][x] === count;
  };

  getPlayerBg = (idx: number, isAlive: boolean) => {
    if (!isAlive) {
      return '#122';
    } else if (idx === gState.roomInfo.currentPlayerTurn) {
      return getColor(idx);
    } else {
      return getColor(-1);
    }
  };

  getCellStyle = (x: number, y: number, cell: ICell) => {
    const backgroundColor = getColor(cell.owner);

    const borderStyle = this.isUnstable(x, y, cell.count)
      ? 'dashed'
      : 'none';

    const boxShadow = this.isUnstable(x, y, cell.count)
      ? `0 0 17px ${getColor(cell.owner)}`
      : '';

    const color = (cell.count === 0)
      ? 'transparent'
      : '#FFF';

    return {
      backgroundColor,
      borderStyle,
      boxShadow,
      color
    };
  }

  isButtonDisabled = (cell: ICell) => (
    this.state.isReacting /* If animation is still playing */
    || !this.state.isRunning /* or if game hasn't started yet */
    || gState.roomInfo.isDone /* or if game is done */
    || this.state.isWaitingMoveResponse /* or if server hasn't processed move yet */
    || gState.roomInfo.currentPlayerTurn !== gState.playerInfo.idx /* or if it isn't your turn */
    || (cell.owner !== gState.playerInfo.idx && cell.owner !== -1) /* or if another player owns cell */
  );

  onCellClick = (x: number, y: number) => {
    this.setState({
      hasMadeFirstMove: true,
      isWaitingMoveResponse: true
    });

    ioClient.emit('do_move', {
      roomId: gState.roomInfo.id,
      playerInfo: gState.playerInfo,
      x: x,
      y: y,
    });

    this.activateCell(x, y, gState.playerInfo.idx)
  };

  render() {
    const { x: xFx, y: yFx } = this.state.fx;

    let playerList: JSX.Element;
    let cellGrid: JSX.Element[];

    if (gState.roomInfo.players !== undefined) {
      playerList = (
        <div className='player-list' >
          {
            gState.roomInfo.players.map((player: any, i: any) => (
              <span className='player-info'
                key={i}
                style={{
                  background: this.getPlayerBg(i, player.alive),
                  textDecoration: player.alive ? 'none' : 'line-through',
                }}
              >{player.name}</span>
            ))
          }
        </div>
      );
    }

    cellGrid = (
      this.state.board.map((row: ICell[], rowN: number) => (
        <div key={rowN}>
          {
            row.map((cell: ICell, colN: number) => (
              <button
                key={colN}
                style={this.getCellStyle(colN, rowN, cell)}
                disabled={this.isButtonDisabled(cell)}
                className={'cell ' + this.getCellClass(colN, rowN, xFx, yFx)}
                onClick={() => this.onCellClick(colN, rowN)}
              >
                {cell.count}
              </button>
            ))
          }
        </div>
      ))
    );

    return (
      <div
        style={{ opacity: gState.roomInfo.isDone ? '40%' : '100%' }}>
        {playerList}
        <div className="board" >
          <div className="board-content" >
            {cellGrid}
          </div>
        </div>
      </div>
    );
  }
}

export default Board;
