const express = require('express');
const tmi = require('tmi.js');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

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
        username: 'gikfik',
        password: 'oauth:42aaoj42otaa7mlmjom9k7l0xc18ee',
    },
    channels: ['geekfreak_'],
});

twitchClient.connect().then(() => {
    console.log('Connected to Twitch channel');
}).catch(err => {
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

            try {
                fs.writeFileSync('tracklist.json', JSON.stringify(trackList, null, 2));
                console.log('Track list saved to tracklist.json');
            } catch (error) {
                console.error('Error saving track list:', error);
            }

            twitchClient.say(channel, `Трек от @${tags.username} добавлен в очередь: ${trackUrl}`).then(() => {
                console.log(`Notification sent to channel: ${channel}`);
            }).catch(err => {
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
            twitchClient.say(channel, `Сейчас играет трек от @${currentTrack.user}: ${currentTrack.url}`).then(() => {
                console.log(`Current track announcement sent to channel: ${channel}`);
            }).catch(err => {
                console.error('Error sending current track announcement:', err);
            });
        } else {
            twitchClient.say(channel, 'Сейчас нет заказанных треков.').then(() => {
                console.log(`No track message sent to channel: ${channel}`);
            }).catch(err => {
                console.error('Error sending no track message:', err);
            });
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

// Example of integrating with HTML page
app.get('/', (req, res) => {
    console.log('GET / called, serving HTML page');
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Мой Музыкальный Сайт</title>
            <link id="theme-link" rel="stylesheet" href="light-theme.css">
            <script>
                function toggleTheme() {
                    console.log('Toggling theme');
                    const themeLink = document.getElementById('theme-link');
                    if (themeLink.getAttribute('href').includes('light-theme.css')) {
                        themeLink.setAttribute('href', 'dark-theme.css');
                        document.body.classList.add('dark');
                        console.log('Theme changed to dark');
                    } else {
                        themeLink.setAttribute('href', 'light-theme.css');
                        document.body.classList.remove('dark');
                        console.log('Theme changed to light');
                    }
                    updateThemeIcon();
                }

                function openTab(tabId) {
                    console.log(`Opening tab: ${tabId}`);
                    const sections = document.querySelectorAll('section');
                    sections.forEach(section => {
                        section.style.display = 'none';
                        console.log(`Hiding section: ${section.id}`);
                    });

                    const selectedSection = document.getElementById(tabId);
                    if (selectedSection) {
                        selectedSection.style.display = 'block';
                        console.log(`Showing section: ${tabId}`);
                    }
                }

                function updateThemeIcon() {
                    const themeIcon = document.getElementById('theme-icon');
                    if (document.body.classList.contains('dark')) {
                        themeIcon.src = 'moon-icon.png';
                        console.log('Theme icon set to moon');
                    } else {
                        themeIcon.src = 'sun-icon.png';
                        console.log('Theme icon set to sun');
                    }
                }

                window.onload = function() {
                    console.log('Page loaded');
                    openTab('home');
                    updateThemeIcon();
                    updateTrackList();
                    checkStreamStatus();
                };

                function updateTrackCount() {
                    const trackList = document.getElementById('track-list');
                    const trackCount = document.getElementById('track-count');
                    trackCount.textContent = `Количество заказанных треков: ${trackList.children.length}`;
                    console.log(`Track count updated: ${trackList.children.length}`);
                }

                async function updateTrackList() {
                    try {
                        console.log('Fetching track list from /tracks');
                        const response = await fetch('/tracks');
                        const tracks = await response.json();
                        const trackListContainer = document.getElementById('track-list');
                        trackListContainer.innerHTML = '';
                        tracks.forEach(track => {
                            const trackItem = document.createElement('div');
                            trackItem.className = 'track-item';
                            trackItem.innerHTML = `<iframe width="560" height="315" src="${track.url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                            trackListContainer.appendChild(trackItem);
                            console.log(`Track added to HTML: ${track.url}`);
                        });
                        updateTrackCount();
                    } catch (error) {
                        console.error('Error fetching track list:', error);
                    }
                }

                setInterval(updateTrackList, 30000);

                async function checkStreamStatus() {
                    try {
                        console.log('Checking stream status');
                        const response = await fetch('https://api.twitch.tv/helix/streams?user_login=geekfreak_', {
                            headers: {
                                'Client-ID': 'j51hx7542g7o8fmxvq6dz75jw6x1l9',
                                'Authorization': '3gxnkm5pan1kag7t4lw4a7pkq98ntn'
                            }
                        });
                        const data = await response.json();
                        const streamStatus = document.getElementById('stream-status');
                        if (data.data && data.data.length > 0) {
                            streamStatus.textContent = 'Сейчас можно заказывать треки';
                            console.log('Stream is live, tracks can be requested');
                        } else {
                            streamStatus.textContent = 'Сейчас нельзя заказывать треки';
                            console.log('Stream is not live, tracks cannot be requested');
                        }
                    } catch (error) {
                        console.error('Error checking stream status:', error);
                    }
                }
            </script>
        </head>
        <body>
            <header>
                <div class="logo">
                    <a href="#" onclick="openTab('home'); return false;">
                        <img src="your-logo.png" alt="Логотип" height="40">
                    </a>
                </div>
                <nav>
                    <ul>
                        <li><a onclick="openTab('home')">Главная</a></li>
                        <li><a onclick="openTab('extensions')">Расширения</a></li>
                        <li><a onclick="openTab('request-track')">Заказ трека</a></li>
                        <li><a onclick="openTab('rules')">Правила</a></li>
                    </ul>
                </nav>
                <button onclick="toggleTheme()" id="theme-toggle-btn" style="background: none; border: none; width: 40px; height: 40px; cursor: pointer;">
                    <img src="sun-icon.png" alt="Переключить тему" id="theme-icon" style="width: 100%; height: 100%;">
                </button>
            </header>

            <section id="home">
                <h1>Добро пожаловать на мой музыкальный сайт!</h1>
                <div class="social-links">
                    <a href="https://t.me/yourtelegram" target="_blank" rel="noopener noreferrer">Телеграм</a>
                    <a href="https://discord.com/yourdiscord" target="_blank" rel="noopener noreferrer">Дискорд</a>
                    <a href="https://www.youtube.com/youryoutube" target="_blank" rel="noopener noreferrer">Ютуб</a>
                </div>
            </section>

            <section id="request-track" style="text-align: center;">
                <div class="request-container" style="text-align: left; max-width: 800px; margin: 0 auto;">
                    <h2>Заказ трека</h2>
                    <p>Для заказа трека необходимо быть платным подписчиком Twitch канала.</p>
                    <p>Чтобы поставить трек, используйте команду <strong>!sr [ссылка на YouTube, без скобок]</strong> в чате <strong>geekfreak_</strong>.</p>
                    <p id="stream-status" style="font-weight: bold; margin-top: 20px; display: inline-block;">Сейчас нельзя заказывать треки</p>
                    <p id="track-count" style="font-weight: bold; margin-top: 20px; display: inline-block; margin-left: 20px;">Количество заказанных треков: 0</p>
                </div>
                <hr style="width: 100%; margin: 40px 0;">
                <div class="track-list-container" style="max-width: 800px; margin: 0 auto; text-align: left;">
                    <div id="track-list"></div>
                </div>
            </section>

            <footer>
                <p>Все права защищены &copy; 2024</p>
                <div class="footer-social-links">
                    <a href="https://t.me/yourtelegram" target="_blank" rel="noopener noreferrer">
                        <img src="telegram-icon.png" alt="Телеграм">Телеграм
                    </a>
                    <a href="https://discord.com/yourdiscord" target="_blank" rel="noopener noreferrer">
                        <img src="discord-icon.png" alt="Дискорд">Дискорд
                    </a>
                    <a href="https://www.youtube.com/youryoutube" target="_blank" rel="noopener noreferrer">
                        <img src="youtube-icon.png" alt="Ютуб">Ютуб
                    </a>
                </div>
            </footer>
        </body>
        </html>
    `);
});
