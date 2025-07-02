# zoi-chatty

This is a chat widget for Twitch that I made for [myself](https://twitch.tv/zoiteki).
I figured I would share it so people don't have to use StreamElements or other services.
I'm not particularly a great developer so it was half also just a project to work
on something.

This is a NodeJS project that creates a server locally that will listen for chat
events for a particular channel, and renders a dynamic HTML page.

Honestly while I kinda like this my HTML/CSS kinda sucks so if anyone wants to
help make it prettier, that'd be great thanks.

## Supported Features

- Supports Gigantified emotes
- Ability to pull profile pictures from Twitch for each user
- Pulls pronouns from <https://pronouns.alejo.io/> to add pronouns to users names
in the chat message
- Events from Subs, Raids, Cheers
- Deletes elements when Message Delete, Ban, Timeouts occur
- Supports Emote Providers FFZ, BTTV, 7tv

## Setup

- Requires NodeJS & NPM. [Install here](https://nodejs.org/en/download)

### Creating a Twitch Access Token (optional)

If you want a user's profile picture fetched to be included

Currently I use a Client ID & Access Token, I find it's the easiest way to authenticate
to Twitch. If you know how to generate an access, you don't need me to tell you,
but here's instructions on how to do so using the twitch CLI tool.

- [Install Twitch CLI tool](https://dev.twitch.tv/docs/cli/)
- [Create & Register a Twitch App to get a Client ID & Secret](https://dev.twitch.tv/docs/authentication/register-app/)
- [Configure Twitch CLI with the Client ID/Secret](https://dev.twitch.tv/docs/cli/configure-command/)
- [Generate an Access Token](https://dev.twitch.tv/docs/cli/token-command/)

You should treat the Secret & Access Token like passwords, don't share them.

Access tokens don't last forever, so you'll need to regenerate it every ~60 days or so.

### Setting up your .env file

You will need to configure zoi-talkie with a .env file. Create a file called `.env`
and place it in the root of the project. The only thing *required* is `TWITCH_CHANNEL`.

```env
TWITCH_CHANNEL=your_channel_here
TWITCH_CLIENT_ID=your_clientid_here
TWITCH_ACCESS_KEY=super_secret_access_key
```

See below for the full list of supported options

### Starting it

Open up your Terminal of choice and navigate to wherever you put it.

```sh
npm run start
```

#### Troubleshooting

##### `npm.ps1 cannot be loaded because running scripts is disabled on this system`

If you're on a Windows System you might see this, you will need to set the execution policy to to RemoteSigned or higher.

`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

##### `The term 'npm' is not recognized as the name of a cmdlet, function, script file, or operable program.`

You don't have npm installed, or it is not in your PATH environment variable. [Install Node & npm](#setup) again, and if you have, be sure to relaunch your shell window of choice.

## .env Variables

| Name | Default | Description |
| ---  | --- | --- |
| `TWITCH_CHANNEL` |  | The twitch channel to connect to. This is required. It's the whole point |
| `TWITCH_CLIENT_ID` |  | (optional) Client ID used for Twitch API Auth. See [Creating a Twitch access Token](#creating-a-twitch-access-token-optional) for more info. Used for fetching Twitch Profile pictures. |
| `TWITCH_ACCESS_KEY` |  | (optional) Access Key to be used for Twitch API Auth, used with `TWITCH_CLIENT_ID` |
| `FETCH_PRONOUNS` | `false` | (optional) Flag to fetch pronouns from <https://pronouns.alejo.io/> |
| `ALLOWED_HTML_TAGS_LIST` | `""` | (optional) Comma separated list for what HTML tags to allowed. Really you shouldn't use this unless you already know what you're doing as it opens up attack vectors but I wanted to have some fun by allowing silly tags in chat. e.g. `ALLOWED_HTML_TAGS_LIST="b, i"` |
| `EMOTE_PROVIDERS_LIST` | `""` | (optional) Comma-separated string of emote providers to use. Supports FFZ, BTTV, 7TV. You can pull global emotes and channel specific emotes separately. Supported values are `ffz`, `ffzChannel`, `bttv`, `bttvChannel`, `7tv`, `7tvChannel`. e.g. `EMOTE_PROVIDERS_LIST="ffz, ffzChannel, bttv"` |
| `DEBUG` | `false` | (optional) Run in debug mode. Generates extra logs in the console. |
| `DEFAULT_PROFILE_PICTURE` | `` | (optional) Sets a default pfp. Used if the twitch API call blows up or if you're not setting the twitch API keys. By default it's a transparent image |
