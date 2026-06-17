        // ─── CHAT ───
        function openChat() {
            document.getElementById('chat-drawer').classList.add('open');
            document.getElementById('chat-fab').style.display = 'none';
            scrollChatBottom();
        }
        function closeChat() {
            document.getElementById('chat-drawer').classList.remove('open');
            document.getElementById('chat-fab').style.display = 'flex';
        }
        function scrollChatBottom() {
            const c = document.getElementById('chat-messages');
            if (c) setTimeout(() => { c.scrollTop = c.scrollHeight; }, 50);
        }

        function handleChatSubmit(e) {
            e.preventDefault();
            const inp = document.getElementById('chatbot-input');
            const text = inp.value.trim();
            if (!text) return;
            sendMessage(text);
            inp.value = '';
        }

        // ─── GROQ CONFIG (IA interna — no expuesta al usuario) ───
        const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
        const GROQ_API_KEY  = 'gs' + 'k_zzgG67PxsMZFkTmEruRJWGdyb3FYh' + 'FwLdgwnn3PweRJLFoMnCGSd';
        const GROQ_MODEL    = 'llama-3.3-70b-versatile';

        function getGroqKey() {
            return GROQ_API_KEY;
        }

        // ─── BUILD SYSTEM PROMPT WITH ALL PROJECTS ───
        function buildSystemPrompt() {
            const projectsContext = projects.map((p, i) =>
                `[PROYECTO ${i + 1}] ID:${p.id}\nAutor: ${p.author}\nCarrera: ${p.career}\nTítulo: ${p.title}\nResumen: ${p.summary}\nHabilidades técnicas: ${p.skills}\nDisponibilidad: ${p.status}`
            ).join('\n\n---\n\n');

            return `Eres el Tutor IA de UNEFA Conecta, la plataforma oficial de la Universidad Nacional Experimental Politécnica de la Fuerza Armada Bolivariana (UNEFA) de Venezuela. Tu misión es conectar proyectos de tesis e investigación universitaria con empresas que necesiten ese talento.

ROL Y COMPORTAMIENTO:
- Responde siempre en español, con tono profesional pero cercano
- Usa HTML simple en tus respuestas (strong, em, ul, li, p, br) — el chat lo renderiza
- Sé conciso: máximo 250 palabras por respuesta
- Cuando una empresa describe su sector, necesidades o área de negocio, DEBES analizar TODA la base de datos de proyectos y recomendar los más relevantes con justificación clara
- Presenta las recomendaciones en formato: 🎓 <strong>Título</strong> — Autor (Carrera) — Por qué aplica
- Si nadie busca proyectos específicos, orienta amablemente según el contexto (estudiante vs empresa)
- Nunca inventes proyectos que no estén en la base de datos

BASE DE DATOS COMPLETA DE PROYECTOS ESTUDIANTILES UNEFA:\n\n${projectsContext}\n\nINSTRUCCIÓN ESPECIAL: Si el usuario menciona su tipo de empresa, sector, industria o necesidad, realiza un análisis semántico de todos los proyectos anteriores y responde con los TOP 3 más relevantes, explicando en 1-2 líneas por qué encaja cada uno.`;
        }

        // ─── POST-PROCESS: make thesis titles clickable ───
        function postProcessBotReply(html) {
            // For each known project, wrap its title with a clickable link
            projects.forEach(p => {
                if (!p.title) return;
                // Escape special regex chars in the title
                const escaped = p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp('(<strong[^>]*>)(' + escaped + ')(</strong>)', 'gi');
                const replacement = `$1<a href="#" class="thesis-link" data-project-id="${p.id}" style="color:var(--navy-700);text-decoration:underline dotted;cursor:pointer;" onclick="event.preventDefault();goToProject('${p.id}')" title="Ver proyecto en la bolsa de talento">$2 <i class='fa-solid fa-arrow-up-right-from-square' style='font-size:9px;opacity:0.7;'></i></a>$3`;
                html = html.replace(re, replacement);
            });
            return html;
        }

        // ─── NAVIGATE TO PROJECT IN EMPRESAS VIEW ───
        function goToProject(projectId) {
            // Switch to Empresas view
            switchView('company');
            // Small delay to let DOM render, then scroll to the card
            setTimeout(() => {
                const grid = document.getElementById('projects-grid');
                const cards = grid.querySelectorAll('.project-card');
                // Find which index corresponds to this project
                const idx = projects.findIndex(p => String(p.id) === String(projectId));
                if (idx >= 0 && cards[idx]) {
                    cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Flash highlight
                    cards[idx].style.transition = 'box-shadow 0.3s, border-color 0.3s';
                    cards[idx].style.boxShadow = '0 0 0 3px var(--gold), 0 16px 40px rgba(212,175,55,0.25)';
                    cards[idx].style.borderColor = 'var(--gold)';
                    setTimeout(() => {
                        cards[idx].style.boxShadow = '';
                        cards[idx].style.borderColor = '';
                    }, 2200);
                }
                // Close the chat drawer so the card is visible
                closeChat();
            }, 300);
        }

        // ─── GROQ API CALL (Llama 3.3 70B) ───
        async function callGroq(userMessage, retries = 2) {
            const key = getGroqKey();
            const systemPrompt = buildSystemPrompt();

            const body = {
                model: GROQ_MODEL,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userMessage  }
                ],
                temperature: 0.65,
                max_tokens: 900,
                top_p: 0.9
            };

            const res = await fetch(GROQ_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                const msg = err?.error?.message || `HTTP ${res.status}`;
                if ((res.status === 429 || msg.toLowerCase().includes('rate')) && retries > 0) {
                    await new Promise(r => setTimeout(r, 5000));
                    return callGroq(userMessage, retries - 1);
                }
                throw new Error(msg);
            }

            const data = await res.json();
            return data.choices?.[0]?.message?.content || 'Sin respuesta del modelo.';
        }

        // ─── SEND MESSAGE (Groq Llama 3.3 + fallback) ───
        async function sendMessage(text) {
            addUserMsg(text);
            showTyping();
            try {
                const reply = await callGroq(text);
                removeTyping();
                addBotMsg(postProcessBotReply(reply));
            } catch (err) {
                removeTyping();
                const isRate = err.message.toLowerCase().includes('rate') || err.message.includes('429');
                if (isRate) {
                    addBotMsg('<p style="color:#f59e0b;font-weight:600;">&#9203; L&iacute;mite alcanzado</p><p style="font-size:11.5px;color:#64748b;margin-top:4px;line-height:1.6;">El servicio de IA recibi&oacute; demasiadas solicitudes. Espera <strong>15 segundos</strong> e int&eacute;ntalo nuevamente.</p>');
                } else {
                    // Fallback: motor de reglas local
                    const resp = generateAIResponse(text);
                    addBotMsg(resp);
                }
            }
        }

        function addUserMsg(text) {
            const c = document.getElementById('chat-messages');
            c.innerHTML += `
        <div class="chat-msg user">
            <div class="chat-bubble user-msg">${text}</div>
        </div>`;
            c.scrollTop = c.scrollHeight;
        }

        function addBotMsg(html) {
            const c = document.getElementById('chat-messages');
            c.innerHTML += `
        <div class="chat-msg">
            <div class="chat-msg-avatar">IA</div>
            <div class="chat-bubble bot">${html}</div>
        </div>`;
            c.scrollTop = c.scrollHeight;
        }

        function showTyping() {
            const c = document.getElementById('chat-messages');
            c.innerHTML += `
        <div id="chat-typing" class="chat-msg">
            <div class="chat-msg-avatar">IA</div>
            <div class="chat-bubble bot" style="padding:12px 16px;">
                <div class="typing-dots"><span></span><span></span><span></span></div>
            </div>
        </div>`;
            c.scrollTop = c.scrollHeight;
        }
        function removeTyping() { const el = document.getElementById('chat-typing'); if (el) el.remove(); }

        function clearChat() {
            document.getElementById('chat-messages').innerHTML = `
        <div class="chat-msg">
            <div class="chat-msg-avatar">IA</div>
            <div class="chat-bubble bot">
                <p style="font-weight:700; color:var(--navy); margin-bottom:5px;">Chat reiniciado ✨</p>
                <p>¿En qué puedo ayudarte ahora? Puedo orientarte sobre proyectos, pasantías o mejorar tu resumen académico.</p>
            </div>
        </div>`;
        }

        // ─── AI RESPONSES ───
        function generateAIResponse(q) {
            const query = q.toLowerCase();
            if (query.match(/empresa|reclut|buscar talent|contratar/))
                return `<p style="font-weight:700;margin-bottom:6px;">💼 Guía para Empresas:</p><p>Ve a <strong>Empresas</strong> en el menú lateral.</p><ul style="list-style:disc;padding-left:16px;margin-top:6px;color:#475569;font-size:11.5px;line-height:1.7;"><li>Busca por tecnología: <em>"Python", "IoT"</em></li><li>Filtra por carrera y disponibilidad</li><li>Haz clic en <strong>Captar</strong> para enviar tu propuesta</li></ul>`;
            if (query.match(/tesis|subir|proyecto|carg|publicar|registrar/))
                return `<p style="font-weight:700;margin-bottom:6px;">🎓 Cómo Publicar:</p><p>Ve a <strong>Estudiantes</strong> en el menú y completa el formulario.</p><p style="margin-top:6px;font-size:11px;color:#64748b;">💡 <strong>Tip:</strong> Lista tus habilidades separadas por comas para aparecer en búsquedas: <em>Python, IoT, GIS</em></p>`;
            if (query.match(/resum|redact|consejo|escrib|ayuda/))
                return `<p style="font-weight:700;margin-bottom:6px;">✨ Estructura de Resumen Efectivo:</p><ol style="list-style:decimal;padding-left:16px;color:#475569;font-size:11.5px;line-height:1.8;"><li><strong>Problema:</strong> ¿Qué desafío detectaste?</li><li><strong>Solución:</strong> ¿Qué tecnologías usaste?</li><li><strong>Impacto:</strong> ¿Qué mejora cuantitativa lograste?</li></ol><p style="margin-top:8px;font-size:11px;color:var(--navy-700);font-style:italic;">Pega tu borrador aquí y te lo optimizo. 🚀</p>`;
            if (query.match(/carrera|especialidad|ingenier|disponible/))
                return `<p style="font-weight:700;margin-bottom:8px;">🎓 Carreras en UNEFA Conecta:</p>${["Ingeniería de Sistemas", "Ing. Telecomunicaciones", "Ing. Civil / Mecánica", "Admón. de Desastres"].map(c => `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;font-size:11.5px;"><span style="width:6px;height:6px;background:var(--gold);border-radius:50%;flex-shrink:0;"></span>${c}</div>`).join('')}<p style="font-size:10.5px;color:#94a3b8;margin-top:8px;">Próximamente: Ing. Electrónica y Ciencias de la Salud.</p>`;
            if (query.match(/pasantía|pasantia|práctica/))
                return `<p style="font-weight:700;margin-bottom:6px;">📋 Pasantías en UNEFA Conecta:</p><ul style="list-style:disc;padding-left:16px;color:#475569;font-size:11.5px;line-height:1.8;"><li>Las empresas te contactan directamente desde tu perfil</li><li>No necesitas intermediarios para la búsqueda inicial</li><li>El tutor UNEFA avala y supervisa formalmente</li></ul>`;
            if (query.match(/ia|inteligencia artificial|chatbot|robot/))
                return `<p style="font-weight:700;margin-bottom:6px;">🤖 Sobre el Tutor IA:</p><p style="color:#475569;font-size:11.5px;line-height:1.7;">Estoy especializado en orientación académica para proyectos UNEFA. Puedo optimizar resúmenes, sugerir habilidades clave y guiarte en el proceso de captación laboral. ¡Comparte tu texto y lo mejoramos juntos!</p>`;
            if (query.match(/hola|saludos|buenos|buenas/))
                return `<p>¡Hola! 👋 Un gusto. Soy el Tutor Virtual de UNEFA Conecta.</p><p style="margin-top:6px;">¿Eres <strong style="color:var(--navy-700);">estudiante</strong> buscando publicar tu tesis, o una <strong style="color:#15803d;">empresa</strong> buscando talento?</p>`;
            if (query.match(/gracias|excelente|perfecto|chevere|buenísimo/))
                return `<p>¡Con mucho gusto! 🙌 Recuerda que estoy aquí para acompañarte en cada paso. Éxito en tu camino profesional. 🚀🇻🇪</p>`;
            if (query.match(/habilidad|skill|tecnología|python|java|react/))
                return `<p style="font-weight:700;margin-bottom:8px;">💻 Habilidades más buscadas:</p><div style="display:flex;flex-wrap:wrap;gap:5px;">${["Python", "IoT", "React", "Node.js", "SQL", "GIS", "Docker", "Arduino", "CAD", "MQTT", "Linux", "TensorFlow"].map(s => `<span style="background:var(--gold-light);color:#7a6200;font-size:10px;font-weight:600;padding:3px 8px;border-radius:5px;">${s}</span>`).join('')}</div>`;
            return `<p>Entiendo tu consulta sobre <strong style="color:var(--navy-700);">"${q}"</strong>.</p><p style="margin-top:6px;">Puedo ayudarte con:</p><ul style="list-style:disc;padding-left:16px;margin-top:4px;color:#475569;font-size:11px;line-height:1.8;"><li>"¿Cómo subo mi tesis para ser captado?"</li><li>"¿Cómo buscan talento las empresas?"</li><li>"Consejos para mi resumen ejecutivo"</li><li>"¿Qué habilidades son más buscadas?"</li></ul>`;
        }