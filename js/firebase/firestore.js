        // ─── LOAD FROM FIRESTORE ───
        async function loadProjectsFromFirestore() {
            try {
                const snap = await db.collection('proyectos').orderBy('createdAt', 'desc').get();
                if (snap.empty) {
                    // Seed default projects on first run
                    const batch = db.batch();
                    defaultProjects.forEach(p => {
                        const ref = db.collection('proyectos').doc();
                        batch.set(ref, { ...p, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
                    });
                    await batch.commit();
                    // Reload after seeding
                    return loadProjectsFromFirestore();
                }
                projects = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderProjects();
                updateMyUploads();
                updateStats();
            } catch (err) {
                console.error('Firestore error:', err);
                // Fallback to defaults if offline
                projects = defaultProjects.map((p, i) => ({ id: i + 1, ...p }));
                renderProjects();
                updateMyUploads();
                updateStats();
            }
        }


        // ─── FORM SUBMIT ───
        async function handleFormSubmit(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showToast("Acceso denegado", "Debes iniciar sesión para publicar una tesis.");
                openAuthModal();
                return;
            }
            if (currentUserRole !== 'estudiante') {
                showToast("Acceso denegado", "Solo los Estudiantes pueden publicar tesis (tienes rol de " + currentUserRole + ").");
                return;
            }

            const btn = document.getElementById('submit-btn');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publicando...';
            btn.disabled = true;
            
            const author = document.getElementById('form-author').value.trim();
            const email = document.getElementById('form-email').value.trim();
            const phone = document.getElementById('form-phone').value.trim();
            const career = document.getElementById('form-career').value;
            const title = document.getElementById('form-title').value.trim();
            const summary = document.getElementById('form-summary').value.trim();
            const skills = document.getElementById('form-skills').value.trim();
            const status = document.getElementById('form-status').value;
            const date = new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' });

            try {
                const docRef = await db.collection('proyectos').add({
                    author: author,
                    email: email,
                    phone: phone,
                    career: career,
                    title: title,
                    summary: summary,
                    skills: skills,
                    status: status,
                    date: date,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    uid: currentUser.uid
                });
                projects.unshift({ id: docRef.id, author, email, phone, career, title, summary, skills, status, date, uid: currentUser.uid });
                renderProjects();
                updateMyUploads();
                document.getElementById('project-form').reset();
                showToast('¡Publicado en la nube!', `"${title.substring(0, 45)}..." ya es visible para todas las empresas.`);
            } catch (err) {
                showToast('❌ Error', 'No se pudo guardar en la base de datos. Verifica tu conexión.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }

        // ─── MY UPLOADS ───
        function updateMyUploads() {
            // Show projects that belong to the current user (not the pre-seeded demo ones)
            const mine = projects.filter(p => !p.seeded && currentUser && p.uid === currentUser.uid);
            const container = document.getElementById('my-uploads');
            const countEl = document.getElementById('upload-count');
            if (countEl) countEl.textContent = mine.length;

            if (mine.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:24px 0; color:#94a3b8;">
            <i class="fa-solid fa-box-open" style="font-size:28px; color:#e2e8f0; display:block; margin-bottom:8px;"></i>
            <span style="font-size:12px; font-style:italic;">Aún no has registrado proyectos.</span>
        </div>`;
                return;
            }

            container.innerHTML = mine.map(p => `
        <div class="upload-item">
            <div class="upload-item-icon"><i class="fa-solid fa-file-lines"></i></div>
            <div style="flex:1; min-width:0;">
                <div style="font-size:12px; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.title}</div>
                <div style="font-size:10px; color:#94a3b8; margin-top:2px;">${p.career} · <span style="color:var(--navy-700); font-weight:600;">${p.status}</span></div>
            </div>
            <button onclick="deleteProject('${p.id}')" style="background:none; border:none; color:#cbd5e1; cursor:pointer; padding:4px 6px; border-radius:6px; transition:all 0.15s;" title="Eliminar"
                onmouseover="this.style.background='#fef2f2'; this.style.color='#ef4444';"
                onmouseout="this.style.background='none'; this.style.color='#cbd5e1';">
                <i class="fa-solid fa-trash-can" style="font-size:11px;"></i>
            </button>
        </div>`).join('');
        }

        async function deleteProject(id) {
            if (!confirm("¿Seguro que deseas eliminar este proyecto?")) return;
            try {
                await db.collection('proyectos').doc(id).delete();
                showToast("Proyecto eliminado", "Tu tesis ha sido borrada.");
                loadProjectsFromFirestore();
            } catch(e) {
                showToast("Error", "No se pudo eliminar el proyecto.");
            }
        }

