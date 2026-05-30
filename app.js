/* ==========================================================================
   Soonho's Wedding D-Day App - Application Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- Constants & Target Dates ---
  // Wedding Target: 2027년 7월 10일 12:00:00 (KST, UTC+9)
  const TARGET_DATE = new Date('2027-07-10T12:00:00+09:00');
  
  // App Creation/Announcement Start: 2026년 5월 30일 21:00:00 (KST, UTC+9)
  const START_DATE = new Date('2026-05-30T21:00:00+09:00');
  const TOTAL_DURATION = TARGET_DATE - START_DATE;

  // --- Theme Configuration ---
  const themeButtons = document.querySelectorAll('.theme-btn');
  
  // Load saved theme or default to 'rose'
  const savedTheme = localStorage.getItem('soonho-wedding-theme') || 'rose';
  setTheme(savedTheme);

  themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeVal = btn.getAttribute('data-theme-val');
      setTheme(themeVal);
      // Spawn a theme change celebrate burst
      createCelebrationBurst(window.innerWidth / 2, window.innerHeight / 2);
    });
  });

  function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('soonho-wedding-theme', themeName);
    
    // Update active button state
    themeButtons.forEach(btn => {
      if (btn.getAttribute('data-theme-val') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --- Countdown and Precision Progress Engine ---
  const ddayDisplay = document.getElementById('dday-display');
  const cardDays = document.querySelector('#card-days .card-number');
  const cardHours = document.querySelector('#card-hours .card-number');
  const cardMinutes = document.querySelector('#card-minutes .card-number');
  const cardSeconds = document.querySelector('#card-seconds .card-number');
  
  const progressFill = document.getElementById('progress-fill');
  const progressHeart = document.getElementById('progress-heart');
  const precisionPercentageText = document.getElementById('precision-percentage');

  function updateCountdown() {
    const now = new Date();
    const diff = TARGET_DATE - now;

    // 1. Calculate Standard Calendar D-Day for the main badge
    // target midnight KST
    const targetMidnight = new Date(TARGET_DATE.getFullYear(), TARGET_DATE.getMonth(), TARGET_DATE.getDate());
    // current local midnight
    const currentMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.ceil((targetMidnight - currentMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      ddayDisplay.textContent = 'D-Day';
    } else if (diffDays > 0) {
      ddayDisplay.textContent = `D-${diffDays}`;
    } else {
      ddayDisplay.textContent = `D+${Math.abs(diffDays)}`;
    }

    // 2. Calculate card values (Days, Hours, Minutes, Seconds)
    if (diff <= 0) {
      cardDays.textContent = '000';
      cardHours.textContent = '00';
      cardMinutes.textContent = '00';
      cardSeconds.textContent = '00';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    cardDays.textContent = String(days).padStart(3, '0');
    cardHours.textContent = String(hours).padStart(2, '0');
    cardMinutes.textContent = String(minutes).padStart(2, '0');
    cardSeconds.textContent = String(seconds).padStart(2, '0');
  }

  // High Precision Progress loop (60fps using requestAnimationFrame)
  function animateProgress() {
    const now = new Date();
    const elapsed = now - START_DATE;
    
    let percent = (elapsed / TOTAL_DURATION) * 100;
    percent = Math.min(100, Math.max(0, percent));

    // Update progress bar UI
    progressFill.style.width = `${percent}%`;
    progressHeart.style.left = `${percent}%`;
    
    // Render high precision percentage string (6 decimals)
    precisionPercentageText.textContent = `${percent.toFixed(6)}%`;

    requestAnimationFrame(animateProgress);
  }

  // Initialize and run countdown
  updateCountdown();
  setInterval(updateCountdown, 1000);
  animateProgress();

  // --- Canvas Particle System (Falling/Rising Hearts) ---
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class HeartParticle {
    constructor(x, y, isBurst = false) {
      this.x = x;
      this.y = y;
      this.isBurst = isBurst;
      this.size = Math.random() * (isBurst ? 18 : 12) + 6;
      
      // Speed vectors
      if (isBurst) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 2;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed - 1.5; // Slight upward bias
      } else {
        // Floating upward particles
        this.speedX = Math.random() * 1.5 - 0.75;
        this.speedY = -(Math.random() * 1.5 + 0.5);
      }
      
      this.opacity = 1;
      this.decay = Math.random() * 0.015 + (isBurst ? 0.012 : 0.005);
      this.rotation = Math.random() * Math.PI;
      this.rotationSpeed = Math.random() * 0.04 - 0.02;
      this.wobbleSpeed = Math.random() * 0.05 + 0.02;
      this.wobbleAmount = Math.random() * 2 + 1;
      this.wobbleCounter = Math.random() * 100;
      
      // Choose color based on active theme
      this.color = getThemeParticleColor();
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      
      if (!this.isBurst) {
        this.wobbleCounter += this.wobbleSpeed;
        this.x += Math.sin(this.wobbleCounter) * (this.wobbleAmount * 0.1);
      }
      
      this.rotation += this.rotationSpeed;
      this.opacity -= this.decay;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = Math.max(0, this.opacity);
      ctx.fillStyle = this.color;
      
      // Draw Heart Path
      ctx.beginPath();
      const s = this.size;
      ctx.moveTo(0, s / 4);
      ctx.quadraticCurveTo(0, 0, s / 2, 0);
      ctx.quadraticCurveTo(s, 0, s, s / 3);
      ctx.quadraticCurveTo(s, s * 0.7, 0, s);
      ctx.quadraticCurveTo(-s, s * 0.7, -s, s / 3);
      ctx.quadraticCurveTo(-s, 0, -s / 2, 0);
      ctx.quadraticCurveTo(0, 0, 0, s / 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  function getThemeParticleColor() {
    const activeTheme = document.body.getAttribute('data-theme') || 'rose';
    const roseColors = ['#ff6b8b', '#ff8da1', '#ffb6c1', '#ff477e'];
    const goldColors = ['#dfb753', '#f3d994', '#d4af37', '#e5c158'];
    const emeraldColors = ['#2e8b57', '#5f9ea0', '#3cb371', '#8fbc8f'];
    const midnightColors = ['#60a5fa', '#a78bfa', '#f472b6', '#38bdf8'];
    
    let colorPalette = roseColors;
    if (activeTheme === 'gold') colorPalette = goldColors;
    else if (activeTheme === 'emerald') colorPalette = emeraldColors;
    else if (activeTheme === 'midnight') colorPalette = midnightColors;
    
    return colorPalette[Math.floor(Math.random() * colorPalette.length)];
  }

  function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Random spawn floaters (low frequency)
    if (Math.random() < 0.05 && particles.length < 150) {
      particles.push(new HeartParticle(Math.random() * canvas.width, canvas.height + 20));
    }
    
    particles = particles.filter(p => p.opacity > 0);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    requestAnimationFrame(animateParticles);
  }
  animateParticles();

  function createCelebrationBurst(x, y) {
    const count = 50 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      particles.push(new HeartParticle(x, y, true));
    }
  }

  // Global click/tap on background page spawns a few floating hearts
  document.addEventListener('click', (e) => {
    // Avoid spawning when clicking interactive UI elements (buttons, inputs)
    if (e.target.tagName !== 'BUTTON' && 
        e.target.tagName !== 'INPUT' && 
        e.target.tagName !== 'TEXTAREA' && 
        !e.target.closest('.theme-buttons')) {
      for (let i = 0; i < 5; i++) {
        particles.push(new HeartParticle(e.clientX, e.clientY, true));
      }
    }
  });

  // Tapping the main Celebrate button
  const celebrateBtn = document.getElementById('celebrate-btn');
  celebrateBtn.addEventListener('click', (e) => {
    const rect = celebrateBtn.getBoundingClientRect();
    const btnX = rect.left + rect.width / 2;
    const btnY = rect.top + rect.height / 2;
    
    createCelebrationBurst(btnX, btnY);
    triggerAudioChimeMelody();
  });

  // --- Web Audio API Romantic Ambient Chimes Synthesizer ---
  let audioCtx = null;
  let isAudioPlaying = false;
  let ambientMelodyInterval = null;
  const audioToggleBtn = document.getElementById('audio-toggle');
  const audioIcon = audioToggleBtn.querySelector('.audio-icon');
  const audioText = audioToggleBtn.querySelector('.audio-text');

  // Major pentatonic scale notes (frequencies in Hz)
  const scale = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00  // A5
  ];

  // Ambient chord base frequencies
  const chordRoots = [130.81, 110.00, 87.31, 98.00]; // C3, A2, F2, G2

  function initAudio() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }

  function playChimeNote(freq) {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    
    // Create nodes
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const delayNode = audioCtx.createDelay(1.0);
    const delayGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // Configure oscillators (Sine for pure fundamental, Triangle for warmth)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, now);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now); // Octave overtone
    
    // Filter to soften the overtone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    // Delay effect for spacey chime room acoustics
    delayNode.delayTime.setValueAtTime(0.4, now);
    delayGain.gain.setValueAtTime(0.25, now);

    // Volume Envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.08); // Quick attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.0); // Very long decay

    // Connections
    osc1.connect(filter);
    osc2.connect(filter);
    
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Send to delay line
    gainNode.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(audioCtx.destination);

    // Play & Clean up
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.5);
    osc2.stop(now + 3.5);
  }

  function playBaseChord(rootFreq) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    
    // Play warm sine waves at root and perfect fifth
    [rootFreq, rootFreq * 1.5, rootFreq * 2.0].forEach(f => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 1.0); // Extremely slow attack
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0); // Smooth long decay
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 6.5);
    });
  }

  function triggerAudioChimeMelody() {
    if (!audioCtx || isAudioPlaying === false) return;
    
    // Choose a random note from pentatonic scale and play it
    const randomFreq = scale[Math.floor(Math.random() * scale.length)];
    playChimeNote(randomFreq);
  }

  let chordIndex = 0;
  function startAmbientSequencer() {
    if (ambientMelodyInterval) clearInterval(ambientMelodyInterval);
    
    let tickCount = 0;
    
    // Play first chord instantly
    playBaseChord(chordRoots[chordIndex]);

    ambientMelodyInterval = setInterval(() => {
      if (!isAudioPlaying) return;
      
      // Play a soft chord root pad every 8 ticks (approx 16 seconds)
      if (tickCount % 8 === 0) {
        chordIndex = (chordIndex + 1) % chordRoots.length;
        playBaseChord(chordRoots[chordIndex]);
      }
      
      // Random chance to play a melody chime (60% chance every 2 seconds)
      if (Math.random() < 0.6) {
        triggerAudioChimeMelody();
      }
      
      tickCount++;
    }, 2000);
  }

  function toggleAudio() {
    initAudio();
    
    if (isAudioPlaying) {
      // Pause
      isAudioPlaying = false;
      audioIcon.textContent = '🔇';
      audioText.textContent = '음악 켜기';
      if (ambientMelodyInterval) {
        clearInterval(ambientMelodyInterval);
        ambientMelodyInterval = null;
      }
    } else {
      // Play
      isAudioPlaying = true;
      audioIcon.textContent = '🎵';
      audioText.textContent = '음악 끄기';
      
      // Resume context if suspended
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      
      startAmbientSequencer();
      // Play an initial chime to acknowledge action
      playChimeNote(scale[4]);
    }
  }

  // Audio button toggle listener
  audioToggleBtn.addEventListener('click', toggleAudio);
  
  // Default audio state: starts unplayed because of browser policies.
  // The first time a user interacts (taps somewhere), we can warm up the context.
  document.body.addEventListener('click', () => {
    initAudio();
  }, { once: true });

});
