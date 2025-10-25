/*
TODO:
- show legal moves visually
- implement piece logic
- implement black movement and turns
- make piece to fill whole square
- implement check
- implement checkmate
- implement stalemate
*/

import { useState, useEffect } from 'react';

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

function ChessBoard() 
{
  const [board_state, setBoardState] = useState(Array(64).fill(null));
  
  //initialize board pieces dynamically, empty depencies array causes it to run only once
  useEffect(() => {
    const pieces = ["♜","♞","♝","♛","♚","♝","♞","♜","♟","♟","♟","♟","♟","♟","♟","♟"];
    const copy = board_state.slice();
    for(let i = 0; i<16; i++)
    {
      
      copy[i] = pieces[i];
      copy[i+48] = pieces[pieces.length-1 - i];
    }
    setBoardState(copy);
    //eslint-disable-next-line
  },[]);
  
  //console.log(board_state);

  let selectedCoord = null;
  let selectedType = null;
  let legalMoves = [];

  //calculate and highlight legal moves
  function clickPiece(index)
  { 
    legalMoves = [];
    if(board_state[index] === "♟")
    {
      //add corner captures
      //add checks for pieces occupying squares
      //add en passant
      legalMoves.push(index+8);
      if(index < 16) //starting row
      {
        legalMoves.push(index+16);        
      }
    }
    if(board_state[index] === "♜")
    {
      
    }
    selectedCoord = index;
    selectedType = board_state[index];

    console.log("legal moves: ", legalMoves);
  }

  function clickEnd(index)
  {
    //check if move is legal, if not remove highlights and return
    if(legalMoves.includes(index)) //legal move
    {
      const copy = board_state.slice();
      copy[selectedCoord] = null;
      copy[index] = selectedType;

      setBoardState(copy);
    }
    else
    {
      //reset shown legal moves
    } 
  }

  return <div className='chess-board'>
    <div className="board-row row-8">
      <Square row="8" index={0} value={"A8"} state={board_state[56]} endSquare={()=>clickEnd(56)} movePiece={()=>clickPiece(56)}/>
      <Square row="8" index={1} value={"B8"} state={board_state[57]} endSquare={()=>clickEnd(57)} movePiece={()=>clickPiece(57)}/>
      <Square row="8" index={2} value={"C8"} state={board_state[58]} endSquare={()=>clickEnd(58)} movePiece={()=>clickPiece(58)}/>
      <Square row="8" index={3} value={"D8"} state={board_state[59]} endSquare={()=>clickEnd(59)} movePiece={()=>clickPiece(59)}/>
      <Square row="8" index={4} value={"E8"} state={board_state[60]} endSquare={()=>clickEnd(60)} movePiece={()=>clickPiece(60)}/>
      <Square row="8" index={5} value={"F8"} state={board_state[61]} endSquare={()=>clickEnd(61)} movePiece={()=>clickPiece(61)}/>
      <Square row="8" index={6} value={"G8"} state={board_state[62]} endSquare={()=>clickEnd(62)} movePiece={()=>clickPiece(62)}/>
      <Square row="8" index={7} value={"H8"} state={board_state[63]} endSquare={()=>clickEnd(63)} movePiece={()=>clickPiece(63)}/>
    </div>
    <div className="board-row row-7">
      <Square row="7" index={0} value={"A7"} state={board_state[48]} endSquare={()=>clickEnd(48)} movePiece={()=>clickPiece(48)}/>
      <Square row="7" index={0} value={"B7"} state={board_state[49]} endSquare={()=>clickEnd(49)} movePiece={()=>clickPiece(49)}/>
      <Square row="7" index={0} value={"C7"} state={board_state[50]} endSquare={()=>clickEnd(50)} movePiece={()=>clickPiece(50)}/>
      <Square row="7" index={0} value={"D7"} state={board_state[51]} endSquare={()=>clickEnd(51)} movePiece={()=>clickPiece(51)}/>
      <Square row="7" index={0} value={"E7"} state={board_state[52]} endSquare={()=>clickEnd(52)} movePiece={()=>clickPiece(52)}/>
      <Square row="7" index={0} value={"F7"} state={board_state[53]} endSquare={()=>clickEnd(53)} movePiece={()=>clickPiece(53)}/>
      <Square row="7" index={0} value={"G7"} state={board_state[54]} endSquare={()=>clickEnd(54)} movePiece={()=>clickPiece(54)}/>
      <Square row="7" index={0} value={"H7"} state={board_state[55]} endSquare={()=>clickEnd(55)} movePiece={()=>clickPiece(55)}/>
    </div>
    <div className="board-row row-6">
      <Square row="6" index={0} value={"A6"} state={board_state[40]} endSquare={()=>clickEnd(40)} movePiece={()=>clickPiece(40)}/>
      <Square row="6" index={0} value={"B6"} state={board_state[41]} endSquare={()=>clickEnd(41)} movePiece={()=>clickPiece(41)}/>
      <Square row="6" index={0} value={"C6"} state={board_state[42]} endSquare={()=>clickEnd(42)} movePiece={()=>clickPiece(42)}/>
      <Square row="6" index={0} value={"D6"} state={board_state[43]} endSquare={()=>clickEnd(43)} movePiece={()=>clickPiece(43)}/>
      <Square row="6" index={0} value={"E6"} state={board_state[44]} endSquare={()=>clickEnd(44)} movePiece={()=>clickPiece(44)}/>
      <Square row="6" index={0} value={"F6"} state={board_state[45]} endSquare={()=>clickEnd(45)} movePiece={()=>clickPiece(45)}/>
      <Square row="6" index={0} value={"G6"} state={board_state[46]} endSquare={()=>clickEnd(46)} movePiece={()=>clickPiece(46)}/>
      <Square row="6" index={0} value={"H6"} state={board_state[47]} endSquare={()=>clickEnd(47)} movePiece={()=>clickPiece(47)}/>
    </div>
    <div className="board-row row-5">
      <Square row="5" index={0} value={"A5"} state={board_state[32]} endSquare={()=>clickEnd(32)} movePiece={()=>clickPiece(32)}/>
      <Square row="5" index={0} value={"B5"} state={board_state[33]} endSquare={()=>clickEnd(33)} movePiece={()=>clickPiece(33)}/>
      <Square row="5" index={0} value={"C5"} state={board_state[34]} endSquare={()=>clickEnd(34)} movePiece={()=>clickPiece(34)}/>
      <Square row="5" index={0} value={"D5"} state={board_state[35]} endSquare={()=>clickEnd(35)} movePiece={()=>clickPiece(35)}/>
      <Square row="5" index={0} value={"E5"} state={board_state[36]} endSquare={()=>clickEnd(36)} movePiece={()=>clickPiece(36)}/>
      <Square row="5" index={0} value={"F5"} state={board_state[37]} endSquare={()=>clickEnd(37)} movePiece={()=>clickPiece(37)}/>
      <Square row="5" index={0} value={"G5"} state={board_state[38]} endSquare={()=>clickEnd(38)} movePiece={()=>clickPiece(38)}/>
      <Square row="5" index={0} value={"H5"} state={board_state[39]} endSquare={()=>clickEnd(39)} movePiece={()=>clickPiece(39)}/>
    </div>
    <div className="board-row row-4">
      <Square row="4" index={0} value={"A4"} state={board_state[24]} endSquare={()=>clickEnd(24)} movePiece={()=>clickPiece(24)}/>
      <Square row="4" index={0} value={"B4"} state={board_state[25]} endSquare={()=>clickEnd(25)} movePiece={()=>clickPiece(25)}/>
      <Square row="4" index={0} value={"C4"} state={board_state[26]} endSquare={()=>clickEnd(26)} movePiece={()=>clickPiece(26)}/>
      <Square row="4" index={0} value={"D4"} state={board_state[27]} endSquare={()=>clickEnd(27)} movePiece={()=>clickPiece(27)}/>
      <Square row="4" index={0} value={"E4"} state={board_state[28]} endSquare={()=>clickEnd(28)} movePiece={()=>clickPiece(28)}/>
      <Square row="4" index={0} value={"F4"} state={board_state[29]} endSquare={()=>clickEnd(29)} movePiece={()=>clickPiece(29)}/>
      <Square row="4" index={0} value={"G4"} state={board_state[30]} endSquare={()=>clickEnd(30)} movePiece={()=>clickPiece(30)}/>
      <Square row="4" index={0} value={"H4"} state={board_state[31]} endSquare={()=>clickEnd(31)} movePiece={()=>clickPiece(31)}/>
    </div>
    <div className="board-row row-3">
      <Square row="3" index={0} value={"A3"} state={board_state[16]} endSquare={()=>clickEnd(16)} movePiece={()=>clickPiece(16)}/>
      <Square row="3" index={0} value={"B3"} state={board_state[17]} endSquare={()=>clickEnd(17)} movePiece={()=>clickPiece(17)}/>
      <Square row="3" index={0} value={"C3"} state={board_state[18]} endSquare={()=>clickEnd(18)} movePiece={()=>clickPiece(18)}/>
      <Square row="3" index={0} value={"D3"} state={board_state[19]} endSquare={()=>clickEnd(19)} movePiece={()=>clickPiece(19)}/>
      <Square row="3" index={0} value={"E3"} state={board_state[20]} endSquare={()=>clickEnd(20)} movePiece={()=>clickPiece(20)}/>
      <Square row="3" index={0} value={"F3"} state={board_state[21]} endSquare={()=>clickEnd(21)} movePiece={()=>clickPiece(21)}/>
      <Square row="3" index={0} value={"G3"} state={board_state[22]} endSquare={()=>clickEnd(22)} movePiece={()=>clickPiece(22)}/>
      <Square row="3" index={0} value={"H3"} state={board_state[23]} endSquare={()=>clickEnd(23)} movePiece={()=>clickPiece(23)}/>
    </div>
    <div className="board-row row-2">
      <Square row="2" index={0} value={"A2"} state={board_state[8]} endSquare={()=>clickEnd(8)} movePiece={()=>clickPiece(8)}/>
      <Square row="2" index={0} value={"B2"} state={board_state[9]} endSquare={()=>clickEnd(9)} movePiece={()=>clickPiece(9)}/>
      <Square row="2" index={0} value={"C2"} state={board_state[10]} endSquare={()=>clickEnd(10)} movePiece={()=>clickPiece(10)}/>
      <Square row="2" index={0} value={"D2"} state={board_state[11]} endSquare={()=>clickEnd(11)} movePiece={()=>clickPiece(11)}/>
      <Square row="2" index={0} value={"E2"} state={board_state[12]} endSquare={()=>clickEnd(12)} movePiece={()=>clickPiece(12)}/>
      <Square row="2" index={0} value={"F2"} state={board_state[13]} endSquare={()=>clickEnd(13)} movePiece={()=>clickPiece(13)}/>
      <Square row="2" index={0} value={"G2"} state={board_state[14]} endSquare={()=>clickEnd(14)} movePiece={()=>clickPiece(14)}/>
      <Square row="2" index={0} value={"H2"} state={board_state[15]} endSquare={()=>clickEnd(15)} movePiece={()=>clickPiece(15)}/>
    </div>
    <div className="board-row row-1">
      <Square row="1" index={0} value={"A1"} state={board_state[0]} endSquare={()=>clickEnd(0)} movePiece={()=>clickPiece(0)}/>
      <Square row="1" index={1} value={"B1"} state={board_state[1]} endSquare={()=>clickEnd(1)} movePiece={()=>clickPiece(1)}/>
      <Square row="1" index={2} value={"C1"} state={board_state[2]} endSquare={()=>clickEnd(2)} movePiece={()=>clickPiece(2)}/>
      <Square row="1" index={3} value={"D1"} state={board_state[3]} endSquare={()=>clickEnd(3)} movePiece={()=>clickPiece(3)}/>
      <Square row="1" index={4} value={"E1"} state={board_state[4]} endSquare={()=>clickEnd(4)} movePiece={()=>clickPiece(4)}/>
      <Square row="1" index={5} value={"F1"} state={board_state[5]} endSquare={()=>clickEnd(5)} movePiece={()=>clickPiece(5)}/>
      <Square row="1" index={6} value={"G1"} state={board_state[6]} endSquare={()=>clickEnd(6)} movePiece={()=>clickPiece(6)}/>
      <Square row="1" index={7} value={"H1"} state={board_state[7]} endSquare={()=>clickEnd(7)} movePiece={()=>clickPiece(7)}/>
    </div>
  </div>;
}

function Square({row, index, value, state, movePiece, endSquare})
{
  if(state === null)
  {
    return <div onClick={endSquare} className={"square square-"+value}></div>;
  }
  else
  {
    let color = "white";
    if(row > 6)
    {
      color = "black";
    }

    return <div onClick={endSquare} className={"square square-"+value}><Piece type={state} color={color} colorClass={color+"-piece"} key={index} startMove={movePiece}/></div>;
  }
}

function Piece({type, colorClass, color, startMove})
{
  return <span color={color} className={"piece "+colorClass} onClick={startMove}>{type}</span>;
}