function toggleTheme() {
    const themeLink = document.getElementById('theme-link');
    console.log('Current theme link:', themeLink.getAttribute('href'));
    if (themeLink.getAttribute('href').includes('light-theme.css')) {
        themeLink.setAttribute('href', 'dark-theme.css');
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        console.log('Theme changed to dark');
    } else {
        themeLink.setAttribute('href', 'light-theme.css');
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        console.log('Theme changed to light');
    }
    updateThemeIcon();
}

function openTab(tabId) {
    console.log('Opening tab:', tabId);
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = 'none';
        console.log('Hiding section:', section.id);
    });
    const selectedSection = document.getElementById(tabId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        localStorage.setItem('activeTab', tabId);
        console.log('Showing section:', tabId);
    } else {
        console.log('Section not found:', tabId);
    }
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    if (document.body.classList.contains('dark')) {
        themeIcon.src = 'moon-icon.png';
        console.log('Theme icon set to moon-icon.png');
    } else {
        themeIcon.src = 'sun-icon.png';
        console.log('Theme icon set to sun-icon.png');
    }
}

function updateTrackCount() {
    const trackList = document.getElementById('track-list');
    const trackCount = document.getElementById('track-count');
    trackCount.textContent = `Количество заказанных треков: ${trackList.children.length}`;
    console.log('Track count updated:', trackList.children.length);
}

async function checkStreamStatus() {
    try {
        console.log('Checking stream status...');
        const response = await fetch('https://api.twitch.tv/helix/streams?user_login=geekfreak_', {
            headers: {
                'Client-ID': 'j51hx7542g7o8fmxvq6dz75jw6x1l9',
                'Authorization': 'Bearer 3gxnkm5pan1kag7t4lw4a7pkq98ntn'
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

function addTrackToList(trackUrl) {
    console.log('Adding track to list:', trackUrl);
    const trackList = document.getElementById('track-list');
    const trackItem = document.createElement('div');
    trackItem.className = 'track-item';
    trackItem.innerHTML = `<iframe width="560" height="315" src="${trackUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    trackList.appendChild(trackItem);
    updateTrackCount();
    console.log('Track added to list');
}

window.onload = function() {
    console.log('Page loaded');
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.getElementById('theme-link').setAttribute('href', 'dark-theme.css');
        document.body.classList.add('dark');
        console.log('Dark theme applied from localStorage');
    }
    updateThemeIcon();

    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        openTab(savedTab);
        console.log('Active tab restored from localStorage:', savedTab);
    } else {
        openTab('home');
        console.log('Default tab opened: home');
    }

    checkStreamStatus();
};
