        // ─── GLOBAL SEARCH ───
        let searchOpen = false;
        function toggleSearch() {
            searchOpen = !searchOpen;
            const overlay = document.getElementById('search-overlay');
            overlay.style.display = searchOpen ? 'flex' : 'none';
            if (searchOpen) {
                document.getElementById('global-search-input').focus();
                document.getElementById('global-search-results').innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:20px;">Escribe para buscar entre todos los proyectos...</p>';
            }
        }
        function closeSearchOnOverlay(e) {
            if (e.target === document.getElementById('search-overlay')) toggleSearch();
        }
        function runGlobalSearch(q) {
            const results = document.getElementById('global-search-results');
            if (!q.trim()) {
                results.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:20px;">Escribe para buscar entre todos los proyectos...</p>';
                return;
            }
            const term = q.toLowerCase();
            const matches = projects.filter(p =>
                (p.title||'').toLowerCase().includes(term) ||
                (p.author||'').toLowerCase().includes(term) ||
                (p.skills||'').toLowerCase().includes(term) ||
                (p.career||'').toLowerCase().includes(term) ||
                (p.summary||'').toLowerCase().includes(term)
            );
            if (matches.length === 0) {
                results.innerHTML = '<p style="text-align:center;color:#94a3b8;font-size:12px;padding:20px;">Sin resultados para "<strong>' + q + '</strong>"</p>';
                return;
            }
            results.innerHTML = matches.map(p => `
                <div style="padding:12px;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:8px;background:#f8fafc;cursor:pointer;transition:all 0.15s;"
                     onmouseover="this.style.background='#f0f7ff'" onmouseout="this.style.background='#f8fafc'"
                     onclick="toggleSearch(); showSection('empresas');">
                    <div style="font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">
                        <i class='fa-solid fa-graduation-cap'></i> ${p.career}
                    </div>
                    <div style="font-weight:700;font-size:13px;color:var(--navy);margin-bottom:2px;">${p.title}</div>
                    <div style="font-size:11px;color:#64748b;">Autor: <strong>${p.author}</strong> &bull; ${p.status}</div>
                    <div style="font-size:10.5px;color:#94a3b8;margin-top:4px;">${(p.skills||'').split(',').slice(0,4).map(s=>`<span style='background:#e2e8f0;padding:2px 7px;border-radius:5px;margin-right:3px;'>${s.trim()}</span>`).join('')}</div>
                </div>`).join('');
        }

