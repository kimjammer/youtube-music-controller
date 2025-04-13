import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { TogglePlay } from "./actions/toggle-play";
import {Next} from "./actions/next";
import {Previous} from "./actions/previous";
import {SongInfo} from "./actions/song-info";
import {Shuffle} from "./actions/shuffle";
import {ToggleMute} from "./actions/toggle-mute";

streamDeck.logger.setLevel(LogLevel.DEBUG);

// Register actions
streamDeck.actions.registerAction(new Next());
streamDeck.actions.registerAction(new Previous());
streamDeck.actions.registerAction(new Shuffle());
streamDeck.actions.registerAction(new SongInfo());
streamDeck.actions.registerAction(new ToggleMute());
streamDeck.actions.registerAction(new TogglePlay());

// Finally, connect to the Stream Deck.
await streamDeck.connect();
