// usestate: declaring state variables in functional component
// useeffect: handling side effects
// usecallback: memorizes functions to prevent uncessary re-rendering
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// defines a typescript type for each grid cell
type Cell = {
  isBomb: boolean;
  isRevealed: boolean;
};

const defaultGridSize = 5;

// helper to generate a list of unique bomb locations
const generateBombLocations = (gridSize: number): { row: number; col: number }[] => {
  const totalCells = gridSize * gridSize;
  const bombCount = Math.max(1, Math.floor(totalCells * 0.15 + Math.random() * totalCells * 0.1)); // 15-25% of grid
  const bombSet = new Set<string>();
  while (bombSet.size < bombCount) {
    const row = Math.floor(Math.random() * gridSize);
    const col = Math.floor(Math.random() * gridSize);
    bombSet.add(`${row},${col}`);
  }
  return Array.from(bombSet).map(str => {
    const [row, col] = str.split(",").map(Number);
    return { row, col };
  });
};

// initialize grid with bombs
const generateGrid = (gridSize: number, bombLocations: { row: number; col: number }[]) => {
  const bombSet = new Set(bombLocations.map(b => `${b.row},${b.col}`));
  const newGrid: Cell[][] = [];
  for (let i = 0; i < gridSize; i++) {
    newGrid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      newGrid[i][j] = {
        isBomb: bombSet.has(`${i},${j}`),
        isRevealed: false,
      };
    }
  }
  return newGrid;
};

const App = ({
               exposeBombs = false,
               initialGridSize,
             }: {
  exposeBombs?: boolean;
  initialGridSize?: number;
}) => {
  const [gridSize, setGridSize] = useState(initialGridSize ?? defaultGridSize);
  const [bombLocations, setBombLocations] = useState(generateBombLocations(gridSize));
  const [grid, setGrid] = useState(() => generateGrid(gridSize, bombLocations));
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [wins, setWins] = useState<number | 0>(0);
  const [losses, setLosses] = useState<number | 0>(0);

  const revealCell = (row: number, col: number) => {
    if (gameOver || grid[row][col].isRevealed) return;
    const newGrid = [...grid];
    newGrid[row][col].isRevealed = true;

    if (newGrid[row][col].isBomb) {
      setGameOver(true);
      setLosses(prev => prev + 1);
      setCountdown(5);
      setGrid(newGrid);
      return;
    }

    let allSafeRevealed = true;
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!newGrid[i][j].isRevealed && !newGrid[i][j].isBomb) {
          allSafeRevealed = false;
        }
      }
    }

    if (allSafeRevealed) {
      setGameWin(true);
      setGameOver(true);
      setWins(prev => prev + 1);
      setCountdown(5);
    }

    setGrid(newGrid);
  };

  const resetGame = useCallback(() => {
    const newBombLocations = generateBombLocations(gridSize);
    setBombLocations(newBombLocations);
    setGrid(generateGrid(gridSize, newBombLocations));
    setGameOver(false);
    setGameWin(false);
    setCountdown(null);
    setShowResetConfirm(false);
  }, [gridSize]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      resetGame();
    }
  }, [countdown, resetGame]);

  const renderSidebarRules = () => (
      <div className="Sidebar rules">
        <h2>Game Rules</h2>
        <ul>
          <li>Click on a tile to reveal it</li>
          <li>Avoid the 💣</li>
          <li>Reveal all the safe cells to win</li>
          <li>You can change the game difficulty mode</li>
        </ul>
      </div>
  );

  const renderPopup = () => {
    if (!(gameOver || showResetConfirm)) return null;
    return (
        <div className="popup">
          <div className="popup-content">
            {showResetConfirm ? (
                <>
                  <h2>🔄 Reset Game?</h2>
                  <p>This will start a new game. Are you sure you want to continue?</p>
                  <button onClick={resetGame}>Yes</button>
                  <button onClick={() => setShowResetConfirm(false)}>No</button>
                </>
            ) : (
                <>
                  <h2>{gameWin ? "🎉 You Win!" : "💥 Game Over!"}</h2>
                  <p>Game restarting in {countdown}...</p>
                </>
            )}
          </div>
        </div>
    );
  };

  const renderSidebarScoreboard = () => (
      <div className="Sidebar scoreboard">
        <h2>Scoreboard</h2>
        <p>🎉 Wins: {wins}</p>
        <p>💥 Losses: {losses}</p>
      </div>
  );

  const renderGrid = () => (
      <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 90px)`,
            gridTemplateRows: `repeat(${gridSize}, 90px)`,
          }}
      >
        {grid.map((row, i) =>
            row.map((cell, j) => (
                <div
                    key={`${i}-${j}`}
                    data-testid={`${i}-${j}`}
                    data-bomb-testid={cell.isBomb && exposeBombs ? "bomb" : undefined}
                    className={`cell ${cell.isRevealed ? (cell.isBomb ? "bomb revealed" : "revealed") : cell.isBomb ? "bomb" : ""}`}
                    onClick={() => revealCell(i, j)}
                >
                  {cell.isRevealed ? (cell.isBomb ? "💣" : "") : ""}
                </div>
            ))
        )}
      </div>
  );


  const renderDifficultyControl = () => (
      <div className="difficulty-button">
        <select
            defaultValue="5"
            data-testid="difficulty-select"
            onChange={(e) => {
              const newSize = parseInt(e.target.value, 10);
              setGridSize(newSize);
              const newBombs = generateBombLocations(newSize);
              setBombLocations(newBombs);
              setGrid(generateGrid(newSize, newBombs));
              setGameOver(false);
              setGameWin(false);
              setCountdown(null);
              setShowResetConfirm(false);
            }}
        >
          <option value={3} data-testid="easy-option">🎯 Difficulty Level: Easy (3 x 3)</option>
          <option value={5} data-testid="medium-option">🎯 Difficulty Level: Medium (5 x 5)</option>
          <option value={7} data-testid="hard-option">🎯 Difficulty Level: Hard (7 x 7)</option>
        </select>
      </div>
  );

  const renderResetButton = () => (
      <div className="reset-button">
        <button onClick={() => setShowResetConfirm(true)}>🔄 Reset Game</button>
      </div>
  );

  return (
      <div className="AppContainer">
        {renderSidebarRules()}
        <div className="App">
          <h1>Threat Simulator</h1>
          {renderPopup()}
          <div className="game-wrapper">
            {renderDifficultyControl()}
            {renderGrid()}
            {renderResetButton()}
          </div>
        </div>
        {renderSidebarScoreboard()}
      </div>
  );
};

export default App;

