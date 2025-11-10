/*
TODO:
- implement king moves: castling
- implement pawn moves: en passant, promotion
- implement check
- implement win/draw conditions: checkmate, stalemate, insufficient material, fifty-move rule, threefold repetition
- add UI
*/

import { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound'
import piece_audio from "./assets/chess-move.mp3";

export default function App() {
  return(
    <>
      <ChessBoard />
    </>);
}

//initializes chess board with default pieces
function initBoard(setBoardArray)
{
  const pieces = ["♜","♞","♝","♛","♚","♝","♞","♜"];
  const copy = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({piece: null, color: null, cssClass: ""})));

  for(let i=0; i<pieces.length; i++)
  {
    copy[0][i] = {piece: pieces[i], color: "white", cssClass: ""};
    copy[7][i] = {piece: pieces[i], color: "black", cssClass: ""};
  }
  
  copy[1] = Array(8).fill({piece: "♟", color: "white", cssClass: ""});
  copy[6] = Array(8).fill({piece: "♟", color: "black", cssClass: ""});

  setBoardArray(copy);
}

//checks if square is occupied
function isOccupied(piece)
{
  if(piece === null || piece === "●") //not occupied
  {
    return false;
  }
  else
  {
    return true;
  }
}

//return array of legal moves for given piece, checkOpposite true when checking legal king moves from opposite color
function getLegalMoves(y_coord, x_coord, type, color, board_array, checkOpposite)
{
  let tempArr = [];
  if(type === "♟")
  {
    let forward = 1;
    if(color === "black")
    {
      forward = -forward
    }
    
    if(!checkOpposite) //ignore forward pawn moves when checking legal king moves
    {
      //one forward    
      let coordY = y_coord+forward;
      if(!isOccupied(board_array[coordY][x_coord].piece))
      {
        tempArr.push({coordX: x_coord, coordY: coordY, capture: false});

        //two forward from starting row
        coordY = y_coord+forward*2;
        if((y_coord < 2 && color === "white") || (y_coord > 5 && color === "black"))
        {
          if(!isOccupied(board_array[coordY][x_coord].piece))
          {
            tempArr.push({coordX: x_coord, coordY: coordY, capture: false});
          }
        }
      }
    }
    //corner captures
    let coordY = y_coord+forward;
    const sides = [1, -1]; //left and right
    for(let i=0; i<sides.length; i++)
    {
      let coordX = x_coord+sides[i];
      if(coordX >=0 && coordX <=7)
      {
        if(checkOpposite) //corner captures always possible on king move check
        {
          tempArr.push({coordX: coordX, coordY: coordY, capture: true}); 
        }
        else
        {
          if(color !== board_array[coordY][coordX].color && board_array[coordY][coordX].piece !== null) //opposite color piece for possible capture
          {
            tempArr.push({coordX: coordX, coordY: coordY, capture: true});
          }
        }
      }          
    }
  }
  else if(type === "♜")
  {
    //movement array for up, down, right, left
    const mvt_arr = [{y: 1, x: 0}, {y: -1, x: 0}, {y: 0, x: 1}, {y: 0, x: -1}];
    moveUntilOccupied(mvt_arr, y_coord, x_coord, board_array, color, tempArr);
  }
  else if(type === "♞")
  {
    //possible moves, starting 1 o clock and going clockwise
    const mvt_arr = [{y: 2, x: 1}, {y: 1, x: 2}, {y: -1, x: 2}, {y: -2, x: 1}, {y: -2, x: -1}, {y: -1, x: -2}, {y: 1, x: -2}, {y: 2, x: -1}];
    tempArr = tempArr.concat(moveToSquares(mvt_arr, y_coord, x_coord, board_array, color));
  }
  else if(type === "♝")
  {
    //bishop movements clockwise
    const mvt_arr = [{y: 1, x: 1}, {y: -1, x: 1}, {y: -1, x: -1}, {y: 1, x: -1}];
    moveUntilOccupied(mvt_arr, y_coord, x_coord, board_array, color, tempArr);
  }
  else if(type === "♛")
  {
    //queen movements clockwise
    const mvt_arr = [{y: 1, x: 0}, {y: 1, x: 1}, {y: 0, x: 1}, {y: -1, x: 1}, {y: -1, x: 0}, {y: -1, x: -1}, {y: 0, x: -1}, {y: 1, x: -1}];
    moveUntilOccupied(mvt_arr, y_coord, x_coord, board_array, color, tempArr);
  }
  else if(type === "♚")
  {
    //king movements clockwise
    const mvt_arr = [{y: 1, x: 0}, {y: 1, x: 1}, {y: 0, x: 1}, {y: -1, x: 1}, {y: -1, x: 0}, {y: -1, x: -1}, {y: 0, x: -1}, {y: 1, x: -1}];
    tempArr = tempArr.concat(moveToSquares(mvt_arr, y_coord, x_coord, board_array, color));

    //prevent infinite loop when checking if king moves into check
    //find and remove illegal moves that would place king in check
    if(!checkOpposite) 
    {
      const oppositeColor = (color === "black") ? "white" : "black";
      const illegalMoves = getAllMoves(oppositeColor, board_array);

      for(let i=0; i<tempArr.length; i++)
      {
        for(let j=0; j<illegalMoves.length; j++)
        {
          if(tempArr[i].coordY === illegalMoves[j].coordY && tempArr[i].coordX === illegalMoves[j].coordX)
          {
            tempArr.splice(i, 1); //remove illegal move from legal moves
            i--; //fix index
            break;
          }
        }
      }
    }
  }
  return tempArr;
}

//movement logic for knight and king
function moveToSquares(mvt_arr, y_coord, x_coord, board_array, turn)
{
  let tempArr = [];
  for(let i=0; i<mvt_arr.length; i++)
  {
    let coordY = y_coord+mvt_arr[i].y;
    let coordX = x_coord+mvt_arr[i].x;

    if(coordY <= 7 && coordY >= 0 && coordX <=7 && coordX >= 0) //within bounds
    {
      if(!isOccupied(board_array[coordY][coordX].piece)) //empty square
      {
        tempArr.push({coordX: coordX, coordY: coordY, capture: false});
      }
      else
      {
        if(turn !== board_array[coordY][coordX].color) //capture if opposite color
        {
          tempArr.push({coordX: coordX, coordY: coordY, capture: true});
        }
      }
    }
  }
  return tempArr;
}

//movement logic used by rook, bishop and queen
function moveUntilOccupied(mvt_arr, y_coord, x_coord, board_array, turn, tempArr)
{
  //loop through movement array
  for(let i=0; i<mvt_arr.length; i++)
  {
    let mvt_horizontal = mvt_arr[i].y;
    let mvt_vertical = mvt_arr[i].x;

    let coordY = y_coord+mvt_horizontal;
    let coordX = x_coord+mvt_vertical;

    while(coordY <= 7 && coordY >= 0 && coordX <=7 && coordX >= 0) //within bounds
    {
      if(!isOccupied(board_array[coordY][coordX].piece)) //empty square
      {
        tempArr.push({coordX: coordX, coordY: coordY, capture: false});
      }
      else
      {
        if(turn !== board_array[coordY][coordX].color) //capture if opposite color
        {
          tempArr.push({coordX: coordX, coordY: coordY, capture: true});
        }
        break; //exit after piece blocks the way
      }

      //check next square in same direction
      coordY = coordY+mvt_horizontal;
      coordX = coordX+mvt_vertical;
    }
  }
}

//sets highlights based on legal move array
function highLightMoves(board_array, setBoardArray, legalMoves, index_y, index_x)
{
  //create deep copy
  const copy = board_array.map(row => row.map(cell => ({ ...cell })));
  //reset highlights
  for(let i=0; i<8; i++)
  {
    for(let j=0; j<8; j++)
    {
      copy[i][j].cssClass = "";
      if(copy[i][j].piece === "●")
      {
        copy[i][j] = {piece: null, color: null, cssClass: ""};
      }
    }
  }

  //set highlights
  for(let i=0; i<legalMoves.current.length; i++)
  {
    if(legalMoves.current[i].capture === false) //show possible moves
    {
      copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX] = {piece: "●", color: null, cssClass: ""};
    }
    else //show captures
    {
      copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX].cssClass = "capture";
    }
  }

  if(legalMoves.current.length > 0) //set piece as selected only if it has legal moves
  {
    copy[index_y][index_x].cssClass = "selected";
  }

  setBoardArray(copy);
}

//returns chess square such as A4 from given coordinates
function coordToSquare(coordY, coordX)
{
  const files = ["A","B","C","D","E","F","G","H"];
  return files[coordX]+(coordY+1);
}

//return all possible moves for given color
function getAllMoves(color, board_array)
{
  let tempArr = [];
  //loop through board
  for(let i=0; i<8; i++)
  {
    for(let j=0; j<8; j++)
    {
      if(board_array[i][j].color === color) //piece found
      {
        tempArr = tempArr.concat(getLegalMoves(i, j, board_array[i][j].piece, board_array[i][j].color, board_array, true));
      }
    }
  }
  return tempArr;
}

//chess board
function ChessBoard() 
{
  const [board_array, setBoardArray] = useState(Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ({piece: null, color: null, cssClass: ""}))));
  const [playSound] = useSound(piece_audio); //piece moving sound effect
  const [playTurn, setPlayTurn] = useState("white"); //white/black turn
  const [history, setHistory] = useState([]); //move history, WIP

  let legalMoves = useRef([]);
  let selectedCoordY = useRef(null);
  let selectedCoordX = useRef(null);
  let selectedType = useRef(null);

  //initialize board pieces dynamically, empty depencies array causes it to run only once
  useEffect(() => {
    initBoard(setBoardArray);
    //eslint-disable-next-line
  },[]);

  //calculate and highlight legal moves
  function ClickPiece(index_y, index_x)
  {
    if(playTurn === board_array[index_y][index_x].color)
    {
      selectedCoordY.current = index_y;
      selectedCoordX.current = index_x;
      selectedType.current = board_array[index_y][index_x].piece;

      //calculate legal moves
      legalMoves.current = []; //coordX, coordY, capture
      legalMoves.current = getLegalMoves(index_y, index_x, selectedType.current, playTurn, board_array, false);
      
      //highlight legal moves
      highLightMoves(board_array, setBoardArray, legalMoves, index_y, index_x);
    }
  }

  function clickEnd(index_y, index_x)
  {
    if(!(index_y === selectedCoordY.current && index_x === selectedCoordX.current)) //ignore clicks on same square as selected piece
    {
      const copy = board_array.map(row => row.map(cell => ({ ...cell })));
      if(legalMoves.current.some(e => e.coordY === index_y && e.coordX === index_x)) //perform legal move
      {
        copy[index_y][index_x] = {piece: selectedType.current, color: playTurn, cssClass: ""}; //move piece
        copy[selectedCoordY.current][selectedCoordX.current] = {piece: null, color: null, cssClass: ""}; //clear original position
        setHistory(history => [...history,{start_y: selectedCoordY.current, start_x: selectedCoordX.current, end_y: index_y, end_x: index_x, piece: selectedType.current, color: playTurn, move: coordToSquare(index_y, index_x)}]);
        setPlayTurn((playTurn === "black") ? "white" : "black");
        playSound();
      }

      //remove highlights, happens also on illegal move attempt to cancel selection
      for(let i=0; i<legalMoves.current.length; i++)
      {
        //reset selected piece and captured piece classes
        copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX].cssClass = "";
        copy[selectedCoordY.current][selectedCoordX.current].cssClass = "";
        if(copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX].piece === "●")
        {
          copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX] = {piece: null, color: null, cssClass: ""};
        }
      }
      setBoardArray(copy);
    }
  }

  function resetBoard()
  {
    initBoard(setBoardArray);
    legalMoves.current = [];
    selectedCoordY.current = null;
    selectedCoordX.current = null;
    selectedType.current = null;
    setPlayTurn("white");
  }

  //generate board dynamically
  let board_rows = [];
  for(let i=7; i>=0; i--)
  {
    let row_arr = [];
    for(let j=0; j<8; j++)
    {
      row_arr.push(<Square key={i+j} css={board_array[i][j].cssClass} piececolor={board_array[i][j].color} state={board_array[i][j].piece} endSquare={()=>clickEnd(i,j)} movePiece={()=>ClickPiece(i,j)}/>);
    }
    board_rows.push(<div key={i} className={'board-row row-'+i}>{row_arr}</div>);
  }

  //generate move history
  let moveHistory = [];
  for(let i=0; i<history.length; i++)
  {
    moveHistory.push(<div className={"move-"+history[i].color} key={i} >{(i+1)+". "+history[i].piece+history[i].move}</div>);
  }

  return(
  <>
  <div className='chess-board'>{board_rows}</div>
  <div className='info-panel'>
    <div className="turn-counter">{playTurn+" to move"}</div>
    <div className="move-history">{moveHistory}</div>    
    <InitButton resetBoard={()=>resetBoard()}/>
  </div>
  </>
  );
}

function InitButton({resetBoard})
{
  return <button className='reset-board' onClick={resetBoard}>Reset Board</button>;
}

//chess board square
function Square({index, css, piececolor, state, movePiece, endSquare})
{
  let piece = "";
  if(state === null) //empty square
  {
    piece = "";
  }
  else if(state === "●") //highlight
  {
    piece = <span className="highlight">{state}</span>;
  }
  else //piece
  {
    piece = <Piece type={state} colorClass={piececolor+"-piece "+css} key={index} startMove={movePiece}/>
  }
  return <div onClick={endSquare} className={"square"}>{piece}</div>;
}

//chess piece
function Piece({type, colorClass, startMove})
{
  return <span className={"piece "+colorClass} onClick={startMove}>{type}</span>;
}