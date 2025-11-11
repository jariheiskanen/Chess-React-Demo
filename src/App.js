/*
TODO:
- BUG: sometimes after a move, piece duplicates itself when trying to select opposite piece, find out why
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

//object for chess piece on board
class PieceObject {
  constructor(piece, color = null, className = "", hasMoved = false) {
    this.piece = piece;
    this.color = color;
    this.cssClass = className;
    this.hasMoved = hasMoved;
  }
}

//object for possible moves
class MoveObject {
  constructor(coordX, coordY, opposite = null, special = null) {
    this.coordX = coordX;
    this.coordY = coordY;
    this.capture = opposite;
    this.special = special;  //castling, en passant, promotion etc
  }
}

//initializes chess board with default pieces
function initBoard(setBoardArray)
{
  const pieces = ["♜","♞","♝","♛","♚","♝","♞","♜"];
  const copy = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => (new PieceObject(null))));

  for(let i=0; i<pieces.length; i++)
  {
    copy[0][i] = new PieceObject(pieces[i], "white");
    copy[7][i] = new PieceObject(pieces[i], "black");
  }
  
  copy[1] = Array(8).fill(new PieceObject("♟", "white"));
  copy[6] = Array(8).fill(new PieceObject("♟", "black"));

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
        tempArr.push(new MoveObject(x_coord, coordY));
        
        
        
        //if((y_coord < 2 && color === "white") || (y_coord > 5 && color === "black"))
        //two forward from starting row
        if(board_array[coordY][x_coord].hasMoved === false)
        {
          coordY = y_coord+forward*2;
          if(!isOccupied(board_array[coordY][x_coord].piece))
          {
            tempArr.push(new MoveObject(x_coord, coordY));
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
          tempArr.push(new MoveObject(coordX, coordY, true)); 
        }
        else
        {
          if(color !== board_array[coordY][coordX].color && board_array[coordY][coordX].piece !== null) //opposite color piece for possible capture
          {
            tempArr.push(new MoveObject(coordX, coordY, true));
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

    //castling
    if(board_array[y_coord][x_coord].hasMoved === false)
    {
      if(!isOccupied(board_array[y_coord][x_coord+1].piece) && !isOccupied(board_array[y_coord][x_coord+2].piece)) //squares between king and rook empty, king side castle
      {
        if(board_array[y_coord][x_coord+3].hasMoved === false) //rook hasn't moved
        {
          tempArr.push(new MoveObject(x_coord+2, y_coord, null, "castle_king"));
        }
      }
      if(!isOccupied(board_array[y_coord][x_coord-1].piece) && !isOccupied(board_array[y_coord][x_coord-2].piece) && !isOccupied(board_array[y_coord][x_coord-2].piece)) //squares between king and rook empty, queen side castle
      {
        if(board_array[y_coord][x_coord-4].hasMoved === false) //rook hasn't moved
        {
          tempArr.push(new MoveObject(x_coord-2, y_coord, null, "castle_queen"));
        }
      }
    }

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
        tempArr.push(new MoveObject(coordX, coordY));
      }
      else
      {
        if(turn !== board_array[coordY][coordX].color) //capture if opposite color
        {
          tempArr.push(new MoveObject(coordX, coordY, true));
        }
        else
        {
          tempArr.push(new MoveObject(coordX, coordY, false)); //own piece, save for king move check
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
        tempArr.push(new MoveObject(coordX, coordY));
      }
      else
      {
        if(turn !== board_array[coordY][coordX].color) //capture if opposite color
        {
          tempArr.push(new MoveObject(coordX, coordY, true));
        }
        else
        {
          tempArr.push(new MoveObject(coordX, coordY, false)); //own piece, save for king move check
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
        copy[i][j] = new PieceObject(null);
      }
    }
  }

  //set highlights
  for(let i=0; i<legalMoves.current.length; i++)
  {
    let coordY = legalMoves.current[i].coordY;
    let coordX = legalMoves.current[i].coordX;
    let capture = legalMoves.current[i].capture;

    if(capture === null) //show possible moves
    {
      copy[coordY][coordX] = new PieceObject("●");
    }
    else if(capture === true)//show captures
    {
      copy[coordY][coordX].cssClass = "capture";
    }
    else{} //own piece, do nothing
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
  for(let y=0; y<8; y++)
  {
    for(let x=0; x<8; x++)
    {
      if(board_array[y][x].color === color) //piece found
      {
        let piece = board_array[y][x].piece;
        let color = board_array[y][x].color;

        tempArr = tempArr.concat(getLegalMoves(y, x, piece, color, board_array, true));
      }
    }
  }
  return tempArr;
}

//chess board
function ChessBoard() 
{
  const [board_array, setBoardArray] = useState(Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => (new PieceObject(null)))));
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
      let piece = selectedType.current = board_array[index_y][index_x].piece;

      //calculate legal moves
      legalMoves.current = []; //coordX, coordY, capture
      legalMoves.current = getLegalMoves(index_y, index_x, piece, playTurn, board_array, false);
      
      //highlight legal moves
      highLightMoves(board_array, setBoardArray, legalMoves, index_y, index_x);
    }
  }

  function clickEnd(endY, endX)
  {
    const startY = selectedCoordY.current;
    const startX = selectedCoordX.current;
    const piece = selectedType.current;

    if(!(endY === startY && endX === startX)) //ignore clicks on same square as selected piece
    {
      const copy = board_array.map(row => row.map(cell => ({ ...cell })));

      const moveIndex = legalMoves.current.findIndex(e => e.coordY === endY && e.coordX === endX);
      if(moveIndex !== -1) //legal move
      {
        //special move cases
        switch(legalMoves.current[moveIndex].special) 
        {
          case "castle_king":
            copy[endY][5] = new PieceObject("♜", playTurn, null, true);//move rook to other side of king
            copy[endY][7] = new PieceObject(null); //clear original position
            break;
          case "castle_queen":
            copy[endY][3] = new PieceObject("♜", playTurn, null, true);//move rook to other side of king
            copy[endY][0] = new PieceObject(null); //clear original position
            break;
          default:
            break;
        }

        copy[endY][endX] = new PieceObject(piece, playTurn, null, true);//move piece
        copy[startY][startX] = new PieceObject(null); //clear original position
        setHistory(history => [...history,{start_y: startY, start_x: startX, end_y: endY, end_x: endX, piece: piece, color: playTurn, move: coordToSquare(endY, endX)}]);
        setPlayTurn((playTurn === "black") ? "white" : "black");
        playSound();
      }
      //remove highlights, happens also on illegal move attempt to cancel selection
      for(let i=0; i<legalMoves.current.length; i++)
      {
        let coordY = legalMoves.current[i].coordY;
        let coordX = legalMoves.current[i].coordX;

        //reset selected piece and captured piece classes
        copy[coordY][coordX].cssClass = "";
        copy[startY][startX].cssClass = "";
        if(copy[coordY][coordX].piece === "●")
        {
          copy[coordY][coordX] = new PieceObject(null);
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
  for(let y=7; y>=0; y--)
  {
    let row_arr = [];
    for(let x=0; x<8; x++)
    {
      row_arr.push(<Square key={y+x} css={board_array[y][x].cssClass} piececolor={board_array[y][x].color} state={board_array[y][x].piece} endSquare={()=>clickEnd(y,x)} movePiece={()=>ClickPiece(y,x)}/>);
    }
    board_rows.push(<div key={y} className={'board-row row-'+y}>{row_arr}</div>);
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