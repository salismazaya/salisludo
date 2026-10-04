import { computeTokenTargetPosition, isSafeSquare, getStartSquare } from './Board6.js';

export class LudoGame {
  constructor({ id, defaultTimer = 10, players }) {
    this.id = id;
    this.defaultTimer = defaultTimer;
    this.currentTurnTimer = defaultTimer;
    this.players = players; // array of { id, name, color }
    this.currentTurnIndex = 0;
    this.consecutiveSixes = 0;
    this.pendingRoll = null;
    this.state = 'WAITING_FOR_ROLL'; // 'WAITING_FOR_ROLL' | 'WAITING_FOR_MOVE' | 'FINISHED'
    this.winners = [];

    // Initialize 4 tokens per player
    this.tokens = {};
    players.forEach(p => {
      this.tokens[p.id] = [0, 1, 2, 3].map(tokenId => ({
        id: tokenId,
        type: 'YARD',
        index: tokenId
      }));
    });
  }

  get currentTurnPlayer() {
    return this.players[this.currentTurnIndex];
  }

  applyRoll(rollResult) {
    this.pendingRoll = rollResult;
    this.state = 'WAITING_FOR_MOVE';

    // Check valid moves
    const validTokenIds = this.getValidMoves(this.currentTurnPlayer.id);
    if (validTokenIds.length === 0) {
      // Auto pass turn
      return { autoSkip: true, validTokenIds: [] };
    }
    return { autoSkip: false, validTokenIds };
  }

  getValidMoves(playerId) {
    if (!this.pendingRoll) return [];
    const player = this.players.find(p => p.id === playerId);
    const tokens = this.tokens[playerId];
    const valid = [];

    tokens.forEach(tok => {
      const target = computeTokenTargetPosition({
        color: player.color,
        currentPos: tok,
        steps: this.pendingRoll.steps,
        direction: this.pendingRoll.direction
      });
      if (target) valid.push(tok.id);
    });

    return valid;
  }

  moveToken(playerId, tokenId) {
    if (this.currentTurnPlayer.id !== playerId || this.state !== 'WAITING_FOR_MOVE') {
      return { success: false, reason: 'NOT_YOUR_TURN' };
    }

    const player = this.players.find(p => p.id === playerId);
    const token = this.tokens[playerId][tokenId];
    const target = computeTokenTargetPosition({
      color: player.color,
      currentPos: token,
      steps: this.pendingRoll.steps,
      direction: this.pendingRoll.direction
    });

    if (!target) return { success: false, reason: 'INVALID_MOVE' };

    // Move token
    token.type = target.type;
    token.index = target.index;

    let captured = null;
    // Check capture on TRACK if target not safe
    if (target.type === 'TRACK' && !isSafeSquare(target.index)) {
      for (const p of this.players) {
        if (p.id === playerId) continue;
        for (const oppTok of this.tokens[p.id]) {
          if (oppTok.type === 'TRACK' && oppTok.index === target.index) {
            oppTok.type = 'YARD';
            captured = { playerId: p.id, tokenId: oppTok.id };
            break;
          }
        }
      }
    }

    // Win check for this player
    const finishedTokens = this.tokens[playerId].filter(t => t.type === 'HOME').length;
    if (finishedTokens === 4 && !this.winners.includes(playerId)) {
      this.winners.push(playerId);
      if (this.winners.length === this.players.length - 1) {
        this.state = 'FINISHED';
        return { success: true, finished: true, winners: this.winners };
      }
    }

    // Extra turn condition (rolled 6 or captured piece)
    const getsBonus = (this.pendingRoll.extraTurn || captured !== null) && this.consecutiveSixes < 2;

    if (this.pendingRoll.extraTurn) {
      this.consecutiveSixes += 1;
      this.currentTurnTimer = Math.max(2, Math.floor(this.currentTurnTimer / 2));
    } else {
      this.consecutiveSixes = 0;
      this.currentTurnTimer = this.defaultTimer;
    }

    this.pendingRoll = null;

    if (!getsBonus) {
      this.nextTurn();
    } else {
      this.state = 'WAITING_FOR_ROLL';
    }

    return {
      success: true,
      captured,
      extraTurn: getsBonus,
      nextPlayer: this.currentTurnPlayer,
      currentTimer: this.currentTurnTimer
    };
  }

  nextTurn() {
    this.consecutiveSixes = 0;
    this.currentTurnTimer = this.defaultTimer;
    this.pendingRoll = null;
    this.state = 'WAITING_FOR_ROLL';

    let count = 0;
    do {
      this.currentTurnIndex = (this.currentTurnIndex + 1) % this.players.length;
      count++;
    } while (this.winners.includes(this.currentTurnPlayer.id) && count < this.players.length);
  }
}
