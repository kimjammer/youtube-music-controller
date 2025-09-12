export enum MediaType {
	Audio = 'AUDIO',
	OriginalMusicVideo = 'ORIGINAL_MUSIC_VIDEO',
	UserGeneratedContent = 'USER_GENERATED_CONTENT',
	PodcastEpisode = 'PODCAST_EPISODE',
	OtherVideo = 'OTHER_VIDEO',
}

export type RepeatMode = 'NONE' | 'ONE' | 'ALL';

export interface SongInfo {
	title: string;
	alternativeTitle?: string;
	artist: string;
	artistUrl?: string;
	views: number;
	uploadDate?: string;
	imageSrc?: string | null;
	image?: any | null;
	isPaused?: boolean;
	songDuration: number;
	elapsedSeconds?: number;
	url?: string;
	album?: string | null;
	videoId: string;
	playlistId?: string;
	mediaType: MediaType;
	tags?: string[];
}

export enum DataTypes {
	PlayerInfo = 'PLAYER_INFO',
	VideoChanged = 'VIDEO_CHANGED',
	PlayerStateChanged = 'PLAYER_STATE_CHANGED',
	PositionChanged = 'POSITION_CHANGED',
	VolumeChanged = 'VOLUME_CHANGED',
	RepeatChanged = 'REPEAT_CHANGED',
	ShuffleChanged = 'SHUFFLE_CHANGED',
}

export interface PlayerInfoData {
	song: SongInfo;
	isPlaying: boolean,
	muted: boolean,
	position: number,
	volume: number,
	repeat: RepeatMode,
	shuffle: boolean,
}

export interface VideoChangedData {
	song: SongInfo;
	position: number;
}

export interface PlayerStateChangedData {
	isPlaying: boolean;
	position: number;
}

export interface PositionChangedData {
	position: number;
}

export interface VolumeChangedData {
	volume: number;
	muted: boolean;
}

export interface RepeatChangedData {
	repeat: RepeatMode;
}

export interface ShuffleChangedData {
	shuffle: boolean;
}