const getActiveTabURL = async () => {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });

  return tabs[0];
};

//important variables
const activeTab = await getActiveTabURL();
const queryParameters = activeTab.url.split('?')[1];
const urlParameters = new URLSearchParams(queryParameters);
const videoId = urlParameters.get('v');

const initializeTheBookmarkElements = async () => {
  const currentVideoBookmarks = await getCurrentVideoBookmarks();
  const bookmarkList = document.querySelector('.bookmark_lists');
  bookmarkList.innerHTML = '';

  //checking if any bookmark exits or not or else appending the new previous bookmarks to the list
  if (currentVideoBookmarks.length <= 0) {
    bookmarkList.innerHTML = '<p>No bookmark exists for this video</p>';
  } else {
    currentVideoBookmarks.forEach(({ time, desc }, index) => {
      const listElement = createBookmarkElement(index + 1, time, desc);
      bookmarkList.appendChild(listElement);
    });
  }
};

const getCurrentVideoBookmarks = async () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([videoId], obj =>
      resolve(obj[videoId] ? JSON.parse(obj[videoId]) : [])
    );
  });
};

const jumpToTimestamp = time => {
  chrome.tabs.sendMessage(activeTab.id, {
    event: 'JUMP',
    videoId: videoId,
    value: time,
  });
};

const removeBookmark = async time => {
  const bookmarkList = document.querySelector('.bookmark_lists');
  const currentBookMarks = await getCurrentVideoBookmarks();
  const currentFilteredBookmarks = currentBookMarks.filter(
    bookmark => bookmark.time !== time
  );

  chrome.storage.sync.set({
    [videoId]: JSON.stringify(
      [...currentFilteredBookmarks].sort((a, b) => a.time - b.time)
    ),
  });

  if (currentFilteredBookmarks.length === 0) {
    bookmarkList.innerHTML = '<p>No bookmark exists for this video</p>';
  } else {
    bookmarkList.innerHTML = '';
    currentFilteredBookmarks.forEach(({ time, desc }, index) => {
      const listElement = createBookmarkElement(index + 1, time, desc);
      bookmarkList.appendChild(listElement);
    });
  }
};

const createBookmarkElement = (index, time, description) => {
  // Create the wrapper div
  const wrapperDiv = document.createElement('div');
  wrapperDiv.className = 'bookmark_list-wrapper';
  wrapperDiv.id = `list_${time}`;

  // Create the left div
  const leftDiv = document.createElement('div');
  leftDiv.className = 'left';

  // Create and append the index span
  const indexSpan = document.createElement('span');
  indexSpan.textContent = `${index}.`;
  leftDiv.appendChild(indexSpan);

  // Create and append the time paragraph
  const timeParagraph = document.createElement('p');
  timeParagraph.textContent = description;
  leftDiv.appendChild(timeParagraph);

  // Create the right controls div
  const rightControlsDiv = document.createElement('div');
  rightControlsDiv.className = 'right-controls';

  // Create and append the jump button
  const jumpButton = document.createElement('button');
  jumpButton.addEventListener('click', () => {
    jumpToTimestamp(time);
  });
  jumpButton.className = 'jump-btn';
  jumpButton.setAttribute('jump-time', time);
  const playIcon = document.createElement('img');
  playIcon.src = chrome.runtime.getURL('/assets/play.png');
  jumpButton.appendChild(playIcon);
  rightControlsDiv.appendChild(jumpButton);

  // Create and append the bin button
  const binButton = document.createElement('button');
  binButton.addEventListener('click', () => removeBookmark(time));
  binButton.setAttribute('timestamp', time);
  binButton.id = `btn_${time}`;
  binButton.className = 'bin-btn';
  const binIcon = document.createElement('img');
  binIcon.src = chrome.runtime.getURL('/assets/bin.png');
  binButton.appendChild(binIcon);
  rightControlsDiv.appendChild(binButton);

  // Append the left and right divs to the wrapper
  wrapperDiv.appendChild(leftDiv);
  wrapperDiv.appendChild(rightControlsDiv);

  return wrapperDiv;
};

const main = async () => {
  if (activeTab.url.includes('youtube.com/watch') && videoId) {
    await initializeTheBookmarkElements();
  }
};

main();
