        // ─── CONTACT MODAL ───
        function openContactModal(projectId, authorName) {
            if (!currentUser) {
                showToast("Acceso denegado", "Debes iniciar sesión para contactar estudiantes.");
                openAuthModal();
                return;
            }
            if (currentUserRole !== 'empresa') {
                showToast("Acceso denegado", "Solo las cuentas de Empresa pueden enviar propuestas (tienes rol de " + currentUserRole + ").");
                return;
            }
            const proj = projects.find(p => String(p.id) === String(projectId));
            if (!proj) return;

            // Fill student info panel
            document.getElementById('modal-project-id').value = projectId;
            document.getElementById('modal-student-name').textContent = proj.author + ' — ' + proj.career;
            document.getElementById('modal-student-email-hidden').value = proj.email || '';
            document.getElementById('modal-student-phone-hidden').value = proj.phone || '';

            // Email button
            const subject = encodeURIComponent('Oportunidad laboral — UNEFA Conecta');
            const body = encodeURIComponent(`Hola ${proj.author},\n\nNos llamó mucho la atención tu proyecto "${proj.title}" publicado en UNEFA Conecta.\n\nNos gustaría agendar una reunión para discutir una propuesta de colaboración.\n\nSaludos,`);
            document.getElementById('modal-btn-email').href = proj.email ? `mailto:${proj.email}?subject=${subject}&body=${body}` : '#';
            document.getElementById('modal-btn-email').style.opacity = proj.email ? '1' : '0.4';

            // WhatsApp button
            const waMsg = encodeURIComponent(`Hola ${proj.author}, vi tu proyecto "${proj.title}" en UNEFA Conecta y me gustaría hablar contigo sobre una oportunidad. ¿Podemos coordinar?`);
            const waPhone = (proj.phone || '').replace(/[^0-9]/g, '');
            document.getElementById('modal-btn-whatsapp').href = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : '#';
            document.getElementById('modal-btn-whatsapp').style.opacity = waPhone ? '1' : '0.4';

            // Pre-fill message
            document.getElementById('contact-message').value = `Hola ${proj.author}, nos llamó mucho la atención tu proyecto "${proj.title}". Nos gustaría agendar una reunión para discutir una propuesta de colaboración.`;

            document.getElementById('modal-overlay').classList.add('open');
        }

        function closeModal() { document.getElementById('modal-overlay').classList.remove('open'); }
        function closeModalOnOverlay(e) { if (e.target === document.getElementById('modal-overlay')) closeModal(); }

        async function handleContactSubmit(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button[type=submit]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
            const projId  = document.getElementById('modal-project-id').value;
            const company = document.getElementById('contact-company-name').value.trim();
            const emailEmpresa = document.getElementById('contact-email').value.trim();
            const tipo    = document.getElementById('contact-type').value;
            const mensaje = document.getElementById('contact-message').value.trim();
            const proj    = projects.find(p => String(p.id) === String(projId));
            try {
                await db.collection('solicitudes_contacto').add({
                    proyectoId:    projId,
                    proyectoTitulo: proj?.title || '',
                    autorNombre:   proj?.author || '',
                    autorEmail:    proj?.email || '',
                    empresa:       company,
                    emailEmpresa:  emailEmpresa,
                    tipo:          tipo,
                    mensaje:       mensaje,
                    fecha:         firebase.firestore.FieldValue.serverTimestamp(),
                    estado:        'pendiente'
                });
                closeModal();
                document.getElementById('contact-form').reset();
                showToast('¡Propuesta Registrada!', `Solicitud de "${tipo}" enviada a ${proj?.author || 'estudiante'} de parte de ${company}. El estudiante puede ver tus datos de contacto.`);
            } catch(err) {
                showToast('❌ Error', 'No se pudo registrar la propuesta. Verifica tu conexión.');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Registrar Propuesta';
            }
        }


        // ─── NOTIFICATIONS ───
        let notifOpen = false;
        async function toggleNotifications() {
            notifOpen = !notifOpen;
            const panel = document.getElementById('notif-panel');
            panel.style.display = notifOpen ? 'block' : 'none';
            if (notifOpen) {
                await loadNotifications();
            }
        }
        async function loadNotifications() {
            const list = document.getElementById('notif-list');
            if (!currentUser) {
                list.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:24px;">Inicia sesión para ver tus notificaciones.</p>';
                document.getElementById('notif-dot').style.display = 'none';
                return;
            }

            try {
                const snap = await db.collection('solicitudes_contacto')
                    .orderBy('fecha', 'desc')
                    .limit(25)
                    .get();

                let myNotifs = [];
                snap.forEach(doc => {
                    const d = doc.data();
                    if (currentUserRole === 'estudiante' && d.autorEmail === currentUser.email) {
                        myNotifs.push(d);
                    } else if (currentUserRole === 'empresa' && d.emailEmpresa === currentUser.email) {
                        myNotifs.push(d);
                    }
                });

                if (myNotifs.length === 0) {
                    list.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:24px;"><i class="fa-regular fa-bell-slash"></i><br>No tienes notificaciones aún</p>';
                    document.getElementById('notif-dot').style.display = 'none';
                    return;
                }

                document.getElementById('notif-dot').style.display = 'block';
                list.innerHTML = myNotifs.slice(0, 8).map(d => {
                    const fecha = d.fecha?.toDate ? d.fecha.toDate().toLocaleDateString('es-VE') : 'Reciente';
                    return `<div style="padding:10px 12px;border-radius:10px;border:1px solid #e2e8f0;margin-bottom:8px;background:#f8fafc;">
                        <div style="font-size:10px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px;">
                            <i class='fa-solid fa-handshake'></i> ${d.tipo || 'Propuesta'}
                        </div>
                        <div style="font-size:12px;font-weight:700;color:var(--navy);">${d.empresa || 'Empresa'}</div>
                        <div style="font-size:11px;color:#64748b;margin-top:2px;">contactó a <strong>${d.autorNombre || 'estudiante'}</strong></div>
                        <div style="font-size:10px;color:#94a3b8;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${d.proyectoTitulo || ''}">${(d.proyectoTitulo || '').substring(0,50)}...</div>
                        <div style="font-size:9px;color:#cbd5e1;margin-top:4px;">${fecha}</div>
                    </div>`;
                }).join('');
            } catch(e) {
                list.innerHTML = '<p style="text-align:center;color:#ef4444;font-size:12px;padding:20px;">Error al cargar notificaciones</p>';
            }
        }

        // ─── TOAST ───

        let toastTimer;
        function showToast(title, msg) {
            document.getElementById('toast-title').textContent = title;
            document.getElementById('toast-msg').textContent = msg;
            const t = document.getElementById('toast');
            t.classList.add('show');
            clearTimeout(toastTimer);
            toastTimer = setTimeout(hideToast, 5000);
        }
        function hideToast() { document.getElementById('toast').classList.remove('show'); }

