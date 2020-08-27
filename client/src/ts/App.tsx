import * as React from 'react';
import Board from './Board';
import endpoints from './endpoints';
import gState from './globalState';
import ioClient from './ioClient';


class App extends React.Component<any, any> {

  componentDidMount = () => {

    /**
     * Ask for username ONCE. Accessible via gState.
     * If no username was inputted, name as "anonymous".
     */
    const username = prompt(`Enter a nickname`);

    if (
      username === undefined
      || username === null
      || username.match(/^\s*$/)
    ) {
      gState.playerInfo.name = 'anonymous';
    } else {
      gState.playerInfo.name = username;
    }

    this.forceUpdate();

    /**
     * JOIN_ROOM LISTENER
     * Updates roomInfo and player's idx based on joined game.
     * If game doesn't exist, show msg to user.
     */
    ioClient.on('join_room', (joinResponse: IJoinRoomResponse) => {
      const { roomInfo, playerInfo } = joinResponse;

      if (roomInfo === null) {
        alert(`Sorry, can't join that game!`);
        return;
      }

      gState.roomInfo = roomInfo;
      this.forceUpdate();

      if (
        playerInfo.name === gState.playerInfo.name
        && gState.playerInfo.idx === undefined
      ) {
        gState.playerInfo.idx = playerInfo.idx;
        this.forceUpdate();
      }

      console.log(`join_room ${JSON.stringify(gState.roomInfo, null, 4)}`);
    });

    /**
     * START_ROOM LISTENER
     * Removes board lock by enabling isRunning flag.
     */
    ioClient.on('start_room', (args: IRoom) => {
      gState.roomInfo = args;
      this.forceUpdate();
    });

    const splitUrl = window.location.href.split('/');
    const urlEnd = splitUrl[splitUrl.length - 1];

    if (
      urlEnd !== ''
      && !urlEnd.includes('.')
      && !urlEnd.includes(':')
    ) {
      this.quickJoinRoom(urlEnd);
    }
  };

  createRoom = () => {
    const name = gState.playerInfo.name;
    const count = Number(prompt(`How many players are joining? (10 max.)`, `2`));
    gState.playerInfo.name = name;
    this.forceUpdate();

    /**
     * Send host's username and the expected # of players for the room.
     */
    const createArgs: ICreateRoomArgs = {
      playerName: name,
      playerCount: count,
    };

    ioClient.emit('create_room', createArgs);

    /**
     * CREATE_ROOM LISTENER
     * Receive details about the newly created server and set
     * creator's idx to 0.
     */
    ioClient.once('create_room', (newRoom: IRoom) => {
      gState.roomInfo = newRoom;
      gState.playerInfo.idx = 0;
      this.forceUpdate();
      console.log(`create_room ${JSON.stringify(gState.roomInfo, null, 4)}`);
    });
  };

  quickJoinRoom = (roomId: string) => {
    const joinArgs: IJoinRoomArgs = {
      roomId: roomId,
      playerName: gState.playerInfo.name,
    };

    ioClient.emit('join_room', joinArgs);
  };

  copyInviteLink = () => {
    const url = document.getElementById('invite-link')?.innerText;
    navigator.clipboard.writeText(url)
  };

  render() {
    let startScreen: JSX.Element;
    let inviteLink: JSX.Element;

    if (gState.roomInfo.id === undefined) {
      startScreen = (
        <div className="menu-bar">
          <div className="menu-bar-start">
            <div className="spinner">
              <div className="dot1"></div>
              <div className="dot2"></div>
            </div>
            <h2 className='title-header linear-wipe'>Chainpop</h2>
            <button className='menu-item' onClick={this.createRoom}>+ Create Game</button>
          </div>
        </div>
      );
    } else {
      inviteLink = (
        <p className='underbar-item server-details'>
          Invite Link:
          <span
            id='invite-link'
            style={{ fontWeight: 'bold' }}
            onClick={this.copyInviteLink}
          >{` ${endpoints.client}/${gState.roomInfo.id}`}</span>
        </p>
      );
    }

    return (
      <div>
        {startScreen}
        <div className='underbar'>{inviteLink}</div>
        {
          startScreen
            ? undefined
            : <Board />
        }
      </div>
    );
  };
}

export default App;
