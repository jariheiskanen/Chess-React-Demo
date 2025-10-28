/*
TODO:
- show whose turn to play
- implement piece logic
- make piece to fill whole square
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

function ChessBoard() 
{
  const [board_state, setBoardState] = useState(Array(64).fill({piece: null, color: null}));
  
  //initialize board pieces dynamically, empty depencies array causes it to run only once
  useEffect(() => {
    initBoard(board_state,setBoardState);    
    //eslint-disable-next-line
  },[]);
  
  let legalMoves = useRef([]);
  let selectedCoord = useRef(null);
  let selectedType = useRef(null);
  let selectedColor = useRef(null);
  let turn_to_move = useRef("white");

  //calculate and highlight legal moves
  function ClickPiece(index)
  {
    if(turn_to_move.current === board_state[index].color)
    {
      selectedCoord.current = index;
      selectedType.current = board_state[index].piece;
      selectedColor.current = board_state[index].color;

      legalMoves.current = [];
      if(selectedType.current === "♟")
      {
        //add en passant
        //add promotion
        let forward = 8;
        if(selectedColor.current === "black")
        {
          forward = -forward
        }
        
        //one forward
        let coord = selectedCoord.current+forward;
        if(board_state[coord].piece === null || board_state[coord].piece === "●")
        {
          legalMoves.current.push({coord: coord, hidden: false});

          //two forward from starting row
          coord = selectedCoord.current+forward*2;
          if((selectedCoord.current < 16 && selectedColor.current === "white") || (selectedCoord.current > 47 && selectedColor.current === "black"))
          {
            if(board_state[coord].piece === null || board_state[coord].piece === "●")
            {
              legalMoves.current.push({coord: coord, hidden: false});
            }              
          }
        }

        //corner captures
        coord = selectedCoord.current+forward;
        const currentRow = Math.floor(coord/8);

        coord = selectedCoord.current+forward+1
        let captureRow = Math.floor(coord/8);

        if(captureRow === currentRow && board_state[coord].piece !== null)
        {
          legalMoves.current.push({coord: coord, hidden: true});
        }

        coord = selectedCoord.current+forward-1
        captureRow = Math.floor(coord/8);

        if(captureRow === currentRow && board_state[coord].piece !== null)
        {
          legalMoves.current.push({coord: coord, hidden: true});
        }
      }

      //sets highlights for selected piece
      const copy = board_state.slice();
      for(let i=0; i<copy.length; i++) //reset highlights
      {
        if(copy[i].piece === "●")
        {
          copy[i] = {piece: null, color: null};
        }
      }
      for(let i=0; i<legalMoves.current.length; i++)
      {
        if(legalMoves.current[i].hidden === false) //show possible moves, don't show possible captures
        {
          copy[legalMoves.current[i].coord] = {piece: "●", color: null};
        }
      }
      setBoardState(copy);
    }
  }
    

  function clickEnd(index)
  {
    if(index !== selectedCoord.current) //ignore clicks on same square as selected piece
    {
      const copy = board_state.slice();
      if(legalMoves.current.some(e => e.coord === index)) //perform move
      {
        copy[index] = {piece: selectedType.current, color: selectedColor.current};
        copy[selectedCoord.current] = {piece: null, color: null}; //clear original position
        turn_to_move.current = (turn_to_move.current === "black") ? "white" : "black";
      }
      //remove highlights
      for(let i=0; i<legalMoves.current.length; i++)
      {
        if(copy[legalMoves.current[i].coord].piece === "●")
        {
          copy[legalMoves.current[i].coord] = {piece: null, color: null};
        }
      }
      setBoardState(copy);
    }
  }

  return(
  <>
  <div className="temporary-turn-counter">{turn_to_move.current}</div>
  <div className='chess-board'>
    <div className="board-row row-8">
      <Square row="8" index={0} value={"A8"} piececolor={board_state[56].color} state={board_state[56].piece} endSquare={()=>clickEnd(56)} movePiece={()=>ClickPiece(56)}/>
      <Square row="8" index={1} value={"B8"} piececolor={board_state[57].color} state={board_state[57].piece} endSquare={()=>clickEnd(57)} movePiece={()=>ClickPiece(57)}/>
      <Square row="8" index={2} value={"C8"} piececolor={board_state[58].color} state={board_state[58].piece} endSquare={()=>clickEnd(58)} movePiece={()=>ClickPiece(58)}/>
      <Square row="8" index={3} value={"D8"} piececolor={board_state[59].color} state={board_state[59].piece} endSquare={()=>clickEnd(59)} movePiece={()=>ClickPiece(59)}/>
      <Square row="8" index={4} value={"E8"} piececolor={board_state[60].color} state={board_state[60].piece} endSquare={()=>clickEnd(60)} movePiece={()=>ClickPiece(60)}/>
      <Square row="8" index={5} value={"F8"} piececolor={board_state[61].color} state={board_state[61].piece} endSquare={()=>clickEnd(61)} movePiece={()=>ClickPiece(61)}/>
      <Square row="8" index={6} value={"G8"} piececolor={board_state[62].color} state={board_state[62].piece} endSquare={()=>clickEnd(62)} movePiece={()=>ClickPiece(62)}/>
      <Square row="8" index={7} value={"H8"} piececolor={board_state[63].color} state={board_state[63].piece} endSquare={()=>clickEnd(63)} movePiece={()=>ClickPiece(63)}/>
    </div>
    <div className="board-row row-7">
      <Square row="7" index={0} value={"A7"} piececolor={board_state[48].color} state={board_state[48].piece} endSquare={()=>clickEnd(48)} movePiece={()=>ClickPiece(48)}/>
      <Square row="7" index={0} value={"B7"} piececolor={board_state[49].color} state={board_state[49].piece} endSquare={()=>clickEnd(49)} movePiece={()=>ClickPiece(49)}/>
      <Square row="7" index={0} value={"C7"} piececolor={board_state[50].color} state={board_state[50].piece} endSquare={()=>clickEnd(50)} movePiece={()=>ClickPiece(50)}/>
      <Square row="7" index={0} value={"D7"} piececolor={board_state[51].color} state={board_state[51].piece} endSquare={()=>clickEnd(51)} movePiece={()=>ClickPiece(51)}/>
      <Square row="7" index={0} value={"E7"} piececolor={board_state[52].color} state={board_state[52].piece} endSquare={()=>clickEnd(52)} movePiece={()=>ClickPiece(52)}/>
      <Square row="7" index={0} value={"F7"} piececolor={board_state[53].color} state={board_state[53].piece} endSquare={()=>clickEnd(53)} movePiece={()=>ClickPiece(53)}/>
      <Square row="7" index={0} value={"G7"} piececolor={board_state[54].color} state={board_state[54].piece} endSquare={()=>clickEnd(54)} movePiece={()=>ClickPiece(54)}/>
      <Square row="7" index={0} value={"H7"} piececolor={board_state[55].color} state={board_state[55].piece} endSquare={()=>clickEnd(55)} movePiece={()=>ClickPiece(55)}/>
    </div>
    <div className="board-row row-6">
      <Square row="6" index={0} value={"A6"} piececolor={board_state[40].color} state={board_state[40].piece} endSquare={()=>clickEnd(40)} movePiece={()=>ClickPiece(40)}/>
      <Square row="6" index={0} value={"B6"} piececolor={board_state[41].color} state={board_state[41].piece} endSquare={()=>clickEnd(41)} movePiece={()=>ClickPiece(41)}/>
      <Square row="6" index={0} value={"C6"} piececolor={board_state[42].color} state={board_state[42].piece} endSquare={()=>clickEnd(42)} movePiece={()=>ClickPiece(42)}/>
      <Square row="6" index={0} value={"D6"} piececolor={board_state[43].color} state={board_state[43].piece} endSquare={()=>clickEnd(43)} movePiece={()=>ClickPiece(43)}/>
      <Square row="6" index={0} value={"E6"} piececolor={board_state[44].color} state={board_state[44].piece} endSquare={()=>clickEnd(44)} movePiece={()=>ClickPiece(44)}/>
      <Square row="6" index={0} value={"F6"} piececolor={board_state[45].color} state={board_state[45].piece} endSquare={()=>clickEnd(45)} movePiece={()=>ClickPiece(45)}/>
      <Square row="6" index={0} value={"G6"} piececolor={board_state[46].color} state={board_state[46].piece} endSquare={()=>clickEnd(46)} movePiece={()=>ClickPiece(46)}/>
      <Square row="6" index={0} value={"H6"} piececolor={board_state[47].color} state={board_state[47].piece} endSquare={()=>clickEnd(47)} movePiece={()=>ClickPiece(47)}/>
    </div>
    <div className="board-row row-5">
      <Square row="5" index={0} value={"A5"} piececolor={board_state[32].color} state={board_state[32].piece} endSquare={()=>clickEnd(32)} movePiece={()=>ClickPiece(32)}/>
      <Square row="5" index={0} value={"B5"} piececolor={board_state[33].color} state={board_state[33].piece} endSquare={()=>clickEnd(33)} movePiece={()=>ClickPiece(33)}/>
      <Square row="5" index={0} value={"C5"} piececolor={board_state[34].color} state={board_state[34].piece} endSquare={()=>clickEnd(34)} movePiece={()=>ClickPiece(34)}/>
      <Square row="5" index={0} value={"D5"} piececolor={board_state[35].color} state={board_state[35].piece} endSquare={()=>clickEnd(35)} movePiece={()=>ClickPiece(35)}/>
      <Square row="5" index={0} value={"E5"} piececolor={board_state[36].color} state={board_state[36].piece} endSquare={()=>clickEnd(36)} movePiece={()=>ClickPiece(36)}/>
      <Square row="5" index={0} value={"F5"} piececolor={board_state[37].color} state={board_state[37].piece} endSquare={()=>clickEnd(37)} movePiece={()=>ClickPiece(37)}/>
      <Square row="5" index={0} value={"G5"} piececolor={board_state[38].color} state={board_state[38].piece} endSquare={()=>clickEnd(38)} movePiece={()=>ClickPiece(38)}/>
      <Square row="5" index={0} value={"H5"} piececolor={board_state[39].color} state={board_state[39].piece} endSquare={()=>clickEnd(39)} movePiece={()=>ClickPiece(39)}/>
    </div>
    <div className="board-row row-4">
      <Square row="4" index={0} value={"A4"} piececolor={board_state[24].color} state={board_state[24].piece} endSquare={()=>clickEnd(24)} movePiece={()=>ClickPiece(24)}/>
      <Square row="4" index={0} value={"B4"} piececolor={board_state[25].color} state={board_state[25].piece} endSquare={()=>clickEnd(25)} movePiece={()=>ClickPiece(25)}/>
      <Square row="4" index={0} value={"C4"} piececolor={board_state[26].color} state={board_state[26].piece} endSquare={()=>clickEnd(26)} movePiece={()=>ClickPiece(26)}/>
      <Square row="4" index={0} value={"D4"} piececolor={board_state[27].color} state={board_state[27].piece} endSquare={()=>clickEnd(27)} movePiece={()=>ClickPiece(27)}/>
      <Square row="4" index={0} value={"E4"} piececolor={board_state[28].color} state={board_state[28].piece} endSquare={()=>clickEnd(28)} movePiece={()=>ClickPiece(28)}/>
      <Square row="4" index={0} value={"F4"} piececolor={board_state[29].color} state={board_state[29].piece} endSquare={()=>clickEnd(29)} movePiece={()=>ClickPiece(29)}/>
      <Square row="4" index={0} value={"G4"} piececolor={board_state[30].color} state={board_state[30].piece} endSquare={()=>clickEnd(30)} movePiece={()=>ClickPiece(30)}/>
      <Square row="4" index={0} value={"H4"} piececolor={board_state[31].color} state={board_state[31].piece} endSquare={()=>clickEnd(31)} movePiece={()=>ClickPiece(31)}/>
    </div>
    <div className="board-row row-3">
      <Square row="3" index={0} value={"A3"} piececolor={board_state[16].color} state={board_state[16].piece} endSquare={()=>clickEnd(16)} movePiece={()=>ClickPiece(16)}/>
      <Square row="3" index={0} value={"B3"} piececolor={board_state[17].color} state={board_state[17].piece} endSquare={()=>clickEnd(17)} movePiece={()=>ClickPiece(17)}/>
      <Square row="3" index={0} value={"C3"} piececolor={board_state[18].color} state={board_state[18].piece} endSquare={()=>clickEnd(18)} movePiece={()=>ClickPiece(18)}/>
      <Square row="3" index={0} value={"D3"} piececolor={board_state[19].color} state={board_state[19].piece} endSquare={()=>clickEnd(19)} movePiece={()=>ClickPiece(19)}/>
      <Square row="3" index={0} value={"E3"} piececolor={board_state[20].color} state={board_state[20].piece} endSquare={()=>clickEnd(20)} movePiece={()=>ClickPiece(20)}/>
      <Square row="3" index={0} value={"F3"} piececolor={board_state[21].color} state={board_state[21].piece} endSquare={()=>clickEnd(21)} movePiece={()=>ClickPiece(21)}/>
      <Square row="3" index={0} value={"G3"} piececolor={board_state[22].color} state={board_state[22].piece} endSquare={()=>clickEnd(22)} movePiece={()=>ClickPiece(22)}/>
      <Square row="3" index={0} value={"H3"} piececolor={board_state[23].color} state={board_state[23].piece} endSquare={()=>clickEnd(23)} movePiece={()=>ClickPiece(23)}/>
    </div>
    <div className="board-row row-2">
      <Square row="2" index={0} value={"A2"} piececolor={board_state[8].color} state={board_state[8].piece} endSquare={()=>clickEnd(8)} movePiece={()=>ClickPiece(8)}/>
      <Square row="2" index={0} value={"B2"} piececolor={board_state[9].color} state={board_state[9].piece} endSquare={()=>clickEnd(9)} movePiece={()=>ClickPiece(9)}/>
      <Square row="2" index={0} value={"C2"} piececolor={board_state[10].color} state={board_state[10].piece} endSquare={()=>clickEnd(10)} movePiece={()=>ClickPiece(10)}/>
      <Square row="2" index={0} value={"D2"} piececolor={board_state[11].color} state={board_state[11].piece} endSquare={()=>clickEnd(11)} movePiece={()=>ClickPiece(11)}/>
      <Square row="2" index={0} value={"E2"} piececolor={board_state[12].color} state={board_state[12].piece} endSquare={()=>clickEnd(12)} movePiece={()=>ClickPiece(12)}/>
      <Square row="2" index={0} value={"F2"} piececolor={board_state[13].color} state={board_state[13].piece} endSquare={()=>clickEnd(13)} movePiece={()=>ClickPiece(13)}/>
      <Square row="2" index={0} value={"G2"} piececolor={board_state[14].color} state={board_state[14].piece} endSquare={()=>clickEnd(14)} movePiece={()=>ClickPiece(14)}/>
      <Square row="2" index={0} value={"H2"} piececolor={board_state[15].color} state={board_state[15].piece} endSquare={()=>clickEnd(15)} movePiece={()=>ClickPiece(15)}/>
    </div>
    <div className="board-row row-1">
      <Square row="1" index={0} value={"A1"} piececolor={board_state[0].color} state={board_state[0].piece} endSquare={()=>clickEnd(0)} movePiece={()=>ClickPiece(0)}/>
      <Square row="1" index={1} value={"B1"} piececolor={board_state[1].color} state={board_state[1].piece} endSquare={()=>clickEnd(1)} movePiece={()=>ClickPiece(1)}/>
      <Square row="1" index={2} value={"C1"} piececolor={board_state[2].color} state={board_state[2].piece} endSquare={()=>clickEnd(2)} movePiece={()=>ClickPiece(2)}/>
      <Square row="1" index={3} value={"D1"} piececolor={board_state[3].color} state={board_state[3].piece} endSquare={()=>clickEnd(3)} movePiece={()=>ClickPiece(3)}/>
      <Square row="1" index={4} value={"E1"} piececolor={board_state[4].color} state={board_state[4].piece} endSquare={()=>clickEnd(4)} movePiece={()=>ClickPiece(4)}/>
      <Square row="1" index={5} value={"F1"} piececolor={board_state[5].color} state={board_state[5].piece} endSquare={()=>clickEnd(5)} movePiece={()=>ClickPiece(5)}/>
      <Square row="1" index={6} value={"G1"} piececolor={board_state[6].color} state={board_state[6].piece} endSquare={()=>clickEnd(6)} movePiece={()=>ClickPiece(6)}/>
      <Square row="1" index={7} value={"H1"} piececolor={board_state[7].color} state={board_state[7].piece} endSquare={()=>clickEnd(7)} movePiece={()=>ClickPiece(7)}/>
    </div>
  </div>
  </>
  );
}

function Square({row, index, value, piececolor, state, movePiece, endSquare})
{
  let piece = "";
  if(state === null) //empty square
  {
    
  }
  else if(state === "●") //highlight
  {
    piece = <span className="highlight">{state}</span>;
  }
  else //piece
  {
    piece = <Piece type={state} color={piececolor} colorClass={piececolor+"-piece"} key={index} startMove={movePiece}/>
  }
  return <div onClick={endSquare} className={"square square-"+value}>{piece}</div>;
}

function Piece({type, colorClass, color, startMove})
{
  return <span color={color} className={"piece "+colorClass} onClick={startMove}>{type}</span>;
}