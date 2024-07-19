let currentVideoId = '';
let currentVideoBookmarks = [];

//utils function
const getTimeInIsoString = time => {
  const date = new Date(0);
  date.setSeconds(time);
  return date.toISOString().substr(11, 8);
};

const jumpToTimestampInPlayer = timestamp => {
  const youtubePlayer = document.querySelector('.video-stream');
  youtubePlayer.currentTime = timestamp;
};

//styles
const injectStyles = () => {
  const style = document.createElement('style');
  style.textContent = `

    .add_bookmark:hover {
      scale: 1.1;
    }
    .add_bookmark:active {
      scale: 0.9;
    }
  `;
  document.head.append(style);
};

//////////////////// main code ////////////////////

// handling receiving messages
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
  const { event, videoId, value } = obj;

  if (event === 'NEW') {
    currentVideoId = videoId;
    youtubePageLoaded();
  } else if (event === 'JUMP') {
    jumpToTimestampInPlayer(value);
  }
});

// jump to timestamp function

// bookmark function
const addBookmark = async () => {
  try {
    const youtubePlayer = document.querySelector('.video-stream');

    const currentPlayerTime = youtubePlayer.currentTime;
    const previousBookmarks = await getAllBookmarks();

    const newBookmark = {
      time: currentPlayerTime,
      name: '',
      desc: getTimeInIsoString(currentPlayerTime),
    };

    currentVideoBookmarks = [newBookmark, ...previousBookmarks];

    chrome.storage.sync.set({
      [currentVideoId]: JSON.stringify(
        [...currentVideoBookmarks].sort((a, b) => a.time - b.time)
      ),
    });

    const bookmarksFromStorageAfterAdding = await getAllBookmarks();
    console.log(bookmarksFromStorageAfterAdding);
  } catch (error) {
    console.log(error.message);
  }
};

// get previous bookmarks
const getAllBookmarks = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([currentVideoId], obj =>
      resolve(obj[currentVideoId] ? JSON.parse(obj[currentVideoId]) : [])
    );
  });
};

//inject bookmark button element
const injectBookmarkElement = () => {
  const channelOwner = document.getElementById('owner');
  const buttonElement = document.createElement('button');
  buttonElement.title = 'Time stamped here';
  buttonElement.addEventListener('click', addBookmark);
  buttonElement.className = 'add_bookmark btn';
  buttonElement.style.backgroundColor = 'transparent';
  buttonElement.style.border = 'none';
  buttonElement.style.width = '48px';
  buttonElement.style.height = '48px';
  buttonElement.style.padding = '6px';
  buttonElement.style.borderRadius = '50%';
  buttonElement.style.display = 'flex';
  buttonElement.style.alignItems = 'center';
  buttonElement.style.justifyContent = 'center';
  buttonElement.style.cursor = 'pointer';
  injectStyles();

  // image element
  const image = document.createElement('img');
  image.src = chrome.runtime.getURL('/assets/bookmark_button.png');
  image.className = 'add_bookmark-btn--image';
  image.style.width = '80%';
  image.style.height = 'auto';
  buttonElement.append(image);
  channelOwner.appendChild(buttonElement);
};

const youtubePageLoaded = async () => {
  const bookmarkButtonExits = document.querySelector('.add_bookmark');
  const channelOwner = document.getElementById('owner');

  if (!bookmarkButtonExits && channelOwner) {
    injectBookmarkElement();
  } else {
    console.log('Bookmark btn already exits or there is a Youtube glitch 🙂');
  }
};
