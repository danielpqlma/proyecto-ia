        // ─── DATA ───
        const defaultProjects = [
            { author: "Carlos Escalona", email: "c.escalona@unefa.edu.ve", phone: "+58 412 111 2233", career: "Ingeniería de Sistemas", title: "Optimización Inteligente del Almacenamiento de Redes con Ceph Distribuido", summary: "Esta investigación aborda la automatización del aprovisionamiento en la nube utilizando contenedores inteligentes. Se implementó un algoritmo genético en Python capaz de autogestionar y distribuir el almacenamiento según prioridades académicas, ahorrando hasta un 40% de infraestructura.", skills: "Python, Docker, Linux, Cloud Computing", status: "Disponible para Pasantías", date: "Mayo 2026", seeded: true },
            { author: "Yuliany Carrero", email: "y.carrero@unefa.edu.ve", phone: "+58 424 333 4455", career: "Ingeniería de Telecomunicaciones", title: "Prototipo IoT para Monitoreo de Parámetros Clínicos en Áreas Críticas", summary: "Sistema microcontrolado mediante ESP32 que recopila parámetros de pulso cardíaco y saturación de oxígeno, transmitiendo vía MQTT con protocolos cifrados. Ideal para la telemedicina en centros asistenciales rurales.", skills: "IoT, C++, MQTT, Electrónica, Telemedicina", status: "Ambos", date: "Abril 2026", seeded: true },
            { author: "Marcos Rodríguez", email: "m.rodriguez@unefa.edu.ve", phone: "+58 416 555 6677", career: "Ingeniería Civil / Mecánica", title: "Modelado Digital Estructural con Algoritmos Evolutivos para Optimización de Puentes", summary: "Aplicación de lógica algorítmica para determinar tensión exacta de materiales estructurales ante sismos. Diseñado bajo normas venezolanas de sismorresistencia para la modelación rápida de puentes y pasos de vías fluviales.", skills: "CAD, Python, Ingeniería Estructural, Análisis Sísmico", status: "Disponible para Contrato", date: "Junio 2026", seeded: true },
            { author: "Génesis Rivas", email: "g.rivas@unefa.edu.ve", phone: "+58 426 777 8899", career: "Administración de Desastres", title: "Plan Digitalizado de Evacuación Civil Frente a Fenómenos Climáticos Severos", summary: "Base de datos georreferenciada para simular movimientos masivos de personas en tiempo real frente a desbordamientos de ríos en comunidades vulnerables. Utiliza capas de geolocalización de libre acceso.", skills: "GIS, Gestión de Riesgos, Planificación Comunitaria, Análisis de Datos", status: "Disponible para Pasantías", date: "Mayo 2026", seeded: true }
        ];

        let projects = [];

        // ─── INIT ───
        document.addEventListener('DOMContentLoaded', () => {
            animateCounters();
            loadProjectsFromFirestore();
        });


        // ─── UPDATE REAL STATS ───
        async function updateStats() {
            // 1. Proyectos publicados
            const totalProjects = projects.length;
            animateStat('stat-projects', totalProjects);
            const projTrend = document.getElementById('stat-projects-trend');
            if (projTrend) projTrend.innerHTML = `<i class="fa-solid fa-file-lines"></i> ${totalProjects} publicado${totalProjects !== 1 ? 's' : ''}`;

            // 2. Carreras únicas
            const uniqueCareers = new Set(projects.map(p => p.career).filter(Boolean)).size;
            animateStat('stat-careers', 19);

            // 3. Empresas conectadas + Solicitudes de contacto desde Firestore
            try {
                const snap = await db.collection('solicitudes_contacto').get();
                const docs = snap.docs.map(d => d.data());

                const uniqueCompanies = new Set(docs.map(d => (d.empresa || '').trim().toLowerCase()).filter(Boolean)).size;
                animateStat('stat-companies', uniqueCompanies);
                const companyTrend = document.getElementById('stat-companies-trend');
                if (companyTrend) companyTrend.innerHTML = uniqueCompanies > 0
                    ? `<i class="fa-solid fa-building"></i> ${uniqueCompanies} empresa${uniqueCompanies !== 1 ? 's' : ''}`
                    : `<i class="fa-solid fa-minus"></i> Sin solicitudes aún`;

                animateStat('stat-internships', docs.length);
                const internTrend = document.getElementById('stat-internships-trend');
                if (internTrend) internTrend.innerHTML = docs.length > 0
                    ? `<i class="fa-solid fa-handshake"></i> ${docs.length} solicitud${docs.length !== 1 ? 'es' : ''}`
                    : `<i class="fa-solid fa-minus"></i> Sin solicitudes aún`;

            } catch (e) {
                animateStat('stat-companies', 0);
                animateStat('stat-internships', 0);
            }
        }

        function animateStat(id, target) {
            const el = document.getElementById(id);
            if (!el) return;
            let current = 0;
            const step = Math.max(1, target / (1200 / 16));
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = Math.floor(current);
                if (current >= target) { el.textContent = target; clearInterval(timer); }
            }, 16);
        }

        // ─── COUNTER ANIMATION ───
        function animateCounters() {
            document.querySelectorAll('.stat-num').forEach(el => {
                const target = parseInt(el.dataset.target);
                let current = 0;
                const step = target / (1600 / 16);
                const timer = setInterval(() => {
                    current = Math.min(current + step, target);
                    el.textContent = Math.floor(current);
                    if (current >= target) clearInterval(timer);
                }, 16);
            });
        }

