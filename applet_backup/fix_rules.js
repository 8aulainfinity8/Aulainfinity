const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(/id\.matches\('\^direct_'\ \+\ request\.auth\.uid \+\ '\(_\.\*\)\?\s*\/\/\s*Global Config \(Public read, Admin write\)/, `id.matches('^direct_' + request.auth.uid + '(_.*)?$') ||
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
    }

    // Global Config (Public read, Admin write)`);

fs.writeFileSync('firestore.rules', rules);
