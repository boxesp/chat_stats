import { setSessionStartTime, calculateSessionDuration } from "./timer.js";

const urlParams = new URLSearchParams(window.location.search);
let channel = urlParams.get("channel") || "god"; // Set default channel
const topListLength = urlParams.get("listLength") || 5;

// List of streamer channels
const streamerChannels = ["god", "adinross", "yet_another_streamer"];
let currentStreamerIndex = 0;

// channel name page element
const channelNameElement = document.getElementById("channel-name");
channelNameElement.textContent = String(channel);

const uniqueUsernames = new Set();
const topUsernames = new Map();
let messageCount = 0;
let totalViewerCount = 0;
let peakViewerCount = 0;
let updateCount = 0;
let twoOrLessCount = 0;
let uniqueUsernamesCount = 0;

const excludedKickBots = [
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
];

// kick websocket uri
const kickWSUri =
  "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.4.0&flash=false";
let kickWS = null; // WebSocket instance

// Function to establish a WebSocket connection
function connectWebSocket() {
  kickWS = new WebSocket(kickWSUri);

  // WebSocket open event listener
  kickWS.addEventListener("open", async function open() {
    // Only send messages or perform actions once the WebSocket connection is open
    const userData = await fetch(
      `https://kick.com/api/v2/channels/${channel}`
    ).then((response) => response.json());

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

    const channelExists = await checkStreamerExists(channel);
    if (!channelExists) {
      // If the channel doesn't exist, insert it into the database
      await insertStreamer(channel);
    }
  });

  // WebSocket error event listener
  kickWS.addEventListener("error", function error(event) {
    console.error("WebSocket error:", event);
  });

  // WebSocket close event listener
  kickWS.addEventListener("close", function close(event) {
    console.log("WebSocket connection closed:", event);
    // Attempt to reconnect after a delay
    setTimeout(connectWebSocket, 5000);
  });
}

// handle the WebSocket Chat Message Event
function handleMessageEvent(event) {
  const data = JSON.parse(event.data);
  if (data.event === "App\\Events\\ChatMessageEvent") {
    const messageData = JSON.parse(data.data);
    let chatMessageSender = messageData.sender.username;

    // Convert sender name to lowercase for case insensitivity
    const sender = chatMessageSender.toLowerCase();

    // Check if sender is in the excludedKickBots array
    if (excludedKickBots.includes(sender)) {
      // Skip processing if the sender is in the excludedKickBots
      return;
    }

    // If not excluded, proceed with the functions
    incrementMessageCount();
    handleSenderData(messageData.sender);
    updateTopUsernames();
  }
}

// Update the HTML elements with the latest information
function updateHTMLElements(
  messageCount,
  uniqueUsernamesCount,
  topUsernames,
  twoOrLessCount
) {
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

// handle the message sender data
function handleSenderData(sender) {
  const senderId = sender.id;
  const senderUsername = sender.username;
  const senderUniqueId = createSenderUniqueId(senderId, senderUsername);
  addSenderUniqueId(senderUniqueId);
  incrementUsernameCount(senderUniqueId);
}

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

// set initial peak viewers
const peakViewersElement = document.getElementById("viewer-peak");
peakViewersElement.textContent = peakViewerCount;

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

// increment the username count in the topUsernames map
function incrementUsernameCount(senderUniqueId) {
  if (topUsernames.has(senderUniqueId)) {
    topUsernames.set(senderUniqueId, topUsernames.get(senderUniqueId) + 1);
  } else {
    topUsernames.set(senderUniqueId, 1);
  }
}

// update top usernames
function updateTopUsernames() {
  const sortedUsernames = getSortedUsernames();
  const topUsernamesWithCount = getTopUsernamesWithCount(sortedUsernames);
  const twoOrLessCount = getTwoOrLessCount();
  updateHTMLElements(
    messageCount,
    uniqueUsernames.size,
    topUsernamesWithCount,
    twoOrLessCount
  );
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

// increment the message count
function incrementMessageCount() {
  messageCount++;
}

// Update viewer count every 1 minute
setInterval(fetchViewerCount, 1 * 60 * 1000);

// update the session duration
setInterval(updateSessionDuration, 1000);

setInterval(() => {
  saveUniqueUsernamesToDatabase(channel, uniqueUsernames);
  saveTopUsernamesToDatabase(channel, topUsernames);
}, 1 * 30 * 1000);

function updateSessionDuration() {
  const sessionDuration = calculateSessionDuration();
  const sessionDurationElement = document.getElementById("session-duration");
  sessionDurationElement.textContent = sessionDuration;
}

// Periodically check online status
setInterval(checkOnlineStatus, 30 * 1000);

// Add the checkOnlineStatus function here
async function checkOnlineStatus() {
  try {
    const response = await fetch(`https://kick.com/api/v2/channels/${channel}`);
    const data = await response.json();
    const isLive = data.livestream && data.livestream.is_live;

    if (!isLive) {
      switchToNextStreamer(); // Switch to the next streamer if offline
    } else {
      updateViewerCount(data.livestream.viewer_count);
      updateIsLiveStatus(true);
    }
  } catch (error) {
    console.error("Error checking online status:", error);
  }
}

// Add a function to switch to the next streamer
function switchToNextStreamer() {
  // Logic to switch to the next streamer goes here
  console.log('Switching to the next streamer...');
  // Increment the current streamer index
  currentStreamerIndex = (currentStreamerIndex + 1) % streamerChannels.length;
  // Set the channel to the next streamer
  channel = streamerChannels[currentStreamerIndex];
  // Then, reconnect WebSocket with the new streamer
  connectWebSocket();
}

connectWebSocket();
