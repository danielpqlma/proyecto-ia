        // ─── VIEW SWITCHING ───
        const viewConfig = {
            home: { section: 'Inicio', title: 'Panel Principal' },
            student: { section: 'Estudiantes', title: 'Registrar Proyecto' },
            company: { section: 'Biblioteca', title: 'Bolsa de Talento' }
        };

        function switchView(id) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById('view-' + id).classList.add('active');

            document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
            const navBtn = document.getElementById('nav-' + id);
            if (navBtn) navBtn.classList.add('active');

            const cfg = viewConfig[id] || {};
            document.getElementById('topbar-section').textContent = cfg.section || id;
            document.getElementById('topbar-title').textContent = cfg.title || id;

            // Reset scroll to top so no blank space appears when switching views
            const body = document.querySelector('.page-body');
            if (body) body.scrollTop = 0;

            closeSidebar();
        }

        // ─── SIDEBAR (mobile) ───
        function toggleSidebar() {
            document.getElementById('sidebar').classList.toggle('mobile-open');
            document.getElementById('sidebar-overlay').classList.toggle('show');
        }
        function closeSidebar() {
            document.getElementById('sidebar').classList.remove('mobile-open');
            document.getElementById('sidebar-overlay').classList.remove('show');
        }

