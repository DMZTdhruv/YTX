const getActiveTabURL = async () => {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    active: true,
  });

  return tabs[0];
};

// Important variables
const activeTab = await getActiveTabURL();
const queryParameters = activeTab.url.split('?')[1];
const urlParameters = new URLSearchParams(queryParameters);
const videoId = urlParameters.get('v');

let currentVideoBookmarks = []; // Global variable for bookmarks

const initializeTheBookmarkElements = async () => {
  currentVideoBookmarks = await getCurrentVideoBookmarks();

  const bookmarkList = document.querySelector('.bookmark_lists');
  bookmarkList.innerHTML = '';

  // Check if any bookmark exists
  if (currentVideoBookmarks.length <= 0) {
    bookmarkList.innerHTML = '<p>No bookmark exists for this video</p>';
  } else {
    displayBookmarks(currentVideoBookmarks); // Call displayBookmarks
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

const updateChromeStorage = newBookmarks => {
  console.log(newBookmarks);
  chrome.storage.sync.set({
    [videoId]: JSON.stringify([...newBookmarks].sort((a, b) => a.time - b.time)),
  });
};

const removeBookmark = async time => {
  const filteredBookmarks = currentVideoBookmarks.filter(
    bookmark => bookmark.time !== time
  );

  currentVideoBookmarks = filteredBookmarks; // Update global variable
  updateChromeStorage(currentVideoBookmarks);
  refreshBookmark(currentVideoBookmarks);
};

const editBookmark = async time => {
  const name = prompt('Enter the name for this bookmark');
  alert('You entered this name for the bookmark: ' + name);

  const updatedBookmarks = currentVideoBookmarks.map(bookmark => {
    if (bookmark.time === time) {
      return { ...bookmark, name: name };
    }

    return bookmark;
  });

  currentVideoBookmarks = updatedBookmarks; // Update global variable
  updateChromeStorage(updatedBookmarks);
  refreshBookmark(currentVideoBookmarks);
};

const refreshBookmark = newBookmarks => {
  displayBookmarks(newBookmarks); // Call displayBookmarks
};

const displayBookmarks = bookmarks => {
  const bookmarkList = document.querySelector('.bookmark_lists');
  bookmarkList.innerHTML = '';

  if (bookmarks.length === 0) {
    bookmarkList.innerHTML = '<p>No bookmark exists for this video</p>';
  } else {
    bookmarks.forEach((bookmark, index) => {
      const { time, desc, name } = bookmark;
      const listElement = createBookmarkElement(index + 1, time, desc, name);
      bookmarkList.appendChild(listElement);
    });
  }
};

const createBookmarkElement = (index, time, description, name) => {
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
  const bookmarkInformationWrapper = document.createElement('div');
  bookmarkInformationWrapper.className = 'bookmark_information_wrapper';

  const bookmarkInformation = document.createElement('div');
  bookmarkInformation.className = 'bookmark_information';

  const titleParagraph = document.createElement('p');
  titleParagraph.textContent = name ? name : description;
  titleParagraph.className = 'bookmark_title';
  bookmarkInformation.appendChild(titleParagraph);

  const timeParagraph = document.createElement('p');
  timeParagraph.textContent = description;
  timeParagraph.className = 'bookmark_time';
  bookmarkInformation.appendChild(timeParagraph);

  bookmarkInformationWrapper.appendChild(bookmarkInformation);
  leftDiv.appendChild(bookmarkInformationWrapper);

  // Create the right controls div
  const rightControlsDiv = document.createElement('div');
  rightControlsDiv.className = 'right-controls';

  // edit button
  const editButton = document.createElement('button');
  editButton.addEventListener('click', () => {
    editBookmark(time);
  });
  editButton.title = 'Edit this bookmark';
  editButton.className = 'edit-btn';
  const editIcon = document.createElement('img');
  editIcon.src = chrome.runtime.getURL('/assets/edit-icon.png');
  editButton.appendChild(editIcon);
  rightControlsDiv.appendChild(editButton);

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

    const searchBox = document.querySelector('.search_box');
    searchBox.addEventListener('input', e => {
      const searchValue = e.target.value.toLowerCase(); // Lowercase for case-insensitive search
      if (searchValue === '') {
        refreshBookmark(currentVideoBookmarks);
        return;
      }

      const filteredBookmarks = currentVideoBookmarks.filter(
        bookmark => bookmark.name && bookmark.name.toLowerCase().includes(searchValue)
      );
      refreshBookmark(filteredBookmarks);
    });
  }
};

main();
