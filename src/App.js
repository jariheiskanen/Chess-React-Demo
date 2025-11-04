/*
TODO:
- implement piece logic
- make piece to fill whole square
- implement castling
- implement sound on move
- implement check
- implement checkmate
- implement stalemate
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
  //const copy = board.slice();
  const copy = Array.from({ length: 8 }, () => Array(8).fill({piece: null, color: null}));

  for(let i=0; i<pieces.length; i++)
  {
    copy[0][i] = {piece: pieces[i], color: "white"};
    copy[7][i] = {piece: pieces[i], color: "black"};
  }
  
  copy[1] = Array(8).fill({piece: "♟", color: "white"});
  copy[6] = Array(8).fill({piece: "♟", color: "black"});

  setBoardArray(copy);
}

//return array of legal moves for given piece
function getLegalMoves(y_coord, x_coord, type, color, board_array, turn)
{
  let tempArr = [];
  if(type === "♟")
  {
    //add en passant
    //add promotion
    let forward = 1;
    if(color === "black")
    {
      forward = -forward
    }    
    
    //one forward    
    let coordY = y_coord+forward;
    if(board_array[coordY][x_coord].piece === null || board_array[coordY][x_coord].piece === "●")
    {
      tempArr.push({coordX: x_coord, coordY: coordY, hidden: false});

      //two forward from starting row
      coordY = y_coord+forward*2;
      if((y_coord < 2 && color === "white") || (y_coord > 5 && color === "black"))
      {
        if(board_array[coordY][x_coord].piece === null || board_array[coordY][x_coord].piece === "●")
        {
          tempArr.push({coordX: x_coord, coordY: coordY, hidden: false});
        }
      }
    }
    //corner captures
    coordY = y_coord+forward;
    const sides = [1, -1]; //left and right
    for(let i=0; i<sides.length; i++)
    {
      let coordX = x_coord+sides[i];
      if(coordX >=0 && coordX <=7)
      {
        if(turn !== board_array[coordY][coordX].color && board_array[coordY][coordX].piece !== null) //opposite color piece for possible capture
        {
          tempArr.push({coordX: coordX, coordY: coordY, hidden: true});
        }
      }          
    }
  }
  else if(type === "♜")
  {
    //movement array for up, down, right, left
    const mvt_arr = [{y: 1, x: 0}, {y: -1, x: 0}, {y: 0, x: 1}, {y: 0, x: -1}];

    //loop through movement array
    for(let i=0; i<mvt_arr.length; i++)
    {
      let mvt_horizontal = mvt_arr[i].y;
      let mvt_vertical = mvt_arr[i].x;

      let coordY = y_coord+mvt_horizontal;
      let coordX = x_coord+mvt_vertical;

      while(coordY <= 7 && coordY >= 0 && coordX <=7 && coordX >= 0) //within bounds
      {
        //checks if coordinate is occupied
        if(board_array[coordY][coordX].piece === null || board_array[coordY][coordX].piece === "●") //empty square
        {
          tempArr.push({coordX: coordX, coordY: coordY, hidden: false});
        }
        else //empty square
        {
          if(turn !== board_array[coordY][coordX].color) //capture if opposite color
          {
            tempArr.push({coordX: coordX, coordY: coordY, hidden: true});
          }
          break; //exit after piece blocks the way
        }

        //check next square in same direction
        coordY = coordY+mvt_horizontal;
        coordX = coordX+mvt_vertical;
      }
    }
  }
  return tempArr;
}

//sets highlights based on legal move array
function highLightMoves(board_array, setBoardArray, legalMoves)
{
  const copy = board_array.slice();
  //reset highlights
  for(let i=0; i<8; i++)
  {
    for(let j=0; j<8; j++)
    {
      if(copy[i][j].piece === "●")
      {
        copy[i][j] = {piece: null, color: null};
      }
    }        
  }

  //set highlights
  for(let i=0; i<legalMoves.current.length; i++)
  {
    if(legalMoves.current[i].hidden === false) //show possible moves, don't show possible captures
    {
      copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX] = {piece: "●", color: null};
    }
  }
  setBoardArray(copy);
}

//chess board
function ChessBoard() 
{
  const [board_array, setBoardArray] = useState(Array.from({ length: 8 }, () => Array(8).fill({piece: null, color: null})));
  const [playSound] = useSound(piece_audio); //piece moving sound effect

  let legalMoves = useRef([]);
  let selectedCoordY = useRef(null);
  let selectedCoordX = useRef(null);
  let selectedType = useRef(null);
  let selectedColor = useRef(null);
  let turn_to_move = useRef("white");

  //initialize board pieces dynamically, empty depencies array causes it to run only once
  useEffect(() => {
    initBoard(setBoardArray);
    //eslint-disable-next-line
  },[]);

  //calculate and highlight legal moves
  function ClickPiece(index_y, index_x)
  {
    if(turn_to_move.current === board_array[index_y][index_x].color)
    {
      selectedCoordY.current = index_y;
      selectedCoordX.current = index_x;
      selectedType.current = board_array[index_y][index_x].piece;
      selectedColor.current = board_array[index_y][index_x].color;

      //calculate legal moves
      legalMoves.current = []; //coordX, coordY, hidden
      legalMoves.current = getLegalMoves(index_y, index_x, selectedType.current, selectedColor.current, board_array, turn_to_move.current);
      
      //highlight legal moves
      highLightMoves(board_array, setBoardArray, legalMoves);      
    }
  }

  function clickEnd(index_y, index_x)
  {
    if(!(index_y === selectedCoordY.current && index_x === selectedCoordX.current)) //ignore clicks on same square as selected piece
    {
      const copy = board_array.slice();
      if(legalMoves.current.some(e => e.coordY === index_y && e.coordX === index_x)) //perform legal move
      {
        copy[index_y][index_x] = {piece: selectedType.current, color: selectedColor.current}; //move piece
        copy[selectedCoordY.current][selectedCoordX.current] = {piece: null, color: null}; //clear original position
        turn_to_move.current = (turn_to_move.current === "black") ? "white" : "black";
        playSound();
      }

      //remove highlights
      for(let i=0; i<legalMoves.current.length; i++)
      {
        if(copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX].piece === "●")
        {
          copy[legalMoves.current[i].coordY][legalMoves.current[i].coordX] = {piece: null, color: null};
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
    selectedColor.current = null;
    turn_to_move.current = "white";
  }

  //generate dynamically
  let board_rows = [];
  for(let i=7; i>=0; i--)
  {
    let row_arr = [];
    for(let j=0; j<8; j++)
    {
      row_arr.push(<Square key={i+j} piececolor={board_array[i][j].color} state={board_array[i][j].piece} endSquare={()=>clickEnd(i,j)} movePiece={()=>ClickPiece(i,j)}/>);
    }
    board_rows.push(<div key={i} className={'board-row row-'+i}>{row_arr}</div>);
  }

  return(
  <>
  <div className="temporary-turn-counter">{turn_to_move.current}</div>
  <div className='chess-board'>{board_rows}</div>
  <InitButton resetBoard={()=>resetBoard()}/>
  </>
  );
}

function InitButton({resetBoard})
{
  return <button onClick={resetBoard}>Reset Board</button>;
}

//chess board square
function Square({index, piececolor, state, movePiece, endSquare})
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
    piece = <Piece type={state} colorClass={piececolor+"-piece"} key={index} startMove={movePiece}/>
  }
  return <div onClick={endSquare} className={"square"}>{piece}</div>;
}

//chess piece
function Piece({type, colorClass, startMove})
{
  return <span className={"piece "+colorClass} onClick={startMove}>{type}</span>;
}