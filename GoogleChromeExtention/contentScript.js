console.log('Added content script');
window.ChooseRndGoogleMeetMember = (window.ChooseRndGoogleMeetMember || {});
if (window.ChooseRndGoogleMeetMember.stopExisting) {
  window.ChooseRndGoogleMeetMember.stopExisting()
    .then(() => {
      window.ChooseRndGoogleMeetMember.stopExisting = runRndGoogleMeetChooser();
    });
} else {
  window.ChooseRndGoogleMeetMember.stopExisting = runRndGoogleMeetChooser();
}

function runRndGoogleMeetChooser() {
  console.log('Running Google Meet Chooser');
  const ACTIONS = Object.freeze({
    UPDATE_PARTICIPANTS_LIST: 'update_participants_list',
  });
  const QUERY_SELECTORS = Object.freeze({
    IN_MEETING_ONLY: '[data-unresolved-meeting-id][__is_owner]',
    SHOW_EVERYONE_BTN: 'button[aria-label="Show everyone"]',
    PARTICIPANTS_LIST: 'div[aria-label="Participants"]',
    PARTICIPANT_LIST_ITEMS: 'div[role="list"] div[role="listitem"]',
  });
  let meetParticipantListObserver = null;
  let getParticipantsPromise = null;
  let elmBeingObserved = null;

  setUpObserver();

  return () => {
    return new Promise((resolve) => {
      if (meetParticipantListObserver) {
        meetParticipantListObserver.disconnect();
      }
      resolve();
    });
  };

  function updateParticipantsList(participantNames) {
    console.log(participantNames);
    chrome.runtime.sendMessage({
      action: ACTIONS.UPDATE_PARTICIPANTS_LIST,
      data: {
        participantNames,
        meetingId: getMeetingId(),
      }
    });
  }

  function setUpObserver() {
    getMeetingParticipants().then(updateParticipantsList);
    addMeetingParticipantsObserver(() => {
      if (!getParticipantsPromise) {
        getParticipantsPromise = getMeetingParticipants()
          .then((participants) => {
            updateParticipantsList(participants);
            getParticipantsPromise = null;
          });
      }
    }).then(participantMenuElm => {
      elmBeingObserved = participantMenuElm;
      const interval = setInterval(() => {
        const elmParticipantMenu = document.querySelector(QUERY_SELECTORS.PARTICIPANTS_LIST);
        if (isInAMeeting() && elmParticipantMenu != elmBeingObserved) {
          clearInterval(interval);
          setUpObserver();
        }
      }, 100);
    });
  }

  function isInAMeeting() {
    return !!(document.body.querySelector(QUERY_SELECTORS.IN_MEETING_ONLY)
      && document.querySelector(QUERY_SELECTORS.SHOW_EVERYONE_BTN));
  }

  function getMeetingId() {
    return window.location.pathname.match(/[a-z0-9]{3}-[a-z0-9]{4}-[a-z0-9]{3}/)[0];
  }

  function isParticipantMenuBeingDisplayed() {
    const elmParticipantMenu = document.querySelector(QUERY_SELECTORS.PARTICIPANTS_LIST);
    return elmParticipantMenu && !!elmParticipantMenu.offsetParent;
  }

  function tryToOpenMenu(hideMenuOnOpen, resolve) {
    const elmParticipantMenu = document.querySelector(QUERY_SELECTORS.PARTICIPANTS_LIST);
    if (elmParticipantMenu && hideMenuOnOpen != isParticipantMenuBeingDisplayed()) {
      resolve(elmParticipantMenu)
      return;
    }
    const elmMenuBtn = document.querySelector(QUERY_SELECTORS.SHOW_EVERYONE_BTN);
    if (elmMenuBtn) {
      elmMenuBtn.click();
    }
    setTimeout(tryToOpenMenu, 100, hideMenuOnOpen, resolve);
  }

  function addMeetingParticipantsObserver(observerCallback) {
    let hideMenuOnOpen = !isParticipantMenuBeingDisplayed();
    return new Promise((resolve) => {
      tryToOpenMenu(hideMenuOnOpen, participantMenuElm => {
        if (meetParticipantListObserver) {
          meetParticipantListObserver.disconnect();
        }
        meetParticipantListObserver = new MutationObserver(observerCallback);
        meetParticipantListObserver.observe(participantMenuElm, {childList: true});
        resolve(participantMenuElm);
      });
    });
  }

  function getMeetingParticipants() {
    let hideMenuOnOpen = !isParticipantMenuBeingDisplayed();
    return new Promise((resolve) => {
      tryToOpenMenu(hideMenuOnOpen, participantMenuElm => {
        const names = [];
        for (const elmListItem of participantMenuElm.querySelectorAll(QUERY_SELECTORS.PARTICIPANT_LIST_ITEMS)) {
          names.push(elmListItem.querySelector('div:first-child span:first-child').innerText);
        }
        resolve(names);
      });
    });
  }
};
