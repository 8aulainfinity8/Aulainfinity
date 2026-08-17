import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
  initializeApp();
}

getAuth().getUserByEmail('8aulainfinity8@gmail.com')
  .then(user => console.log('User:', user.uid))
  .catch(err => console.error('Error:', err.message));
