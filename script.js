function toggleTheme() {
    const themeLink = document.getElementById('theme-link');
    if (!themeLink) {
        console.error('Theme link element not found');
        return;
    }

    const currentTheme = themeLink.getAttribute('href');
    if (currentTheme.includes('light-theme.css')) {
        themeLink.setAttribute('href', 'dark-theme.css');
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        themeLink.setAttribute('href', 'light-theme.css');
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }

    updateThemeIcon();
}

function openTab(tabId) {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const selectedSection = document.getElementById(tabId);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        localStorage.setItem('activeTab', tabId);
    } else {
        console.error('Section not found:', tabId);
    }
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    if (!themeIcon) {
        console.error('Theme icon element not found');
        return;
    }

    if (document.body.classList.contains('dark')) {
        themeIcon.src = 'moon-icon.png';
        themeIcon.alt = 'Переключить на светлую тему';
    } else {
        themeIcon.src = 'sun-icon.png';
        themeIcon.alt = 'Переключить на темную тему';
    }
}

function updateTrackCount() {
    const trackList = document.getElementById('track-list');
    const trackCount = document.getElementById('track-count');
    if (!trackList || !trackCount) {
        console.error('Track list or count element not found');
        return;
    }

    trackCount.textContent = `Количество заказанных треков: ${trackList.children.length}`;
}

async function checkStreamStatus() {
    const streamStatus = document.getElementById('stream-status');
    if (!streamStatus) {
        console.error('Stream status element not found');
        return;
    }

    try {
        const response = await fetch('https://api.twitch.tv/helix/streams?user_login=geekfreak_', {
            headers: {
                'Client-ID': 'j51hx7542g7o8fmxvq6dz75jw6x1l9',
                'Authorization': 'Bearer 3gxnkm5pan1kag7t4lw4a7pkq98ntn'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            streamStatus.textContent = 'Сейчас можно заказывать треки';
        } else {
            streamStatus.textContent = 'Сейчас нельзя заказывать треки';
        }
    } catch (error) {
        console.error('Error checking stream status:', error);
        streamStatus.textContent = 'Ошибка при проверке статуса стрима';
    }
}

function addTrackToList(trackUrl) {
    if (!trackUrl) {
        console.error('Invalid track URL');
        return;
    }

    const trackList = document.getElementById('track-list');
    if (!trackList) {
        console.error('Track list element not found');
        return;
    }

    const trackItem = document.createElement('div');
    trackItem.className = 'track-item';
    trackItem.innerHTML = `
        <iframe width="560" height="315" src="${trackUrl}" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
        </iframe>`;
    trackList.appendChild(trackItem);
    updateTrackCount();
}

window.onload = function () {
    const themeLink = document.getElementById('theme-link');
    if (!themeLink) {
        console.error('Theme link element not found');
        return;
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        themeLink.setAttribute('href', 'dark-theme.css');
        document.body.classList.add('dark');
    }

    updateThemeIcon();

    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
        openTab(savedTab);
    } else {
        openTab('home');
    }

    checkStreamStatus();
};
