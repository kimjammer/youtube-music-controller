export class Endpoints {

	public static readonly VERSION = "/v1"

	public static readonly API = "/api" + Endpoints.VERSION

	public static readonly Dislike = Endpoints.API + "/dislike"

	public static readonly Like = Endpoints.API + "/like"

	public static readonly Next = Endpoints.API + "/next"

	public static readonly Previous = Endpoints.API + "/previous"

	public static readonly Repeat = Endpoints.API + "/switch-repeat"

	public static readonly Shuffle = Endpoints.API + "/shuffle"

	public static readonly TogglePlay = Endpoints.API + "/toggle-play"

	public static readonly Volume = Endpoints.API + "/volume"

	public static readonly ToggleMute = Endpoints.API + "/toggle-mute"

	public static readonly Song = Endpoints.API + "/song"
}