        // ─── AUTH LOGIC ───
        auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            if (user) {
                // Check role in firestore
                const doc = await db.collection('usuarios').doc(user.uid).get();
                if (doc.exists) {
                    currentUserRole = doc.data().rol;
                } else {
                    currentUserRole = 'estudiante'; // fallback
                    await db.collection('usuarios').doc(user.uid).set({ rol: 'estudiante', nombre: user.displayName || 'Estudiante', email: user.email });
                }
                
                // Update UI
                document.getElementById('btn-login').style.display = 'none';
                document.getElementById('user-profile').style.display = 'flex';
                document.getElementById('user-name').textContent = (user.displayName || user.email.split('@')[0]).substring(0,10);
                document.getElementById('user-avatar').textContent = (user.displayName || user.email)[0].toUpperCase();
                document.getElementById('user-role-display').textContent = currentUserRole.charAt(0).toUpperCase() + currentUserRole.slice(1);
                
                closeAuthModal();
                if (notifOpen) loadNotifications();
                // Rerender projects to show delete buttons if applicable
                if (projects.length > 0) renderProjects(projects);
                // Refresh "Mis Publicaciones" now that we know the logged-in user
                updateMyUploads();
            } else {
                currentUserRole = 'visitante';
                document.getElementById('btn-login').style.display = 'flex';
                document.getElementById('user-profile').style.display = 'none';
                document.getElementById('user-menu').style.display = 'none';
                if (projects.length > 0) renderProjects(projects); // Hide delete buttons
            }
        });

        function openAuthModal() { document.getElementById('auth-overlay').style.display = 'flex'; }
        function closeAuthModal() { document.getElementById('auth-overlay').style.display = 'none'; }
        function switchAuthTab(tab) {
            document.getElementById('form-login').style.display = tab==='login' ? 'block' : 'none';
            document.getElementById('form-register').style.display = tab==='register' ? 'block' : 'none';
            document.getElementById('tab-login').style.background = tab==='login' ? 'white' : '#f8fafc';
            document.getElementById('tab-login').style.borderBottomColor = tab==='login' ? 'var(--navy)' : 'transparent';
            document.getElementById('tab-login').style.color = tab==='login' ? 'var(--navy)' : '#94a3b8';
            document.getElementById('tab-register').style.background = tab==='register' ? 'white' : '#f8fafc';
            document.getElementById('tab-register').style.borderBottomColor = tab==='register' ? 'var(--navy)' : 'transparent';
            document.getElementById('tab-register').style.color = tab==='register' ? 'var(--navy)' : '#94a3b8';
        }
        function toggleUserMenu() {
            const m = document.getElementById('user-menu');
            m.style.display = m.style.display === 'none' ? 'block' : 'none';
        }

        async function loginWithEmail() {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;
            if(!email || !pass) return showToast("Error", "Completa los campos");
            try { await auth.signInWithEmailAndPassword(email, pass); showToast("Éxito", "Sesión iniciada"); } catch(e) { showToast("Error", e.message); }
        }

        async function registerWithEmail() {
            const name = document.getElementById('reg-name').value;
            const role = document.getElementById('reg-role').value;
            const email = document.getElementById('reg-email').value;
            const pass = document.getElementById('reg-pass').value;
            if(!name || !email || !pass) return showToast("Error", "Completa los campos");
            try {
                const cred = await auth.createUserWithEmailAndPassword(email, pass);
                await cred.user.updateProfile({ displayName: name });
                await db.collection('usuarios').doc(cred.user.uid).set({
                    nombre: name, email: email, rol: role, fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                });
                showToast("Éxito", "Cuenta creada exitosamente");
            } catch(e) { showToast("Error", e.message); }
        }

        async function loginWithGoogle() {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                const doc = await db.collection('usuarios').doc(result.user.uid).get();
                if (!doc.exists) {
                    await db.collection('usuarios').doc(result.user.uid).set({
                        nombre: result.user.displayName, email: result.user.email, rol: 'estudiante', fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                showToast("Éxito", "Sesión iniciada con Google");
            } catch(e) { showToast("Error", e.message); }
        }

        async function logout() {
            await auth.signOut();
            toggleUserMenu();
            showToast("Sesión cerrada", "Has cerrado tu sesión.");
        }

