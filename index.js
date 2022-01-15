

class Message {
    constructor(CONTENT, FROM, TO) {
        this.CONTENT = CONTENT;
        this.FROM = FROM;
        this.TO = TO;
        this.LIKE = 0;
        this.LIKES = [];
        this.REPLYS = [];
        this.REPLYED_TO = null;
    }
    like(FROM) {
        if (this.LIKES.filter(_item => _item === FROM).length === 0) {
            this.LIKES.push(FROM);
            this.LIKE++;
        } else {
            return false;
        }
    }
    reply(MESSAGE) {
        this.REPLYS.push(MESSAGE);
        this.REPLYS.forEach(_item => _item.REPLYED_TO = this);
    }
}
class Member {
    constructor(FIRST_NAME, LAST_NAME, EMAIL, PHONE_NUMBER) {
        this.FIRST_NAME = FIRST_NAME;
        this.LAST_NAME = LAST_NAME;
        this.EMAIL = EMAIL;
        this.PHONE_NUMBER = PHONE_NUMBER;
        this.NAME = `${FIRST_NAME} ${LAST_NAME}`;
        this.ROOM = null;
        this.MESSAGE_HANDLERS = [];
    }
    join(CHAT_ROOM) {
        CHAT_ROOM.addMember(this)
    }
    send(MESSAGE) {
        this.ROOM.send(this, MESSAGE);
    }
    reply(OLD_MESSAGE ,MESSAGE) {
        this.ROOM.reply(OLD_MESSAGE ,this, MESSAGE);
    }
    reverce(FROM, MESSAGE) {
        this.runEventMessage(FROM, MESSAGE);
    }
    reverceReply(FROM, OLD_MESSAGE, MESSAGE) {
        this.runEventMessage(FROM, MESSAGE);
    }
    addEventMessage(FX) {
        this.MESSAGE_HANDLERS.push(FX);
    }
    runEventMessage(FROM ,MESSAGE) {
        this.MESSAGE_HANDLERS.forEach(_item => _item(FROM ,MESSAGE));
    }
}
class ChatRoom {
    constructor() {
        this.MEMBERS = [];
        this.MESSAGES = [];
        this.MSG_EVENTS = [];
        this.MEM_EVENTS = [];
    }
    addMember(MEMBER) {
        this.MEMBERS.push(MEMBER);
        MEMBER.ROOM = this;
        this.runEventMemeber(MEMBER)
    }
    send(FROM, MESSAGE) {
        const message = new Message(MESSAGE, FROM, this);
        this.MEMBERS.filter(_item => _item!=FROM).forEach(_item => _item.reverce(FROM, message));
        this.MESSAGES.push(message);
        this.runEventMessage(message);
    }
    reply(OLD_MESSAGE, FROM, MESSAGE) {
        const message = new Message(MESSAGE, FROM, this);
        OLD_MESSAGE.reply(message);
        this.MEMBERS.filter(_item => _item!=FROM).forEach(_item => _item.reverceReply(FROM, OLD_MESSAGE, message));
        this.MESSAGES.push(message);
        this.runEventMessage(message);
    }

    addEventMessage(FX) {
        this.MSG_EVENTS.push(FX);
    }
    addEventMemeber(FX) {
        this.MEM_EVENTS.push(FX);
    }
    runEventMessage(MESSAGE) {
        this.MSG_EVENTS.forEach(_item => _item(MESSAGE))
    }
    runEventMemeber(MEMBER) {
        this.MEM_EVENTS.forEach(_item => _item(MEMBER))
    }
}

const chat_room = new ChatRoom();

chat_room.addEventMessage((MSG) => {
    console.log(MSG)
});

const WebSocket = require('ws')
const wss = new WebSocket.Server({'port': 7071})
const map = []

wss.on('connection', (WS, REQ) => {
    map.push(WS);
    WS.on('message', (DATA) => {
        const message = JSON.parse(DATA)
        if (message['work'] === 'connect') {
            user = new Member(message['first_name'], message['last_name'], message['email'], message['phone_number'])
            user.join(chat_room)
            user.addEventMessage((FROM ,MSG) => {
                WS.send(`
                {
                    "content": "${MSG.CONTENT}",
                    "from": "${MSG.FROM}",
                    "likes": "${MSG.LIKES}",
                    "replys": "${MSG.REPLYS}",
                }
                `)
            })
        } else if (message['work'] === 'send') {
            user.send(message['content'])
        }
    })
})

