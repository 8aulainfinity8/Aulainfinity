const fs = require('fs');
let lines = fs.readFileSync('firestore.rules', 'utf8').split('\n');

// We know the clean end is around line 599.
let cleanRules = lines.slice(0, 599).join('\n');

// Now let's fix the isCommunicationParticipant that got cut off.
cleanRules = cleanRules.replace(/function isCommunicationParticipant[\s\S]*?id\.matches\('\^direct_'\ \+\ request\.auth\.uid \+\ '\(_\.\*\)\?/, `function isCommunicationParticipant(id, data) {
      return isVerifiedUser() && (
        isAdmin() ||
        isApprovedTeacher() ||
        id == request.auth.uid ||
        id == 'direct_' + request.auth.uid ||
        id == 'peer_' + request.auth.uid ||
        id == 'room_' + request.auth.uid ||
        id.matches('^direct_' + request.auth.uid + '(_.*)?$') ||
        id.matches('^peer_' + request.auth.uid + '(_.*)?$') ||
        id.matches('^room_' + request.auth.uid + '(_.*)?$') ||
        id.matches('^' + request.auth.uid + '_.*') ||
        id.matches('.*_' + request.auth.uid + '$') ||
        id.matches('.*_' + request.auth.uid + '_.*') ||
        (data != null && "participants" in data && request.auth.uid in data.participants) ||
        (data != null && "participantIds" in data && request.auth.uid in data.participantIds) ||
        (data != null && "studentId" in data && data.studentId == request.auth.uid) ||
        (data != null && "teacherId" in data && data.teacherId == request.auth.uid) ||
        (data != null && "createdBy" in data && data.createdBy == request.auth.uid) ||
        (data != null && "ownerId" in data && data.ownerId == request.auth.uid) ||
        (data != null && "senderId" in data && data.senderId == request.auth.uid)
      );
    }

    function canAccessCommunicationSubcollection(parentId, data) {
      return isVerifiedUser() && (
        isAdmin() ||
        isApprovedTeacher() ||
        parentId == request.auth.uid ||
        parentId == 'direct_' + request.auth.uid ||
        parentId == 'peer_' + request.auth.uid ||
        parentId == 'room_' + request.auth.uid ||
        parentId.matches('^direct_' + request.auth.uid + '(_.*)?$') ||
        parentId.matches('^peer_' + request.auth.uid + '(_.*)?$') ||
        parentId.matches('^room_' + request.auth.uid + '(_.*)?$') ||
        parentId.matches('^' + request.auth.uid + '_.*') ||
        parentId.matches('.*_' + request.auth.uid + '$') ||
        parentId.matches('.*_' + request.auth.uid + '_.*') ||
        (data != null && "senderId" in data && data.senderId == request.auth.uid) ||
        (data != null && "participants" in data && request.auth.uid in data.participants)
      );
    }`);

// Fix chats, rooms, calls, voice_group_calls
const communicationCollections = ['chats', 'rooms', 'calls', 'voice_group_calls'];
for (const col of communicationCollections) {
    const regex = new RegExp(`match /${col}/\\{([a-zA-Z0-9_]+)\\} \\{[\\s\\S]*?match /\\{allSubcollections=\\*\\*\\} \\{[\\s\\S]*?\\}\\s*\\}`, 'g');
    cleanRules = cleanRules.replace(regex, `match /${col}/{$1} {
      allow read: if isCommunicationParticipant($1, resource == null ? null : resource.data);
      allow create: if isCommunicationParticipant($1, request.resource.data);
      allow update: if isCommunicationParticipant($1, resource == null ? null : resource.data);
      allow delete: if isAdmin();
      match /{allSubcollections=**} {
        allow read: if canAccessCommunicationSubcollection($1, resource == null ? null : resource.data);
        allow create: if canAccessCommunicationSubcollection($1, request.resource.data);
        allow update: if canAccessCommunicationSubcollection($1, resource == null ? null : resource.data);
        allow delete: if isAdmin();
      }
    }`);
}

// Fix whiteboards (subcollections need same check)
const whiteboardCollections = ['whiteboards'];
for (const col of whiteboardCollections) {
    const regex = new RegExp(`match /${col}/\\{([a-zA-Z0-9_]+)\\} \\{[\\s\\S]*?match /\\{allSubcollections=\\*\\*\\} \\{[\\s\\S]*?\\}\\s*\\}`, 'g');
    cleanRules = cleanRules.replace(regex, `match /${col}/{$1} {
      allow read: if isCommunicationParticipant($1, resource == null ? null : resource.data);
      allow write: if isCommunicationParticipant($1, resource == null ? null : resource.data) || isCommunicationParticipant($1, request.resource.data);
      match /{allSubcollections=**} {
        allow read: if canAccessCommunicationSubcollection($1, resource == null ? null : resource.data);
        allow write: if canAccessCommunicationSubcollection($1, resource == null ? null : resource.data) || canAccessCommunicationSubcollection($1, request.resource.data);
      }
    }`);
}

const whiteboardMeta = ['whiteboardMeta', 'whiteboardDocs', 'whiteboardStrokes'];
for (const col of whiteboardMeta) {
    const regex = new RegExp(`match /${col}/\\{([a-zA-Z0-9_]+)\\} \\{[\\s\\S]*?\\}`, 'g');
    cleanRules = cleanRules.replace(regex, `match /${col}/{$1} {
      allow read: if isCommunicationParticipant($1, resource == null ? null : resource.data);
      allow write: if isCommunicationParticipant($1, resource == null ? null : resource.data) || isCommunicationParticipant($1, request.resource.data);
    }`);
}


fs.writeFileSync('firestore.rules', cleanRules);
console.log('Fixed firestore.rules successfully');
