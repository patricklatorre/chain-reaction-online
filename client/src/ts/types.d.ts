interface ICell {
  count: number;
  owner: number;
}

interface IBoardProps {
  width: number;
  height: number;
  playerCount: 1 | 2 | 3 | 4;
  myPlayerIdx: 0 | 1 | 2 | 3;
}

interface IBoardState {
  board: ICell[][];
  fx: ICoor;
  hasMadeFirstMove: boolean;
  isReacting: boolean;
  isRunning: boolean;
  isWaitingMoveResponse: boolean;
  roomInfo: undefined | IGameServerState;
}

interface IGameServerState {
  id: string;
  players: string[];
  playerCount: number;
  isRunning: boolean;
  isDone: boolean;
  currentPlayerTurn: number;
}

interface IPlayerInfo {
  name: string | null;
  idx: number | null | undefined;
}

interface IJoinRoomResponse {
  roomInfo: IGameServerState;
  playerInfo: IPlayerInfo;
}

interface IGlobalState {
  roomInfo: IGameServerState;
  playerInfo: IPlayerInfo;
}

interface ICoor {
  x: number;
  y: number;
}

interface IJob extends ICoor {
  owner: number;
}
