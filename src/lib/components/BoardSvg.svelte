<script>
  import {
    PLAYER_COLORS,
    COLOR_CONFIG,
    SAFE_SQUARES,
    TRACK_GRID_COORDS,
    HOME_COLUMN_GRID_COORDS,
    YARD_PIXEL_COORDS,
    HOME_PIXEL_COORDS,
    getTrackPixelCoords,
    getHomeColumnPixelCoords
  } from '../../../server/game/Board.js';

  let {
    players = [],
    tokens = {},
    validTokenIds = [],
    activePlayerId = null,
    onTokenClick = () => {}
  } = $props();

  const greenPlayer = $derived(players.find(p => p.color === 'green'));
  const yellowPlayer = $derived(players.find(p => p.color === 'yellow'));
  const redPlayer = $derived(players.find(p => p.color === 'red'));
  const bluePlayer = $derived(players.find(p => p.color === 'blue'));

  // Helper to map a token's logical position to pixel coordinates [x, y]
  function getTokenCoordinates(playerColor, token, tokenId) {
    if (!token) return { x: 300, y: 300 };

    if (token.type === 'YARD') {
      const yardList = YARD_PIXEL_COORDS[playerColor] || YARD_PIXEL_COORDS.red;
      return yardList[tokenId] || yardList[0];
    }

    if (token.type === 'TRACK') {
      return getTrackPixelCoords(token.index);
    }

    if (token.type === 'HOME_COLUMN') {
      return getHomeColumnPixelCoords(playerColor, token.index);
    }

    if (token.type === 'HOME') {
      return HOME_PIXEL_COORDS[playerColor] || { x: 300, y: 300 };
    }

    return { x: 300, y: 300 };
  }

  // Group tokens that share the same square so we can offset them visually
  const allRenderedTokens = $derived.by(() => {
    const list = [];
    players.forEach(p => {
      const playerTokens = tokens[p.id] || [];
      playerTokens.forEach(t => {
        const baseCoords = getTokenCoordinates(p.color, t, t.id);
        const isEligible = activePlayerId === p.id && validTokenIds.includes(t.id);
        list.push({
          playerId: p.id,
          playerName: p.name,
          color: p.color,
          token: t,
          baseCoords,
          isEligible,
          // key for stacking
          coordKey: `${t.type}_${t.index}_${t.type === 'YARD' ? t.id : ''}_${t.type === 'HOME' ? p.color : ''}`
        });
      });
    });

    // Compute stacking offset
    const grouped = {};
    list.forEach(item => {
      if (!grouped[item.coordKey]) grouped[item.coordKey] = [];
      grouped[item.coordKey].push(item);
    });

    list.forEach(item => {
      const group = grouped[item.coordKey];
      if (group.length > 1 && item.token.type !== 'YARD') {
        const idx = group.indexOf(item);
        const total = group.length;
        // Radial or small diagonal offset
        const angle = (idx / total) * Math.PI * 2;
        const radius = Math.min(12, 5 + total * 2);
        item.renderX = item.baseCoords.x + Math.cos(angle) * radius;
        item.renderY = item.baseCoords.y + Math.sin(angle) * radius;
      } else {
        item.renderX = item.baseCoords.x;
        item.renderY = item.baseCoords.y;
      }
    });

    return list;
  });

  // Track cell data for rendering
  const trackCellsList = $derived.by(() => {
    const cells = [];
    for (let i = 0; i < 52; i++) {
      const [col, row] = TRACK_GRID_COORDS[i];
      const isSafe = SAFE_SQUARES.includes(i);
      let specialType = null; // 'START_RED', 'START_GREEN', 'START_YELLOW', 'START_BLUE', 'SAFE_STAR'
      if (i === 0) specialType = 'START_RED';
      else if (i === 13) specialType = 'START_GREEN';
      else if (i === 26) specialType = 'START_YELLOW';
      else if (i === 39) specialType = 'START_BLUE';
      else if (isSafe) specialType = 'SAFE_STAR';

      cells.push({
        index: i,
        col,
        row,
        x: col * 40,
        y: row * 40,
        isSafe,
        specialType
      });
    }
    return cells;
  });
</script>

<div class="w-full max-w-[760px] aspect-square mx-auto p-1 sm:p-3 flex items-center justify-center">
  <svg
    viewBox="0 0 600 600"
    class="w-full h-full select-none border-4 border-black shadow-[6px_6px_0px_#000] bg-white"
  >
    <defs>
      <!-- Gradients for 3D Pawn Tokens -->
      <radialGradient id="token-red" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#f87171" />
        <stop offset="50%" stop-color="#ef4444" />
        <stop offset="100%" stop-color="#991b1b" />
      </radialGradient>
      <radialGradient id="token-green" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#4ade80" />
        <stop offset="50%" stop-color="#10b981" />
        <stop offset="100%" stop-color="#065f46" />
      </radialGradient>
      <radialGradient id="token-yellow" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#fde047" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#92400e" />
      </radialGradient>
      <radialGradient id="token-blue" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="#60a5fa" />
        <stop offset="50%" stop-color="#3b82f6" />
        <stop offset="100%" stop-color="#1e3a8a" />
      </radialGradient>

      <!-- Token Drop Shadow -->
      <filter id="pawn-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.6" />
      </filter>

      <!-- Glow for Active Token -->
      <filter id="active-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="5" flood-color="#ffffff" flood-opacity="0.9" />
      </filter>
    </defs>

    <!-- 1. BOARD BACKGROUND GRID -->
    <rect x="0" y="0" width="600" height="600" fill="#f8fafc" />

    <!-- 2. FOUR CORNER YARDS (BASES) -->
    <!-- Green Yard (Top-Left: 6x6 cells) -->
    <g class={activePlayerId === greenPlayer?.id ? 'active-yard' : ''}>
      <rect x="0" y="0" width="240" height="240" fill="#10B981" />
      {#if activePlayerId === greenPlayer?.id}
        <rect x="3" y="3" width="234" height="234" rx="6" fill="none" stroke="#6ee7b7" stroke-width="4" stroke-dasharray="8,6" class="animate-pulse" />
      {/if}
      <rect x="30" y="30" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      {#each YARD_PIXEL_COORDS.green as pt, i}
        <circle cx={pt.x} cy={pt.y} r="22" fill="#d1fae5" stroke="#10b981" stroke-width="3" />
        <circle cx={pt.x} cy={pt.y} r="8" fill="#a7f3d0" />
      {/each}
      <rect x="15" y="8" width="210" height="20" rx="10" fill={activePlayerId === greenPlayer?.id ? '#047857' : 'rgba(0,0,0,0.25)'} />
      <text x="120" y="22" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">
        {#if activePlayerId === greenPlayer?.id}★ {/if}{greenPlayer ? greenPlayer.name.toUpperCase() : 'MENUNGGU'}{#if activePlayerId === greenPlayer?.id} ★{/if}
      </text>
      {#if activePlayerId === greenPlayer?.id}
        <circle cx="28" cy="18" r="4" fill="#34d399" class="animate-ping" />
        <circle cx="28" cy="18" r="3" fill="#ffffff" />
      {/if}
    </g>

    <!-- Yellow Yard (Top-Right: 6x6 cells) -->
    <g class={activePlayerId === yellowPlayer?.id ? 'active-yard' : ''}>
      <rect x="360" y="0" width="240" height="240" fill="#F59E0B" />
      {#if activePlayerId === yellowPlayer?.id}
        <rect x="363" y="3" width="234" height="234" rx="6" fill="none" stroke="#fde047" stroke-width="4" stroke-dasharray="8,6" class="animate-pulse" />
      {/if}
      <rect x="390" y="30" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      {#each YARD_PIXEL_COORDS.yellow as pt, i}
        <circle cx={pt.x} cy={pt.y} r="22" fill="#fef3c7" stroke="#f59e0b" stroke-width="3" />
        <circle cx={pt.x} cy={pt.y} r="8" fill="#fde68a" />
      {/each}
      <rect x="375" y="8" width="210" height="20" rx="10" fill={activePlayerId === yellowPlayer?.id ? '#b45309' : 'rgba(0,0,0,0.25)'} />
      <text x="480" y="22" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">
        {#if activePlayerId === yellowPlayer?.id}★ {/if}{yellowPlayer ? yellowPlayer.name.toUpperCase() : 'MENUNGGU'}{#if activePlayerId === yellowPlayer?.id} ★{/if}
      </text>
      {#if activePlayerId === yellowPlayer?.id}
        <circle cx="388" cy="18" r="4" fill="#fde047" class="animate-ping" />
        <circle cx="388" cy="18" r="3" fill="#ffffff" />
      {/if}
    </g>

    <!-- Red Yard (Bottom-Left: 6x6 cells) -->
    <g class={activePlayerId === redPlayer?.id ? 'active-yard' : ''}>
      <rect x="0" y="360" width="240" height="240" fill="#EF4444" />
      {#if activePlayerId === redPlayer?.id}
        <rect x="3" y="363" width="234" height="234" rx="6" fill="none" stroke="#fca5a5" stroke-width="4" stroke-dasharray="8,6" class="animate-pulse" />
      {/if}
      <rect x="30" y="390" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      {#each YARD_PIXEL_COORDS.red as pt, i}
        <circle cx={pt.x} cy={pt.y} r="22" fill="#fee2e2" stroke="#ef4444" stroke-width="3" />
        <circle cx={pt.x} cy={pt.y} r="8" fill="#fecaca" />
      {/each}
      <rect x="15" y="368" width="210" height="20" rx="10" fill={activePlayerId === redPlayer?.id ? '#b91c1c' : 'rgba(0,0,0,0.25)'} />
      <text x="120" y="382" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">
        {#if activePlayerId === redPlayer?.id}★ {/if}{redPlayer ? redPlayer.name.toUpperCase() : 'MENUNGGU'}{#if activePlayerId === redPlayer?.id} ★{/if}
      </text>
      {#if activePlayerId === redPlayer?.id}
        <circle cx="28" cy="378" r="4" fill="#fca5a5" class="animate-ping" />
        <circle cx="28" cy="378" r="3" fill="#ffffff" />
      {/if}
    </g>

    <!-- Blue Yard (Bottom-Right: 6x6 cells) -->
    <g class={activePlayerId === bluePlayer?.id ? 'active-yard' : ''}>
      <rect x="360" y="360" width="240" height="240" fill="#3B82F6" />
      {#if activePlayerId === bluePlayer?.id}
        <rect x="363" y="363" width="234" height="234" rx="6" fill="none" stroke="#93c5fd" stroke-width="4" stroke-dasharray="8,6" class="animate-pulse" />
      {/if}
      <rect x="390" y="390" width="180" height="180" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />
      {#each YARD_PIXEL_COORDS.blue as pt, i}
        <circle cx={pt.x} cy={pt.y} r="22" fill="#dbeafe" stroke="#3b82f6" stroke-width="3" />
        <circle cx={pt.x} cy={pt.y} r="8" fill="#bfdbfe" />
      {/each}
      <rect x="375" y="368" width="210" height="20" rx="10" fill={activePlayerId === bluePlayer?.id ? '#1d4ed8' : 'rgba(0,0,0,0.25)'} />
      <text x="480" y="382" fill="#ffffff" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.5">
        {#if activePlayerId === bluePlayer?.id}★ {/if}{bluePlayer ? bluePlayer.name.toUpperCase() : 'MENUNGGU'}{#if activePlayerId === bluePlayer?.id} ★{/if}
      </text>
      {#if activePlayerId === bluePlayer?.id}
        <circle cx="388" cy="378" r="4" fill="#93c5fd" class="animate-ping" />
        <circle cx="388" cy="378" r="3" fill="#ffffff" />
      {/if}
    </g>

    <!-- 3. TRACK CELLS (52 Cells) -->
    <g id="track-cells">
      {#each trackCellsList as cell}
        {@const isStartRed = cell.specialType === 'START_RED'}
        {@const isStartGreen = cell.specialType === 'START_GREEN'}
        {@const isStartYellow = cell.specialType === 'START_YELLOW'}
        {@const isStartBlue = cell.specialType === 'START_BLUE'}
        {@const isSafeStar = cell.specialType === 'SAFE_STAR'}

        <!-- Cell Base -->
        <rect
          x={cell.x}
          y={cell.y}
          width="40"
          height="40"
          fill={isStartRed
            ? '#ef4444'
            : isStartGreen
            ? '#10b981'
            : isStartYellow
            ? '#f59e0b'
            : isStartBlue
            ? '#3b82f6'
            : isSafeStar
            ? '#f1f5f9'
            : '#ffffff'}
          stroke="#cbd5e1"
          stroke-width="1"
        />

        <!-- Start Square Arrow Markers -->
        {#if isStartRed}
          <!-- Arrow pointing UP -->
          <polygon
            points="{cell.x + 20},{cell.y + 8} {cell.x + 10},{cell.y + 24} {cell.x + 16},{cell.y + 24} {cell.x + 16},{cell.y + 32} {cell.x + 24},{cell.y + 32} {cell.x + 24},{cell.y + 24} {cell.x + 30},{cell.y + 24}"
            fill="#ffffff"
          />
        {:else if isStartGreen}
          <!-- Arrow pointing RIGHT -->
          <polygon
            points="{cell.x + 32},{cell.y + 20} {cell.x + 16},{cell.y + 10} {cell.x + 16},{cell.y + 16} {cell.x + 8},{cell.y + 16} {cell.x + 8},{cell.y + 24} {cell.x + 16},{cell.y + 24} {cell.x + 16},{cell.y + 30}"
            fill="#ffffff"
          />
        {:else if isStartYellow}
          <!-- Arrow pointing DOWN -->
          <polygon
            points="{cell.x + 20},{cell.y + 32} {cell.x + 10},{cell.y + 16} {cell.x + 16},{cell.y + 16} {cell.x + 16},{cell.y + 8} {cell.x + 24},{cell.y + 8} {cell.x + 24},{cell.y + 16} {cell.x + 30},{cell.y + 16}"
            fill="#ffffff"
          />
        {:else if isStartBlue}
          <!-- Arrow pointing LEFT -->
          <polygon
            points="{cell.x + 8},{cell.y + 20} {cell.x + 24},{cell.y + 10} {cell.x + 24},{cell.y + 16} {cell.x + 32},{cell.y + 16} {cell.x + 32},{cell.y + 24} {cell.x + 24},{cell.y + 24} {cell.x + 24},{cell.y + 30}"
            fill="#ffffff"
          />
        {:else if isSafeStar}
          <!-- Safe Star Icon (★) -->
          <path
            d="M {cell.x + 20} {cell.y + 10}
               L {cell.x + 22.8} {cell.y + 16.5}
               L {cell.x + 29.5} {cell.y + 17.1}
               L {cell.x + 24.4} {cell.y + 21.6}
               L {cell.x + 25.9} {cell.y + 28.2}
               L {cell.x + 20} {cell.y + 24.8}
               L {cell.x + 14.1} {cell.y + 28.2}
               L {cell.x + 15.6} {cell.y + 21.6}
               L {cell.x + 10.5} {cell.y + 17.1}
               L {cell.x + 17.2} {cell.y + 16.5} Z"
            fill="#64748b"
          />
        {/if}
      {/each}
    </g>

    <!-- 4. FOUR HOME RUN COLUMNS (5 cells each) -->
    <!-- Red Home Column (bottom arm middle col 7, rows 13..9) -->
    {#each HOME_COLUMN_GRID_COORDS.red as [c, r]}
      <rect x={c * 40} y={r * 40} width="40" height="40" fill="#ef4444" stroke="#ffffff" stroke-width="1.5" />
    {/each}

    <!-- Green Home Column (left arm middle row 7, cols 1..5) -->
    {#each HOME_COLUMN_GRID_COORDS.green as [c, r]}
      <rect x={c * 40} y={r * 40} width="40" height="40" fill="#10b981" stroke="#ffffff" stroke-width="1.5" />
    {/each}

    <!-- Yellow Home Column (top arm middle col 7, rows 1..5) -->
    {#each HOME_COLUMN_GRID_COORDS.yellow as [c, r]}
      <rect x={c * 40} y={r * 40} width="40" height="40" fill="#f59e0b" stroke="#ffffff" stroke-width="1.5" />
    {/each}

    <!-- Blue Home Column (right arm middle row 7, cols 13..9) -->
    {#each HOME_COLUMN_GRID_COORDS.blue as [c, r]}
      <rect x={c * 40} y={r * 40} width="40" height="40" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5" />
    {/each}

    <!-- 5. CENTER FINISH ZONE (4 Triangles meeting at 300,300) -->
    <g id="center-home">
      <!-- Top Triangle (Yellow) -->
      <polygon points="240,240 360,240 300,300" fill="#f59e0b" stroke="#ffffff" stroke-width="1" />
      <!-- Right Triangle (Blue) -->
      <polygon points="360,240 360,360 300,300" fill="#3b82f6" stroke="#ffffff" stroke-width="1" />
      <!-- Bottom Triangle (Red) -->
      <polygon points="360,360 240,360 300,300" fill="#ef4444" stroke="#ffffff" stroke-width="1" />
      <!-- Left Triangle (Green) -->
      <polygon points="240,360 240,240 300,300" fill="#10b981" stroke="#ffffff" stroke-width="1" />

      <!-- Center Inner Hub -->
      <circle cx="300" cy="300" r="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
      <circle cx="300" cy="300" r="12" fill="#0f172a" />
      <!-- Center Star Icon -->
      <path
        d="M 300 293
           L 302 297.5
           L 307 298
           L 303.2 301.2
           L 304.5 306
           L 300 303.5
           L 295.5 306
           L 296.8 301.2
           L 293 298
           L 298 297.5 Z"
        fill="#facc15"
      />
    </g>

    <!-- 6. TOKENS LAYER (Realistic Pawns with 3D Gradients & Pulse Rings) -->
    <g id="tokens-layer">
      {#each allRenderedTokens as item}
        {@const gradId = `token-${item.color}`}
        <!-- Bounding Box for Easy Clicking on Mobile/Desktop (Large Touch Target) -->
        <circle
          cx={item.renderX}
          cy={item.renderY}
          r="26"
          fill="transparent"
          class="cursor-pointer"
          onclick={() => {
            onTokenClick(item.token.id);
          }}
        />

        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <g
          transform="translate({item.renderX}, {item.renderY})"
          style="transform: translate({item.renderX}px, {item.renderY}px); transition: transform 0.65s cubic-bezier(0.34, 1.3, 0.64, 1); will-change: transform; pointer-events: none;"
          class="pawn-node {item.isEligible ? 'is-eligible' : ''}"
          filter={item.isEligible ? 'url(#active-glow)' : 'url(#pawn-shadow)'}
        >
          <!-- Active Pulsing Target Rings for Eligible Tokens -->
          {#if item.isEligible}
            <circle cx="0" cy="0" r="20" fill="none" stroke="#ffffff" stroke-width="2.5" class="animate-ping opacity-75" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="#facc15" stroke-width="2.5" stroke-dasharray="3,3" />
            <!-- Floating Animated Pointer Arrow above token -->
            <path
              d="M -5,-26 L 5,-26 L 0,-20 Z"
              fill="#facc15"
              stroke="#0f172a"
              stroke-width="1"
              class="animate-bounce"
            />
          {/if}

          <!-- Pawn Shadow -->
          <ellipse cx="0" cy="8" rx="12" ry="4" fill="rgba(0,0,0,0.35)" />

          <!-- Pawn Base Ring -->
          <ellipse cx="0" cy="5" rx="11" ry="4" fill="url(#{gradId})" stroke="#ffffff" stroke-width="0.8" />

          <!-- Pawn Conical Body -->
          <path
            d="M -9,5 C -8,-2 -5,-8 0,-10 C 5,-8 8,-2 9,5 Z"
            fill="url(#{gradId})"
            stroke="#ffffff"
            stroke-width="0.8"
          />

          <!-- Pawn Head Sphere -->
          <circle cx="0" cy="-11" r="7" fill="url(#{gradId})" stroke="#ffffff" stroke-width="0.8" />

          <!-- Specular Highlight for 3D Finish -->
          <circle cx="-2" cy="-13" r="2.2" fill="rgba(255, 255, 255, 0.75)" />

          <!-- Small Inner Badge with Token ID (1..4) -->
          <text
            x="0"
            y="-2"
            fill="#ffffff"
            font-size="7"
            font-weight="bold"
            text-anchor="middle"
            class="pointer-events-none"
          >
            {item.token.id + 1}
          </text>
        </g>
      {/each}
    </g>
  </svg>
</div>

<style>
  :global(.pawn-node) {
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-box: fill-box;
  }
  :global(.active-yard) {
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
  }
</style>
