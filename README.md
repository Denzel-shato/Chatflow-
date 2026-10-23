ChatFlow
ChatFlow is a real-time messaging application built with React and
Firebase. It supports private chatrooms, message read receipts, typing
indicators, user profiles, and voice/video calling.
Features
- Real-time conversations between two participants.
- Message sender metadata and read receipts.
- Typing indicators and latest-message metadata.
- User profiles with searchable name and email fields.
- Voice and video call sessions with call status tracking.
- Per-user call history.
Technology
- React
- Firebase Authentication
- Cloud Firestore
- Agora for voice/video calling
- Node.js/Express service for Agora token generation
Firestore structure
  Collection/path                             Purpose
  Users/{uid}                               User profile information and search
                                              fields

  Chatrooms/{chatId}                        Conversation participants and
                                              conversation metadata

  Chatrooms/{chatId}/messages/{messageId}   Messages sent in a chatroom

  Calls/{callId}                            Active call details and status

  CallHistory/{historyId}                   Call history entry associated with
                                          a user
Collection names are case-sensitive.
How the application data works
Users
Each user profile is stored at Users/{uid}, using the Firebase
Authentication UID as the document ID. The document contains identity
and search fields such as displayName, email, photoURL,
searchEmail, and searchName, along with createdAt.

Signed-in users can read user profiles. A user creates and updates their
own profile, while profile deletion is disabled in the current rules.
Chatrooms
Each conversation is stored at Chatrooms/{chatId}. The document
includes the two participants, participant display information, and
metadata used to show the latest message and typing status.

A chatroom is readable by its listed participants. Creation requires two
participant entries, includes the creator, and requires the chatId
field to match the document ID. The initial latest-message value is
null.

Participants can update only the conversation metadata fields
lastMessage, lastMessageAt, messageAt, and typing. Typing
updates are scoped to the current user's entry in the typing map.
Messages
Messages are stored in the messages subcollection under their
chatroom. A message's senderId must match the authenticated user
creating it. New messages start with the sender's UID as the only entry
in readBy.

Chatroom participants can read messages. Message updates are limited to
readBy and mediaUrl. The readBy rules preserve existing reader
UIDs and allow the current user to add their own UID, supporting
per-user read receipts.
Calls
Call documents are stored in Calls/{callId}. Each record identifies a
callerId, a calleeId, the associated chatId, a callType, and a
status.

A call can be created by its caller when both users belong to the
referenced chatroom. Calls begin with status calling, and callType
is limited to voice or video. Only the caller and callee can read
the call. Status updates are restricted by role:
- The callee can set the status to accepted, cancelled,
  declined, or ended.
- The caller can set the status to cancelled, ended, or missed.
The application uses Agora for the media session; Firestore stores the
call metadata and status.
Call history
Call history entries are stored in CallHistory/{historyId}. Each entry
contains a participant list, forUserId, call type, caller ID, and
timestamp.

A user can read a history entry when their UID is included in
participants and matches forUserId. A participant can create an
entry. Updates are limited to readBy, where existing entries must be
retained and a user may add their own UID.
Firestore access summary
  Data                       Read access    Create access  Update access   Delete access
  Users                    Any signed-in  Own profile    Own profile     Denied
                             user           with required
                                            fields                         

  Chatrooms                Listed         Signed-in      Participants;   Denied by
                             participants   creator        only            default
                                            included in a  conversation
                                            two-entry      metadata fields
                                            participant
                                            list                           

  Chatrooms/.../messages   Parent         Participant    Participants;   Denied by
                             chatroom       whose          only readBy   default
                             participants   senderId     and mediaUrl,
                                            matches their  with reader
                                            UID and whose  additions
                                            readBy       constrained
                                            initially
                                            contains only
                                            them                           

  Calls                    Caller or      Caller, when   Caller/callee   Denied by
                             callee         caller and     with            default
                                            callee belong  role-specific
                                            to the         status values
                                            referenced
                                            chatroom                       

  CallHistory              Participant    Signed-in      Participant;    Denied by
                             matching       participant    only readBy   default
                             forUserId    with required
                                        call fields                    
Implementation notes
- The isSignedIn() helper checks Firebase Authentication.
- isParticipant(chatId) loads the parent chatroom and checks whether
  the current UID is in its participants array.
- chatRoomParticipants(chatId) loads a chatroom's participant list
  for validating call creation.
- Firestore security rules are not query filters. Queries should be
  structured so Firestore can determine that every returned document
  is authorized.
- Firestore rules control database access; Firebase Storage access and
  the Agora token service have their own configuration and security
  responsibilities.
Current Firestore rules
The rules below define the current access behavior described above.
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /Chatrooms/{chatId} {
      allow read: if isSignedIn() &&
        request.auth.uid in resource.data.participants;

      allow create: if isSignedIn()
        && request.resource.data.participants is list
        && request.resource.data.participants.size() == 2
        && request.auth.uid in request.resource.data.participants
        && request.resource.data.chatId is string
        && request.resource.data.chatId == chatId
        && request.resource.data.lastMessage == null
        && (request.resource.data.lastMessageAt is timestamp || request.resource.data.lastMessageAt == null)
        && request.resource.data.participantsInfo is list
        && request.resource.data.participantsInfo.size() == 2;

      allow update: if isSignedIn() &&
        request.auth.uid in resource.data.participants &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly([
          'lastMessage',
          'lastMessageAt',
          'messageAt',
          'typing'
        ]) &&
        (
          request.resource.data.lastMessage is string ||
          request.resource.data.lastMessage == null
        ) &&
        (
          request.resource.data.lastMessageAt is timestamp ||
          request.resource.data.lastMessageAt == null
        ) &&
        (
          request.resource.data.messageAt is timestamp ||
          request.resource.data.messageAt == null
        ) && (
          !('typing' in request.resource.data.diff(resource.data).affectedKeys()) ||
          (
            request.resource.data.typing is map &&
            request.resource.data.typing.diff(resource.data.get('typing', {})).affectedKeys().hasOnly([request.auth.uid]) &&
            request.resource.data.typing[request.auth.uid] is bool
          )
        );

      match /messages/{messageId} {
        allow read: if isSignedIn() && isParticipant(chatId);

        allow create: if isSignedIn() && isParticipant(chatId)
          && request.resource.data.senderId == request.auth.uid
          && request.resource.data.readBy.size() == 1
          && request.auth.uid in request.resource.data.readBy;

        allow update: if isSignedIn() &&
          isParticipant(chatId) &&
          request.resource.data.diff(resource.data).affectedKeys().hasOnly([
            'readBy', 'mediaUrl'
          ]) &&
          request.resource.data.readBy.hasAll(resource.data.get('readBy', [])) &&
          request.resource.data.readBy.toSet()
            .difference(resource.data.get('readBy', []).toSet())
            .hasOnly([request.auth.uid]);
      }
    }

    match /Users/{uid} {
      allow read: if isSignedIn();

      allow create: if isSignedIn()
        && request.auth.uid == uid
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.createdAt is timestamp
        && request.resource.data.displayName is string
        && request.resource.data.email is string
        && request.resource.data.photoURL is string
        && request.resource.data.searchEmail is string
        && request.resource.data.searchName is string;

     allow update: if isSignedIn() && request.auth.uid == uid
      && request.resource.data.uid == resource.data.uid
      && request.resource.data.createdAt == resource.data.createdAt
      && request.resource.data.displayName == resource.data.displayName
      && request.resource.data.email == resource.data.email
      && request.resource.data.photoURL == resource.data.photoURL
      && request.resource.data.searchEmail == resource.data.searchEmail
      && request.resource.data.searchName == resource.data.searchName;
      allow delete: if false;
    }

    match /Calls/{callId} {
      allow read: if isSignedIn() &&
        (request.auth.uid == resource.data.callerId ||
         request.auth.uid == resource.data.calleeId);

      allow create: if isSignedIn()
        && request.auth.uid == request.resource.data.callerId
        && request.resource.data.calleeId != request.resource.data.callerId
        && request.auth.uid in chatRoomParticipants(request.resource.data.chatId)
        && request.resource.data.calleeId in chatRoomParticipants(request.resource.data.chatId)
        && request.resource.data.status == 'calling'
        && request.resource.data.callType in ['voice', 'video']
        && (request.resource.data.callerPhoto is string || request.resource.data.callerPhoto == null);

      allow update: if isSignedIn()
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status'])
        && (
          (request.auth.uid == resource.data.calleeId
            && request.resource.data.status in ['accepted', 'cancelled', 'declined', 'ended'])
          || (request.auth.uid == resource.data.callerId
            && request.resource.data.status in ['cancelled', 'ended', 'missed'])
        );
    }

    match /CallHistory/{historyId} {
      allow read: if isSignedIn() &&
        request.auth.uid in resource.data.participants &&
        request.auth.uid == resource.data.forUserId;

      allow create: if isSignedIn() &&
        request.auth.uid in request.resource.data.participants &&
        request.resource.data.callType in ['video', 'voice'] &&
        request.resource.data.callerId is string &&
        request.resource.data.participants is list &&
        request.resource.data.participants.size() == 2 &&
        request.resource.data.forUserId in request.resource.data.participants &&
        request.resource.data.timestamp is timestamp;

      allow update: if isSignedIn()
        && request.auth.uid in resource.data.participants
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['readBy'])
        && request.resource.data.readBy.hasAll(resource.data.get('readBy', []))
        && request.resource.data.readBy.toSet()
          .difference(resource.data.get('readBy', []).toSet())
          .hasOnly([request.auth.uid]);
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isParticipant(chatId) {
      return request.auth.uid in
        get(/databases/$(database)/documents/Chatrooms/$(chatId)).data.participants;
    }

    function chatRoomParticipants(chatId) {
      let room = get(/databases/$(database)/documents/Chatrooms/$(chatId)).data;
      return room.participants;
    }
  }
}
Development setup
1. Clone the repository.
2. Install dependencies using the package manager and lockfile included
   in the project.
3. Configure the Firebase project settings required by the application.
4. Configure the Agora token service and its environment variables
   separately.
5. Run the development script defined in package.json.