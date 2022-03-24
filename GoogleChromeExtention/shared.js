function dateToObject(date) {
    if (!date) {
        return date;
    }
    return date.getTime();
}

function dateFromObject(date) {
    if (!date) {
        return date;
    }
    return new Date(date);
}

class Participant {
    constructor(name, inMeeting, dateOfLastNotify, notifyCount) {
        this.name = name;
        this.inMeeting = inMeeting || false;
        this.dateOfLastNotify = dateOfLastNotify;
        this.notifyCount = Number.isInteger(notifyCount) ? notifyCount : 0;
    }

    toString() {
        return JSON.stringify({
            name: this.name,
            inMeeting: this.inMeeting,
            dateOfLastNotify: this.dateOfLastNotify,
            notifyCount: this.notifyCount,
        });
    }

    toObject() {
        return {
            name: this.name,
            inMeeting: this.inMeeting,
            dateOfLastNotify: dateToObject(this.dateOfLastNotify),
            notifyCount: this.notifyCount,
        };
    }

    static fromObject(object) {
        return new Participant(
            object.name,
            object.inMeeting,
            dateFromObject(object.dateOfLastNotify),
            object.notifyCount,
        );
    }
}

class Meeting {
    constructor(meetingId, lastUpdateTime) {
        this.meetingId = meetingId;
        this.lastUpdateTime = lastUpdateTime || null;
        this.nameToParticipant = {};
    }

    updateParticipantDateOfNotify(name) {
        let participant;
        if (name in this.nameToParticipant) {
            participant = this.nameToParticipant[name];
        } else {
            participant = new Participant(name, true)
            this.nameToParticipant[participant.name] = participant;
        }
        participant.dateOfLastNotify = new Date();
        participant.notifyCount++;
    }

    updateParticipantsInMeeting(participantNames) {
        const participantsNotInTheMeeting = new Set(Object.values(this.nameToParticipant));
        for (const name of participantNames) {
            if (name in this.nameToParticipant) {
                const participant = this.nameToParticipant[name];
                participant.inMeeting = true;
                participantsNotInTheMeeting.delete(participant);
            } else {
                const participant = new Participant(name, true)
                this.nameToParticipant[participant.name] = participant;
            }
        }
        for (const participant of participantsNotInTheMeeting) {
            participant.inMeeting = false;
        }
    }

    toObject() {
        const nameToParticipantObject = {};
        for (const entry of Object.entries(this.nameToParticipant)) {
            nameToParticipantObject[entry[0]] = entry[1].toObject();
        }
        return {
            meetingId: this.meetingId,
            lastUpdateTime: dateToObject(this.lastUpdateTime),
            nameToParticipant: nameToParticipantObject,
        };
    }

    save() {
        const storageKey = `meeting-${this.meetingId}`;
        chrome.storage.local.get(['meetings', storageKey], (result) => {
            chrome.storage.local.set({
            'meetings': {
                ...(result.meetings || {}),
                [storageKey]: this.toObject()
            },
            });
        });
    }

    static fromObject(object) {
        const nameToParticipant = {};
        const meeting = new Meeting(object.meetingId, dateFromObject(object.lastUpdateTime));
        for (const entry of Object.entries(object.nameToParticipant)) {
            nameToParticipant[entry[0]] = Participant.fromObject(entry[1]);
        }
        meeting.nameToParticipant = nameToParticipant;
        return meeting;
    }
}