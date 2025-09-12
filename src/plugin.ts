import streamDeck, { LogLevel } from "@elgato/streamdeck";

import {TogglePlay} from "./actions/toggle-play";
import {Next} from "./actions/next";
import {Previous} from "./actions/previous";
import {SongInfo} from "./actions/song-info";
import {Shuffle} from "./actions/shuffle";
import {ToggleMute} from "./actions/toggle-mute";
import {Repeat} from "./actions/repeat";
import {Like} from "./actions/like";
import {Dislike} from "./actions/dislike";
import {WsClient} from "./common/ws-client";
import {VolumeUp} from "./actions/volume-up";
import {VolumeDown} from "./actions/volume-down";

streamDeck.logger.setLevel(LogLevel.DEBUG);

let wsClient = new WsClient();

// Register actions
streamDeck.actions.registerAction(new Next());
streamDeck.actions.registerAction(new Previous());
streamDeck.actions.registerAction(new Like());
streamDeck.actions.registerAction(new Dislike());
streamDeck.actions.registerAction(new Shuffle(wsClient));
streamDeck.actions.registerAction(new Repeat(wsClient));
streamDeck.actions.registerAction(new SongInfo(wsClient));
streamDeck.actions.registerAction(new ToggleMute(wsClient));
streamDeck.actions.registerAction(new TogglePlay(wsClient));
streamDeck.actions.registerAction(new VolumeUp());
streamDeck.actions.registerAction(new VolumeDown());

// Connect to the Stream Deck.
await streamDeck.connect();

// Connect to WebSocket
await wsClient.connect();