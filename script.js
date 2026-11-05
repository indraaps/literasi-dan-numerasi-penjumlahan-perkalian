/* ==========================================================================
   PETUALANGAN BIMA & LALA — KOMIK FLIPBOOK INTERAKTIF
   Core Interactive Engine: Audio, Hotspots, Book Flipping, State
   ========================================================================== */

(function () {
  'use strict';

  // ========== AUDIO SYNTHESIZER (WEB AUDIO API) ==========
  let audioCtx = null;
  let isSoundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  function playPageFlipSound() {
    if (!isSoundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
      // Gentle page swish noise
      const bufferSize = audioCtx.sampleRate * 0.15;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch (e) {
      console.warn('Flip sound error:', e);
    }
  }

  function playCorrectSound() {
    if (!isSoundEnabled) return;
    // Chime: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 0.28, 'triangle', 0.2);
      }, idx * 70);
    });
  }

  function playWrongSound() {
    if (!isSoundEnabled) return;
    // Gentle wobble: 220Hz -> 180Hz
    playTone(220, 0.25, 'sawtooth', 0.12);
    setTimeout(() => {
      playTone(180, 0.3, 'sawtooth', 0.1);
    }, 120);
  }

  function playVictorySound() {
    if (!isSoundEnabled) return;
    // Joyful fanfare: G4, C5, E5, G5
    const fanfare = [392, 523.25, 659.25, 783.99];
    fanfare.forEach((freq, idx) => {
      setTimeout(() => {
        playTone(freq, 0.4, 'triangle', 0.22);
      }, idx * 120);
    });
  }

  // ========== DATA SLIDE BUKU (14 HALAMAN) ==========
  const slides = [
    // 1 — Cover
    {
      type: 'cover',
      chapter: 'Sampul Depan',
      image: 'gambar/Cover.png',
      hint: 'Tekan tombol "Selanjutnya ▶" di sebelah kanan untuk mulai membaca!',
    },
    // 2 — Petunjuk Penggunaan
    {
      type: 'comic',
      chapter: 'Petunjuk Penggunaan',
      image: 'gambar/petunjuk.jpeg',
      title: 'Petunjuk Penggunaan Komik',
      hint: '📖 Pelajari petunjuk di atas, lalu tekan tombol "Selanjutnya ▶" untuk mulai petualangan!',
    },
    // 3 — slide_1.jpeg
    {
      type: 'comic',
      chapter: 'Awal Petualangan',
      image: 'gambar/slide_1.jpeg',
      title: 'Halo Teman-teman!',
      hint: 'Bima dan Lala siap mengajakmu berpetualang dan berhitung di Pasar Ceria.',
    },
    // 4 — slide_2.jpeg
    {
      type: 'comic',
      chapter: 'Di Pasar Ceria',
      image: 'gambar/slide_2.jpeg',
      title: 'Kios Buah Makmur',
      hint: 'Lihat apel yang banyak sekali disusun oleh nenek penjual buah!',
    },
    // 5 — slide_3.jpeg
    {
      type: 'comic',
      chapter: 'Misi Pertama',
      image: 'gambar/slide_3.jpeg',
      title: 'Menghitung Total Apel',
      hint: 'Ada 125 apel di keranjang lama dan 135 apel di keranjang baru.',
    },
    // 6 — slide_4.jpeg
    {
      type: 'comic',
      chapter: 'Belajar Menjumlahkan',
      image: 'gambar/slide_4.jpeg',
      title: 'Metode Bersusun & Uraian',
      hint: '125 + 135 = 260. Mudah dipahami lewat ratusan, puluhan, dan satuan!',
    },
    // 7 — slide_6.jpeg (HOTSPOT QUIZ 1)
    {
      type: 'hotspot-quiz',
      chapter: 'Tantangan 1 (Penjumlahan)',
      image: 'gambar/slide_6.jpeg',
      title: 'Tantangan Penjumlahan Lala & Bima',
      hint: '👉 Tekan langsung kotak jawaban (A, B, C, atau D) di dalam gambar papan tulis!',
      quizId: 'q-slide6',
      hotspots: [
        {
          id: 's6-a',
          label: 'A. 30',
          left: 28.4,
          top: 62.2,
          width: 9.3,
          height: 8.7,
          isCorrect: false,
          explain: 'Kurang tepat. 15 + 22 = 37 kotak pensil.',
        },
        {
          id: 's6-b',
          label: 'B. 37',
          left: 39.75,
          top: 62.2,
          width: 9.25,
          height: 8.7,
          isCorrect: true,
          explain: 'Jawaban Benar! 15 + 22 = 37 kotak pensil! 🎉',
        },
        {
          id: 's6-c',
          label: 'C. 45',
          left: 51.0,
          top: 62.2,
          width: 9.25,
          height: 8.7,
          isCorrect: false,
          explain: 'Kurang tepat. 15 + 22 = 37 kotak pensil.',
        },
        {
          id: 's6-d',
          label: 'D. 32',
          left: 62.3,
          top: 62.2,
          width: 9.3,
          height: 8.7,
          isCorrect: false,
          explain: 'Kurang tepat. 15 + 22 = 37 kotak pensil.',
        },
      ],
    },
    // 8 — slide_7.jpeg
    {
      type: 'comic',
      chapter: 'Toko Alat Tulis',
      image: 'gambar/slide_7.jpeg',
      title: 'Melihat Pensil Warna',
      hint: 'Bima dan Lala memilih kelompok pensil warna untuk kegiatan kelas.',
    },
    // 10 — slide_8.jpeg
    {
      type: 'comic',
      chapter: 'Konsep Perkalian',
      image: 'gambar/slide_8.jpeg',
      title: 'Empat Kelompok Pensil',
      hint: 'Ada 4 kelompok, masing-masing berisi 3 pensil. 3 dijumlahkan 4 kali!',
    },
    // 11 — slide_9.jpeg
    {
      type: 'comic',
      chapter: 'Belajar Perkalian',
      image: 'gambar/slide_9.jpeg',
      title: 'Perkalian Adalah Penjumlahan Berulang',
      hint: '3 + 3 + 3 + 3 = 12 sama artinya dengan 4 × 3 = 12.',
    },
    // 12 — slide_10.jpeg (HOTSPOT QUIZ 2 & 3)
    {
      type: 'hotspot-quiz',
      chapter: 'Tantangan 2 (Perkalian)',
      image: 'gambar/slide_10.jpeg',
      title: 'Dua Tantangan Perkalian di Papan Kelas',
      hint: '👉 Tekan langsung lingkaran angka (56 / 63 dan 48 / 42) di dalam gambar whiteboard!',
      groups: [
        {
          quizId: 'q-slide10-1',
          name: '7 × 9',
          hotspots: [
            {
              id: 's10-1-56',
              label: '56',
              isCircle: true,
              left: 37.0,
              top: 56.0,
              width: 5.6,
              height: 10.4,
              isCorrect: false,
              explain: 'Kurang tepat. 7 × 9 = 63.',
            },
            {
              id: 's10-1-63',
              label: '63',
              isCircle: true,
              left: 45.4,
              top: 56.0,
              width: 5.8,
              height: 10.4,
              isCorrect: true,
              explain: 'Benar sekali! 7 × 9 = 63! 🌟',
            },
          ],
        },
        {
          quizId: 'q-slide10-2',
          name: '6 × 8',
          hotspots: [
            {
              id: 's10-2-48',
              label: '48',
              isCircle: true,
              left: 56.7,
              top: 56.0,
              width: 5.8,
              height: 10.4,
              isCorrect: true,
              explain: 'Luar biasa! 6 × 8 = 48! 🌟',
            },
            {
              id: 's10-2-42',
              label: '42',
              isCircle: true,
              left: 65.0,
              top: 56.0,
              width: 5.8,
              height: 10.4,
              isCorrect: false,
              explain: 'Kurang tepat. 6 × 8 = 48.',
            },
          ],
        },
      ],
    },
    // 13 — slide_11.jpeg (HOTSPOT QUIZ 4 to 9)
    {
      type: 'hotspot-board-quiz',
      chapter: 'Tantangan Berhitung Pasar Ceria',
      image: 'gambar/slide_11.jpeg',
      title: 'Tantangan Papan Besar Pasar Ceria',
      hint: '👉 Tekan langsung lingkaran jawaban pada papan hijau di dalam gambar!',
      questions: [
        // Penjumlahan Row 1: 125 + 37 = 162
        {
          quizId: 's11-p1',
          correctValue: '162',
          hotspots: [
            { id: 's11-p1-152', isCircle: true, left: 33.2, top: 50.0, width: 4.8, height: 8.6, isCorrect: false },
            { id: 's11-p1-162', isCircle: true, left: 38.6, top: 50.0, width: 4.8, height: 8.6, isCorrect: true, explain: '125 + 37 = 162! Tepat sekali!' },
            { id: 's11-p1-172', isCircle: true, left: 44.0, top: 50.0, width: 4.8, height: 8.6, isCorrect: false }
          ]
        },
        // Penjumlahan Row 2: 240 + 115 = 355
        {
          quizId: 's11-p2',
          correctValue: '355',
          hotspots: [
            { id: 's11-p2-345', isCircle: true, left: 33.2, top: 65.6, width: 4.8, height: 8.6, isCorrect: false },
            { id: 's11-p2-355', isCircle: true, left: 38.6, top: 65.6, width: 4.8, height: 8.6, isCorrect: true, explain: '240 + 115 = 355! Hebat!' },
            { id: 's11-p2-365', isCircle: true, left: 44.0, top: 65.6, width: 4.8, height: 8.6, isCorrect: false }
          ]
        },
        // Penjumlahan Row 3: 56 + 28 = 84
        {
          quizId: 's11-p3',
          correctValue: '84',
          hotspots: [
            { id: 's11-p3-74', isCircle: true, left: 33.2, top: 81.2, width: 4.8, height: 8.6, isCorrect: false },
            { id: 's11-p3-84', isCircle: true, left: 38.6, top: 81.2, width: 4.8, height: 8.6, isCorrect: true, explain: '56 + 28 = 84! Pintar!' },
            { id: 's11-p3-94', isCircle: true, left: 44.0, top: 81.2, width: 4.8, height: 8.6, isCorrect: false }
          ]
        },
        // Perkalian Row 1: 5 x 8 = 40
        {
          quizId: 's11-m1',
          correctValue: '40',
          hotspots: [
            { id: 's11-m1-35', isCircle: true, left: 53.6, top: 50.0, width: 4.8, height: 8.6, isCorrect: false },
            { id: 's11-m1-40', isCircle: true, left: 59.0, top: 50.0, width: 4.8, height: 8.6, isCorrect: true, explain: '5 × 8 = 40! Mantap!' },
            { id: 's11-m1-45', isCircle: true, left: 64.4, top: 50.0, width: 4.8, height: 8.6, isCorrect: false }
          ]
        },
        // Perkalian Row 2: 12 x 5 = 60
        {
          quizId: 's11-m2',
          correctValue: '60',
          hotspots: [
            { id: 's11-m2-50', isCircle: true, left: 53.6, top: 65.6, width: 4.8, height: 8.6, isCorrect: false },
            { id: 's11-m2-60', isCircle: true, left: 59.0, top: 65.6, width: 4.8, height: 8.6, isCorrect: true, explain: '12 × 5 = 60! Keren!' },
            { id: 's11-m2-70', isCircle: true, left: 64.4, top: 65.6, width: 4.8, height: 8.6, isCorrect: false }
          ]
        },
        // Perkalian Row 3: (5 x 4) + 10 = 30
        {
          quizId: 's11-m3',
          correctValue: '30',
          hotspots: [
            { id: 's11-m3-25', isCircle: true, left: 53.6, top: 81.2, width: 4.8, height: 8.6, isCorrect: false },
            { id: 's11-m3-30', isCircle: true, left: 59.0, top: 81.2, width: 4.8, height: 8.6, isCorrect: true, explain: '(5 × 4) + 10 = 20 + 10 = 30! Sempurna!' },
            { id: 's11-m3-35', isCircle: true, left: 64.4, top: 81.2, width: 4.8, height: 8.6, isCorrect: false }
          ]
        }
      ]
    },
    // 14 — slide_12.jpeg (PENUTUP & REKAP SKOR)
    {
      type: 'final',
      chapter: 'Penutup & Rekap Nilai',
      image: 'gambar/slide_12.jpeg',
      title: 'Selamat Tinggal Teman-teman!',
      hint: '🎉 Kamu telah menyelesaikan petualangan literasi & numerasi Bima dan Lala!',
    }
  ];

  // ========== APPLICATION STATE ==========
  let currentSlide = 0;
  let quizAnswers = {}; // { quizId: { selectedId, isCorrect } }
  let toastTimer = null;

  // DOM Elements
  const appEl = document.getElementById('app');
  const splashEl = document.getElementById('splash');
  const pageViewportEl = document.getElementById('pageViewport');
  const bookPageEl = document.getElementById('bookPage');
  const pageChapterEl = document.getElementById('pageChapter');
  const pageCounterBadgeEl = document.getElementById('pageCounterBadge');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const hintTextEl = document.getElementById('hintText');
  const progressLabelEl = document.getElementById('progressLabel');
  const progressFillEl = document.getElementById('progressFill');
  const thumbnailStripEl = document.getElementById('thumbnailStrip');
  const soundBtn = document.getElementById('soundBtn');
  const soundIcon = document.getElementById('soundIcon');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const toastNotificationEl = document.getElementById('toastNotification');
  const toastIconEl = document.getElementById('toastIcon');
  const toastTitleEl = document.getElementById('toastTitle');
  const toastMsgEl = document.getElementById('toastMsg');

  // Total quizzes in the book:
  // Slide 8: 1 quiz
  // Slide 12: 2 quizzes
  // Slide 13: 6 quizzes
  // Total = 9 questions
  const TOTAL_QUIZZES = 9;

  function countCorrectQuizzes() {
    return Object.values(quizAnswers).filter((a) => a.isCorrect).length;
  }

  // ========== TOAST FEEDBACK ==========
  function showToast(title, msg, isSuccess = true) {
    if (toastTimer) clearTimeout(toastTimer);

    toastIconEl.textContent = isSuccess ? '🎉' : '💡';
    toastTitleEl.textContent = title;
    toastMsgEl.textContent = msg;

    toastNotificationEl.className = `toast-notification ${isSuccess ? 'success' : 'wrong'}`;
    toastNotificationEl.classList.remove('hidden');

    toastTimer = setTimeout(() => {
      toastNotificationEl.classList.add('hidden');
    }, 2800);
  }

  // ========== RENDER PAGE ==========
  function renderSlide(direction = 'next') {
    const slide = slides[currentSlide];

    // Trigger 3D turn animation
    bookPageEl.classList.remove('page-flip-forward', 'page-flip-backward');
    void bookPageEl.offsetWidth; // Force reflow
    bookPageEl.classList.add(direction === 'next' ? 'page-flip-forward' : 'page-flip-backward');

    // Update Ribbon & Meta
    pageChapterEl.textContent = slide.chapter;
    pageCounterBadgeEl.textContent = `Hal. ${currentSlide + 1} / ${slides.length}`;
    hintTextEl.textContent = slide.hint || 'Gunakan panah di samping untuk membalik halaman.';
    progressLabelEl.textContent = `Halaman ${currentSlide + 1} dari ${slides.length}`;
    progressFillEl.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;

    // Arrows state
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;

    // Render viewport content
    let html = '';
    switch (slide.type) {
      case 'petunjuk':
        html = renderPetunjukSlide(slide);
        break;
      case 'cover':
      case 'comic':
        html = renderComicSlide(slide);
        break;
      case 'hotspot-quiz':
        html = renderHotspotQuizSlide(slide);
        break;
      case 'hotspot-board-quiz':
        html = renderHotspotBoardSlide(slide);
        break;
      case 'final':
        html = renderFinalSlide(slide);
        break;
    }

    pageViewportEl.innerHTML = html;

    // Update thumbnail highlights
    updateThumbnails();

    // If final slide, play victory sound
    if (slide.type === 'final') {
      playVictorySound();
    }
  }

  // ========== TEMPLATES ==========

  // 1. Comic Picture Template
  function renderComicSlide(slide) {
    return `
      <div class="comic-slide-wrap">
        <img class="comic-picture" src="${slide.image}" alt="${escapeHtml(slide.chapter)}">
      </div>
    `;
  }

  // 2. Petunjuk Penggunaan Slide (Slide 2)
  function renderPetunjukSlide(slide) {
    return `
      <div class="petunjuk-page">
        <div class="petunjuk-header">
          <span class="petunjuk-badge">Panduan Membaca</span>
          <h2 class="petunjuk-title">📖 Petunjuk Penggunaan Komik</h2>
        </div>

        <div class="petunjuk-welcome">
          <span class="emoji">👋</span>
          Halo sahabat hebat! Selamat datang di <strong>Komik Flipbook Interaktif Bima & Lala</strong>.
          Berikut cara seru untuk menikmati dan belajar bersama komik ini:
        </div>

        <div class="petunjuk-cards">
          <div class="p-card">
            <div class="p-card-icon blue">◀ ▶</div>
            <div class="p-card-body">
              <h4>1. Membalik Halaman</h4>
              <p>Tekan tombol panah <b>Sebelumnya</b> di kiri atau <b>Selanjutnya</b> di kanan. Kamu juga bisa menggunakan tombol panah keyboard ← → atau mengusap layar.</p>
            </div>
          </div>

          <div class="p-card">
            <div class="p-card-icon yellow">🎯</div>
            <div class="p-card-body">
              <h4>2. Kuis Langsung di Gambar!</h4>
              <p>Di halaman kuis (Tantangan Berhitung), kamu bisa <b>langsung menekan opsi jawaban yang ada di dalam gambar</b> papan tulis atau whiteboard!</p>
            </div>
          </div>

          <div class="p-card">
            <div class="p-card-icon green">🔊</div>
            <div class="p-card-body">
              <h4>3. Suara & Efek Menyenangkan</h4>
              <p>Dengarkan suara lembaran buku berbalik serta suara lonceng yang riang saat jawabanmu benar! Suara bisa diatur lewat tombol di kanan atas.</p>
            </div>
          </div>

          <div class="p-card">
            <div class="p-card-icon purple">🏆</div>
            <div class="p-card-body">
              <h4>4. Lihat Skor Akhir</h4>
              <p>Di halaman terakhir, kamu akan mendapatkan rekap nilai dari semua tantangan berhitung yang telah kamu selesaikan.</p>
            </div>
          </div>
        </div>

        <div class="petunjuk-footer-card">
          💡 Ayo mulai! Tekan tombol <b>"Selanjutnya ▶"</b> di sebelah kanan untuk memulai petualangan Bima & Lala!
        </div>
      </div>
    `;
  }

  // 3. Hotspot Quiz (Slide 8 & 12)
  function renderHotspotQuizSlide(slide) {
    let hotspotsHtml = '';

    if (slide.hotspots) {
      // Single group (e.g. slide 6)
      const state = quizAnswers[slide.quizId];
      slide.hotspots.forEach((h) => {
        let cls = `hotspot ${h.isCircle ? 'circle' : 'box'}`;
        if (state) {
          cls += ' answered';
          if (h.isCorrect) cls += ' correct';
          else if (state.selectedId === h.id) cls += ' wrong';
        }
        hotspotsHtml += `
          <button class="${cls}"
            style="left:${h.left}%; top:${h.top}%; width:${h.width}%; height:${h.height}%;"
            onclick="window.handleHotspotClick('${slide.quizId}', '${h.id}', ${h.isCorrect}, '${escapeJs(h.explain || '')}')"
            title="${h.label || 'Pilih jawaban ini'}"
            aria-label="${h.label || 'Opsi'}">
          </button>
        `;
      });
    } else if (slide.groups) {
      // Multiple groups (e.g. slide 10)
      slide.groups.forEach((g) => {
        const state = quizAnswers[g.quizId];
        g.hotspots.forEach((h) => {
          let cls = `hotspot ${h.isCircle ? 'circle' : 'box'}`;
          if (state) {
            cls += ' answered';
            if (h.isCorrect) cls += ' correct';
            else if (state.selectedId === h.id) cls += ' wrong';
          }
          hotspotsHtml += `
            <button class="${cls}"
              style="left:${h.left}%; top:${h.top}%; width:${h.width}%; height:${h.height}%;"
              onclick="window.handleHotspotClick('${g.quizId}', '${h.id}', ${h.isCorrect}, '${escapeJs(h.explain || '')}')"
              title="${h.label || 'Pilih jawaban ini'}"
              aria-label="${h.label || 'Opsi'}">
            </button>
          `;
        });
      });
    }

    return `
      <div class="comic-slide-wrap">
        <img class="comic-picture" src="${slide.image}" alt="${escapeHtml(slide.title)}">
        <div class="hotspot-overlay-layer">
          ${hotspotsHtml}
        </div>
      </div>
    `;
  }

  // 4. Hotspot Board Slide (Slide 13 — 6 questions)
  function renderHotspotBoardSlide(slide) {
    let hotspotsHtml = '';

    slide.questions.forEach((q) => {
      const state = quizAnswers[q.quizId];
      q.hotspots.forEach((h) => {
        let cls = `hotspot ${h.isCircle ? 'circle' : 'box'}`;
        if (state) {
          cls += ' answered';
          if (h.isCorrect) cls += ' correct';
          else if (state.selectedId === h.id) cls += ' wrong';
        }
        hotspotsHtml += `
          <button class="${cls}"
            style="left:${h.left}%; top:${h.top}%; width:${h.width}%; height:${h.height}%;"
            onclick="window.handleHotspotClick('${q.quizId}', '${h.id}', ${h.isCorrect}, '${escapeJs(h.explain || '')}')"
            title="Pilih lingkaran ini"
            aria-label="Pilihan">
          </button>
        `;
      });
    });

    return `
      <div class="comic-slide-wrap">
        <img class="comic-picture" src="${slide.image}" alt="${escapeHtml(slide.title)}">
        <div class="hotspot-overlay-layer">
          ${hotspotsHtml}
        </div>
      </div>
    `;
  }

  // 5. Final Slide (Slide 13 — Rekap Skor)
  let isScoreVisible = true;
  function renderFinalSlide(slide) {
    const correctCount = countCorrectQuizzes();
    const answeredCount = Object.keys(quizAnswers).length;
    const scorePct = Math.round((correctCount / TOTAL_QUIZZES) * 100);

    let praise = 'Hebat Sekali!';
    if (correctCount === TOTAL_QUIZZES) praise = 'Luar Biasa Sempurna! 🌟🌟🌟';
    else if (correctCount >= 6) praise = 'Sangat Pintar & Teliti! ⭐';
    else praise = 'Semangat Terus Berlatih! 💪';

    return `
      <div class="comic-slide-wrap final-slide-wrap">
        <img class="comic-picture" src="${slide.image}" alt="Selamat Tinggal">
        <!-- Score overlay placed at top sky area so bottom banner in image is 100% visible -->
        <div class="final-score-overlay ${isScoreVisible ? '' : 'minimized'}" id="finalScoreCard">
          <div class="final-score-text">
            <h3>🏆 ${praise}</h3>
            <p>Kamu berhasil menjawab <b>${correctCount} dari ${TOTAL_QUIZZES}</b> soal tantangan berhitung (${scorePct}%).</p>
          </div>
          <div class="final-score-badge">
            <div class="score-num-box">
              <strong>${correctCount}/${TOTAL_QUIZZES}</strong>
              <small>Nilai: ${scorePct}</small>
            </div>
            <button class="btn-retry" onclick="window.resetAllQuizzes()" title="Ulangi Kuis">
              🔄 Ulangi
            </button>
            <button class="btn-toggle-score" onclick="window.toggleFinalScore()" title="Sembunyikan kartu nilai">
              ▲ Sembunyikan
            </button>
          </div>
        </div>
        <!-- Button to re-open score card if hidden -->
        <button class="btn-show-score ${isScoreVisible ? 'hidden' : ''}" id="btnShowScore" onclick="window.toggleFinalScore()">
          🏆 Rekap Nilai
        </button>
      </div>
    `;
  }

  window.toggleFinalScore = function () {
    isScoreVisible = !isScoreVisible;
    const card = document.getElementById('finalScoreCard');
    const showBtn = document.getElementById('btnShowScore');
    if (card) card.classList.toggle('minimized', !isScoreVisible);
    if (showBtn) showBtn.classList.toggle('hidden', isScoreVisible);
  };

  // ========== HOTSPOT CLICK HANDLER ==========
  window.handleHotspotClick = function (quizId, hotspotId, isCorrect, explainText) {
    // If already answered correctly, no change needed
    if (quizAnswers[quizId] && quizAnswers[quizId].isCorrect) {
      showToast('Sudah Benar!', explainText || 'Soal ini sudah kamu jawab dengan benar.', true);
      return;
    }

    // Save answer state
    quizAnswers[quizId] = {
      selectedId: hotspotId,
      isCorrect: isCorrect,
    };

    if (isCorrect) {
      playCorrectSound();
      showToast('🎉 Benar Sekali!', explainText || 'Jawabanmu tepat!', true);
    } else {
      playWrongSound();
      showToast('💡 Belum Tepat', explainText || 'Coba perhatikan dan hitung kembali ya!', false);
    }

    // Re-render current slide to update styles & checkmarks
    renderSlide('stay');
  };

  // Reset Quizzes
  window.resetAllQuizzes = function () {
    quizAnswers = {};
    showToast('Kuis Direset', 'Ayo coba selesaikan semua tantangan lagi!', true);
    goToSlide(6); // Jump to first quiz slide (Tantangan 1)
  };

  // ========== NAVIGATION ==========
  function goToSlide(targetIndex) {
    if (targetIndex < 0 || targetIndex >= slides.length || targetIndex === currentSlide) return;

    const direction = targetIndex > currentSlide ? 'next' : 'prev';
    currentSlide = targetIndex;
    playPageFlipSound();
    renderSlide(direction);

    // Scroll smoothly to book on mobile
    document.getElementById('bookContainer').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.goToSlide = goToSlide;

  prevBtn.addEventListener('click', () => {
    if (currentSlide > 0) goToSlide(currentSlide - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
  });

  // Keyboard Navigation (Arrow Keys & Space)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentSlide < slides.length - 1) goToSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentSlide > 0) goToSlide(currentSlide - 1);
    }
  });

  // Touch Swipe Support
  let touchStartX = 0;
  let touchEndX = 0;
  const bookContainer = document.getElementById('bookContainer');

  bookContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  bookContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) {
        goToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }
  }, { passive: true });

  // ========== THUMBNAILS ==========
  function buildThumbnails() {
    let html = '';
    slides.forEach((s, idx) => {
      const hasQuiz = s.type.includes('quiz');
      html += `
        <button class="thumb-item ${idx === 0 ? 'active' : ''} ${hasQuiz ? 'has-quiz' : ''}"
          onclick="window.goToSlide(${idx})"
          title="${escapeHtml(s.chapter)} (Hal. ${idx + 1})"
          aria-label="Halaman ${idx + 1}">
          ${idx + 1}
        </button>
      `;
    });
    thumbnailStripEl.innerHTML = html;
  }

  function updateThumbnails() {
    const thumbs = thumbnailStripEl.querySelectorAll('.thumb-item');
    thumbs.forEach((t, i) => {
      t.classList.toggle('active', i === currentSlide);
    });
  }

  // ========== TOOLBAR BUTTONS ==========
  // Sound Toggle
  soundBtn.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
    soundBtn.querySelector('.tool-label').textContent = isSoundEnabled ? 'Suara' : 'Mati';
    if (isSoundEnabled) {
      initAudio();
      playTone(523.25, 0.15);
    }
  });

  // Fullscreen Toggle
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Error enabling fullscreen:', err);
      });
      fullscreenBtn.querySelector('.tool-label').textContent = 'Kecilkan';
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        fullscreenBtn.querySelector('.tool-label').textContent = 'Layar Penuh';
      }
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const isFs = !!document.fullscreenElement;
    fullscreenBtn.querySelector('.tool-label').textContent = isFs ? 'Kecilkan' : 'Layar Penuh';
  });

  // ========== ESCAPING UTILS ==========
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function escapeJs(str) {
    if (!str) return '';
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ========== INITIALIZATION ==========
  function init() {
    buildThumbnails();
    renderSlide('next');

    // Hide Splash after 2 seconds
    setTimeout(() => {
      splashEl.classList.add('hide');
      appEl.classList.remove('hidden');
      setTimeout(() => {
        splashEl.style.display = 'none';
      }, 600);
    }, 1900);
  }

  init();
})();
