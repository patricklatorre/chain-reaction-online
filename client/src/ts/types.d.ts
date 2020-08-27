/**
 * Global State
 */
interface IGlobalState {
  roomInfo: IRoom,
  playerInfo: IPlayerInfo,
}

/**
 * UI Types
 */
interface ICell {
  count: number;
  owner: number;
}

interface IBoardState {
  board: ICell[][];
  fx: ICoor;
  hasMadeFirstMove: boolean;
  isReacting: boolean;
  isRunning: boolean;
  isWaitingMoveResponse: boolean;
  roomInfo: undefined | IRoom;
}

interface ICoor {
  x: number;
  y: number;
}

interface IJob extends ICoor {
  owner: number;
}

/**
 * Server resources
 */
interface IPlayerInfo {
  name: string | null;
  idx: number | null | undefined;
}

interface IPlayerStatus {
  name: string;
  alive: boolean;
}

interface IRoom {
  id: string;
  players: IPlayerStatus[];
  playerCount: number;
  isRunning: boolean;
  isDone: boolean;
  currentPlayerTurn: number;
}


/**
 * Server args
 */
interface ICreateRoomArgs {
  playerName: string;
  playerCount: number;
}

interface ILeaveRoomArgs {
  roomId: string;
}

interface ILeaveGameArgs {
  roomId: string;
}

interface IJoinRoomArgs {
  roomId: string;
  playerName: string;
}

interface IDoMoveArgs {
  roomId: string;
  playerInfo: IPlayerInfo;
  x: number;
  y: number;
}

interface ISkipDeadPlayerArgs {
  roomId: string;
  playerInfo: IPlayerInfo;
}

interface IWinCheckArgs {
  roomId: string;
}

/**
 * Server responses
 */
interface ICreateRoomResponse {
  playerName: string;
  playerCount: number;
}

interface ILeaveGameResponse {
  roomId: string;
}

interface IJoinRoomResponse {
  roomInfo: IRoom;
  playerInfo: IPlayerInfo;
}

interface IDoMoveResponse {
  roomInfo: IRoom;
  playerInfo: IPlayerInfo;
  x: number;
  y: number;
}

interface IWinCheckResponse {
  roomInfo: IRoom;
  playerInfo: IPlayerInfo;
}