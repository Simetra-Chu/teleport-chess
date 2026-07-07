// ==========================================
// 1. 类型定义（Types）
// ==========================================
export type Piece = string; // 大写为白方 (K, Q, R, B, N, P)，小写为黑方 (k, q, r, b, n, p), "." 为空
export type Board = Piece[][];
export type Coord = [number, number]; // [row, col]

export interface TeleportConfig {
  each_side_tp_times: number;   // 每方瞬移次数限制
  tp_any_piece: boolean;        // true=任意棋子瞬移；false=仅皇后瞬移
  tp_cannot_capture: boolean;   // 瞬移是否禁止吃子（仅指敌方；己方棋子永远不可覆盖）
  tp_cannot_check: boolean;     // 瞬移是否禁止直接将军对方
  pawn_tp_no_promote: boolean;  // 瞬移过的兵是否无法升变
}

export interface GameState {
  board: Board;
  white_turn: boolean;
  white_tp_left: number;
  black_tp_left: number;
  pawn_tp_status: Record<string, boolean>; // "r,c" -> true 记录哪些兵瞬移过
  white_king_moved: boolean;
  black_king_moved: boolean;
  white_a_rook_moved: boolean;
  white_h_rook_moved: boolean;
  black_a_rook_moved: boolean;
  black_h_rook_moved: boolean;
  ep_target: Coord | null; // 可被吃过路兵的目标格子坐标
}

// ==========================================
// 2. 初始化棋盘与状态
// ==========================================
export function initGame(config: TeleportConfig): GameState {
  const board: Board = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    [".", ".", ".", ".", ".", ".", ".", "."],
    [".", ".", ".", ".", ".", ".", ".", "."],
    [".", ".", ".", ".", ".", ".", ".", "."],
    [".", ".", ".", ".", ".", ".", ".", "."],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"],
  ];
  return {
    board,
    white_turn: true,
    white_tp_left: config.each_side_tp_times,
    black_tp_left: config.each_side_tp_times,
    pawn_tp_status: {},
    white_king_moved: false,
    black_king_moved: false,
    white_a_rook_moved: false,
    white_h_rook_moved: false,
    black_a_rook_moved: false,
    black_h_rook_moved: false,
    ep_target: null,
  };
}

// 辅助工具函数
export const isWhite = (p: Piece) => p !== "." && p === p.toUpperCase();
export const isBlack = (p: Piece) => p !== "." && p === p.toLowerCase();

export function findKing(board: Board, whiteSide: boolean): Coord {
  const target = whiteSide ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === target) return [r, c];
    }
  }
  return [-1, -1];
}

/** 目标格是否为对方王（国际象棋中王不可被吃掉） */
export function isEnemyKing(board: Board, r: number, c: number, moverIsWhite: boolean): boolean {
  const target = board[r][c];
  if (target === ".") return false;
  return moverIsWhite ? target === "k" : target === "K";
}

/** 目标格是否为己方棋子 */
export function isOwnPieceAt(board: Board, r: number, c: number, moverIsWhite: boolean): boolean {
  const target = board[r][c];
  if (target === ".") return false;
  return moverIsWhite ? isWhite(target) : isBlack(target);
}

// ==========================================
// 3. 核心修复：格子受攻击判定 (squareAttacked)
// ==========================================
// enemyIsWhite: 攻击方是否是白方
export function squareAttacked(board: Board, r: number, c: number, enemyIsWhite: boolean): boolean {
  const isEnemyPiece = (p: Piece) => enemyIsWhite ? isWhite(p) : isBlack(p);
  const targetType = (p: Piece) => p.toUpperCase();

  // 1. 马的攻击
  const knightDirs = [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]];
  for (const [dr, dc] of knightDirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (isEnemyPiece(p) && targetType(p) === "N") return true;
    }
  }

  // 2. 兵的攻击 (注意：攻击格子由敌方兵的前进方向决定)
  const pawnDirs = enemyIsWhite ? [[1, -1], [1, 1]] : [[-1, -1], [-1, 1]];
  for (const [dr, dc] of pawnDirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (isEnemyPiece(p) && targetType(p) === "P") return true;
    }
  }

  // 3. 直线攻击 (车、后)
  const lineDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [dr, dc] of lineDirs) {
    let cr = r + dr, cc = c + dc;
    while (cr >= 0 && cr < 8 && cc >= 0 && cc < 8) {
      const p = board[cr][cc];
      if (p !== ".") {
        if (isEnemyPiece(p) && (targetType(p) === "R" || targetType(p) === "Q")) return true;
        break;
      }
      cr += dr; cc += dc;
    }
  }

  // 4. 斜线攻击 (象、后)
  const diagDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [dr, dc] of diagDirs) {
    let cr = r + dr, cc = c + dc;
    while (cr >= 0 && cr < 8 && cc >= 0 && cc < 8) {
      const p = board[cr][cc];
      if (p !== ".") {
        if (isEnemyPiece(p) && (targetType(p) === "B" || targetType(p) === "Q")) return true;
        break;
      }
      cr += dr; cc += dc;
    }
  }

  // 5. 王贴身攻击
  const kingDirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
  for (const [dr, dc] of kingDirs) {
    const nr = r + dr, nc = c + dc;
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
      const p = board[nr][nc];
      if (isEnemyPiece(p) && targetType(p) === "K") return true;
    }
  }

  return false;
}

export function inCheck(board: Board, whiteTurn: boolean): boolean {
  const [kr, kc] = findKing(board, whiteTurn);
  if (kr === -1) return false;
  // 核心 Bug 修复：检查己方王是否被【敌方】攻击。敌方的颜色是 !whiteTurn
  return squareAttacked(board, kr, kc, !whiteTurn);
}

// ==========================================
// 4. 核心修复：瞬移合法性校验 (checkTeleportValid)
// ==========================================
export function checkTeleportValid(
  state: GameState,
  config: TeleportConfig,
  fr: number, fc: number,
  tr: number, tc: number
): { valid: boolean; msg: string } {
  const board = state.board;
  const piece = board[fr][fc];

  if (piece === ".") return { valid: false, msg: "起点没有棋子" };
  if (state.white_turn && !isWhite(piece)) return { valid: false, msg: "只能瞬移白方棋子" };
  if (!state.white_turn && !isBlack(piece)) return { valid: false, msg: "只能瞬移黑方棋子" };

  // 检查次数
  if (state.white_turn && state.white_tp_left <= 0) return { valid: false, msg: "白方瞬移次数已用完" };
  if (!state.white_turn && state.black_tp_left <= 0) return { valid: false, msg: "黑方瞬移次数已用完" };

  // 禁止吃子
  if (config.tp_cannot_capture && board[tr][tc] !== ".") {
    return { valid: false, msg: "瞬移落点不能有棋子（已禁止瞬移吃子）" };
  }

  // 王不可被吃掉（无论是否允许瞬移吃子）
  if (isEnemyKing(board, tr, tc, state.white_turn)) {
    return { valid: false, msg: "不能瞬移吃掉对方的王，请通过将死取胜" };
  }

  // 硬编码：永远不能移动到己方棋子上（含吃己方）
  if (isOwnPieceAt(board, tr, tc, state.white_turn)) {
    return { valid: false, msg: "不能移动到己方棋子上" };
  }

  // 仅限皇后限制
  if (!config.tp_any_piece && piece.toUpperCase() !== "Q") {
    return { valid: false, msg: "当前规则仅允许皇后进行瞬移" };
  }

  // 模拟瞬移
  const boardCopy = board.map(row => [...row]);
  boardCopy[tr][tc] = piece;
  boardCopy[fr][fc] = ".";

  // 1. 瞬移后自己不能被将军
  if (inCheck(boardCopy, state.white_turn)) {
    return { valid: false, msg: "瞬移后己方王被将军，属于违规走法" };
  }

  // 2. 核心 Bug 修复：禁止瞬移直接将军对方
  if (config.tp_cannot_check) {
    const enemyIsWhite = !state.white_turn;
    const [ekr, ekc] = findKing(boardCopy, enemyIsWhite);
    // 检查敌方的王是否暴露在【我方】（state.white_turn）的火力下
    if (squareAttacked(boardCopy, ekr, ekc, state.white_turn)) {
      return { valid: false, msg: "规则禁止通过瞬移直接形成将军" };
    }
  }

  return { valid: true, msg: "合法瞬移" };
}

// ==========================================
// 5. 核心修复：执行移动，含完美过路兵逻辑
// ==========================================
export function executeNormalMove(
  state: GameState,
  config: TeleportConfig,
  fr: number, fc: number,
  tr: number, tc: number,
  promoPiece: string | null = "Q"
): GameState {
  const nextState = JSON.parse(JSON.stringify(state)) as GameState; // 深拷贝状态
  const board = nextState.board;
  const piece = board[fr][fc];
  const pt = piece.toUpperCase();

  // 检查王车移动状态
  if (pt === "K") {
    if (nextState.white_turn) nextState.white_king_moved = true;
    else nextState.black_king_moved = true;
  }
  if (pt === "R") {
    if (nextState.white_turn) {
      if (fr === 7 && fc === 0) nextState.white_a_rook_moved = true;
      if (fr === 7 && fc === 7) nextState.white_h_rook_moved = true;
    } else {
      if (fr === 0 && fc === 0) nextState.black_a_rook_moved = true;
      if (fr === 0 && fc === 7) nextState.black_h_rook_moved = true;
    }
  }

  // 核心 Bug 修复：完美的过路兵吃子逻辑
  if (pt === "P" && nextState.ep_target && tr === nextState.ep_target[0] && tc === nextState.ep_target[1]) {
    // 被吃掉的敌方兵在【起点行 fr】和【目标列 tc】的交汇处
    const enemyPawnRow = fr;
    const enemyPawnCol = tc;
    board[enemyPawnRow][enemyPawnCol] = ".";
    delete nextState.pawn_tp_status[`${enemyPawnRow},${enemyPawnCol}`];
  }

  // 普通捕获，清除被吃子小兵的瞬移状态记录
  if (board[tr][tc] !== ".") {
    delete nextState.pawn_tp_status[`${tr},${tc}`];
  }

  // 移动棋子并继承兵的瞬移状态
  board[tr][tc] = piece;
  board[fr][fc] = ".";

  if (pt === "P") {
    if (nextState.pawn_tp_status[`${fr},${fc}`]) {
      nextState.pawn_tp_status[`${tr},${tc}`] = true;
      delete nextState.pawn_tp_status[`${fr},${fc}`];
    }

    // 设置下一个回合的过路兵目标点
    if (Math.abs(tr - fr) === 2) {
      nextState.ep_target = [(fr + tr) / 2, fc];
    } else {
      nextState.ep_target = null;
    }

    // 兵底线升变限制判定
    if ((nextState.white_turn && tr === 0) || (!nextState.white_turn && tr === 7)) {
      if (config.pawn_tp_no_promote && nextState.pawn_tp_status[`${tr},${tc}`]) {
        // 如果开启了限制且该兵瞬移过，强行不让它变身，保持为小兵
        console.log("该兵曾使用过神秘力量瞬移，遭到底线法则封印，无法升变！");
      } else {
        const p = promoPiece || "Q";
        board[tr][tc] = nextState.white_turn ? p.toUpperCase() : p.toLowerCase();
      }
    }
  } else {
    nextState.ep_target = null;
  }

  // 轮换回合
  nextState.white_turn = !nextState.white_turn;
  return nextState;
}

export function executeTeleport(
  state: GameState,
  fr: number, fc: number,
  tr: number, tc: number
): GameState {
  const nextState = JSON.parse(JSON.stringify(state)) as GameState;
  const board = nextState.board;
  const piece = board[fr][fc];

  if (isEnemyKing(board, tr, tc, nextState.white_turn)) {
    throw new Error("不能瞬移吃掉对方的王");
  }

  if (board[tr][tc] !== ".") {
    delete nextState.pawn_tp_status[`${tr},${tc}`];
  }

  board[tr][tc] = piece;
  board[fr][fc] = ".";

  if (nextState.white_turn) {
    nextState.white_tp_left--;
  } else {
    nextState.black_tp_left--;
  }

  // 标记该兵瞬移过
  if (piece.toUpperCase() === "P") {
    nextState.pawn_tp_status[`${tr},${tc}`] = true;
  }

  nextState.ep_target = null; // 瞬移不产生过路兵窗口
  nextState.white_turn = !nextState.white_turn;
  return nextState;
}
