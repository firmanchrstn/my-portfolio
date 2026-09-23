/**
 * MOBILE JKN — QUEUE SYSTEM ENHANCEMENT PROTOTYPE
 * Simulated backend API, ML wait-time prediction and rule-based WA triggers.
 * Not offline-first: network errors surface a banner and stale data is masked.
 */
(() => {
    'use strict';

    /* ----------------------------- CONFIG ----------------------------- */
    const BUFFER = 10;              // safety buffer (minutes)
    const POLL_MS = 4000;           // backend sync interval
    const TICK_MS = 2500;           // queue progression interval
    const LATE_MS = 8000;           // called -> late timeout
    const HISTORY_LIMIT = 9;

    const POLI = {
        umum:      { label: 'Poli Umum',      avg: 6, code: 'UM' },
        anak:      { label: 'Poli Anak',      avg: 8, code: 'AN' },
        gigi:      { label: 'Poli Gigi',      avg: 5, code: 'GI' },
        mata:      { label: 'Poli Mata',      avg: 7, code: 'MT' },
        kandungan: { label: 'Poli Kandungan', avg: 9, code: 'KD' }
    };

    const STATUS_LABEL = {
        empty: 'Belum Ambil',
        waiting: 'Menunggu',
        called: 'Dipanggil',
        late: 'Terlambat',
        done: 'Selesai'
    };

    const RULE_META = {
        belum:     { label: 'Belum perlu berangkat', tone: 'waiting' },
        siap:      { label: 'Siap-siap berangkat',   tone: 'called' },
        berangkat: { label: 'Berangkat sekarang',    tone: 'late' }
    };

    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const $ = (id) => document.getElementById(id);
    const pad = (n) => String(n).padStart(2, '0');
    const nowTime = () => new Date().toTimeString().slice(0, 8);

    /* ----------------------------- STATE ------------------------------ */
    const state = {
        poli: 'umum',
        patientNumber: null,
        servedNumber: 15,
        remaining: 0,
        status: 'empty',           // empty | waiting | called | late | done
        waOptIn: false,
        waSubscribed: false,
        running: true,
        speed: 1,
        travel: 18,
        lastUpdate: null,
        lastRule: null,
        lastEta: null,
        lastWaRule: null,
        calledAt: null
    };

    /* --------------------------- ELEMENTS ----------------------------- */
    const els = {
        // tabs
        tabs: Array.from(document.querySelectorAll('.study-tab')),
        panels: Array.from(document.querySelectorAll('.tab-panel')),

        // phone
        clock: $('phone-clock'),
        connBanner: $('conn-banner'),
        connRetry: $('conn-retry'),
        staleHint: $('stale-hint'),
        patientNumber: $('patient-number'),
        servedNumber: $('served-number'),
        remainingCount: $('remaining-count'),
        etaMinutes: $('eta-minutes'),
        queueStatus: $('queue-status'),
        takeCard: $('take-card'),
        patientName: $('patient-name'),
        btnTake: $('btn-take'),
        optinCard: $('optin-card'),
        waToggle: $('wa-toggle'),
        waPhone: $('wa-phone'),
        phoneInput: $('phone-input'),
        waStatus: $('wa-status'),
        calledActions: $('called-actions'),
        btnServed: $('btn-confirm-served'),
        historyList: $('history-list'),
        lastUpdate: $('last-update'),

        // engine
        aiPoli: $('ai-poli'),
        aiHour: $('ai-hour'),
        aiAvg: $('ai-avg'),
        aiRemaining: $('ai-remaining'),
        predMinutes: $('pred-minutes'),
        travelMinutes: $('travel-minutes'),
        formula: $('formula'),
        ruleChip: $('rule-chip'),
        ruleNote: $('rule-note'),
        waPreview: $('wa-preview'),

        // controls
        poliSelect: $('poli-select'),
        travelRange: $('travel-range'),
        travelOutput: $('travel-output'),
        speedSelect: $('speed-select'),
        btnRun: $('btn-toggle-run'),
        runLabel: $('run-label'),
        btnSkip: $('btn-skip'),
        btnReset: $('btn-reset'),
        netSim: $('net-sim'),

        // wa log
        waLogList: $('wa-log-list')
    };

    /* --------------------------- API (MOCK) --------------------------- */
    const isOffline = () => els.netSim.checked ||
        (typeof navigator !== 'undefined' && navigator.onLine === false);

    const api = {
        /** ML inference: predicted wait time (min) from remaining + hour + poli history. */
        async predictWait() {
            await delay(180 + Math.random() * 320);
            if (isOffline()) throw new Error('NETWORK_OFFLINE');
            const cfg = POLI[state.poli];
            const hour = new Date().getHours();
            const factor = hour >= 8 && hour < 11 ? 1.25
                : hour >= 11 && hour < 14 ? 1.1
                : hour >= 14 && hour < 17 ? 0.9 : 0.8;
            const jitter = 1 + (Math.random() * 0.24 - 0.12);
            return Math.max(2, Math.round(state.remaining * cfg.avg * factor * jitter));
        },

        /** Google Maps (mock): travel time t_travel in minutes. */
        async getTravelTime() {
            await delay(120 + Math.random() * 220);
            if (isOffline()) throw new Error('NETWORK_OFFLINE');
            const jitter = 1 + (Math.random() * 0.2 - 0.1);
            return Math.max(2, Math.round(state.travel * jitter));
        },

        /** Rule-based trigger decision. */
        async evaluateRule(predicted, travel) {
            await delay(80 + Math.random() * 100);
            if (isOffline()) throw new Error('NETWORK_OFFLINE');
            const depart = predicted - (travel + BUFFER);
            const name = (els.patientName.value || 'Bapak/Ibu').trim();
            let rule, message;
            if (depart > 30) {
                rule = 'belum';
                message = null;
            } else if (depart >= 10) {
                rule = 'siap';
                message = `Halo ${name}, sisa ${state.remaining} pasien sebelum giliran Anda. ` +
                    `Estimasi panggil ±${predicted} menit. Sisa ${depart} menit sampai batas aman — siapkan diri Anda, ya!`;
            } else {
                rule = 'berangkat';
                message = `Halo ${name}, sisa ${state.remaining} pasien sebelum giliran Anda. ` +
                    `Estimasi panggil ±${predicted} menit. Disarankan berangkat SEKARANG agar tidak kehilangan giliran.`;
            }
            return { depart, rule, message };
        },

        /** WhatsApp Gateway (mock). */
        async sendWhatsApp(text) {
            await delay(160 + Math.random() * 260);
            if (isOffline()) throw new Error('NETWORK_OFFLINE');
            return { id: 'WA-' + Math.floor(1000 + Math.random() * 9000) };
        }
    };

    /* --------------------------- RENDERING ---------------------------- */
    const setStatus = (status) => {
        state.status = status;
        els.queueStatus.setAttribute('data-status', status);
        els.queueStatus.textContent = STATUS_LABEL[status];
    };

    const fmtNumber = () => state.patientNumber == null
        ? '—'
        : `${POLI[state.poli].code}-${String(state.patientNumber).padStart(3, '0')}`;

    const renderDashboard = (eta) => {
        els.patientNumber.textContent = fmtNumber();
        els.servedNumber.textContent = state.servedNumber > 0 ? `A-${String(state.servedNumber).padStart(3, '0')}` : '—';

        if (state.status === 'empty') {
            els.remainingCount.textContent = '—';
            els.etaMinutes.textContent = '—';
        } else {
            els.remainingCount.textContent = state.remaining;
            els.etaMinutes.textContent = eta == null ? '—' : `±${eta} mnt`;
        }

        const stale = isOffline();
        els.remainingCount.classList.toggle('is-stale', stale && state.status !== 'empty');
        els.etaMinutes.classList.toggle('is-stale', stale);
    };

    const renderEngine = (pred, travel, rule) => {
        const hour = new Date().getHours();
        els.aiPoli.textContent = POLI[state.poli].label;
        els.aiHour.textContent = `${pad(hour)}:00 (${hour >= 12 ? 'siang' : 'pagi'})`;
        els.aiAvg.textContent = `${POLI[state.poli].avg} mnt`;
        els.aiRemaining.textContent = `${state.remaining} pasien`;

        if (isOffline()) {
            els.predMinutes.textContent = '—';
            els.travelMinutes.textContent = '—';
            els.predMinutes.classList.add('is-stale');
            els.travelMinutes.classList.add('is-stale');
            els.formula.innerHTML = 'waktu_berangkat = <strong>—</strong>';
            els.ruleChip.setAttribute('data-status', 'empty');
            els.ruleChip.textContent = 'Data offline';
            els.ruleNote.textContent = 'Koneksi terputus — prediksi tidak diperbarui untuk mencegah data basi.';
            els.waPreview.hidden = true;
            return;
        }

        if (state.status === 'empty') {
            els.predMinutes.textContent = '—';
            els.travelMinutes.textContent = '—';
            els.predMinutes.classList.remove('is-stale');
            els.travelMinutes.classList.remove('is-stale');
            els.formula.innerHTML = 'waktu_berangkat = <strong>—</strong>';
            els.ruleChip.setAttribute('data-status', 'empty');
            els.ruleChip.textContent = 'Menunggu antrean';
            els.ruleNote.textContent = 'Ambil nomor antrean untuk melihat kalkulasi rekomendasi waktu berangkat.';
            els.waPreview.hidden = true;
            return;
        }

        els.predMinutes.classList.remove('is-stale');
        els.travelMinutes.classList.remove('is-stale');
        els.predMinutes.textContent = `±${pred}`;
        els.travelMinutes.textContent = `${travel}`;
        els.formula.innerHTML = `waktu_berangkat = <strong>${pred}</strong> − (${travel} + ${BUFFER}) = <strong>${rule.depart} mnt</strong>`;

        const meta = RULE_META[rule.rule];
        els.ruleChip.setAttribute('data-status', meta.tone);
        els.ruleChip.textContent = meta.label;
        els.ruleNote.innerHTML = rule.rule === 'belum'
            ? `Waktu berangkat <strong>${rule.depart} menit</strong> &gt; 30 — Anda masih aman di rumah, tanpa notifikasi.`
            : rule.rule === 'siap'
                ? `Waktu berangkat <strong>${rule.depart} menit</strong> berada di rentang 10–30 — dikirim WA untuk bersiap.`
                : `Waktu berangkat <strong>${rule.depart} menit</strong> &lt; 10 — dikirim WA untuk segera berangkat.`;

        els.waPreview.hidden = !rule.message;
        if (rule.message) {
            const head = state.waOptIn
                ? 'Pratinjau pesan via WhatsApp'
                : 'WhatsApp nonaktif — pesan dilewati';
            els.waPreview.innerHTML =
                `<div class="wa-preview__head"><span class="material-symbols-rounded">chat</span>${head}</div>` +
                `${rule.message}`;
        }
    };

    const addHistory = (parts) => {
        if (els.historyList.querySelector('.history-empty')) {
            els.historyList.innerHTML = '';
        }
        const li = document.createElement('li');
        li.innerHTML = `<strong>${nowTime()}</strong> — ${parts.join(' · ')}`;
        els.historyList.prepend(li);
        while (els.historyList.children.length > HISTORY_LIMIT) {
            els.historyList.lastElementChild.remove();
        }
    };

    const addWaLog = (text, sent) => {
        const empty = els.waLogList.querySelector('.wa-log-empty');
        if (empty) empty.remove();
        const li = document.createElement('li');
        li.innerHTML =
            `<span class="wa-ico material-symbols-rounded ${sent ? 'is-sent' : 'is-skipped'}">${sent ? 'chat' : 'block'}</span>` +
            `<div><span class="wa-time">${nowTime()} → ${els.phoneInput.value || 'WhatsApp'}</span>` +
            `<span class="wa-msg">${text}</span></div>`;
        els.waLogList.prepend(li);
        while (els.waLogList.children.length > 12) {
            els.waLogList.lastElementChild.remove();
        }
    };

    /* --------------------------- ERROR (BANNER) ----------------------- */
    const openBanner = () => {
        els.connBanner.hidden = false;
        els.staleHint.hidden = false;
        renderEngine(null, null, null);
        if (state.lastUpdate) {
            els.lastUpdate.textContent = `Terakhir sinkron: ${state.lastUpdate}`;
        }
    };

    const closeBanner = () => {
        els.connBanner.hidden = true;
        const now = Date.now();
        if (state.lastUpdate && now - state.lastUpdate > POLL_MS + 1800) {
            els.staleHint.hidden = false;
        } else {
            els.staleHint.hidden = true;
        }
    };

    /* --------------------------- SYNC (POLL) -------------------------- */
    const prevEta = { eta: null };

    async function refresh() {
        if (!state.running) return;
        if (state.status === 'empty') {
            els.lastUpdate.textContent = 'Menunggu antrean diambil…';
            return;
        }
        if (state.status === 'done') {
            state.lastUpdate = nowTime();
            els.lastUpdate.textContent = `Update: ${state.lastUpdate}`;
            closeBanner();
            return;
        }

        try {
            const pred = await api.predictWait();
            const travel = await api.getTravelTime();
            const rule = await api.evaluateRule(pred, travel);

            state.lastUpdate = nowTime();
            state.lastRule = rule.rule;
            els.lastUpdate.textContent = `Update: ${state.lastUpdate}`;
            closeBanner();

            renderDashboard(pred);
            renderEngine(pred, travel, rule);

            addHistory([
                `Sisa <strong>${state.remaining}</strong> pasien`,
                `Estimasi ±${pred} mnt · <span class="rule-tag">${RULE_META[rule.rule].label}</span>`
            ]);

            // only send WA on rule transition while waiting, not every poll
            if (state.status === 'waiting' && state.waOptIn && rule.message &&
                rule.rule !== 'belum' && rule.rule !== state.lastWaRule) {
                const res = await api.sendWhatsApp(rule.message);
                addWaLog(rule.message, true);
                addHistory([`WhatsApp terkirim (<span class="rule-tag">${RULE_META[rule.rule].label}</span>)`]);
                state.lastWaRule = rule.rule;
            }
        } catch (err) {
            openBanner();
        }
    }

    /* --------------------------- QUEUE TICK --------------------------- */
    function tickQueue() {
        if (!state.running || state.status !== 'waiting') return;
        state.remaining = Math.max(0, state.remaining - state.speed);
        state.servedNumber += state.speed;

        if (state.remaining <= 0) {
            state.remaining = 0;
            setStatus('called');
            state.calledAt = Date.now();
            renderDashboard(null);
            addHistory([`Nomor <strong>${fmtNumber()}</strong> dipanggil — silakan menuju loket`]);
            if (state.waOptIn) {
                const msg = `Panggilan: Nomor ${fmtNumber()} Anda dipanggil di ${POLI[state.poli].label}. Silakan menuju loket pendaftaran.`;
                api.sendWhatsApp(msg).then(() => {
                    addWaLog(msg, true);
                    addHistory(['WhatsApp terkirim (nomor Anda dipanggil)']);
                }).catch(() => openBanner());
            }
            clearTimeout(state.lateTimer);
            state.lateTimer = setTimeout(() => {
                if (state.status === 'called') {
                    setStatus('late');
                    els.calledActions.hidden = false;
                    renderDashboard(null);
                    addHistory([`Giliran <strong>${fmtNumber()}</strong> terlewat (terlambat)`]);
                    if (state.waOptIn) {
                        api.sendWhatsApp(`Giliran ${fmtNumber()} Anda telah terlewat. Mohon hubungi petugas loket.`)
                            .then((r) => addWaLog(`Giliran ${fmtNumber()} Anda telah terlewat. Mohon hubungi petugas loket.`, true))
                            .catch(() => openBanner());
                    }
                }
            }, LATE_MS);
        } else {
            renderDashboard(null);
        }
    }

    /* --------------------------- INTERACTIONS ------------------------- */
    async function takeQueue() {
        const cfg = POLI[state.poli];
        const n = state.servedNumber + Math.ceil(3 + Math.random() * 5);
        state.patientNumber = n;
        state.remaining = n - state.servedNumber;
        state.lastEta = null;
        setStatus('waiting');
        els.calledActions.hidden = true;
        els.waToggle.disabled = false;
        els.optinCard.hidden = false;
        els.btnTake.textContent = 'Antrean Aktif';
        els.btnTake.disabled = true;
        renderDashboard(null);
        addHistory([`Antrean diambil — nomor <strong>${fmtNumber()}</strong> di ${cfg.label}`]);
        els.lastUpdate.textContent = 'Menyinkronkan…';
        refresh();
        els.travelRange.disabled = false;
        els.poliSelect.disabled = true;
    }

    function confirmServed() {
        setStatus('done');
        els.calledActions.hidden = true;
        renderDashboard(null);
        addHistory([`Pasien <strong>${fmtNumber()}</strong> selesai dilayani`]);
        els.btnTake.textContent = 'Ambil Antrean';
        els.btnTake.disabled = false;
        els.poliSelect.disabled = false;
        els.waToggle.checked = false;
        els.waToggle.disabled = true;
        els.waPhone.hidden = true;
        els.waStatus.hidden = true;
        if (state.waOptIn) state.lastWaRule = null;
    }

    function resetAll() {
        clearTimeout(state.lateTimer);
        state.patientNumber = null;
        state.remaining = 0;
        state.lastRule = null;
        state.lastEta = null;
        state.lastWaRule = null;
        state.lastUpdate = null;
        setStatus('empty');
        els.optinCard.hidden = true;
        els.calledActions.hidden = true;
        els.btnTake.textContent = 'Ambil Antrean';
        els.btnTake.disabled = false;
        els.poliSelect.disabled = false;
        els.travelRange.disabled = false;
        els.waToggle.checked = false;
        els.waPhone.hidden = true;
        els.waStatus.hidden = true;
        els.historyList.innerHTML = '<li class="history-empty">Belum ada pembaruan.</li>';
        els.waLogList.innerHTML = '<li class="wa-log-empty">Belum ada pesan WhatsApp.</li>';
        renderDashboard(null);
        renderEngine(null, null, null);
        els.lastUpdate.textContent = 'Menunggu antrean diambil…';
        els.staleHint.hidden = true;
        els.connBanner.hidden = true;
    }

    /* --------------------------- TAB SYSTEM --------------------------- */
    const switchTab = (btn) => {
        const target = btn.getAttribute('data-panel');
        els.tabs.forEach((t) => {
            const active = t === btn;
            t.classList.toggle('is-active', active);
            t.setAttribute('aria-selected', String(active));
            t.tabIndex = active ? 0 : -1;
        });
        els.panels.forEach((p) => {
            const show = p.id === `panel-${target}`;
            p.hidden = !show;
            if (show) {
                p.querySelectorAll('.reveal').forEach((el) => el.classList.add('active'));
            }
        });
    };

    /* ------------------------------ INIT ------------------------------ */
    function init() {
        // Tabs
        els.tabs.forEach((btn) => {
            btn.addEventListener('click', () => switchTab(btn));
            btn.addEventListener('keydown', (e) => {
                const list = els.tabs;
                const idx = list.indexOf(btn);
                let next = null;
                if (e.key === 'ArrowRight') next = list[(idx + 1) % list.length];
                if (e.key === 'ArrowLeft') next = list[(idx - 1 + list.length) % list.length];
                if (next) {
                    e.preventDefault();
                    switchTab(next);
                    next.focus();
                }
            });
        });

        // Clock
        if (els.clock) {
            const setClock = () => { els.clock.textContent = nowTime().slice(0, 5); };
            setClock();
            setInterval(setClock, 10000);
        }

        // Controls
        els.poliSelect.addEventListener('change', () => { state.poli = els.poliSelect.value; });
        els.travelRange.addEventListener('input', () => {
            state.travel = Number(els.travelRange.value);
            els.travelOutput.textContent = `${state.travel} mnt`;
        });
        els.speedSelect.addEventListener('change', () => { state.speed = Number(els.speedSelect.value); });

        els.btnTake.addEventListener('click', takeQueue);
        els.btnServed.addEventListener('click', confirmServed);
        els.btnReset.addEventListener('click', resetAll);

        els.btnRun.addEventListener('click', () => {
            state.running = !state.running;
            els.runLabel.textContent = state.running ? 'Pause' : 'Lanjut';
            if (state.running) refresh();
        });

        els.btnSkip.addEventListener('click', () => {
            clearTimeout(state.lateTimer);
            state.remaining = 0;
            tickQueue();
        });

        // WhatsApp opt-in
        els.waToggle.addEventListener('change', () => {
            const on = els.waToggle.checked;
            els.waPhone.hidden = !on;
            state.waOptIn = on;
            if (on) {
                els.waStatus.hidden = false;
                els.waStatus.innerHTML =
                    '<span class="material-symbols-rounded" style="font-size:1rem">check_circle</span> ' +
                    'Opt-in aktif — pembaruan antrean akan dikirim ke WhatsApp Anda.';
                state.lastWaRule = null;
                addWaLog('Opt-in notifikasi WhatsApp diaktifkan (izin pengguna).', true);
            } else {
                els.waStatus.hidden = true;
                addWaLog('Opt-in notifikasi WhatsApp dimatikan oleh pengguna.', false);
            }
        });

        // Network simulation + real offline events
        els.netSim.addEventListener('change', () => {
            if (els.netSim.checked) openBanner();
            else if (navigator.onLine !== false) { state.lastUpdate = null; refresh(); }
            renderDashboard(null);
        });
        window.addEventListener('offline', () => { els.netSim.checked = true; openBanner(); renderDashboard(null); });
        window.addEventListener('online', () => {
            if (navigator.onLine !== false) { els.netSim.checked = false; state.lastUpdate = null; refresh(); }
        });
        els.connRetry.addEventListener('click', () => {
            els.netSim.checked = false;
            state.lastUpdate = null;
            refresh();
        });

        // Loops
        setInterval(refresh, POLL_MS);
        setInterval(tickQueue, TICK_MS);

        // Staleness watchdog
        setInterval(() => {
            if (els.netSim.checked) return;
            if (state.lastUpdate && state.running && state.status !== 'empty') {
                els.staleHint.hidden = true;
            }
        }, 1000);

        addHistory([`Simulasi siap — ambil nomor antrean untuk memulai`]);
        els.lastUpdate.textContent = 'Menunggu antrean diambil…';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();