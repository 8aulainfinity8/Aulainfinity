const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const helperFunctions = `
    function isEnrolledInCourse(courseId) {
      return isVerifiedUser() && request.auth.token.role == 'student' &&
             courseId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('enrolledCourseIds', []);
    }

    function isTeacherOfCourse(courseId) {
      return isVerifiedUser() && request.auth.token.role == 'teacher' && (
        courseId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('taughtCourseIds', []) ||
        courseId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('coursesTaughtIds', []) ||
        courseId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('levels', [])
      );
    }
`;

// Insert helper functions after isIdParticipant
rules = rules.replace(/    function isIdParticipant\(id\) \{[\s\S]*?    \}/, match => match + '\n' + helperFunctions);

// Replace match /firestore_course_messages/{msgId}
const newCourseMessagesRule = `
    match /firestore_course_messages/{msgId} {
       allow read: if isVerifiedUser() && (
         isAdmin() ||
         isEnrolledInCourse(resource.data.courseId) ||
         isTeacherOfCourse(resource.data.courseId)
       );
       allow create: if isVerifiedUser() && (
         isAdmin() ||
         isEnrolledInCourse(request.resource.data.courseId) ||
         isTeacherOfCourse(request.resource.data.courseId)
       );
       allow update: if isVerifiedUser() && (
         isAdmin() ||
         (isEnrolledInCourse(resource.data.courseId) && request.resource.data.courseId == resource.data.courseId) ||
         (isTeacherOfCourse(resource.data.courseId) && request.resource.data.courseId == resource.data.courseId)
       );
       allow delete: if isVerifiedUser() && (
         isAdmin() ||
         isEnrolledInCourse(resource.data.courseId) ||
         isTeacherOfCourse(resource.data.courseId)
       );
    }
`;

rules = rules.replace(/    match \/firestore_course_messages\/\{msgId\} \{[\s\S]*?    \}/, newCourseMessagesRule.trim());

// Update whiteboards rules
const newWhiteboardsRule = `
    match /whiteboards/{whiteboardId} {
      allow read, write: if isVerifiedUser() && (
        isAdmin() || 
        isApprovedTeacher() ||
        isIdParticipant(whiteboardId) || 
        isParticipant(resource.data) || 
        isEnrolledInCourse(whiteboardId) ||
        isTeacherOfCourse(whiteboardId)
      );
      match /{allSubcollections=**} {
        allow read, write: if isVerifiedUser() && (
          isAdmin() || 
          isApprovedTeacher() ||
          isIdParticipant(whiteboardId) || 
          isParticipant(resource.data) || 
          isEnrolledInCourse(whiteboardId) ||
          isTeacherOfCourse(whiteboardId)
        );
      }
    }
`;

rules = rules.replace(/    match \/whiteboards\/\{whiteboardId\} \{[\s\S]*?      \}\n    \}/, newWhiteboardsRule.trim());

fs.writeFileSync('firestore.rules', rules);
console.log('firestore.rules updated');
