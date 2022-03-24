self.oninstall = () => {
  tryImport('./shared.js');
};

const ACTIONS = Object.freeze({
  UPDATE_PARTICIPANTS_LIST: 'update_participants_list',
});

chrome.runtime.onInstalled.addListener(function () {
  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [new chrome.declarativeContent.PageStateMatcher({
        pageUrl: {
          hostEquals: 'meet.google.com',
          originAndPathMatches: 'https://meet.google.com/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}',
        },
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Got update from: ' + sender.tab.url)
  const expectedMeetingId = getMeetingId(sender.tab.url);
  if (request.action == ACTIONS.UPDATE_PARTICIPANTS_LIST
    && request.data.meetingId === expectedMeetingId) {
      updateMeetingData(request.data.meetingId, request.data.participantNames);
      sendResponse(true);
  }
});

function updateMeetingData(meetingId, participantNames) {
  const storageKey = `meeting-${meetingId}`;
  chrome.storage.local.get(['meetings', storageKey], (result) => {
    const meeting = result.meetings && result.meetings[storageKey]
      ? Meeting.fromObject(result.meetings[storageKey])
      : new Meeting(meetingId, new Date());
    meeting.lastUpdateTime = new Date();
    meeting.updateParticipantsInMeeting(participantNames);
    chrome.storage.local.set({
      'meetings': {
        ...(result.meetings || {}),
        [storageKey]: meeting.toObject()
      },
    });
  });
}

function getMeetingId(url) {
  return url.match(/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}/)[0];
}

function tryImport(...fileNames) {
  try {
    importScripts(...fileNames);
    return true;
  } catch (e) {
    console.error(e);
  }
}