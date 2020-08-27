import * as React from 'react';

import Board from './Board';
import ioClient from './ioClient';
import gState from './globalState';
import endpoints from './endpoints';

class App extends React.Component<any, any> {

  componentDidMount = () => {

    /**
     * Ask for username ONCE. Accessible via gState.
     * If no username was inputted, name as "anonymous".
     */
    const username = prompt(`Enter a nickname`);
    gState.playerInfo.name = username ? username : `anonymous`;
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

      // ! FIXME roomInfo shouldn't take playerInfo
      gState.roomInfo = roomInfo;
      this.forceUpdate();

      if (
        playerInfo.name === gState.playerInfo.name
        && gState.playerInfo.idx === undefined
      ) {
        gState.playerInfo.idx = playerInfo.idx; // Adds idx to playerInfo
        this.forceUpdate();
      }

      console.log(`join_room ${JSON.stringify(gState.roomInfo, null, 4)}`);
    });

    /**
     * START_ROOM LISTENER
     * Removes board lock by enabling isRunning flag.
     */
    ioClient.on('start_room', (args: IGameServerState) => {
      gState.roomInfo = args;
      this.forceUpdate();
    });

    const splitUrl = window.location.href.split('/');
    const urlEnd = splitUrl[splitUrl.length - 1];
    console.log('urlend ' + urlEnd);
    if (
      urlEnd !== ''
      && !urlEnd.includes('.')
      && !urlEnd.includes(':')) {
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
    ioClient.emit('create_room', {
      playerName: name,
      playerCount: count,
    });

    /**
     * CREATE_ROOM LISTENER
     * Receive details about the newly created server and set
     * creator's idx to 0.
     */
    ioClient.once('create_room', (reRoomInfo: any) => {
      gState.roomInfo = reRoomInfo;
      gState.playerInfo.idx = 0;
      this.forceUpdate();
      console.log(`create_room ${JSON.stringify(gState.roomInfo, null, 4)}`);
    });
  };

  joinRoom = () => {
    /**
     * Prompt for the roomId to join
     */
    const roomId = prompt('Room ID');

    ioClient.emit('join_room', {
      roomId: roomId,
      playerName: gState.playerInfo.name,
    });
  };

  quickJoinRoom = (roomId: string) => {
    ioClient.emit('join_room', {
      roomId: roomId,
      playerName: gState.playerInfo.name,
    });
  };

  copyInviteLink = () => {
    const link = document.getElementById('invite-link')?.innerText;
    // @ts-ignore
    navigator.clipboard.writeText(link)
  };

  render() {
    let srvDetails = '';
    let menuBar;

    if (gState.roomInfo.id !== undefined) {
      srvDetails = `${endpoints.client}/${gState.roomInfo.id}`
    } else {
      menuBar = (
        <div className="menu-bar">
          <div className="menu-bar-start">
            <h2 className='title-header linear-wipe'>Chain Reaction</h2>
            <button className='menu-item' onClick={this.createRoom}>+ Create Game</button>
          </div>
        </div>
      );
    }

    return (
      <div>
        {menuBar}
        <div className='underbar'>
          <p className='underbar-item server-details'>
            {srvDetails === '' ? '' : 'Invite Link: '}
            <span
              id='invite-link'
              style={{ fontWeight: 'bold' }}
              onClick={this.copyInviteLink}
            >{srvDetails}</span>
          </p>
        </div>
        <Board />
      </div>
    );
  };
}

export default App;
