const express = require('express');
const tmi = require('tmi.js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Load configuration from config.json
let config;
try {
    const configData = fs.readFileSync('config.json');
    config = JSON.parse(configData);
    console.log('Configuration loaded from config.json');
} catch (error) {
    console.error('Error reading config.json:', error);
    process.exit(1);
}

// Array to store requested tracks
let trackList = [];

// Endpoint to get track list
app.get('/tracks', (req, res) => {
    console.log('GET /tracks called');
    res.json(trackList);
});

// Twitch bot configuration
const twitchClient = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true,
    },
    identity: {
        username: config.twitch.bot_username,
        password: config.twitch.oauth_token,
    },
    channels: [config.twitch.channel],
});

(async () => {
    try {
        await twitchClient.connect();
        console.log('Connected to Twitch channel');
    } catch (err) {
        console.error('Error connecting to Twitch:', err);
    }
})();

// Event listener for chat messages
twitchClient.on('message', async (channel, tags, message, self) => {
    if (self) return;

    console.log(`Received message: ${message} from @${tags.username}`);

    // Command to request a song
    if (message.startsWith('!sr ')) {
        console.log('Processing song request command');
        const parts = message.split(' ');
        if (parts.length > 1) {
            const trackUrl = parts[1];
            if (trackUrl.includes('youtube.com')) {
                trackList.push({ url: trackUrl, user: tags.username });
                console.log(`Track added: ${trackUrl} by ${tags.username}`);

                fs.writeFile('tracklist.json', JSON.stringify(trackList, null, 2), (error) => {
                    if (error) {
                        console.error('Error saving track list:', error);
                    } else {
                        console.log('Track list saved to tracklist.json');
                    }
                });

                try {
                    await twitchClient.say(channel, `Трек от @${tags.username} добавлен в очередь: ${trackUrl}`);
                    console.log(`Notification sent to channel: ${channel}`);
                } catch (err) {
                    console.error('Error sending message to channel:', err);
                }
            } else {
                console.log('Invalid YouTube link provided');
                try {
                    await twitchClient.say(channel, `@${tags.username}, пожалуйста, предоставьте правильную ссылку на YouTube.`);
                } catch (err) {
                    console.error('Error sending invalid link message to channel:', err);
                }
            }
        } else {
            console.log('Song request command missing URL');
        }
    }

    // Command to announce the current song
    if (message.startsWith('!song')) {
        console.log('Processing current song command');
        if (trackList.length > 0) {
            const currentTrack = trackList[0];
            try {
                await twitchClient.say(channel, `Сейчас играет трек от @${currentTrack.user}: ${currentTrack.url}`);
                console.log(`Current track announcement sent to channel: ${channel}`);
            } catch (err) {
                console.error('Error sending current track announcement:', err);
            }
        } else {
            console.log('No tracks in the queue');
            try {
                await twitchClient.say(channel, 'Сейчас нет заказанных треков.');
                console.log(`No track message sent to channel: ${channel}`);
            } catch (err) {
                console.error('Error sending no track message:', err);
            }
        }
    }
});

// Load track list from file if it exists
if (fs.existsSync('tracklist.json')) {
    try {
        trackList = JSON.parse(fs.readFileSync('tracklist.json'));
        console.log('Track list loaded from tracklist.json');
    } catch (error) {
        console.error('Error reading tracklist.json:', error);
        trackList = [];
    }
} else {
    console.log('No existing tracklist.json found, starting with an empty track list');
}

// Start Express server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
