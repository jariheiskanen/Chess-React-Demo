/*
TODO:
- implement piece logic
- make piece to fill whole square
- make coordinate system 2 dimensional for easier piece calculation
- create table squares dynamically
- implement check
- implement checkmate
- implement stalemate
*/

import { useState, useEffect, useRef } from 'react';

export default function App() {
  return(
    <>
      <ChessBoard />
      <InitButton />
    </>);
}

//doesn't do anything at the moment
function InitButton() 
{
  return <button>Reset Board</button>;
}
/*
function initBoard(board_state,setBoardState)
{
  const pieces = ["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","♟","♟","♟","♟","♟"];
  const copy = board_state.slice();
  for(let i = 0; i<16; i++)
  {
    let obj = {piece: pieces[i], color: "white"};
    copy[i] = obj;
    obj = {piece: pieces[15-i], color: "black"};
    copy[i+48] = obj;
  }
  setBoardState(copy);
}
*/

function initBoard(board, setBoardArray)
{
  const pieces = ["♜","♞","♝","♛","♚","♝","♞","♜"];
  const copy = board.slice();

  copy[0] = [];
  copy[7] = [];
  for(let i=0; i<pieces.length; i++)
  {
    copy[0].push({piece: pieces[i], color: "white"});
    copy[7].push({piece: pieces[i], color: "black"});
  }
  
  copy[1] = Array(8).fill({piece: "♟", color: "white"});
  copy[6] = Array(8).fill({piece: "♟", color: "black"});
  
  setBoardArray(copy);
}

function ChessBoard() 
{
  const [board_array, setBoardArray] = useState(Array.from({ length: 8 }, () => Array(8).fill({piece: null, color: null})));

  //initialize board pieces dynamically, empty depencies array causes it to run only once
  useEffect(() => {
    initBoard(board_array, setBoardArray);
    //eslint-disable-next-line
  },[]);
  
  let legalMoves = useRef([]);
  let selectedCoordY = useRef(null);
  let selectedCoordX = useRef(null);
  let selectedType = useRef(null);
  let selectedColor = useRef(null);
  let turn_to_move = useRef("white");

  //calculate and highlight legal moves
  function ClickPiece(index_y, index_x)
  {
    if(turn_to_move.current === board_array[index_y][index_x].color)
    {
      selectedCoordY.current = index_y;
      selectedCoordX.current = index_x;

      selectedType.current = board_array[index_y][index_x].piece;
      selectedColor.current = board_array[index_y][index_x].color;

      legalMoves.current = []; //coordX, coordY, hidden
      if(selectedType.current === "♟")
      {
        //add en passant
        //add promotion
        let forward = 1;
        if(selectedColor.current === "black")
        {
          forward = -forward
        }
        
        //one forward
        let coordY = index_y+forward;
        if(board_array[coordY][index_x].piece === null || board_array[coordY][index_x].piece === "●")
        {
          legalMoves.current.push({coordX: index_x, coordY: coordY, hidden: false});

          //two forward from starting row
          coordY = index_y+forward*2;
          if((index_y < 2 && selectedColor.current === "white") || (index_y > 5 && selectedColor.current === "black"))
          {
            if(board_array[coordY][index_x].piece === null || board_array[coordY][index_x].piece === "●")
            {
              legalMoves.current.push({coordX: index_x, coordY: coordY, hidden: false});
            }
          }
        }
        //corner captures
        coordY = selectedCoordY.current+forward;
        const sides = [1, -1]; //left and right
        for(let i=0; i<sides.length; i++)
        {
          let coordX = selectedCoordX.current+sides[i];
          if(coordX >=0 && coordX <=7)
          {
            if(turn_to_move.current !== board_array[coordY][coordX].color && board_array[coordY][coordX].piece !== null) //opposite color piece for possible capture
            {
              legalMoves.current.push({coordX: coordX, coordY: coordY, hidden: true});
            }
          }          
        }
      }
      /*
      //fix to new system
      if(selectedType.current === "♜")
      {
        //todo: combine all directions
        //up/down movement
        const mvt_arr_y = [8, -8];
        let forward = 0;
        let coord = 0;
        for(let i=0; i<mvt_arr_y.length; i++)
        {
          forward = mvt_arr_y[i];
          coord = selectedCoordY.current+forward;
          while(coord <= 63 && coord >= 0)
          {
            //checks if coordinate is occupied
            if(board_array[index_y][index_x].piece !== null) //occupied
            {
              if(turn_to_move.current !== board_array[index_y][index_x].color) //capture
              {
                legalMoves.current.push({coord: coord, hidden: true});
              }
              break; //exit after piece blocks the way
            }
            else //empty
            {
              legalMoves.current.push({coord: coord, hidden: false});
            }
            coord = coord+forward;
          }
        }

        //left/right movement
        const currentRow = Math.floor(selectedCoordY.current/8);
        const mvt_arr_x = [1, -1];
        for(let i=0; i<mvt_arr_x.length; i++)
        {
          forward = mvt_arr_x[i];
          coord = selectedCoordY.current+forward;
          let targetRow = Math.floor(coord/8);
          while(currentRow === targetRow)
          {
            //checks if coordinate is occupied
            if(board_array[index_y][index_x].piece !== null) //occupied
            {
              if(turn_to_move.current !== board_array[index_y][index_x].color) //capture
              {
                legalMoves.current.push({coord: coord, hidden: true});
              }
              break; //exit after piece blocks the way
            }
            else //empty
            {
              legalMoves.current.push({coord: coord, hidden: false});
            }
            coord = coord+forward;
            targetRow = Math.floor(coord/8);
          }
        }
      }
      */
      console.log(legalMoves.current);

      
      //sets highlights for selected piece
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
  }
    

  function clickEnd(index_y, index_x)
  {
    if(!(index_y === selectedCoordY.current && index_x === selectedCoordX.current)) //ignore clicks on same square as selected piece
    {
      const copy = board_array.slice();
      if(legalMoves.current.some(e => e.coordY === index_y) && legalMoves.current.some(e => e.coordX === index_x)) //perform legal move
      {
        copy[index_y][index_x] = {piece: selectedType.current, color: selectedColor.current}; //move piece
        copy[selectedCoordY.current][selectedCoordX.current] = {piece: null, color: null}; //clear original position
        turn_to_move.current = (turn_to_move.current === "black") ? "white" : "black";
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
  </>
  );
}

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

function Piece({type, colorClass, startMove})
{
  return <span className={"piece "+colorClass} onClick={startMove}>{type}</span>;
}