import { setSessionStartTime, calculateSessionDuration } from "./timer.js";

const state = {
  channel: "god",
  topListLength: 5,
  streamerChannels: ["adinross", "5555555", "rrrrrrrr"],
  currentStreamerIndex: 0,
  uniqueUsernames: new Set(),
  topUsernames: new Map(),
  messageCount: 0,
  totalViewerCount: 0,
  peakViewerCount: 0,
  updateCount: 0,
  twoOrLessCount: 0,
  uniqueUsernamesCount: 0,
  excludedKickBots: [
    "babblechat",
    "botrix",
    "casterlabs",
    "intrx",
    "livebot",
    "lottobot",
    "logibot",
    "mrbeefbot",
    "notibot",
    "squadbot",
    "babzbot",
    "kickbot"
  ],
  kickWSUri:
    "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.4.0&flash=false",
  kickWS: null,
};

function connectWebSocket() {
  // Implement WebSocket connection logic
}

function checkOnlineStatus() {
  // Implement online status check logic
}

function switchToNextStreamer() {
  // Implement switching to the next streamer logic
}

function handleMessageEvent(event) {
  // Implement WebSocket message event handling logic
}

function updateHTMLElements() {
  // Implement updating HTML elements logic
}

// Other functions...

document.addEventListener("DOMContentLoaded", async function () {
  connectWebSocket();
  checkOnlineStatus();

  state.kickWS.addEventListener("message", handleMessageEvent);
});

// Other event listeners and initialization code...


  // Close existing WebSocket connection if it exists
  if (kickWS && kickWS.readyState !== WebSocket.CLOSED) {
    kickWS.close();
  }

  // Create new WebSocket instance
  kickWS = new WebSocket(kickWSUri);

  // WebSocket open event listener
  kickWS.addEventListener("open", async function open() {
    // Only send messages or perform actions once the WebSocket connection is open
    const userData = await fetch(
      `https://kick.com/api/v2/channels/${channel}`
    ).then((response) => response.json());

    // Send the message once the WebSocket connection is open
    kickWS.send(
      JSON.stringify({
        event: "pusher:subscribe",
        data: { auth: "", channel: `chatrooms.${userData.chatroom.id}.v2` },
      })
    );

    console.log(
      "Connected to Kick.com Streamer Chat: " +
      channel +
      " Chatroom ID: " +
      userData.chatroom.id
    );

    setSessionStartTime(); // Set the session start time when the WebSocket connection opens
    updateIsLiveStatus();
    await fetchViewerCount();
  });

{
  // Get the HTML elements for displaying the information
  const messageCountElement = document.getElementById("message-count");
  const uniqueUsernamesElement = document.getElementById("unique-usernames");
  const topUsernamesElement = document.getElementById("top-usernames");
  const twoOrLessElement = document.getElementById("2x-usernames");

  // Check if HTML elements exist before updating
  // Update the HTML elements with the latest information
  messageCountElement.textContent = messageCount.toLocaleString();
  uniqueUsernamesElement.textContent = uniqueUsernamesCount.toLocaleString();
  twoOrLessElement.textContent = twoOrLessCount.toLocaleString();

  // Clear the existing list of top usernames
  topUsernamesElement.innerHTML = "";

  // Create and append <li> elements for each top username
  topUsernames.forEach(({ username, count }) => {
    const listItem = document.createElement("li");

    const usernameSpan = document.createElement("span");
    usernameSpan.textContent = username;
    usernameSpan.className = "username"; // Assign 'username' as the class name
    listItem.appendChild(usernameSpan);

    const countSpan = document.createElement("span");
    countSpan.textContent = count ? count.toLocaleString() : "";
    countSpan.className = "messageCount"; // Assign 'messageCount' as the class name
    listItem.appendChild(countSpan);

    topUsernamesElement.appendChild(listItem);
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize WebSocket connection
  connectWebSocket();

  // Start checking online status
  checkOnlineStatus();

  // Add WebSocket message event listener
  kickWS.addEventListener("message", handleMessageEvent);
});

// set initial peak viewers
const peakViewersElement = document.getElementById("viewer-peak");
peakViewersElement.textContent = peakViewerCount;

// Update the is_live status display
function updateIsLiveStatus(isLive) {
  const channelLiveElement = document.getElementById("channel-live");

  if (isLive) {
    channelLiveElement.textContent = " ";
    channelLiveElement.classList.add("live");
    channelLiveElement.classList.remove("offline");
  } else {
    channelLiveElement.textContent = " ";
    channelLiveElement.classList.add("offline");
    channelLiveElement.classList.remove("live");
  }
}

// create a unique ID for the sender
function createSenderUniqueId(id, username) {
  return `${id}-${username}`;
}

// add the sender unique ID to the set of unique usernames
function addSenderUniqueId(senderUniqueId) {
  uniqueUsernames.add(senderUniqueId);
}

// get the top usernames with their message count
function getTopUsernamesWithCount(sortedUsernames) {
  return sortedUsernames
    .slice(0, topListLength)
    .map(([senderUniqueId, count]) => ({
      username: senderUniqueId.split("-")[1],
      count: count,
    }));
}

function getTwoOrLessCount() {
  console.log(topUsernames);
  let twoOrLessCount = 0;
  for (let [senderUniqueId, count] of topUsernames) {
    if (count <= 2) {
      twoOrLessCount++;
    }
  }
  return twoOrLessCount;
}

// sort top usernames by count in descending order
function getSortedUsernames() {
  return Array.from(topUsernames.entries()).sort((a, b) => b[1] - a[1]);
}

// Update viewer count every 1 minute
setInterval(fetchViewerCount, 1 * 60 * 1000);

// update the session duration
setInterval(updateSessionDuration, 1000);

function updateSessionDuration() {
  const sessionDuration = calculateSessionDuration();
  const sessionDurationElement = document.getElementById("session-duration");
  sessionDurationElement.textContent = sessionDuration;
}

// Periodically check online status
setInterval(checkOnlineStatus, 30 * 1000);

// Reset statistics when the page loads
document.addEventListener("DOMContentLoaded", function () {
  resetStatistics();
});

// Increment the username count in the topUsernames map
function incrementUsernameCount(senderUniqueId) {
  if (topUsernames.has(senderUniqueId)) {
    topUsernames.set(senderUniqueId, topUsernames.get(senderUniqueId) + 1);
  } else {
    topUsernames.set(senderUniqueId, 1);
  }

  // Update unique chatters count
  uniqueUsernamesCount = uniqueUsernames.size;

  // Update chatters with less than 3 messages count
  twoOrLessCount = getTwoOrLessCount();
}

// Update top usernames
function updateTopUsernames() {
  const sortedUsernames = Array.from(topUsernames.entries()).sort((a, b) => b[1] - a[1]);
  topUsernamesElement.innerHTML = "";
  sortedUsernames.slice(0, topListLength).forEach(([senderUniqueId, count]) => {
    const listItem = document.createElement("li");
    const username = senderUniqueId.split("-")[1];
    const countSpan = document.createElement("span");
    countSpan.textContent = count.toLocaleString();
    listItem.textContent = `${username}: `;
    listItem.appendChild(countSpan);
    topUsernamesElement.appendChild(listItem);
  });
}

// HTML elements for statistics display
let messageCountElement, uniqueUsernamesElement, topUsernamesElement;

document.addEventListener("DOMContentLoaded", async function () {
  // Initialize WebSocket connection
  connectWebSocket();

  // Retrieve HTML elements
  messageCountElement = document.getElementById("message-count");
  uniqueUsernamesElement = document.getElementById("unique-usernames");
  topUsernamesElement = document.getElementById("top-usernames");

  // Start checking online status
  checkOnlineStatus();

  // Add WebSocket message event listener
  kickWS.addEventListener("message", handleMessageEvent);
});

// Fetch the viewer count and check is_live status
async function fetchViewerCount() {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${channel}`);
    const data = await response.json();

    // Check if the 'livestream' object exists in the response data
    if (data.livestream && data.livestream.viewer_count !== undefined) {
      const viewerCount = data.livestream.viewer_count;
      const isLive = data.livestream.is_live || false;

      // Update the viewer count
      updateViewerCount(viewerCount);

      // Update the is_live status
      updateIsLiveStatus(isLive);
    } else {
      // If 'livestream' object doesn't exist or 'viewer_count' is undefined, set viewer count to 0
      updateViewerCount(0);
      // Update the is_live status to false
      updateIsLiveStatus(false);
    }
  } catch (error) {
    console.error("Error fetching viewer count:", error);
  }
}

// Update viewer count
async function updateViewerCount(viewerCount) {
  try {
    totalViewerCount += viewerCount;

    // Increment update count
    updateCount++;

    // Calculate new average viewer count
    const averageViewerCount = updateCount > 0 ? totalViewerCount / updateCount : 0;

    // Update UI with viewer count
    const viewerCountElement = document.getElementById("viewer-count");
    viewerCountElement.textContent = viewerCount ? viewerCount.toLocaleString() : "0";

    // Update UI with average viewer count
    const viewerAverageElement = document.getElementById("viewer-average");
    viewerAverageElement.textContent = Math.round(averageViewerCount).toLocaleString();

    // Update peak viewer count
    await updatePeakViewerCount(viewerCount);
  } catch (error) {
    console.error('Error updating viewer count:', error);
  }
}

// Update peak viewer count
async function updatePeakViewerCount(viewerCount) {
  peakViewerCount = Math.max(peakViewerCount, viewerCount);

  // Update UI with peak viewer count
  const peakViewersElement = document.getElementById("viewer-peak");
  peakViewersElement.textContent = peakViewerCount.toLocaleString();
}

// Periodically check online status
setInterval(checkOnlineStatus, 5 * 1000);

// Reset statistics when the page loads
document.addEventListener("DOMContentLoaded", function () {
  resetStatistics();
});

// Increment the message count
function incrementMessageCount() {
  messageCount++;

  // Update total message count
  messageCountElement.textContent = messageCount.toLocaleString();
}

// Function to reset statistics
function resetStatistics() {
  messageCount = 0;
  uniqueUsernames.clear();
  topUsernames.clear();
  // Check if HTML elements exist before updating
  const messageCountElement = document.getElementById("message-count");
  const uniqueUsernamesElement = document.getElementById("unique-usernames");
  const topUsernamesElement = document.getElementById("top-usernames");
  if (messageCountElement) {
    messageCountElement.textContent = "0";
  }
  if (uniqueUsernamesElement) {
    uniqueUsernamesElement.textContent = "0";
  }
  if (topUsernamesElement) {
    topUsernamesElement.innerHTML = "";
  }
}