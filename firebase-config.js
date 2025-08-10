// Your web app's Firebase configuration
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3omHLxVU0spDOzh-w0n6aTD-A5qiXwB0",
    authDomain: "desimess-866fa.firebaseapp.com",
    projectId: "desimess-866fa",
    storageBucket: "desimess-866fa.appspot.com",
    messagingSenderId: "225505366962",
    appId: "1:225505366962:web:55d7247d78b4a28238caab",
    measurementId: "G-V73Q74TV6X"
};

let app, db;

try {
    // Initialize Firebase if not already initialized
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully");
    } else {
        app = firebase.app();
    }
    db = firebase.firestore();
    auth = firebase.auth();
    
    // Initialize Firestore with settings
    db = firebase.firestore();
    
    // Configure Firestore settings for better offline support
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        experimentalAutoDetectLongPolling: true
    });
    
    // Make db available globally
    window.db = db;
     window.auth = auth;
} catch (error) {
    console.error("Firebase initialization error:", error);
    alert("Failed to initialize Firebase. Please check the console for details.");
}




