import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { TogglePlay } from "./actions/toggle-play";
import {Next} from "./actions/next";
import {Previous} from "./actions/previous";
import {SongInfo} from "./actions/song-info";
import {Shuffle} from "./actions/shuffle";
import {ToggleMute} from "./actions/toggle-mute";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel(LogLevel.TRACE);

// Register actions
streamDeck.actions.registerAction(new Next());
streamDeck.actions.registerAction(new Previous());
streamDeck.actions.registerAction(new Shuffle());
streamDeck.actions.registerAction(new SongInfo());
streamDeck.actions.registerAction(new ToggleMute());
streamDeck.actions.registerAction(new TogglePlay());

// Finally, connect to the Stream Deck.
streamDeck.connect();
