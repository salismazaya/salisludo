<script>
  import { onMount } from 'svelte';
  import { getSocket } from '$lib/socket.js';
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
  let totalTimer = $state(5);
  let timeLeft = $state(5);
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

  onMount(() => {
    sessionId = localStorage.getItem('ludo_math_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      localStorage.setItem('ludo_math_session_id', sessionId);
    }

    const savedName = localStorage.getItem('ludo_math_player_name');
    if (savedName) playerName = savedName;

    socket = getSocket();

    socket.on('connect', () => {
      // Rejoin existing room if available
      const savedCode = localStorage.getItem('ludo_math_room_code');
      if (savedCode && sessionId) {
        socket.emit('rejoin_room', { code: savedCode, sessionId }, (res) => {
          isRestoringSession = false;
          if (res && res.success) {
            currentRoom = res.room;
            myPlayer = res.player;
            if (res.gameStarted) {
              gameView = 'PLAYING';
              tokens = res.tokens || {};
              activePlayer = res.activePlayer;
              totalTimer = res.currentTimer || 5;
              timeLeft = res.timeLeft ?? 5;
              gameState = res.gameState || 'WAITING_FOR_ROLL';
              if (res.currentChallenge) currentChallenge = res.currentChallenge;
              currentRoll = res.currentRoll || null;
              validTokenIds = res.validTokenIds || [];
              winners = res.winners || [];
            }
          } else {
            localStorage.removeItem('ludo_math_room_code');
            gameView = 'LOBBY';
          }
        });
      } else {
        isRestoringSession = false;
      }
    });

    socket.on('player_joined', (data) => {
      currentRoom = data.room;
      if (soundEnabled) sounds.playJoin();
    });

    socket.on('player_left', (data) => {
      currentRoom = data.room;
    });

    socket.on('game_started', (data) => {
      gameView = 'PLAYING';
      tokens = data.tokens;
      activePlayer = data.activePlayer;
      totalTimer = data.currentTimer || 5;
      timeLeft = data.timeLeft ?? 5;
      gameState = data.gameState || 'WAITING_FOR_ROLL';
      currentChallenge = null;
      currentRoll = null;
      validTokenIds = data.validTokenIds || [];
      winners = [];
      if (soundEnabled) sounds.playStart();
    });

    socket.on('timer_tick', (data) => {
      timeLeft = data.timeLeft;
      totalTimer = data.totalTimer || 5;
      if (soundEnabled && timeLeft <= 2 && timeLeft > 0) {
        sounds.playTick();
      }
    });

    socket.on('challenge_ready', (data) => {
      currentChallenge = data.challenge;
      activePlayer = data.activePlayer;
      gameState = 'WAITING_FOR_INPUT';
      timeLeft = data.timeLeft ?? 5;
      totalTimer = data.currentTimer || 5;
    });

    socket.on('dice_rolled', (data) => {
      currentRoll = data.roll;
      validTokenIds = data.validTokenIds || [];
      activePlayer = data.activePlayer;
      gameState = 'WAITING_FOR_MOVE';
      if (soundEnabled) sounds.playRoll();
    });

    socket.on('token_moved', (data) => {
      tokens = data.tokens;
      activePlayer = data.activePlayer;
      gameState = data.gameState;
      currentRoll = null;
      currentChallenge = null;
      validTokenIds = [];
      timeLeft = data.timeLeft ?? 5;
      totalTimer = data.currentTimer || 5;

      if (soundEnabled) {
        if (data.captured) sounds.playCapture();
        else if (data.reachedHome) sounds.playHome();
        else sounds.playMove();
      }
    });

    socket.on('turn_passed', (data) => {
      activePlayer = data.activePlayer;
      gameState = data.gameState || 'WAITING_FOR_ROLL';
      currentRoll = null;
      currentChallenge = null;
      validTokenIds = [];
      timeLeft = data.timeLeft ?? 5;
      totalTimer = data.currentTimer || 5;
    });

    socket.on('game_over', (data) => {
      gameView = 'FINISHED';
      winners = data.winners || [];
      if (soundEnabled) sounds.playWin();
    });

    return () => {
      // Cleanup
    };
  });

  function handleCreateRoom({ name, timer, maxPlayers }, callback) {
    localStorage.setItem('ludo_math_player_name', name);
    socket.emit('create_room', { name, timer, maxPlayers, sessionId }, (res) => {
      if (res && res.success) {
        currentRoom = res.room;
        myPlayer = res.player;
        localStorage.setItem('ludo_math_room_code', res.room.code);
        if (callback) callback(null);
      } else {
        if (callback) callback(res?.error || 'Gagal membuat kamar.');
      }
    });
  }

  function handleJoinRoom({ name, code }, callback) {
    localStorage.setItem('ludo_math_player_name', name);
    socket.emit('join_room', { name, code, sessionId }, (res) => {
      if (res && res.success) {
        currentRoom = res.room;
        myPlayer = res.player;
        localStorage.setItem('ludo_math_room_code', res.room.code);

        if (res.gameStarted) {
          gameView = 'PLAYING';
          tokens = res.tokens || {};
          activePlayer = res.activePlayer;
          totalTimer = res.currentTimer || 5;
          timeLeft = res.timeLeft ?? 5;
          gameState = res.gameState || 'WAITING_FOR_ROLL';
          if (res.currentChallenge) currentChallenge = res.currentChallenge;
          currentRoll = res.currentRoll || null;
          validTokenIds = res.validTokenIds || [];
          winners = res.winners || [];
        }

        if (callback) callback(null);
      } else {
        if (callback) callback(res?.error || 'Kamar tidak ditemukan.');
      }
    });
  }

  function handleStartGame() {
    if (!currentRoom) return;
    socket.emit('start_game', { code: currentRoom.code }, () => {});
  }

  function handleSpinDice() {
    if (!currentRoom) return;
    if (soundEnabled) sounds.playRoll();
    socket.emit('spin_dice', { code: currentRoom.code }, () => {});
  }

  function handleRollDice(inputNumber) {
    if (!currentRoom) return;
    socket.emit('roll_dice', { code: currentRoom.code, inputNumber }, () => {});
  }

  function handleSelectToken(tokenId) {
    if (!currentRoom) return;
    socket.emit('move_token', { code: currentRoom.code, tokenId }, () => {});
  }

  function openLeaderboard() {
    if (!socket) return;
    socket.emit('get_leaderboard', (res) => {
      leaderboardData = res?.leaderboard ?? [];
      showLeaderboard = true;
    });
  }

  function leaveGame() {
    if (currentRoom && socket) {
      socket.emit('leave_room', { code: currentRoom.code });
    }
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

<main class="min-h-screen bg-[#FEF08A] text-black flex flex-col justify-between p-3 sm:p-6 font-sans">
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
        <p class="font-black text-black text-base uppercase">Menghubungkan kembali ke kamar...</p>
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
        onSpin={handleSpinDice}
        onRoll={handleRollDice}
      />

      <!-- Scalable SVG Board (15x15 Classic Grid) -->
      <div class="p-2 sm:p-4 bg-white border-4 border-black shadow-[8px_8px_0px_#000] flex justify-center items-center">
        <BoardSvg
          players={currentRoom?.players ?? []}
          {tokens}
          {validTokenIds}
          activePlayerId={activePlayer?.id}
          onTokenClick={handleSelectToken}
        />
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
            {@const p = currentRoom?.players.find(x => x.id === winnerId)}
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
