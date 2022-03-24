const drumRollPaths = [
  'https://media2.giphy.com/media/X2AVdPLysKiqs/giphy.gif?cid=790b7611a02599b7ebe1a949d633a76db93f2d92fde87352&rid=giphy.gif&ct=g',
  'http://pa1.narvii.com/6969/3d389dcc1c84c99ba98d6d9a2f47b915fbd3efebr1-320-320_00.gif',
  'https://i.pinimg.com/originals/40/e3/3d/40e33d3379280584ae05c5b3bff6535e.gif',
  'https://concept-stories.s3.ap-south-1.amazonaws.com/test/Stories%20-%20Images_story_122464/image_2020-09-22%2014%3A05%3A33.676777%2B00%3A00',
  'https://media1.giphy.com/media/13xkwlrxUka2Gs/giphy.gif?cid=790b7611a479d7db4000c9540a3a7d5f10f4885693a2db5d&rid=giphy.gif&ct=g',
  'https://mblogthumb-phinf.pstatic.net/MjAxODA0MjlfMjM3/MDAxNTI0OTkzMDYxNjcx.530MMidWEUgPf_G9TJWSe8HNEScnzrsYPputJM2xhEsg.F3XtjthL1srRvPoRdR0Ur8LDJxDQw-OiPCFEvYLam1Yg.GIF.cyl4619/giphy.gif?type=w800',
  'https://i.imgflip.com/5i1la3.gif',
  'https://res.cloudinary.com/practicaldev/image/fetch/s--2H2ksvWx--/c_limit%2Cf_auto%2Cfl_progressive%2Cq_66%2Cw_880/https://media2.giphy.com/media/116seTvbXx07F6/giphy.gif%3Fcid%3D790b76115ca2f3af624f796b6bed49a6',
  'https://pa1.narvii.com/6362/1e3018b80ca5bd71aa0a6ea5637b2316c7cec2d8_hq.gif',
]

function randomIntegerBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showChosenParticipant() {
  document.querySelector('#drum_roll').style.display='none';
  document.querySelector('.picked').style.display='flex';
}

function showDrumRoll() {
  document.querySelector('#drum_roll').style.display='flex';
  document.querySelector('.picked').style.display='none';
}

function setRandomDrumRollVisual() {
  const imageOrGif = drumRollPaths[randomIntegerBetween(0, drumRollPaths.length - 1)];
  document.querySelector('#drum_roll .visual').poster = imageOrGif;
  document.querySelector('#drum_roll .visual').src = imageOrGif;
}

function fetchActiveMeeting() {
  return new Promise((resolve) => {
    chrome.storage.local.get('meetings', function (results) {
      const meetings = Object.values(results.meetings || {});
      const sortedMeetings = meetings.sort((a, b) => {
        const dateA = a.lastUpdateTime || 0;
        const dateB = b.lastUpdateTime || 0;
        return dateB - dateA;
      });
      resolve(sortedMeetings.length > 0
        ? Meeting.fromObject(sortedMeetings[0])
        : null);
    });
  });
}

function sortByDateOfLastNotify(a, b) {
  if (!a.dateOfLastNotify && !b.dateOfLastNotify) {
    return 0;
  }
  if (!a.dateOfLastNotify) {
    return -1;
  }
  if (!b.dateOfLastNotify) {
    return 1;
  }
  return a.dateOfLastNotify - b.dateOfLastNotify;
}

async function selectRandomParticipant(event) {
  event.target.disabled = true;
  const activeMeeting = await fetchActiveMeeting();
  if (!activeMeeting) {
    alert('There is no data from a meeting available');
    return;
  }
  console.log(`Choosing random participant from meeting: ${activeMeeting.meetingId}\n`);
  let participants = Object.values(activeMeeting.nameToParticipant)
    .filter(participant => participant.inMeeting)
    .sort(sortByDateOfLastNotify);
  participants = participants.slice(0, 3);
  if (participants.length < 1) {
    alert('There are no online meeting participants')
  }
  let randomlyChosenParticipant = participants[randomIntegerBetween(0, participants.length - 1)];
  document.querySelector('#picked_name').innerText = randomlyChosenParticipant.name;
  showChosenParticipant();
  event.target.disabled = false;
  activeMeeting.updateParticipantDateOfNotify(randomlyChosenParticipant.name);
  activeMeeting.save();
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#drum_roll').addEventListener('click', selectRandomParticipant);
  setRandomDrumRollVisual();
});

chrome.storage.local.get('meetings', function (results) {
  const meetingsRawData = Object.values(results.meetings || {});
  let meetingsInfo = ''
  for (const meetingData of meetingsRawData) {
    const meeting = Meeting.fromObject(meetingData);
    meetingsInfo += `Meeting Id: ${meeting.meetingId}\n`
    let participants = Object.values(meeting.nameToParticipant)
      .sort(sortByDateOfLastNotify);
    for (const participant of participants) {
      meetingsInfo += participant.toString() + '\n';
    }
    meetingsInfo += `${'-'.repeat(75)}\n`;
  }
  console.log(meetingsInfo);
});