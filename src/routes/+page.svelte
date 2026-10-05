<script>
  import { onMount } from 'svelte';
  import { getSocket } from '$lib/socket.js';
  import { initRealtime, unsubscribeRealtime } from '$lib/realtime.js';
  import BoardSvg from '$lib/components/BoardSvg.svelte';
  import TurnHUD from '$lib/components/TurnHUD.svelte';
  import Lobby from '$lib/components/Lobby.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import { sounds } from '$lib/sound.js';

  let socket = null;
  let playerName = $state('');
  let sessionId = $state('');
  let currentRoom = $state(null);
  let myPlayer = $state(null);
  let gameView = $state('LOBBY'); // 'LOBBY' | 'PLAYING' | 'FINISHED'
  let isRestoringSession = $state(true);

  // Active game states
  let tokens = $state({});
  let activePlayer = $state(null);
  let totalTimer = $state(30);
  let timeLeft = $state(30);
  let gameState = $state('WAITING_FOR_ROLL');
  let currentChallenge = $state(null);
  let currentRoll = $state(null);
  let validTokenIds = $state([]);
  let winners = $state([]);

  // Leaderboard modal
  let showLeaderboard = $state(false);
  let leaderboardData = $state([]);

  // Sound toggle
  let soundEnabled = $state(true);

  // Central Realtime Event Handler (handles Pusher events & Socket.IO fallback)
  function handleGameEvent(eventName, data) {
    if (!data) return;

    switch (eventName) {
      case 'room_updated':
        currentRoom = data;
        break;

      case 'player_joined':
        currentRoom = data.room || data;
        if (soundEnabled) sounds.playJoin();
        break;

      case 'player_left':
        currentRoom = data.room || data;
        break;

      case 'player_connection_change':
        if (data.room) currentRoom = data.room;
        break;

      case 'game_started':
        gameView = 'PLAYING';
        tokens = data.tokens || {};
        activePlayer = data.activePlayer;
        totalTimer = data.currentTimer || 30;
        timeLeft = data.currentTimer || 30;
        gameState = data.gameState || 'WAITING_FOR_ROLL';
        currentChallenge = null;
        currentRoll = null;
        validTokenIds = [];
        winners = [];
        if (soundEnabled) sounds.playStart();
        break;

      case 'timer_tick':
        timeLeft = data.timeLeft;
        totalTimer = data.totalTimer || totalTimer || 30;
        if (data.activePlayerId && !activePlayer) {
          activePlayer = currentRoom?.players?.find((p) => p.id === data.activePlayerId) || null;
        }
        if (data.gameState) gameState = data.gameState;
        if (data.tokens) tokens = data.tokens;
        if (data.validTokenIds) validTokenIds = data.validTokenIds;
        if (soundEnabled && timeLeft <= 2 && timeLeft > 0) {
          sounds.playTick();
        }
        break;

      case 'challenge_ready':
        currentChallenge = data.currentChallenge;
        if (data.activePlayer) activePlayer = data.activePlayer;
        gameState = 'WAITING_FOR_INPUT';
        timeLeft = data.timeLeft ?? totalTimer;
        totalTimer = data.currentTimer ?? totalTimer;
        break;

      case 'dice_rolled':
        currentRoll = data.roll;
        validTokenIds = data.validTokenIds || [];
        if (data.activePlayer) activePlayer = data.activePlayer;
        gameState = 'WAITING_FOR_MOVE';
        if (soundEnabled) sounds.playRoll();
        break;

      case 'token_moved':
        tokens = data.tokens || tokens;
        if (data.activePlayer) activePlayer = data.activePlayer;
        gameState = data.gameState || 'WAITING_FOR_ROLL';
        currentRoll = null;
        currentChallenge = null;
        validTokenIds = [];
        timeLeft = data.currentTimer ?? 30;
        totalTimer = data.currentTimer ?? 30;

        if (soundEnabled) {
          if (data.captured) sounds.playCapture();
          else if (data.reachedHome) sounds.playHome();
          else sounds.playMove();
        }
        break;

      case 'turn_passed':
      case 'turn_timeout':
        if (data.activePlayer) activePlayer = data.activePlayer;
        else if (data.nextPlayer) activePlayer = data.nextPlayer;
        gameState = data.gameState || 'WAITING_FOR_ROLL';
        currentRoll = null;
        currentChallenge = null;
        validTokenIds = [];
        timeLeft = data.currentTimer ?? 30;
        totalTimer = data.currentTimer ?? 30;
        break;

      case 'game_over':
        gameView = 'FINISHED';
        winners = data.winners || [];
        if (soundEnabled) sounds.playWin();
        break;
    }
  }

  function subscribeRoomRealtime(code) {
    if (!code) return;
    initRealtime(code, handleGameEvent);
    if (socket) {
      socket.emit('subscribe_room', { code, sessionId });
    }
  }

  onMount(() => {
    sessionId = localStorage.getItem('ludo_math_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('ludo_math_session_id', sessionId);
    }

    const savedName = localStorage.getItem('ludo_math_player_name');
    if (savedName) playerName = savedName;

    // Timeout pengaman agar UI tidak stuck loading
    const timeoutTimer = setTimeout(() => {
      if (isRestoringSession) {
        isRestoringSession = false;
      }
    }, 2000);

    const savedCode = localStorage.getItem('ludo_math_room_code');
    if (savedCode && sessionId) {
      fetch('/api/rooms/rejoin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: savedCode, sessionId })
      })
        .then((res) => res.json())
        .then((res) => {
          clearTimeout(timeoutTimer);
          isRestoringSession = false;
          if (res && res.success) {
            currentRoom = res.room;
            myPlayer = res.player;
            subscribeRoomRealtime(res.room.code);

            if (res.gameStarted) {
              gameView = 'PLAYING';
              tokens = res.tokens || {};
              activePlayer = res.activePlayer;
              totalTimer = res.currentTimer || 30;
              timeLeft = res.timeLeft ?? 30;
              gameState = res.gameState || 'WAITING_FOR_ROLL';
              if (res.currentChallenge) currentChallenge = res.currentChallenge;
              currentRoll = res.currentRoll || null;
              validTokenIds = res.validTokenIds || [];
              winners = res.winners || [];
            }
          } else {
            localStorage.removeItem('ludo_math_room_code');
            currentRoom = null;
            gameView = 'LOBBY';
          }
        })
        .catch(() => {
          clearTimeout(timeoutTimer);
          isRestoringSession = false;
        });
    } else {
      clearTimeout(timeoutTimer);
      isRestoringSession = false;
    }

    // Socket.IO fallback listener
    socket = getSocket();
    if (socket) {
      [
        'player_joined',
        'room_updated',
        'player_left',
        'player_connection_change',
        'game_started',
        'timer_tick',
        'challenge_ready',
        'dice_rolled',
        'token_moved',
        'turn_passed',
        'turn_timeout',
        'game_over'
      ].forEach((ev) => {
        socket.on(ev, (data) => handleGameEvent(ev, data));
      });
    }

    return () => {
      unsubscribeRealtime();
    };
  });

  async function handleCreateRoom({ name, timer, maxPlayers, minRange, maxRange }, callback) {
    localStorage.setItem('ludo_math_player_name', name);
    try {
      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, timer, maxPlayers, minRange, maxRange, sessionId })
      }).then((r) => r.json());

      if (res && res.success) {
        currentRoom = res.room;
        myPlayer = res.player;
        localStorage.setItem('ludo_math_room_code', res.room.code);
        subscribeRoomRealtime(res.room.code);
        if (socket && socket.connected) {
          socket.emit('rejoin_room', { code: res.room.code, sessionId }, () => {});
        }
        if (callback) callback(null);
      } else {
        if (callback) callback(res?.error || 'Gagal membuat room.');
      }
    } catch (err) {
      if (callback) callback('Terjadi gangguan koneksi');
    }
  }

  async function handleJoinRoom({ name, code }, callback) {
    localStorage.setItem('ludo_math_player_name', name);
    try {
      const res = await fetch('/api/rooms/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code, sessionId })
      }).then((r) => r.json());

      if (res && res.success) {
        currentRoom = res.room;
        myPlayer = res.player;
        localStorage.setItem('ludo_math_room_code', res.room.code);
        subscribeRoomRealtime(res.room.code);
        if (socket && socket.connected) {
          socket.emit('rejoin_room', { code: res.room.code, sessionId }, () => {});
        }

        if (res.gameStarted) {
          gameView = 'PLAYING';
          tokens = res.tokens || {};
          activePlayer = res.activePlayer;
          totalTimer = res.currentTimer || 30;
          timeLeft = res.timeLeft ?? 30;
          gameState = res.gameState || 'WAITING_FOR_ROLL';
          if (res.currentChallenge) currentChallenge = res.currentChallenge;
          currentRoll = res.currentRoll || null;
          validTokenIds = res.validTokenIds || [];
          winners = res.winners || [];
        }

        if (callback) callback(null);
      } else {
        if (callback) callback(res?.error || 'Room tidak ditemukan.');
      }
    } catch (err) {
      if (callback) callback('Terjadi gangguan koneksi');
    }
  }

  async function handleStartGame() {
    if (!currentRoom) return;
    await fetch('/api/rooms/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: currentRoom.code, sessionId })
    });
  }

  async function handleSpinDice() {
    if (!currentRoom) return;
    if (soundEnabled) sounds.playRoll();
    await fetch('/api/rooms/spin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: currentRoom.code, sessionId })
    });
  }

  async function handleRollDice(inputNumber) {
    if (!currentRoom) return;
    await fetch('/api/rooms/roll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: currentRoom.code, sessionId, inputNumber })
    });
  }

  async function handleSelectToken(tokenId) {
    if (!currentRoom) return;
    await fetch('/api/rooms/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: currentRoom.code, sessionId, tokenId })
    });
  }

  async function openLeaderboard() {
    try {
      const res = await fetch('/api/leaderboard').then((r) => r.json());
      leaderboardData = res?.leaderboard ?? [];
      showLeaderboard = true;
    } catch {
      leaderboardData = [];
      showLeaderboard = true;
    }
  }

  async function leaveGame() {
    if (currentRoom) {
      fetch('/api/rooms/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: currentRoom.code, sessionId })
      }).catch(() => {});
    }
    unsubscribeRealtime();
    localStorage.removeItem('ludo_math_room_code');
    currentRoom = null;
    myPlayer = null;
    gameView = 'LOBBY';
    tokens = {};
    activePlayer = null;
    validTokenIds = [];
    currentRoll = null;
    winners = [];
  }
</script>

<svelte:head>
  <title>SalisLudo - Neobrutalism Math Game</title>
</svelte:head>

<main class="min-h-screen bg-white text-black flex flex-col justify-between p-3 sm:p-6 font-sans">
  <!-- Navigation Header Neobrutalist -->
  <header class="max-w-5xl w-full mx-auto flex items-center justify-between p-3 bg-white border-4 border-black shadow-[5px_5px_0px_#000] mb-5">
    <div class="flex items-center gap-2.5">
      <div class="w-9 h-9 bg-[#FFE600] text-black flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_#000]">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="0" />
          <path d="M8 8h.01" />
          <path d="M12 12h.01" />
          <path d="M16 16h.01" />
          <path d="M16 8h.01" />
          <path d="M8 16h.01" />
        </svg>
      </div>
      <span class="font-black text-lg sm:text-xl tracking-tight text-black uppercase">
        SalisLudo
      </span>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      <button
        onclick={openLeaderboard}
        class="text-xs px-3 py-1.5 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] text-black font-black uppercase tracking-wider transition flex items-center gap-1.5"
      >
        <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
        <span>Peringkat</span>
      </button>

      <button
        onclick={() => (soundEnabled = !soundEnabled)}
        class="text-xs p-2 bg-white hover:bg-slate-100 active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] text-black transition"
        title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
        aria-label={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
      >
        {#if soundEnabled}
          <svg class="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        {:else}
          <svg class="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        {/if}
      </button>

      {#if gameView !== 'LOBBY'}
        <button
          onclick={leaveGame}
          class="text-xs px-3 py-1.5 bg-[#FF6B6B] hover:bg-[#EE5253] active:translate-x-0.5 active:translate-y-0.5 border-2 border-black shadow-[2px_2px_0px_#000] text-black font-black uppercase tracking-wider transition"
        >
          Keluar
        </button>
      {/if}
    </div>
  </header>

  <!-- Body Content -->
  <div class="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto space-y-4">
    {#if isRestoringSession}
      <div class="p-8 text-center text-black bg-white border-4 border-black shadow-[6px_6px_0px_#000] space-y-3">
        <div class="w-8 h-8 mx-auto animate-spin text-black">
          <svg class="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <p class="font-black text-black text-base uppercase">Menghubungkan kembali ke room...</p>
        <p class="text-xs text-slate-700 font-bold">Memulihkan sesi permainanmu</p>
      </div>
    {:else if gameView === 'LOBBY'}
      <Lobby
        bind:playerName
        room={currentRoom}
        player={myPlayer}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onStartGame={handleStartGame}
        onLeaveRoom={leaveGame}
        onShowLeaderboard={openLeaderboard}
      />
    {:else if gameView === 'PLAYING'}
      {@const isInputting = activePlayer?.id === sessionId && gameState !== 'WAITING_FOR_MOVE' && !!currentChallenge}

      <!-- Turn HUD with Interactive Math Input & Non-blocking Result Display -->
      <TurnHUD
        {activePlayer}
        myPlayerId={sessionId}
        {timeLeft}
        {totalTimer}
        {gameState}
        {validTokenIds}
        {currentChallenge}
        {currentRoll}
        minRange={currentRoom?.minRange ?? -20}
        maxRange={currentRoom?.maxRange ?? 20}
        onSpin={handleSpinDice}
        onRoll={handleRollDice}
      />

      <!-- Scalable SVG Board (15x15 Classic Grid) -->
      <!-- Papan diperkecil saat input angka agar pas 1 layar tanpa perlu scroll -->
      <div
        class="w-full transition-all duration-300 flex flex-col items-center justify-center {isInputting ? 'max-w-[190px] sm:max-w-[240px] p-1.5 bg-white border-2 border-black shadow-[3px_3px_0px_#000]' : 'max-w-4xl p-2 sm:p-4 bg-white border-4 border-black shadow-[8px_8px_0px_#000]'}"
      >
        <BoardSvg
          players={currentRoom?.players ?? []}
          {tokens}
          {validTokenIds}
          activePlayerId={activePlayer?.id}
          onTokenClick={handleSelectToken}
        />
        {#if isInputting}
          <span class="text-[9px] font-black uppercase tracking-wider text-slate-500 pt-1 text-center">
            Papan mini saat input (otomatis membesar)
          </span>
        {/if}
      </div>
    {:else if gameView === 'FINISHED'}
      <!-- Game Over / Winner Screen (Neobrutalism) -->
      <div class="w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_#000] p-8 text-center space-y-6">
        <div class="w-16 h-16 mx-auto bg-[#FFE600] text-black flex items-center justify-center border-3 border-black shadow-[3px_3px_0px_#000]">
          <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </svg>
        </div>
        <h2 class="text-3xl font-black text-black uppercase">Permainan Selesai!</h2>
        <p class="text-xs font-bold text-slate-800">
          Selamat kepada para pemenang yang berhasil memasukkan seluruh bidaknya ke zona finish!
        </p>

        <div class="space-y-2">
          {#each winners as winnerId, idx}
            {@const p = currentRoom?.players.find((x) => x.id === winnerId)}
            <div class="flex items-center justify-between p-3 bg-[#F8FAFC] border-2 border-black shadow-[2px_2px_0px_#000]">
              <span class="font-black text-black text-sm uppercase">Juara {idx + 1}</span>
              <span class="font-black text-black text-sm uppercase">{p?.name ?? 'Pemain'}</span>
            </div>
          {/each}
        </div>

        <button
          onclick={leaveGame}
          class="w-full py-3.5 bg-[#4ADE80] hover:bg-[#22C55E] active:translate-x-0.5 active:translate-y-0.5 text-black font-black uppercase text-sm border-3 border-black shadow-[4px_4px_0px_#000] transition"
        >
          Kembali ke Menu Utama
        </button>
      </div>
    {/if}
  </div>

  <!-- Footer Info -->
  <footer class="text-center py-4 text-xs font-black uppercase tracking-wider text-black">
    SalisLudo &bull; Rentang angka -20 s.d. 20 &bull; 6 atau -6 giliran ekstra (3 detik)
  </footer>

  <!-- Leaderboard Modal Dialog -->
  {#if showLeaderboard}
    <Leaderboard
      leaderboard={leaderboardData}
      onClose={() => (showLeaderboard = false)}
    />
  {/if}
</main>
