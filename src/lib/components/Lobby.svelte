<script>
  let {
    onJoin = () => {},
    onCreate = () => {},
    onCreateRoom = null,
    onJoinRoom = null,
    room = null,
    player = null,
    onStartGame = () => {},
    onLeaveRoom = () => {},
    onShowLeaderboard = () => {},
    myPlayerId = ''
  } = $props();

  function triggerCreate(payload, cb) {
    const fn = onCreateRoom || onCreate;
    fn(payload, cb);
  }

  function triggerJoin(payload, cb) {
    const fn = onJoinRoom || onJoin;
    fn(payload, cb);
  }

  let playerName = $state(
    typeof window !== 'undefined' ? localStorage.getItem('ludo_player_name') || '' : ''
  );

  let mode = $state('HOME'); // 'HOME' | 'CREATE' | 'JOIN'
  let joinCode = $state('');
  let selectedTimer = $state(30);
  let selectedMaxPlayers = $state(4);
  let selectedRangePreset = $state('-20_20'); // '-10_10' | '-20_20' | '-50_50' | '-100_100' | 'CUSTOM'
  let customMinRange = $state(-20);
  let customMaxRange = $state(20);
  let errorMessage = $state('');
  let copied = $state(false);

  function handleCreate() {
    if (!playerName.trim()) {
      errorMessage = 'Nama pemain tidak boleh kosong';
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludo_player_name', playerName.trim());
    }
    errorMessage = '';

    let minVal = -20;
    let maxVal = 20;
    if (selectedRangePreset === '-10_10') {
      minVal = -10;
      maxVal = 10;
    } else if (selectedRangePreset === '-20_20') {
      minVal = -20;
      maxVal = 20;
    } else if (selectedRangePreset === '-50_50') {
      minVal = -50;
      maxVal = 50;
    } else if (selectedRangePreset === '-100_100') {
      minVal = -100;
      maxVal = 100;
    } else if (selectedRangePreset === 'CUSTOM') {
      minVal = Number.isFinite(Number(customMinRange)) ? Number(customMinRange) : -20;
      maxVal = Number.isFinite(Number(customMaxRange)) ? Number(customMaxRange) : 20;
    }
    const low = Math.min(minVal, maxVal);
    const high = Math.max(minVal, maxVal);

    triggerCreate({
      name: playerName.trim(),
      timer: selectedTimer,
      maxPlayers: selectedMaxPlayers,
      minRange: low,
      maxRange: high
    }, (err) => {
      if (err) errorMessage = err;
    });
  }

  function handleJoin() {
    if (!playerName.trim()) {
      errorMessage = 'Nama pemain tidak boleh kosong';
      return;
    }
    if (!joinCode.trim()) {
      errorMessage = 'Kode room tidak boleh kosong';
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludo_player_name', playerName.trim());
    }
    errorMessage = '';
    triggerJoin({
      name: playerName.trim(),
      code: joinCode.trim().toUpperCase()
    }, (err) => {
      if (err) errorMessage = err;
    });
  }

  function copyCode() {
    if (room?.code && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(room.code);
      copied = true;
      setTimeout(() => {
        copied = false;
      }, 2000);
    }
  }

  const isHost = $derived(room?.players?.[0]?.id === (myPlayerId || player?.id));
  const canStart = $derived(isHost && room?.players?.length >= 2);
</script>

<div class="w-full max-w-md mx-auto">
  {#if !room}
    <!-- Lobby Card: Neobrutalism Form -->
    <div class="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      <!-- Title & Branding -->
      <div class="text-center space-y-2 border-b-4 border-black pb-5">
        <div class="inline-flex items-center justify-center w-14 h-14 bg-[#FFE600] border-3 border-black shadow-[3px_3px_0px_#000] text-black mb-1">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="0" />
            <path d="M8 8h.01" />
            <path d="M12 12h.01" />
            <path d="M16 16h.01" />
            <path d="M16 8h.01" />
            <path d="M8 16h.01" />
          </svg>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-black uppercase">
          SalisLudo
        </h1>
        <p class="text-xs sm:text-sm font-bold text-slate-800">
          Multiplayer 2 s.d. 4 pemain dengan dadu persamaan matematika seru.
        </p>
      </div>

      <!-- Error Banner -->
      {#if errorMessage}
        <div class="p-3 bg-[#FF6B6B] border-2 border-black shadow-[2px_2px_0px_#000] text-xs text-black font-black text-center">
          {errorMessage}
        </div>
      {/if}

      <!-- Name Input -->
      <div class="space-y-1.5">
        <label for="player-name" class="block text-xs font-black text-black uppercase tracking-wider">
          Nama Pemain
        </label>
        <input
          id="player-name"
          type="text"
          maxlength="15"
          bind:value={playerName}
          placeholder="Ketik namamu..."
          class="w-full px-4 py-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000] text-black font-black placeholder-slate-400 focus:outline-none focus:bg-[#FFF9C4] transition"
          onkeydown={(e) => {
            if (e.key === 'Enter') {
              if (mode === 'CREATE') handleCreate();
              else if (mode === 'JOIN') handleJoin();
            }
          }}
        />
      </div>

      {#if mode === 'HOME'}
        <div class="grid grid-cols-2 gap-3 pt-2">
          <button
            onclick={() => { errorMessage = ''; mode = 'CREATE'; }}
            class="py-3.5 px-4 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs sm:text-sm tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Buat Room</span>
          </button>
          <button
            onclick={() => { errorMessage = ''; mode = 'JOIN'; }}
            class="py-3.5 px-4 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs sm:text-sm tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m21 2-2 2m-6 6 2-2m-8 8 2-2m2 2 4-4m-4 4-2-2m2 2-4-4" />
              <circle cx="7.5" cy="15.5" r="4.5" />
            </svg>
            <span>Gabung</span>
          </button>
        </div>
      {:else if mode === 'CREATE'}
        <!-- Custom Timer, Max Players & Number Range -->
        <div class="space-y-4 pt-2 border-t-2 border-black">
          <div>
            <span class="block text-xs font-black uppercase tracking-wider mb-2 text-black">
              Batas Waktu per Giliran (Maksimal 30 Detik)
            </span>
            <div class="grid grid-cols-3 gap-2">
              {#each [10, 20, 30] as sec}
                <button
                  type="button"
                  onclick={() => (selectedTimer = sec)}
                  class="py-2.5 font-black text-sm border-2 border-black transition {selectedTimer === sec ? 'bg-[#FFEB3B] text-black shadow-[3px_3px_0px_#000]' : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000]'}"
                >
                  {sec} Detik
                </button>
              {/each}
            </div>
          </div>

          <div>
            <span class="block text-xs font-black uppercase tracking-wider mb-2 text-black">
              Kapasitas Pemain
            </span>
            <div class="grid grid-cols-3 gap-2">
              {#each [2, 3, 4] as num}
                <button
                  type="button"
                  onclick={() => (selectedMaxPlayers = num)}
                  class="py-2.5 font-black text-sm border-2 border-black transition {selectedMaxPlayers === num ? 'bg-[#FFEB3B] text-black shadow-[3px_3px_0px_#000]' : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000]'}"
                >
                  {num} Pemain
                </button>
              {/each}
            </div>
          </div>

          <!-- Setting Rentang Angka Soal Dadu -->
          <div>
            <span class="block text-xs font-black uppercase tracking-wider mb-2 text-black">
              Rentang Angka Soal Dadu
            </span>
            <div class="grid grid-cols-2 gap-2 mb-2">
              {#each [
                { id: '-10_10', label: '-10 s.d. 10' },
                { id: '-20_20', label: '-20 s.d. 20 (Standar)' },
                { id: '-50_50', label: '-50 s.d. 50' },
                { id: '-100_100', label: '-100 s.d. 100' }
              ] as r}
                <button
                  type="button"
                  onclick={() => (selectedRangePreset = r.id)}
                  class="py-2 px-2 font-black text-xs border-2 border-black transition text-center {selectedRangePreset === r.id ? 'bg-[#FFEB3B] text-black shadow-[3px_3px_0px_#000]' : 'bg-white text-black hover:bg-slate-100 shadow-[2px_2px_0px_#000]'}"
                >
                  {r.label}
                </button>
              {/each}
            </div>

            <!-- Tombol Opsi Kustom -->
            <button
              type="button"
              onclick={() => (selectedRangePreset = selectedRangePreset === 'CUSTOM' ? '-20_20' : 'CUSTOM')}
              class="w-full py-2 font-black text-xs border-2 border-black transition text-center {selectedRangePreset === 'CUSTOM' ? 'bg-[#FFE600] text-black shadow-[3px_3px_0px_#000]' : 'bg-slate-100 text-black hover:bg-slate-200 shadow-[2px_2px_0px_#000]'}"
            >
              {selectedRangePreset === 'CUSTOM' ? '✓ Rentang Kustom Aktif' : 'Atur Rentang Angka Kustom (Bebas)'}
            </button>

            {#if selectedRangePreset === 'CUSTOM'}
              <div class="grid grid-cols-2 gap-2 mt-2 p-2.5 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000]">
                <div>
                  <label for="custom-min" class="block text-[10px] font-black uppercase text-black mb-1">Batas Bawah (Min)</label>
                  <input
                    id="custom-min"
                    type="number"
                    bind:value={customMinRange}
                    class="w-full px-2 py-1 bg-white border-2 border-black font-mono font-black text-sm text-center text-black focus:outline-none"
                  />
                </div>
                <div>
                  <label for="custom-max" class="block text-[10px] font-black uppercase text-black mb-1">Batas Atas (Max)</label>
                  <input
                    id="custom-max"
                    type="number"
                    bind:value={customMaxRange}
                    class="w-full px-2 py-1 bg-white border-2 border-black font-mono font-black text-sm text-center text-black focus:outline-none"
                  />
                </div>
              </div>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onclick={() => { errorMessage = ''; mode = 'HOME'; }}
              class="py-3 px-4 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Kembali
            </button>
            <button
              type="button"
              onclick={handleCreate}
              class="py-3 px-4 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      {:else if mode === 'JOIN'}
        <div class="space-y-4 pt-2 border-t-2 border-black">
          <div class="space-y-1.5">
            <label for="room-code" class="block text-xs font-black text-black uppercase tracking-wider">
              Kode Room (6 Huruf)
            </label>
            <input
              id="room-code"
              type="text"
              maxlength="6"
              bind:value={joinCode}
              placeholder="CONTOH: AB12CD"
              class="w-full px-4 py-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000] text-black font-mono font-black text-center uppercase tracking-widest placeholder-slate-400 focus:outline-none focus:bg-[#FFF9C4] transition"
              onkeydown={(e) => {
                if (e.key === 'Enter') handleJoin();
              }}
            />
          </div>

          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onclick={() => { errorMessage = ''; mode = 'HOME'; }}
              class="py-3 px-4 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Kembali
            </button>
            <button
              type="button"
              onclick={handleJoin}
              class="py-3 px-4 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition"
            >
              Masuk Room
            </button>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <!-- Room Waiting Room (Neobrutalism) -->
    <div class="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_#000] space-y-6">
      <div class="flex items-center justify-between border-b-2 border-black pb-4">
        <div>
          <span class="text-xs font-black uppercase tracking-wider text-slate-700">Kode Room</span>
          <div class="text-3xl font-black font-mono tracking-wider text-black">
            {room.code}
          </div>
        </div>
        <button
          onclick={copyCode}
          class="px-3.5 py-2 bg-[#FFE600] hover:bg-[#FDD835] active:translate-x-0.5 active:translate-y-0.5 text-black font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0px_#000] transition flex items-center gap-1.5"
        >
          {#if copied}
            <span>Disalin!</span>
          {:else}
            <span>Salin Kode</span>
          {/if}
        </button>
      </div>

      <!-- Room Config Details Badge -->
      <div class="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase text-black border-2 border-black p-2 bg-[#F8FAFC]">
        <div>
          <span class="block text-[9px] text-slate-500">Timer</span>
          <span>{room.defaultTimer}s</span>
        </div>
        <div>
          <span class="block text-[9px] text-slate-500">Kapasitas</span>
          <span>{room.maxPlayers} Pemain</span>
        </div>
        <div>
          <span class="block text-[9px] text-slate-500">Rentang Soal</span>
          <span>{room.minRange ?? -20} s.d. {room.maxRange ?? 20}</span>
        </div>
      </div>

      <!-- Player List in Room -->
      <div class="space-y-3">
        <div class="flex items-center justify-between text-xs font-black uppercase text-black">
          <span>Pemain Tergabung</span>
          <span>{room.players.length} / {room.maxPlayers}</span>
        </div>

        <div class="space-y-2">
          {#each room.players as p, idx}
            <div class="flex items-center justify-between p-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000]">
              <div class="flex items-center gap-3">
                <span class="w-3.5 h-3.5 border-2 border-black shadow-[1px_1px_0px_#000]" style="background-color: {p.color === 'red' ? '#ef4444' : p.color === 'green' ? '#10b981' : p.color === 'yellow' ? '#f59e0b' : '#3b82f6'};"></span>
                <span class="font-black text-sm text-black uppercase">{p.name}</span>
                {#if p.id === myPlayerId}
                  <span class="text-[10px] font-black uppercase bg-[#FFE600] px-1.5 py-0.5 border border-black shadow-[1px_1px_0px_#000]">
                    Kamu
                  </span>
                {/if}
              </div>
              {#if idx === 0}
                <span class="text-[10px] font-black uppercase bg-black text-white px-2 py-0.5">
                  Host
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Start Button for Host & Leave Button -->
      <div class="space-y-3 pt-2">
        {#if isHost}
          <button
            onclick={onStartGame}
            disabled={!canStart}
            class="w-full py-3.5 px-4 font-black uppercase text-sm tracking-wider border-3 border-black shadow-[4px_4px_0px_#000] transition flex items-center justify-center gap-2 {canStart ? 'bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black cursor-pointer' : 'bg-slate-200 text-slate-500 cursor-not-allowed shadow-none'}"
          >
            {canStart ? 'Mulai Permainan Sekarang' : 'Menunggu Minimal 2 Pemain...'}
          </button>
        {:else}
          <div class="p-3 bg-[#FFE600] border-2 border-black shadow-[2px_2px_0px_#000] text-center text-xs font-black uppercase text-black">
            Menunggu Host memulai permainan...
          </div>
        {/if}

        <!-- Tombol Keluar Room -->
        <button
          type="button"
          onclick={onLeaveRoom}
          class="w-full py-3 px-4 bg-[#FF6B6B] hover:bg-[#EE5253] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-xs tracking-wider border-3 border-black shadow-[3px_3px_0px_#000] transition flex items-center justify-center gap-2"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Keluar dari Room</span>
        </button>
      </div>
    </div>
  {/if}
</div>
