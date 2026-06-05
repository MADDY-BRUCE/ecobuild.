import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './src/firebase';

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error('Usage: npx tsx create-center.ts <email> <password> "<center name>"');
    process.exit(1);
  }

  const [email, password, centerName] = args;

  console.log(`Setting up recycling center user: ${email}...`);

  try {
    let uid = '';
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`User created in Firebase Auth with UID: ${uid}`);
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        console.log('User already exists in Firebase Auth. Signing in instead to complete setup...');
        const cred = await signInWithEmailAndPassword(auth, email, password);
        uid = cred.user.uid;
        console.log(`Signed in successfully with UID: ${uid}`);
      } else {
        throw authErr;
      }
    }

    console.log(`Writing profile to Firestore recyclingCenters collection...`);
    await setDoc(doc(db, 'recyclingCenters', uid), {
      name: centerName,
      email,
      role: 'recycling-center',
      uid,
      createdAt: serverTimestamp()
    });

    console.log('Profile created successfully in Firestore!');

    // Sign out to clean up local auth state
    await signOut(auth);
    console.log('Done!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error creating recycling center:', error.message || error);
    process.exit(1);
  }
}

main();
