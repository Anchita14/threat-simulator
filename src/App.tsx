// usestate: declaring state variables in functional component
// useeffect: handling side effects
// usecallback: memorizes functions to prevent unnecessary re-rendering
import React, { useState, useEffect, useCallback } from "react";
import "./App.css";

// defines a TypeScript type for each grid cell
type Cell = {
  isBomb: boolean;
  isRevealed: boolean;
  isInfected?: boolean;
};

const defaultGridSize = 5;

const generateBombLocation = (gridSize: number) => ({
  row: Math.floor(Math.random() * gridSize),
  col: Math.floor(Math.random() * gridSize),
});

const generateGrid = (
    gridSize: number,
    bombLocation: { row: number; col: number }
): Cell[][] => {
  const newGrid: Cell[][] = [];
  for (let i = 0; i < gridSize; i++) {
    newGrid[i] = [];
    for (let j = 0; j < gridSize; j++) {
      newGrid[i][j] = {
        isBomb: i === bombLocation.row && j === bombLocation.col,
        isRevealed: false,
        isInfected: false,
      };
    }
  }
  return newGrid;
};

const App = ({
               exposeBombs = false,
               initialBombLocation,
               initialGridSize,
             }: {
  exposeBombs?: boolean;
  initialBombLocation?: { row: number; col: number };
  initialGridSize?: number;
}) => {
  const [gridSize, setGridSize] = useState(initialGridSize ?? defaultGridSize);
  const [bombLocation, setBombLocation] = useState(
      initialBombLocation ?? generateBombLocation(initialGridSize ?? defaultGridSize)
  );
  const [grid, setGrid] = useState(() => generateGrid(gridSize, bombLocation));
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [wins, setWins] = useState<number | 0>(0);
  const [losses, setLosses] = useState<number | 0>(0);

  const revealCell = (row: number, col: number) => {
    if (gameOver || grid[row][col].isRevealed) return;
    const newGrid = [...grid.map(row => [...row])];
    newGrid[row][col].isRevealed = true;

    if (newGrid[row][col].isBomb) {
      // Infect adjacent cells
      const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], /*self*/ [0, 1],
        [1, -1], [1, 0], [1, 1],
      ];

      directions.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;
        if (
            newRow >= 0 &&
            newRow < gridSize &&
            newCol >= 0 &&
            newCol < gridSize
        ) {
          newGrid[newRow][newCol].isRevealed = true;
          newGrid[newRow][newCol].isInfected = true;
        }
      });

      setGrid(newGrid);
      setGameOver(true);
      setLosses((prev) => prev + 1);
      setCountdown(5);
      return;
    }

    // Check for win condition
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
      setWins((prev) => prev + 1);
      setCountdown(5);
    }

    setGrid(newGrid);
  };

  const resetGame = useCallback(() => {
    const newBombLocation = generateBombLocation(gridSize);
    setBombLocation(newBombLocation);
    setGrid(generateGrid(gridSize, newBombLocation));
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
          <li>Revealing the bomb infects adjacent cells</li>
          <li>Reveal all safe cells to win</li>
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
                    className={`cell ${cell.isRevealed ? (cell.isBomb ? "bomb revealed" : "revealed") : ""} ${cell.isInfected ? "infected" : ""}`}
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
              const newBombLocation = generateBombLocation(newSize);
              setBombLocation(newBombLocation);
              setGrid(generateGrid(newSize, newBombLocation));
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

