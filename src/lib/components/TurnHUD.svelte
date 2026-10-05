<script>
  import { COLOR_CONFIG } from '../../../server/game/Board.js';

  let {
    activePlayer = null,
    myPlayerId = '',
    timeLeft = 30,
    totalTimer = 30,
    gameState = 'WAITING_FOR_ROLL',
    validTokenIds = [],
    currentChallenge = null,
    currentRoll = null,
    minRange = -20,
    maxRange = 20,
    onSpin = () => {},
    onRoll = () => {}
  } = $props();

  let userNumberInput = $state('');

  // Hapus input angka saat selesai move / challenge direset
  $effect(() => {
    if (!currentChallenge) {
      userNumberInput = '';
    }
  });

  const isMyTurn = $derived(activePlayer?.id === myPlayerId);
  const activeColor = $derived(activePlayer ? COLOR_CONFIG[activePlayer.color] : null);
  const effectiveMin = $derived(currentChallenge?.min ?? minRange ?? -20);
  const effectiveMax = $derived(currentChallenge?.max ?? maxRange ?? 20);

  // Timer dijeda jika belum roll (currentChallenge null) atau sedang memilih bidak
  const isTimerPaused = $derived(timeLeft === null || !currentChallenge || gameState === 'WAITING_FOR_MOVE');
  const progressPercent = $derived(
    isTimerPaused ? 100 : Math.max(0, Math.min(100, ((timeLeft ?? 5) / (totalTimer || 5)) * 100))
  );

  function handleKeypadPress(key) {
    if (key === 'BACKSPACE') {
      userNumberInput = userNumberInput.slice(0, -1);
      return;
    }

    if (key === '-') {
      if (userNumberInput === '') {
        userNumberInput = '-';
      } else if (userNumberInput === '-') {
        userNumberInput = '';
      } else if (userNumberInput.startsWith('-')) {
        userNumberInput = userNumberInput.slice(1);
      } else {
        userNumberInput = '-' + userNumberInput;
      }
      return;
    }

    if (userNumberInput.length >= 6) return;

    if (userNumberInput === '0') {
      userNumberInput = key;
    } else if (userNumberInput === '-0') {
      userNumberInput = '-' + key;
    } else {
      userNumberInput += key;
    }
  }

  function handleSubmitRoll() {
    let num = Number(userNumberInput);
    if (userNumberInput === '' || isNaN(num) || userNumberInput === '-') {
      num = 0;
    }
    onRoll(Math.round(num));
    userNumberInput = '';
  }

  // Tombol acak untuk memilih angka secara random sesuai rentang room
  function handleRandomPick() {
    const low = Math.min(effectiveMin, effectiveMax);
    const high = Math.max(effectiveMin, effectiveMax);
    const randomVal = Math.floor(Math.random() * (high - low + 1)) + low;
    userNumberInput = String(randomVal);
    handleSubmitRoll();
  }

  // Format dadu neobrutalism seperti +1, +2, -1, -6, +6, 0
  const diceDisplay = $derived.by(() => {
    if (!currentRoll) return null;
    if (currentRoll.raw === 0 || currentRoll.steps === 0) {
      return {
        signText: '0',
        badgeBg: 'bg-slate-200 text-black',
        label: 'DIAM DI TEMPAT',
        sub: '0 Langkah'
      };
    }
    if (currentRoll.direction === 'FORWARD') {
      return {
        signText: `+${currentRoll.steps}`,
        badgeBg: 'bg-[#4ADE80] text-black',
        label: 'MAJU',
        sub: `${currentRoll.steps} Langkah`
      };
    }
    return {
      signText: `-${currentRoll.steps}`,
      badgeBg: 'bg-[#FF6B6B] text-black',
      label: 'MUNDUR',
      sub: `${currentRoll.steps} Langkah`
    };
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (!isMyTurn || gameState === 'WAITING_FOR_MOVE' || !currentChallenge) return;
    if (e.key >= '0' && e.key <= '9') {
      handleKeypadPress(e.key);
    } else if (e.key === '-' || e.key === '_') {
      handleKeypadPress('-');
    } else if (e.key === 'Backspace') {
      handleKeypadPress('BACKSPACE');
    } else if (e.key === 'Enter') {
      handleSubmitRoll();
    }
  }}
/>

<div class="w-full max-w-xl mx-auto bg-white border-4 border-black p-3 sm:p-4 shadow-[6px_6px_0px_#000] space-y-2.5">
  <!-- Active Player Header & Timer Status -->
  <div class="flex items-center justify-between gap-3 border-b-2 border-black pb-2.5">
    <div class="flex items-center gap-2.5 min-w-0">
      <!-- Active Player Mark Dot -->
      <span class="inline-block w-4 h-4 border-2 border-black shadow-[1px_1px_0px_#000]" style="background-color: {activeColor?.hex ?? '#10b981'}"></span>

      <div class="truncate flex items-center gap-1.5 text-black">
        <span class="text-xs font-bold uppercase tracking-wider">Giliran:</span>
        <strong class="text-sm sm:text-base font-black uppercase">{activePlayer?.name ?? 'Menunggu'}</strong>
        {#if isMyTurn}
          <span class="text-[10px] font-black uppercase text-black bg-[#FFE600] px-2 py-0.5 border-2 border-black shadow-[1px_1px_0px_#000]">
            Kamu
          </span>
        {/if}
      </div>

      <!-- Active Indicator Badge -->
      <div class="hidden sm:inline-block px-2 py-0.5 bg-[#4ADE80] border-2 border-black text-black text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0px_#000]">
        AKTIF
      </div>
    </div>

    <!-- Timer Countdown Badge -->
    <div class="flex items-center gap-1.5 bg-[#FFE600] text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000] flex-shrink-0">
      <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {#if !currentChallenge && gameState !== 'WAITING_FOR_MOVE'}
        <span class="text-xs font-black uppercase font-mono">
          Tunggu Roll
        </span>
      {:else if isTimerPaused}
        <span class="text-xs font-black uppercase font-mono">
          Timer Dijeda
        </span>
      {:else}
        <span class="font-mono font-black text-sm {timeLeft <= 2 ? 'text-red-600' : 'text-black'}">
          {timeLeft}s
        </span>
      {/if}
    </div>
  </div>

  <!-- Neobrutalist Progress Bar -->
  <div class="w-full h-3 bg-slate-100 border-2 border-black overflow-hidden shadow-[2px_2px_0px_#000]">
    <div
      class="h-full transition-all duration-300 {isTimerPaused ? 'bg-[#4ADE80]' : (timeLeft <= 2 ? 'bg-[#FF6B6B]' : 'bg-[#3B82F6]')}"
      style="width: {progressPercent}%;"
    ></div>
  </div>

  <!-- Main Turn Interaction Area -->
  {#if isMyTurn}
    {#if gameState !== 'WAITING_FOR_MOVE' && !currentChallenge}
      <!-- STEP 1: Tombol Roll Dadu Dulu (Timer belum berjalan) -->
      <div class="p-4 bg-[#F8FAFC] border-2 border-black shadow-[3px_3px_0px_#000] text-center space-y-3">
        <p class="text-xs sm:text-sm text-black font-bold">
          Sekarang giliranmu! Timer belum berjalan. Silakan lempar dadu untuk memulai kalkulasi.
        </p>
        <button
          type="button"
          onclick={onSpin}
          class="w-full py-3.5 px-4 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black text-sm uppercase tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="0" />
            <path d="M8 8h.01" />
            <path d="M12 12h.01" />
            <path d="M16 16h.01" />
            <path d="M16 8h.01" />
            <path d="M8 16h.01" />
          </svg>
          <span>Roll Dadu Sekarang</span>
        </button>
      </div>

    {:else if gameState !== 'WAITING_FOR_MOVE' && currentChallenge}
      <!-- STEP 2: Soal Muncul Setelah Roll Dadu (Keypad Custom 2 Baris, Tanpa Virtual Keyboard Native) -->
      <div class="p-3 sm:p-4 bg-[#F8FAFC] border-2 border-black shadow-[3px_3px_0px_#000] space-y-2.5 text-black">
        <div class="flex items-center justify-between text-xs font-black">
          <span class="uppercase tracking-wider">
            Tentukan Angka Kalkulasimu
          </span>
          <span class="font-mono text-slate-700">
            Rentang: {effectiveMin} s.d. {effectiveMax}
          </span>
        </div>

        <!-- Equation Visual with Custom Display (No native mobile virtual keyboard) -->
        <div class="flex items-center justify-center gap-2 font-mono text-xl sm:text-2xl font-black py-0.5">
          <span class="px-3.5 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-black">
            {currentChallenge.screenNumber}
          </span>
          <span class="text-2xl text-black">
            {currentChallenge.op}
          </span>
          <!-- Readonly Display Box replacing native input -->
          <div
            class="min-w-[100px] sm:min-w-[130px] px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000] text-center text-black font-mono font-black text-xl sm:text-2xl select-none flex items-center justify-center min-h-[44px]"
          >
            {#if userNumberInput !== ''}
              <span>{userNumberInput}</span>
            {:else}
              <span class="text-slate-400 font-sans text-xs font-bold animate-pulse">Isi angka...</span>
            {/if}
          </div>
          <span class="text-black font-black">=</span>
          <span class="text-slate-600 text-sm font-sans font-bold">?</span>
        </div>

        <!-- Custom On-screen Keypad (2 Baris) -->
        <div class="w-full max-w-sm mx-auto space-y-1.5 select-none pt-0.5">
          <!-- Baris 1: 1, 2, 3, 4, 5, Mines (-) -->
          <div class="grid grid-cols-6 gap-1.5">
            {#each ['1', '2', '3', '4', '5'] as num}
              <button
                type="button"
                onclick={() => handleKeypadPress(num)}
                class="h-10 sm:h-11 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] font-mono font-black text-base sm:text-lg text-black transition flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            {/each}
            <!-- Mines (-) button -->
            <button
              type="button"
              onclick={() => handleKeypadPress('-')}
              class="h-10 sm:h-11 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] font-mono font-black text-xl text-black transition flex items-center justify-center cursor-pointer"
              title="Tanda Minus (-)"
            >
              −
            </button>
          </div>

          <!-- Baris 2: 6, 7, 8, 9, 0, Backspace (⌫) -->
          <div class="grid grid-cols-6 gap-1.5">
            {#each ['6', '7', '8', '9', '0'] as num}
              <button
                type="button"
                onclick={() => handleKeypadPress(num)}
                class="h-10 sm:h-11 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] font-mono font-black text-base sm:text-lg text-black transition flex items-center justify-center cursor-pointer"
              >
                {num}
              </button>
            {/each}
            <!-- Backspace button -->
            <button
              type="button"
              onclick={() => handleKeypadPress('BACKSPACE')}
              class="h-10 sm:h-11 bg-[#E2E8F0] hover:bg-[#CBD5E1] active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] font-mono font-black text-black transition flex items-center justify-center cursor-pointer"
              title="Hapus Satu Karakter"
            >
              <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Action Buttons: Hitung & Tombol Acak Random -->
        <div class="grid grid-cols-2 gap-2 pt-0.5 max-w-sm mx-auto">
          <!-- Submit Roll Button -->
          <button
            type="button"
            onclick={handleSubmitRoll}
            class="py-2.5 px-3 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Hitung Dadu</span>
          </button>

          <!-- Tombol Acak Random -->
          <button
            type="button"
            onclick={handleRandomPick}
            class="py-2.5 px-3 bg-[#FF6B6B] hover:bg-[#EE5253] active:translate-x-0.5 active:translate-y-0.5 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>Acak Angka</span>
          </button>
        </div>

        <p class="text-[10px] text-slate-500 text-center font-bold">
          Tip: Tekan tombol atau gunakan keyboard fisik (0-9, -, Backspace, Enter).
        </p>
      </div>

    {:else if gameState === 'WAITING_FOR_MOVE'}
      <!-- STEP 3: TAMPILAN DADU SUPER JELAS (+1, +2, -1, -6, +6) & WAJIB KLIK BIDAK DI PAPAN -->
      <div class="space-y-3">
        <!-- Kartu Dadu Jelas Neobrutalist -->
        <div class="p-3.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000] space-y-3">
          <div class="flex items-center justify-between text-xs border-b-2 border-black pb-1.5 font-bold text-black">
            <span class="uppercase tracking-wider">Kalkulasi Matematika</span>
            <span class="font-mono font-black text-xs">
              ({currentRoll?.a ?? 0}) {currentRoll?.op ?? '+'} ({currentRoll?.b ?? 0}) = {currentRoll?.raw ?? 0}
            </span>
          </div>

          <!-- Highlight Besar Dadu Hasil -->
          <div class="flex items-center justify-between p-3 border-2 border-black shadow-[2px_2px_0px_#000] {diceDisplay?.badgeBg}">
            <div class="flex items-center gap-3">
              <!-- Big Dice Number Display (+1, +2, -1, -6, +6) -->
              <div class="w-14 h-14 bg-white border-2 border-black flex flex-col items-center justify-center shadow-[2px_2px_0px_#000] flex-shrink-0">
                <span class="text-2xl font-black text-black tracking-tight">{diceDisplay?.signText}</span>
              </div>

              <div>
                <div class="text-base font-black tracking-wide flex items-center gap-1.5 text-black">
                  {#if currentRoll?.direction === 'FORWARD'}
                    <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  {:else if currentRoll?.direction === 'BACKWARD'}
                    <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  {/if}
                  <span>{diceDisplay?.label}</span>
                </div>
                <div class="text-xs font-bold text-black">
                  {diceDisplay?.sub}
                </div>
              </div>
            </div>

            {#if currentRoll?.steps === 6}
              <div class="text-right">
                <span class="text-[10px] font-black uppercase tracking-wider text-black bg-[#FFE600] px-2 py-1 border-2 border-black shadow-[1px_1px_0px_#000]">
                  Bonus Giliran (3 Detik)!
                </span>
              </div>
            {/if}
          </div>

          <!-- Clean Direct Board Pick Hint -->
          <div class="pt-1 flex items-center justify-center gap-2 text-xs font-black uppercase text-black bg-[#FFE600] py-1.5 border-2 border-black shadow-[2px_2px_0px_#000]">
            <span>Silakan klik langsung bidakmu di papan untuk melangkah</span>
          </div>
        </div>
      </div>
    {/if}

  {:else}
    <!-- Opponent Turn View -->
    <div class="p-3.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000] space-y-2 text-center text-black">
      <div class="text-xs font-bold">
        {#if !currentChallenge && gameState !== 'WAITING_FOR_MOVE'}
          Menunggu <strong>{activePlayer?.name ?? 'pemain'}</strong> melempar dadu...
        {:else if currentChallenge && gameState !== 'WAITING_FOR_MOVE'}
          <strong>{activePlayer?.name ?? 'Pemain'}</strong> sedang menentukan angka...
        {:else if gameState === 'WAITING_FOR_MOVE'}
          <strong>{activePlayer?.name ?? 'Pemain'}</strong> sedang memilih bidak di papan...
        {/if}
      </div>

      {#if gameState === 'WAITING_FOR_MOVE' && diceDisplay}
        <div class="inline-flex items-center gap-3 px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000] {diceDisplay.badgeBg}">
          <span class="text-xl font-black font-mono">{diceDisplay.signText}</span>
          <span class="text-xs font-black uppercase">{diceDisplay.label} {diceDisplay.sub}</span>
        </div>
      {:else if currentChallenge}
        <div class="text-[11px] text-slate-700 font-mono font-bold">
          Angka di layar: ({currentChallenge.screenNumber}) {currentChallenge.op} [ ? ]
        </div>
      {/if}
    </div>
  {/if}
</div>
