        // ─── RENDER PROJECTS ───
        function renderProjects(list = null) {
            const data = list ?? projects;
            const grid = document.getElementById('projects-grid');
            const noRes = document.getElementById('no-results');
            const countEl = document.getElementById('results-count');

            grid.innerHTML = '';
            noRes.classList.remove('show');

            if (countEl) countEl.textContent = data.length + ' proyecto' + (data.length !== 1 ? 's' : '');

            if (data.length === 0) { noRes.classList.add('show'); return; }

            data.forEach((proj, i) => {
                const chips = proj.skills.split(',').map(s =>
                    `<span class="skill-chip">${s.trim()}</span>`
                ).join('');

                let badge = '';
                if (proj.status === 'Disponible para Pasantías') badge = `<span class="status-badge status-pasantia"><i class="fa-solid fa-graduation-cap"></i> ${proj.status}</span>`;
                else if (proj.status === 'Disponible para Contrato') badge = `<span class="status-badge status-contrato"><i class="fa-solid fa-briefcase"></i> ${proj.status}</span>`;
                else badge = `<span class="status-badge status-ambos"><i class="fa-solid fa-arrows-left-right"></i> Ambos</span>`;

                grid.innerHTML += `
        <div class="project-card" style="animation:fadeSlideUp 0.4s ease-out ${i * 0.06}s both;">
            <div class="project-card-top"></div>
            <div class="project-card-body">
                <div style="display:flex; align-items:start; justify-content:space-between; gap:8px;">
                    <span style="font-size:11px; font-weight:700; color:rgba(10,35,66,0.6); display:flex; align-items:center; gap:5px;">
                        <i class="fa-solid fa-graduation-cap" style="color:var(--gold);"></i> ${proj.career}
                    </span>
                    <span style="font-size:10px; color:#94a3b8; font-weight:600; background:#f8fafc; padding:2px 8px; border-radius:6px; white-space:nowrap;">${proj.date || 'Jun 2026'}</span>
                </div>
                <div>
                    <h3 style="font-family:'Poppins',sans-serif; font-weight:700; font-size:13px; color:#1e293b; line-height:1.4; margin-bottom:4px;">${proj.title}</h3>
                    <p style="font-size:11px; color:#94a3b8; font-weight:500;">Autor: <span style="color:var(--navy); font-weight:700;">${proj.author}</span></p>
                </div>
                <p style="font-size:11.5px; color:#64748b; line-height:1.6; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">${proj.summary}</p>
                <div>${chips}</div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:10px; border-top:1px solid #f1f5f9; margin-top:auto;">
                    ${badge}
                    <div style="display:flex; gap:6px;">
                        ${(currentUser && proj.uid === currentUser.uid) ? `<button onclick="deleteProject('${proj.id}')" style="background:#fee2e2; color:#ef4444; border:none; border-radius:8px; padding:6px 10px; cursor:pointer;" title="Eliminar proyecto"><i class="fa-solid fa-trash"></i></button>` : ''}
                        <button class="btn-captar" onclick="openContactModal('${proj.id}', '${proj.author.replace(/'/g, '&apos;')}')">
                            <i class="fa-solid fa-handshake"></i> Captar
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
            });

            // Update badge
            const badge = document.getElementById('projects-badge');
            if (badge) badge.textContent = data.length;
        }


        // ─── FILTER ───
        function filterProjects() {
            const q = document.getElementById('search-input').value.toLowerCase();
            const career = document.getElementById('filter-career').value;
            const status = document.getElementById('filter-status').value;
            const filtered = projects.filter(p => {
                const s = (p.title + p.summary + p.author + p.skills + p.career).toLowerCase();
                return s.includes(q)
                    && (career === 'all' || p.career === career)
                    && (status === 'all' || p.status === status || p.status === 'Ambos');
            });
            renderProjects(filtered);
        }

