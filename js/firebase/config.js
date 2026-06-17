// ─── FIREBASE INIT ───
        const firebaseConfig = {
            apiKey: "AIzaSyDgmY7P2adOjYbq96LgJNc2WPTxtMsM7-U",
            authDomain: "unefa-conecta-32ac3.firebaseapp.com",
            projectId: "unefa-conecta-32ac3",
            storageBucket: "unefa-conecta-32ac3.firebasestorage.app",
            messagingSenderId: "435835948911",
            appId: "1:435835948911:web:6bb840325ae7488936a29a"
        };
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();
        let currentUser = null;
        let currentUserRole = 'visitante'; // visitante, estudiante, empresa

