import express, { Request, Response } from 'express';
import tmi from 'tmi.js';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const existsAsync = promisify(fs.exists);

const app = express();
const port = 3000;

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Array to store requested tracks
interface Track {
  url: string;
  user: string;
}
let trackList: Track[] = [];

// Endpoint to get track list
app.get('/tracks', (req: Request, res: Response) => {
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
    username: 'gikfik',
    password: 'oauth:YOUR_TWITCH_OAUTH_TOKEN',
  },
  channels: ['geekfreak_'],
});

twitchClient
  .connect()
  .then(() => {
    console.log('Connected to Twitch channel');
  })
  .catch((err) => {
    console.error('Error connecting to Twitch:', err);
  });

// Event listener for chat messages
twitchClient.on('message', (channel, tags, message, self) => {
  if (self) return;

  console.log(`Received message: ${message} from @${tags.username}`);

  // Command to request a song
  if (message.startsWith('!sr ')) {
    const trackUrl = message.split(' ')[1];
    if (trackUrl && trackUrl.includes('youtube.com')) {
      trackList.push({ url: trackUrl, user: tags.username });
      console.log(`Track added: ${trackUrl} by ${tags.username}`);

      writeFileAsync('tracklist.json', JSON.stringify(trackList, null, 2))
        .then(() => {
          console.log('Track list saved to tracklist.json');
        })
        .catch((error) => {
          console.error('Error saving track list:', error);
        });

      twitchClient
        .say(channel, `Трек от @${tags.username} добавлен в очередь: ${trackUrl}`)
        .then(() => {
          console.log(`Notification sent to channel: ${channel}`);
        })
        .catch((err) => {
          console.error('Error sending message to channel:', err);
        });
    } else {
      console.log('Invalid track URL or not a YouTube link');
    }
  }

  // Command to announce the current song
  if (message.startsWith('!song')) {
    if (trackList.length > 0) {
      const currentTrack = trackList[0];
      twitchClient
        .say(channel, `Сейчас играет трек от @${currentTrack.user}: ${currentTrack.url}`)
        .then(() => {
          console.log(`Current track announcement sent to channel: ${channel}`);
        })
        .catch((err) => {
          console.error('Error sending current track announcement:', err);
        });
    } else {
      twitchClient
        .say(channel, 'Сейчас нет заказанных треков.')
        .then(() => {
          console.log(`No track message sent to channel: ${channel}`);
        })
        .catch((err) => {
          console.error('Error sending no track message:', err);
        });
    }
  }
});

// Load track list from file if it exists
existsAsync('tracklist.json')
  .then((exists) => {
    if (exists) {
      return readFileAsync('tracklist.json', 'utf-8');
    } else {
      console.log('No existing tracklist.json found, starting with an empty track list');
      return null;
    }
  })
  .then((data) => {
    if (data) {
      trackList = JSON.parse(data);
      console.log('Track list loaded from tracklist.json');
    }
  })
  .catch((error) => {
    console.error('Error reading tracklist.json:', error);
  });

// Start Express server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Example of integrating with HTML page
app.get('/', (req: Request, res: Response) => {
  console.log('GET / called, serving HTML page');
  res.sendFile(path.join(__dirname, 'public/index.html'));
});
