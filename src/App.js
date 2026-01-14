/*
TODO:
- AI opponent?
- captured piece colors?
- promotion menu piece color shows always as black?
- promotion menu position for black (non issue? only matters when playing both sides)
- timer pauses when out of focus, use date based timer or possible irrelevant without serverside?

*/

import { useState, useEffect, useRef } from 'react';
import useSound from 'use-sound'
import piece_audio from "./assets/chess-move.mp3";
import in_check from "./assets/error-in-check.mp3";


export default function App() {
  return(
    <>
      <ChessBoard />
    </>);
}

//object for chess piece on board
class PieceObject 
{
  constructor({
    piece,
    color = null,
    cssClass = "",
    hasMoved = false,
  })
  {
    this.piece = piece; 
    this.color = color; 
    this.cssClass = cssClass; //css class for the piece for capture highlight etc
    this.hasMoved = hasMoved; //if piece has moved
  }
}

//object for possible move
class MoveObject 
{
  constructor({
    piece,
    x,
    y,
    capture = null,
    special = null,
    check = null,
    pin = null,
  })
  {
    this.piece = piece; //piece and its coordinates
    this.x = x; //target of the move
    this.y = y;
    this.capture = capture; //true if move is a capture, false if friendly "capture", null if empty square
    this.special = special; //castling, en passant, promotion etc
    this.check = check; //object for attacking piece
    this.pin = pin; //object for attacking piece
  }
}

//object for checks and pins
class CheckObject {
  constructor({
    attacker,
    squares_to_block = [],
    pin = null,
    illegal = null,
  })
  {
    this.attacker = attacker; //piece that is attacking, object
    this.squares_to_block = squares_to_block; //squares that are in threat
    this.pinned = pin; //object for pinned piece coordinates
    this.illegal = illegal; //illegal move for king behind itself
  }
}

//initializes chess board with default pieces
function initBoard(setBoardArray)
{
  const pieces = ["♜","♞","♝","♛","♚","♝","♞","♜"];
  let piece_obj = {piece: null};
  const copy = Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => (new PieceObject(piece_obj))));

  for(let i=0; i<pieces.length; i++)
  {
    piece_obj = {piece: pieces[i], color: "white"};
    copy[0][i] = new PieceObject(piece_obj);
    piece_obj = {piece: pieces[i], color: "black"};
    copy[7][i] = new PieceObject(piece_obj);
  }

  piece_obj = {piece: "♟", color: "white"};
  copy[1] = Array(8).fill(new PieceObject(piece_obj));
  piece_obj = {piece: "♟", color: "black"};
  copy[6] = Array(8).fill(new PieceObject(piece_obj));

  setBoardArray(copy);
}

//return array of legal moves for given piece, king_move true when checking legal king moves from opposite color
function getLegalMoves(y_coord, x_coord, type, king_move, gameData, color)
{
  let tempArr = [];

  if(type === "♟")
  {
    pawnLogic(y_coord, x_coord, tempArr, king_move, gameData, color);
  }
  else if(type === "♜")
  {
    //rook movements clockwise
    const mvt_arr = [{y: 1, x: 0}, {y: -1, x: 0}, {y: 0, x: 1}, {y: 0, x: -1}];
    moveUntilOccupied("♜", mvt_arr, y_coord, x_coord, tempArr, gameData, color);
  }
  else if(type === "♞")
  {
    //knight moves clockwise
    const mvt_arr = [{y: 2, x: 1}, {y: 1, x: 2}, {y: -1, x: 2}, {y: -2, x: 1}, {y: -2, x: -1}, {y: -1, x: -2}, {y: 1, x: -2}, {y: 2, x: -1}];
    tempArr = tempArr.concat(moveToSquares("♞", mvt_arr, y_coord, x_coord, gameData, color));
  }
  else if(type === "♝")
  {
    //bishop movements clockwise
    const mvt_arr = [{y: 1, x: 1}, {y: -1, x: 1}, {y: -1, x: -1}, {y: 1, x: -1}];
    moveUntilOccupied("♝", mvt_arr, y_coord, x_coord, tempArr, gameData, color);
  }
  else if(type === "♛")
  {
    //queen movements clockwise
    const mvt_arr = [{y: 1, x: 0}, {y: 1, x: 1}, {y: 0, x: 1}, {y: -1, x: 1}, {y: -1, x: 0}, {y: -1, x: -1}, {y: 0, x: -1}, {y: 1, x: -1}];
    moveUntilOccupied("♛", mvt_arr, y_coord, x_coord, tempArr, gameData, color);
  }
  else if(type === "♚")
  {
    //king movements clockwise
    const mvt_arr = [{y: 1, x: 0}, {y: 1, x: 1}, {y: 0, x: 1}, {y: -1, x: 1}, {y: -1, x: 0}, {y: -1, x: -1}, {y: 0, x: -1}, {y: 1, x: -1}];
    tempArr = tempArr.concat(moveToSquares("♚", mvt_arr, y_coord, x_coord, gameData, color));

    kingLogic(y_coord, x_coord, tempArr, king_move, gameData, color); //filter illegal king moves
  }
  return tempArr;
}

//movement logic for king
function kingLogic(y_coord, x_coord, tempArr, king_move, gameData, color)
{
  const board_array = gameData.board_data;

  const piece_obj = {piece: "♚", x: x_coord, y: y_coord};
  //castling
  if(board_array[y_coord][x_coord].hasMoved === false)
  {
    const sq1 = board_array[y_coord][x_coord+1].piece;
    const sq2 = board_array[y_coord][x_coord+2].piece;

    if(!isOccupied(sq1) && !isOccupied(sq2)) //squares between king and rook empty, king side castle
    {
      if(board_array[y_coord][x_coord+3].hasMoved === false) //rook hasn't moved
      {
        const move_obj = {piece: piece_obj, x: x_coord+2, y: y_coord, special: "castle_king"};
        tempArr.push(new MoveObject(move_obj));
      }
    }

    const sq3 = board_array[y_coord][x_coord-1].piece;
    const sq4 = board_array[y_coord][x_coord-2].piece;
    const sq5 = board_array[y_coord][x_coord-2].piece;

    if(!isOccupied(sq3) && !isOccupied(sq4) && !isOccupied(sq5)) //squares between king and rook empty, queen side castle
    {
      if(board_array[y_coord][x_coord-4].hasMoved === false) //rook hasn't moved
      {
        const move_obj = {piece: piece_obj, x: x_coord-2, y: y_coord, special: "castle_queen"};
        tempArr.push(new MoveObject(move_obj));
      }
    }
  }

  //find and remove illegal moves that would place king in check
  //king_move true when checking opposite side
  if(!king_move)
  {
    const opponent_moves = getAllMoves(gameData, true, opposite(color));

    for(let i=0; i<tempArr.length; i++)
    {
      for(let j=0; j<opponent_moves.length; j++)
      {
        //special exception to remove a move behind king when checked by queen/rook/bishop
        if(opponent_moves[j].check !== null)
        {
          let attacking_piece = opponent_moves[j].piece.piece;
          if(["♜", "♝", "♛"].includes(attacking_piece))
          {
            let illegal_x = opponent_moves[j].check.illegal.x;
            let illegal_y = opponent_moves[j].check.illegal.y;

            if(tempArr[i].y === illegal_y && tempArr[i].x === illegal_x)
            {
              tempArr.splice(i, 1); //remove illegal move from legal moves
              i--;
              break;
            }
          }
        }
        //remove all illegal moves that are being attacked from king moves
        if(tempArr[i].y === opponent_moves[j].y && tempArr[i].x === opponent_moves[j].x)
        {
          tempArr.splice(i, 1); //remove illegal move from legal moves
          i--;
          break;
        }
      }
    }
  }
}

//movement logic for pawn
function pawnLogic(y_coord, x_coord, tempArr, king_move, gameData, color) 
{
  const board_array = gameData.board_data;
  const history = gameData.history;

  //set movement direction
  let forward = 1;
  if(color === "black")
  {
    forward = -forward
  }
  //check if next move is promotion
  let promote = null;
  if((color === "white" && y_coord === 6) || (color === "black" && y_coord === 1))
  {
    promote = "promotion";
  }

  const piece_obj = {piece: "♟", x: x_coord, y: y_coord};
  
  if(!king_move) //ignore forward pawn moves when checking legal king moves
  {
    //one forward    
    let coordY = y_coord+forward;
    if(!isOccupied(board_array[coordY][x_coord].piece))
    {
      let move_obj = {piece: piece_obj, x: x_coord, y: coordY, special: promote};
      tempArr.push(new MoveObject(move_obj));
      
      //two forward from starting row
      if(board_array[y_coord][x_coord].hasMoved === false)
      {
        coordY = y_coord+forward*2;
        if(!isOccupied(board_array[coordY][x_coord].piece))
        {
          let move_obj = {piece: piece_obj, x: x_coord, y: coordY};
          tempArr.push(new MoveObject(move_obj));
        }
      }
    }
    //en passant
    if((color === "white" && y_coord === 4) || (color === "black" && y_coord === 3))
    {
      let coordY = y_coord+forward;
      let checkStartY = y_coord+forward*2 //starting position for opponent pawn

      let pieceLast = history[history.length-1].piece;
      let yStartLast  = history[history.length-1].start.y;
      let yEndLast  = history[history.length-1].end.y;
      let xEndLast  = history[history.length-1].end.x;

      //if pawn moved next to this pawn from starting position
      if(pieceLast === "♟" && yEndLast === y_coord  && yStartLast === checkStartY)
      {
        if(xEndLast === x_coord+1 || xEndLast === x_coord-1)
        {
          let move_obj = {piece: piece_obj, x: xEndLast, y: coordY, special: "en_passant"};
          tempArr.push(new MoveObject(move_obj));
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
    if(isInBounds(coordX, coordY))
    {
      let target_piece = board_array[coordY][coordX].piece;
      let target_color = board_array[coordY][coordX].color;

      if(king_move) //corner captures always possible on king move check
      {
        if(target_piece === "♚" && color !== target_color)
        {
          const attack_obj = new CheckObject({attacker: {y: y_coord, x: x_coord}});
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, check: attack_obj};
          tempArr.push(new MoveObject(move_obj));
        }
        else
        {
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true, special: promote};
          tempArr.push(new MoveObject(move_obj));
        }
      }
      else
      {
        if(isOccupied(target_piece) && color !== target_color)
        {
          if(target_piece === "♚")
          {
            const attack_obj = new CheckObject({attacker: {y: y_coord, x: x_coord}});
            let move_obj = {piece: piece_obj, x: coordX, y: coordY, check: attack_obj};
            tempArr.push(new MoveObject(move_obj));
          }
          else
          {
            let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true, special: promote};
            tempArr.push(new MoveObject(move_obj));
          }
        }
      }
    }
  }
}

//movement logic for knight and king
function moveToSquares(piece, mvt_arr, y_coord, x_coord, gameData, turn)
{
  const board_array = gameData.board_data;

  const piece_obj = {piece: piece, x: x_coord, y: y_coord};
  let tempArr = [];
  for(let i=0; i<mvt_arr.length; i++)
  {
    let coordY = y_coord+mvt_arr[i].y;
    let coordX = x_coord+mvt_arr[i].x;

    if(isInBounds(coordX, coordY)) //within bounds
    {
      let target_piece = board_array[coordY][coordX].piece;
      let target_color = board_array[coordY][coordX].color;

      if(!isOccupied(target_piece)) //empty square
      {
        let move_obj = {piece: piece_obj, x: coordX, y: coordY};
        tempArr.push(new MoveObject(move_obj));
      }
      else
      {
        if(turn !== target_color) //capture if opposite color
        {
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true};
          tempArr.push(new MoveObject(move_obj));
        }
        else
        {
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: false};
          tempArr.push(new MoveObject(move_obj));
        }

        if(target_piece === "♚" && turn !== target_color)
        {
          const attack_obj = new CheckObject({attacker: {y: y_coord, x: x_coord}});
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, check: attack_obj};
          tempArr.push(new MoveObject(move_obj));
        }
      }
    }
  }
  return tempArr;
}

//movement logic used by rook, bishop and queen
function moveUntilOccupied(piece, mvt_arr, y_coord, x_coord, tempArr, gameData, turn)
{
  const board_array = gameData.board_data;
  const piece_obj = {piece: piece, x: x_coord, y: y_coord};
  //loop through movement array
  for(let i=0; i<mvt_arr.length; i++)
  {
    let mvt_horizontal = mvt_arr[i].y;
    let mvt_vertical = mvt_arr[i].x;

    let coordY = y_coord+mvt_horizontal;
    let coordX = x_coord+mvt_vertical;

    let blocked_piece_count = 0; //check how many opponent pieces are blocking way to the king
    let squares_checked = []; //every coordinate that has been checked
    let pinned_piece = null; //pinned piece coordinate


    while(isInBounds(coordX, coordY)) //within bounds
    {
      squares_checked.push({x: coordX, y: coordY});
      let target_piece = board_array[coordY][coordX].piece;
      let target_color = board_array[coordY][coordX].color;

      if(!isOccupied(target_piece)) //empty square
      {
        if(blocked_piece_count < 1) //piece is blocking the way, don't add new moves
        {
          let move_obj = {piece: piece_obj, x: coordX, y: coordY};
          tempArr.push(new MoveObject(move_obj));
        }        
      }
      else //piece blocking the way
      {
        if(turn !== target_color) //opposite color, capture
        {
          if(blocked_piece_count < 1) //piece is blocking the way, don't add new moves
          {
            pinned_piece = {x: coordX, y: coordY};
            let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true};
            tempArr.push(new MoveObject(move_obj));
          }
          blocked_piece_count++;
        }
        else
        {
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: false};
          tempArr.push(new MoveObject(move_obj));
          break; //exit if own piece blocks the way
        }

        //pin logic for finding out if you are pinning a piece
        //opponent piece is blocking the way, check if opponent king is behind it, if multiple ignore
        //king is counted for blocked_piece_count
        if(blocked_piece_count === 2 && target_piece === "♚" && turn !== target_color)
        {
          squares_checked.splice(squares_checked.length-1, 1); //remove king from checked squares
          let pin_data = {attacker: {y: y_coord, x: x_coord}, squares_to_block: squares_checked, pin: pinned_piece};
          const pin_obj = new CheckObject(pin_data);

          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true, pin: pin_obj};
          tempArr.push(new MoveObject(move_obj));
          break; //don't check squares behind king
        }

        //king in check
        if(blocked_piece_count === 1 && target_piece === "♚" && turn !== target_color)
        {
          squares_checked.splice(squares_checked.length-1, 1); //remove king from checked squares

          //if attacked by queen/rook/bishop, add illegal coordinate behind king
          let illegal_y = coordY+mvt_horizontal;
          let illegal_x = coordX+mvt_vertical;
          let illegal_obj = {x: illegal_x, y: illegal_y};

          let check_data = {attacker: {y: y_coord, x: x_coord}, squares_to_block: squares_checked, illegal: illegal_obj};
          const attack_obj = new CheckObject(check_data);

          let move_obj = {piece: piece_obj, x: coordX, y: coordY, check: attack_obj};
          tempArr.push(new MoveObject(move_obj));
          break; //don't check squares behind king
        }
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
  let piece_obj = {piece: null};
  //reset highlights
  for(let i=0; i<8; i++)
  {
    for(let j=0; j<8; j++)
    {
      copy[i][j].cssClass = "";
      if(copy[i][j].piece === "●")
      {
        copy[i][j] = new PieceObject(piece_obj);
      }
    }
  }

  //set highlights
  let possible_moves = 0;
  for(let i=0; i<legalMoves.length; i++)
  {
    let coordY = legalMoves[i].y;
    let coordX = legalMoves[i].x;
    let capture = legalMoves[i].capture;

    if(capture === null) //show possible moves
    {
      piece_obj = {piece: "●"};
      copy[coordY][coordX] = new PieceObject(piece_obj);
      possible_moves++
    }
    else if(capture === true)//show captures
    {
      //pin is not null when checking if king is pinned, otherwise king shows capturable
      if(legalMoves[i].pin === null) 
      {
        copy[coordY][coordX].cssClass = "capture";
        possible_moves++
      }
    }
    else{} //own piece, do nothing
  }

  if(possible_moves > 0) //set piece as selected only if it has legal moves
  {
    copy[index_y][index_x].cssClass = "selected";
  }

  setBoardArray(copy);
}

//return all possible moves for given color non-filtered (checks and pins)
function getAllMoves(gameData, king_check, color)
{
  const board_array = gameData.board_data;

  let tempArr = [];
  //loop through board
  for(let y=0; y<8; y++)
  {
    for(let x=0; x<8; x++)
    {
      if(board_array[y][x].color === color) //piece found
      {
        let piece = board_array[y][x].piece;

        if(king_check === true)
        {
          tempArr = tempArr.concat(getLegalMoves(y, x, piece, true, gameData, color));
        }
        else
        {
          tempArr = tempArr.concat(getLegalMoves(y, x, piece, false, gameData, color));
          tempArr = filterSelf(tempArr);
        }        
      }
    }
  }

  return tempArr;
}

//returns array of possible moves if in check
function filterChecks(pieceMoves, opponentMoves, piece)
{
  let filtered_moves = [];
  let checkCount = 0;
  let check_array = [];
  for(let i=0; i<opponentMoves.length; i++)
  {
    if(opponentMoves[i].check !== null)
    {
      checkCount++;
      opponentMoves[i].check.squares_to_block.push(opponentMoves[i].check.attacker); //push attacker as possible move also
      check_array = opponentMoves[i].check.squares_to_block;
    }
  }

  if(checkCount === 1)
  {
    if(piece !== "♚")
    {
      //filter legal moves to allow only moves that would block or capture checking piece
      let filtered = [];
      for(let i=0; i<pieceMoves.length; i++)
      {
        let piece_x = pieceMoves[i].x;
        let piece_y = pieceMoves[i].y;

        for(let k=0; k<check_array.length; k++)
        {
          let block_x = check_array[k].x;
          let block_y = check_array[k].y;

          if(piece_x === block_x && piece_y === block_y)
          {
            filtered.push(pieceMoves[i]);
          }
        }
      }
      filtered_moves = filtered;
    }
    else //king move away from check
    {
      filtered_moves = pieceMoves;
    }
  }
  else if(checkCount === 2) //king move only
  {
    if(piece !== "♚")  //remove all legal moves from other pieces than king
    {
      filtered_moves = [];
    }
    else //king keeps original movement
    {
      filtered_moves = pieceMoves;
    }    
  }
  else
  {
    filtered_moves = pieceMoves;
  }
  return filtered_moves;
}

//filters pins for all moves and returns filtered move array
function filterPins(opposite_moves, own_moves, board_array)
{
  let move_arr = opposite_moves;
  //check if you are pinning a piece
  for(let i=0; i<own_moves.length; i++)
  {
    if(own_moves[i].pin !== null)
    {
      let pinned_x = own_moves[i].pin.pinned.x;
      let pinned_y = own_moves[i].pin.pinned.y;
      let pinner = own_moves[i].piece.piece;
      let pinned_moves = []; //array for pinned piece moves to filter out
      
      //remove all moves for pinned piece
      for(let j=0; j<move_arr.length; j++)
      {
        let piece_x = move_arr[j].piece.x;
        let piece_y = move_arr[j].piece.y;

        if(piece_x === pinned_x && piece_y === pinned_y)
        {
          pinned_moves.push(move_arr[j]);
          move_arr.splice(j,1);
          j--;                
        }
      }

      //add moves back to pinned piece which are in pin line
      let filtered = pinLogic(pinned_moves, own_moves, board_array, pinned_y, pinned_x, pinner);
      for(let j=0; j<filtered.length; j++)
      {
        move_arr.push(filtered[i]);
      }
    }
  }
  return move_arr;
}

//returns array of possible moves after filtering pins
function pinLogic(legalMoves, opponentMoves, board_array, index_y, index_x, piece)
{
  let filteredMoves = [];
  let pin_found = false;
  for(let i=0; i<opponentMoves.length; i++)
  {
    if(opponentMoves[i].pin !== null) //if any piece is pinned
    {
      let pinned_piece = opponentMoves[i].pin.pinned;

      const piece_obj = {piece: piece, x: pinned_piece.x, y: pinned_piece.y};
      if(pinned_piece.x === index_x && pinned_piece.y === index_y) //if selected piece is pinned
      {
        //remove pinned piece from possible moves
        let squares = opponentMoves[i].pin.squares_to_block;
        for(let j=0; j<squares.length; j++)
        {
          if(squares[j].x === pinned_piece.x && squares[j].y === pinned_piece.y)
          {
            squares.splice(j, 1);
            break;
          }
        }
        //add attacker to possible moves
        squares.push(opponentMoves[i].pin.attacker);

        //filter moves
        for(let j=0; j<squares.length; j++)
        {
          for(let k=0; k<legalMoves.length; k++)
          {
            if(squares[j].x === legalMoves[k].x && squares[j].y === legalMoves[k].y)
            {
              let target_y = squares[j].y;
              let target_x = squares[j].x;
              if(isOccupied(board_array[target_y][target_x].piece))
              {
                let move_obj = {piece: piece_obj, x: target_x, y: target_y, capture: true};
                filteredMoves.push(new MoveObject(move_obj));
              }
              else
              {
                let move_obj = {piece: piece_obj, x: target_x, y: target_y};
                filteredMoves.push(new MoveObject(move_obj));
              }
            }
          }
        }
        pin_found = true;
      }
    }
  }

  if(pin_found === false)
  {
    filteredMoves = legalMoves;
  }

  return filteredMoves;
}

//filter out own colored "captures"
function filterSelf(moves)
{
  for(let i=0; i<moves.length; i++)
  {
    if(moves[i].capture === false)
    {
      moves.splice(i,1);
      i--;
    }
  }
  return moves;
}

//returns oppposite color
function opposite(color)
{
  return (color === "black") ? "white" : "black";
}

//returns true if in check
function inCheck(moves)
{
  let check = false;
  for(let i=0; i<moves.length; i++)
  {
    if(moves[i].check !== null)
    {
      check = true;
      break;
    }
  }

  return check;
}

//checks if game is over by checkmate/stalemate
function isGameOver(gameData, simpleHistory)
{
  let game_over = null;

  //50-MOVE RULE
  //check for 50-move rule, no pawn move or capture in last 50 moves
  let fifty_move = true;
  if(gameData.history.length >= 50) //calculate only if more than 50 moves played
  {
    //if capture or pawn move found in last 50 moves
    for(let i = gameData.history.length-1; i >= gameData.history.length-50; i--) 
    {
      if(gameData.history[i].piece === "♟" || isOccupied(gameData.history[i].capture)) //capture shows captured piece instead of true/false
      {
        fifty_move = false;
        break; //move found, stop checking
      }
    }
  }
  else
  {
    fifty_move = false;
  }

  if(fifty_move)
  {
    game_over = "50-MOVE";
  }

  //REPETITION
  let repetition = 0;
  let last_data = JSON.stringify(simpleHistory[simpleHistory.length-1]);
  for(let i=0; i<simpleHistory.length-1; i++)
  {
    let history_data = JSON.stringify(simpleHistory[i]);
    if(history_data === last_data)
    {
      repetition++;
    }
  }
  if(repetition === 3)
  {
    game_over = "REPETITION";
  }

  //INSUFFICIENT MATERIAL
  let own_pieces = getAllPieces(gameData.turn, gameData.board_data);
  let opponent_pieces = getAllPieces(opposite(gameData.turn), gameData.board_data);

  //no pawns, queen or rook on board
  if(!(own_pieces.some(piece => ["♟", "♛", "♜"].includes(piece)) || opponent_pieces.some(piece => ["♟", "♛", "♜"].includes(piece))))
  {
    let own_length = 0;
    let own_knights = 0;
    let opponent_length = 0;
    for(let i=0; i<own_pieces.length; i++)
    {
      if(["♝", "♞"].includes(own_pieces[i]))
      {
        own_length++;
        if(own_pieces[i] === "♞")
        {
          own_knights++;
        }
      }
    }
    for(let i=0; i<opponent_pieces.length; i++)
    {
      if(["♝", "♞"].includes(opponent_pieces[i]))
      {
        opponent_length++;
      }
    }

    //if both sides have 1 or less bishops and knights left, checkmate not possible
    //if you have 2 knights, checkmate not possible without other opponent pieces
    if((own_length < 2 && opponent_length < 2) || (own_knights === 2 && opponent_length === 0))
    {
      game_over = "INSUFFICIENT";
    }
  }
  //CHECKMATE/STALEMATE
  //check if opponent has legal moves
  let turn_now = getAllMoves(gameData, false, opposite(gameData.turn));
  let move_performed = getAllMoves(gameData, false, gameData.turn);

  //check if king can move
  let kingMoves = 0;
  for(let i=0; i<turn_now.length; i++)
  {
    if(turn_now[i].piece.piece === "♚")
    {
      kingMoves++;
    }
  }
  if(kingMoves === 0) //if king has moves, it can't be stalemate or checkmate
  {
    //filters pins
    let filtered_pins = filterPins(turn_now, move_performed, gameData.board_data);
    
    //filters if any piece can block a check
    let filtered_opponent = filterChecks(filtered_pins, move_performed, null);

    //no legal moves for opponent, stalemate/checkmate
    if(filtered_opponent.length === 0)
    {
      if(inCheck(move_performed))
      {
        game_over = "CHECKMATE";
      }
      else
      {
        game_over = "STALEMATE";
      }
    }
  }
  return game_over;
}

//returns pieces on board for given color
function getAllPieces(color, board_data)
{
  let arr = [];
  for(let i=0; i<board_data.length; i++)
  {
    for(let j=0; j<board_data[i].length; j++)
    {
      if(isOccupied(board_data[i][j].piece) && color === board_data[i][j].color)
      {
        arr.push(board_data[i][j].piece);
      }   
    }
  }
  return arr;
}

//returns array of simplified board state history
function setSimpleHistory(data)
{
  let arr = [];
  for(let i=0; i<data.length; i++)
  {
    for(let j=0; j<data[i].length; j++)
    {
      if(isOccupied(data[i][j].piece))
      {
        arr.push(data[i][j].piece+"-"+data[i][j].color);      
      }
      else
      {
        arr.push(null+"-"+null);
      }      
    }
  }

  return arr;
}

//initializes canvas context to initial values
function initCanvas(canvas)
{
  const ctx = canvas.getContext("2d");
  ctx.beginPath();
  ctx.strokeStyle = '#787878';
  ctx.fillStyle = '#787878';

  return ctx;
}

//clears canvas on click
function clearCanvas(canvas)
{
  const context = canvas.getContext('2d');
  context.beginPath();
  context.clearRect(0, 0, canvas.width, canvas.height);
}

//draws circle to canvas
function drawCircle(ctx, x, y)
{
  ctx.lineWidth = 5;
  ctx.arc(x, y, 30, 0, Math.PI * 2);
  ctx.stroke();
}

//draws arrow to canvas
function drawArrow(ctx, startX, startY, posX, posY)
{
  // Arrow shaft
  ctx.lineWidth = 10;
  ctx.moveTo(startX, startY);
  ctx.lineTo(posX, posY);
  ctx.stroke();

  //angle for arrowhead
  const dx = posX - startX;
  const dy = posY - startY;
  const angle = Math.atan2(dy, dx);

  // Arrowhead
  const arrow_size = 40;
  const arrow_tip_x = posX + (arrow_size/2) * Math.cos(angle);
  const arrow_tip_y = posY + (arrow_size/2) * Math.sin(angle);
  ctx.beginPath();
  ctx.moveTo(arrow_tip_x, arrow_tip_y);
  ctx.lineTo(
    arrow_tip_x - arrow_size * Math.cos(angle - Math.PI / 6),
    arrow_tip_y - arrow_size * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    arrow_tip_x - arrow_size * Math.cos(angle + Math.PI / 6),
    arrow_tip_y - arrow_size * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
}

//removes highlights after piece is unselected
function removeHighLights(moves, copy, startY, startX)
{
  const piece_obj = {piece: null};
  for(let i=0; i<moves.length; i++)
  {
    let coordY = moves[i].y;
    let coordX = moves[i].x;

    //reset selected piece and captured piece classes
    copy[coordY][coordX].cssClass = "";
    copy[startY][startX].cssClass = "";
    if(copy[coordY][coordX].piece === "●")
    {
      copy[coordY][coordX] = new PieceObject(piece_obj);
    }
  }
}

//handles special moves such as castling, en passant and promotion
function handleSpecialMoves(moves, copy, coords, move, gameData)
{
  let piece_obj = {};
  let special = moves[move].special;
  switch(special)
  {
    case "castle_king":
      piece_obj = {piece: "♜", color: gameData.turn, hasMoved: true};
      copy[coords.endY][5] = new PieceObject(piece_obj);//move rook to other side of king
      piece_obj = {piece: null};
      copy[coords.endY][7] = new PieceObject(piece_obj); //clear rook original position
      break;
    case "castle_queen":
      piece_obj = {piece: "♜", color: gameData.turn, hasMoved: true};
      copy[coords.endY][3] = new PieceObject(piece_obj);//move rook to other side of king
      piece_obj = {piece: null};
      copy[coords.endY][0] = new PieceObject(piece_obj); //clear rook original position
      break;
    case "en_passant":
      piece_obj = {piece: null};
      copy[coords.startY][coords.endX] = new PieceObject(piece_obj); //clear pawn being captured
      break;
    case "promotion_confirm": //selected from promotion submenu
      piece_obj = {piece: gameData.promotionData.piece, color: gameData.turn, hasMoved: true};
      copy[coords.endY][coords.endX] = new PieceObject(piece_obj);//turn pawn into selected piece
      break;
    default:
      break;
  }
  return special;
}

//sets game over status and winner message
function gameOverStatus(game_over, new_history, gameWinner, setGameOver, gameData)
{
  switch (game_over)
  {
    case "CHECKMATE":
      new_history[new_history.length-1].checkmate = true; //mark last move as checkmate for notation
      gameWinner.current = gameData.turn.charAt(0).toUpperCase() + gameData.turn.slice(1)+" wins!";
      setGameOver("CHECKMATE");
      break;
    case "STALEMATE":
      gameWinner.current = "Draw";
      setGameOver("STALEMATE");
      break;
    case "50-MOVE":
      gameWinner.current = "Draw";
      setGameOver("50-MOVE RULE");
      break;
    case "REPETITION":
      gameWinner.current = "Draw";
      setGameOver("THREEFOLD REPETITION");
      break;
    case "INSUFFICIENT":
      gameWinner.current = "Draw";
      setGameOver("INSUFFICIENT MATERIAL");
      break;
    default:
      break;
  }
}

//finds identical pieces which can move to same squares to set the correct notation
function setIdenticalNotation(piece, gameData, coords, new_history)
{
  if(["♜", "♞", "♝", "♛"].includes(piece))
  {
    let identical_arr = [];
    //loop through data to find identical piece
    for(let i=0; i<gameData.board_data.length; i++)
    {
      for(let j=0; j<gameData.board_data[i].length; j++)
      {
        if(gameData.board_data[i][j].piece === piece && gameData.board_data[i][j].color === gameData.turn && !(i === coords.startY && j === coords.startX)) //piece that is not the moving piece
        {
          //found identical piece, find all moves
          getLegalMoves(i, j, piece, false, gameData, gameData.turn).forEach(move => 
          {
            //if identical piece can move to same square
            if(move.x === coords.endX && move.y === coords.endY)
            {
              let identical = {x: j, y: i};
              identical_arr.push(identical);
            }
          });
        }
      }
    }
    new_history[new_history.length-1].identical = identical_arr;
  }
  new_history[new_history.length-1].notation = moveToNotation(new_history[new_history.length-1]);
}


//HELPER FUNCTIONS
//value of lost pieces
function calcPieceValues(array)
{
  let total = 0;
  for(let i=0; i<array.length; i++)
  {
    switch(array[i])
    {
      case "♟":
        total += 1;
        break;
      case "♞":
        total += 3;
        break;
      case "♝":
        total += 3;
        break;
      case "♜":
        total += 5;
        break;
      case "♛":
        total += 9;
        break;
      default:
        break;
    }
  }
  return total;
}

//returns chess square such as A4 from given coordinates
function coordToSquare(coordY, coordX)
{
  const files = ["a","b","c","d","e","f","g","h"];
  return files[coordX]+(coordY+1);
}

//returns chess notation
function moveToNotation(history)
{
  const piece = history.piece;
  //const color = history.color;
  const capture = history.capture;
  const start = history.start;
  const end = history.end;
  const special = history.special;
  const check = history.check;
  const checkmate = history.checkmate;
  const identical = history.identical;

  //piece into corresponding letter
  let piece_notation = "";
  switch(piece)
  {
    case "♟":
      piece_notation = "";
      break;
    case "♜":
      piece_notation = "R";
      break;
    case "♞":
      piece_notation = "N";
      break;
    case "♝":
      piece_notation = "B";
      break;
    case "♚":
      piece_notation = "K";
      break;
    case "♛":
      piece_notation = "Q";
      break;
    default:
      break;
  }

  //identical piece targeting same square
  let identical_notation = "";
  let identical_file = false;
  let identical_rank = false;

  identical.forEach(coord => 
  {
    if(coord.x === start.x) //on same file (x)
    {
      identical_file = true;
      if(coord.y === start.y) //on same rank (y)
      {
        identical_rank = true;
      }
    }
  });

  if(identical_file) //pieces share same file, use number
  {
    if(identical_rank) //pieces share same file and rank, use both
    {
      identical_notation = coordToSquare(start.y, start.x);
    }
    else
    {
      identical_notation = coordToSquare(start.y, start.x).charAt(1);
    }
  }
  else //pieces are on different files, use letter
  {
    if(identical.length > 0)
    {
      identical_notation = coordToSquare(start.y, start.x).charAt(0);
    }    
  }

  //capture, x indicates capture
  let capture_notation = "";
  if(isOccupied(capture))
  {
    let extra = "";
    if(piece === "♟")
    {
      extra = coordToSquare(start.y, start.x).charAt(0);
    }
    capture_notation = extra+"x";
  }

  //check/checkmate, only add + for check if not in checkmate
  const check_status = checkmate ? "#" : check ? "+" : "";

  let notation = piece_notation+identical_notation+capture_notation+coordToSquare(end.y, end.x)+check_status;

  //castling, promotion
  switch(special)
  {
    case "castle_king":
      notation = "O-O";
      break;
    case "castle_queen":
      notation = "O-O-O";
      break;
    case "promotion_confirm":
      notation += "="+history.promotion.piece;
      break;
    default:
      break;
  }

  return notation;
}

//formats time into MM:SS format, also decimals below 1 minute
function formatTime(deciseconds)
{

  if(deciseconds === 99999)
  {
    return "--:--";
  }
  else
  {
    let decis = deciseconds%10;
    let seconds = Math.floor(deciseconds/10);
    let minutes = Math.floor(seconds/60);

    let format_minutes = minutes;
    let format_seconds = seconds%60; //get remainder

    if(format_minutes < 10)
    {
      format_minutes = "0"+format_minutes;
    }
    if(format_seconds < 10)
    {
      format_seconds = "0"+format_seconds;
    }

    //don't show decimals if more than a minute left
    if(minutes > 0)
    {
      return format_minutes+":"+format_seconds;
    }
    else
    {
      return format_minutes+":"+format_seconds+"."+decis;
    }    
  }

}

//returns true if coordinate is on board
function isInBounds(x, y) 
{
  return (x >= 0 && x <= 7 && y >= 0 && y <= 7);
}

//returns true if given piece is not equal or move placeholder = empty
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

//return center coordinate for given square for canvas
function coordToCanvas(coord)
{
  return coord * 70 + 35;
}

//chess board
function ChessBoard() 
{
  let piece_obj = {piece: "●"};
  const [board_array, setBoardArray] = useState(Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => (new PieceObject(piece_obj)))));

  const [playSound] = useSound(piece_audio); //piece moving sound effect
  const [playError] = useSound(in_check); //piece moving sound effect
  
  const [playTurn, setPlayTurn] = useState("white"); //white/black turn
  const [history, setHistory] = useState([]); //move history
  const [historyIndex, setHistoryIndex] = useState(null); //index for current selected history browsing, updates to latest move by default
  const [gameOver, setGameOver] = useState(null); //game over message if win/draw
  const [whiteCaptures, setWhiteCaptures] = useState([]); //lost pieces for white
  const [blackCaptures, setBlackCaptures] = useState([]); //lost pieces for black
  const [errorPrompt, setErrorPrompt] = useState({text: null}); //show error prompt
  const [gameInit, setGameInit] = useState(false); //true when timer and color has been selected

  let legalMoves = useRef([]);
  let selectedCoordY = useRef(null);
  let selectedCoordX = useRef(null);
  let selectedType = useRef(null);
  let simpleHistory = useRef([]); //used for repetition checks
  let gameWinner = useRef(null); //DRAW, WHITE or BLACK
  let hasMoved = useRef({white: false, black: false}); //checks if each side has started their timer
  let reverseBoard = useRef(false); //flip board if playing black
  let promotionData = useRef({menu: false, target: {x: null, y: null}, legalMoves: [], piece: null}); //promotion data
  let timerWhite = useRef(null);
  let timerBlack = useRef(null);
  let canvasRef = useRef(null);
  let canvasStart = useRef({x: null, y: null});

  let gameData = {board_data: board_array, turn: playTurn, history: history};

  //initialize board pieces dynamically, empty depencies array causes it to run only once
  useEffect(() => {
    initBoard(setBoardArray);
    //eslint-disable-next-line
  },[]);

  //calculate and highlight legal moves
  function ClickPiece(index_y, index_x)
  {
    if(history.length === historyIndex+1 || history.length === 0) //if not browsing history
    {
      //correct color,game is not over and timer has been selected, promotion menu not open
      if(playTurn === board_array[index_y][index_x].color && gameWinner.current === null && gameInit === true && promotionData.current.menu === false)
      {
        selectedCoordY.current = index_y;
        selectedCoordX.current = index_x;
        let piece = selectedType.current = board_array[index_y][index_x].piece;

        //calculate legal moves
        legalMoves.current = []; //coordX, coordY, capture
        legalMoves.current = getLegalMoves(index_y, index_x, piece, false, gameData, gameData.turn);

        //get unfiltered opponent moves
        let opponentMoves = getAllMoves(gameData, false, opposite(playTurn));
        //filter pins for selected piece moves in case you are pinned
        legalMoves.current = pinLogic(legalMoves.current, opponentMoves, board_array, index_y, index_x, piece);
        //filter checks for selected piece in case you are in check
        legalMoves.current = filterChecks(legalMoves.current, opponentMoves, piece);
        //filter self captures used for king move check
        legalMoves.current = filterSelf(legalMoves.current);      

        //in check and trying to select a piece with no moves
        if(legalMoves.current.length === 0 && inCheck(opponentMoves))
        {
          playError();
        }

        //highlight legal moves
        highLightMoves(board_array, setBoardArray, legalMoves.current, index_y, index_x);
      }
    }
    else
    {
      setErrorPrompt({text: "Go to current move first!"}); //object causes a re-render even if set to same value
    }
  }

  //click end for piece movement
  function clickEnd(endY, endX)
  {
    const startY = selectedCoordY.current;
    const startX = selectedCoordX.current;
    const piece = selectedType.current;
    const coords = {startX, startY, endX, endY};

    clearCanvas(canvasRef.current);

    //ignore clicks on same square as selected piece
    if(!(endY === startY && endX === startX)) 
    {
      //create deep copy of board_array
      const copy = board_array.map(row => row.map(cell => ({ ...cell })));
      const moveIndex = legalMoves.current.findIndex(e => e.y === endY && e.x === endX);
      if(moveIndex !== -1) //legal move check
      {
        //open promotion menu and handle promotion
        if(legalMoves.current[moveIndex].special === "promotion")
        {
          promotionData.current = {menu: true, target: {x: endX, y: endY}, legalMoves: legalMoves.current, promotionData: promotionData.current};
        }
        else
        {
          let capture_piece = copy[endY][endX].piece;
          piece_obj = {piece: piece, color: playTurn, hasMoved: true};
          copy[endY][endX] = new PieceObject(piece_obj); //move piece
          copy[startY][startX] = new PieceObject({piece: null}); //clear original position
          
          if (history.length === 0) hasMoved.current.white = true;
          if (history.length === 1) hasMoved.current.black = true;
          
          //special move cases
          let special = handleSpecialMoves(legalMoves.current, copy, coords, moveIndex, gameData);

          //captured pieces
          if (isOccupied(capture_piece)) {
            playTurn === "white" ? setBlackCaptures([...blackCaptures, capture_piece]) : setWhiteCaptures([...whiteCaptures, capture_piece]);
          }

          //update history
          let history_obj = {data: copy, start: {x: startX, y: startY}, end: {x: endX, y: endY}, piece: piece, color: playTurn, capture: capture_piece, special: special, checkmate: false, check: false, promotion: promotionData.current, identical: [], notation: ""};
          let new_history = [...history,history_obj];

          //checks game ending conditions
          gameData = {board_data: copy, turn: playTurn, history: new_history}; //use copy to get updated data for current move
          const game_over = isGameOver(gameData, simpleHistory.current);
          gameOverStatus(game_over, new_history, gameWinner, setGameOver, gameData);

          //update history
          let opponentMoves = getAllMoves(gameData, false, playTurn);
          let history_check = inCheck(opponentMoves);
          new_history[new_history.length-1].check = history_check; //mark last move as check for notation

          //find identical piece that can move to same square, bishop and queen can happen after promotion
          gameData = {board_data: board_array, turn: playTurn, history: new_history};
          setIdenticalNotation(piece, gameData, coords, new_history);

          //set history values
          let simple_move_data = setSimpleHistory(copy);
          simpleHistory.current = [...simpleHistory.current, simple_move_data];

          setHistory(new_history);
          setHistoryIndex(history.length);
          
          setPlayTurn(opposite(playTurn));
          playSound();
        }
      }
      removeHighLights(legalMoves.current, copy, startY, startX);
      legalMoves.current = [];
      setBoardArray(copy);
    }
  }

  //reset board from "Play Again" button
  function resetBoard()
  {
    initBoard(setBoardArray);
    legalMoves.current = [];
    selectedCoordY.current = null;
    selectedCoordX.current = null;
    selectedType.current = null;
    gameWinner.current = null;
    simpleHistory.current = [];
    hasMoved.current = {white: false, black: false};
    reverseBoard.current = false;
    timerWhite.current = null;
    timerBlack.current = null;

    setGameOver(null);
    setHistoryIndex(null);    
    setHistory([]);
    setPlayTurn("white");
    setWhiteCaptures([]);
    setBlackCaptures([]);
    setGameInit(false);
  }

  //click event on right side history panel
  function browseHistory(index)
  {
    if(index >= 0 && index <= history.length-1) //check if browsing within history range
    {
      let history_data = history[index].data;

      setBoardArray(history_data);
      setHistoryIndex(index);
    }
  }

  //forfeits game
  function surrender()
  {
    if(history.length > 0)
    {
      const last_move = history[history.length-1].color;
      gameWinner.current = last_move.charAt(0).toUpperCase() + last_move.slice(1)+" wins!";
      setGameOver("FORFEIT");
    }
    else //abort game before first move is played
    {
      gameWinner.current = "Game aborted";
      setGameOver("ABORT");
    }
 
  }

  //timeout
  function timeout()
  {
    setGameOver("TIMEOUT");
    gameWinner.current = opposite(playTurn).charAt(0).toUpperCase() + opposite(playTurn).slice(1)+" wins!";
  }

  //sets timers
  function setTimer(deciseconds)
  {
    //infinite timer sets time to 99999
    if(deciseconds === null)
    {
      timerWhite.current = 99999;
      timerBlack.current = 99999;
    }
    else
    {
      timerWhite.current = deciseconds;
      timerBlack.current = deciseconds;
    }
    setGameInit(true);
    reverseBoard.current = document.querySelector('input[name="pieceColor"]:checked').value === "black" ? true : false; //white or black
  }

  //handle promotion logic from menu
  function promotePiece(piece)
  {
    //edit legalmoves.special into different value
    const updated = promotionData.current.legalMoves.map(o => ({
      ...o,
      special: "promotion_confirm",
    }));
    legalMoves.current = updated;

    promotionData.current.menu = false; //close menu
    promotionData.current.piece = piece; //update to selected piece

    clickEnd(promotionData.current.target.y, promotionData.current.target.x); //simulate click
  }

  //right mouse button handlers
  const startRMB = (e) => {
    if (e.button !== 2) return; // right click only
    e.preventDefault();

    //save starting position for drag
    const rect = canvasRef.current.getBoundingClientRect();
    const squareY = Math.floor((e.clientY - rect.top) / 70);
    const squareX = Math.floor((e.clientX - rect.left) / 70);

    canvasStart.current = {x: squareX, y: squareY}
  };
  const endRMB = (e) => {
    if (e.button !== 2) return; // right click only
    e.preventDefault();
    //ending position for drag
    const rect = canvasRef.current.getBoundingClientRect();
    const squareY = Math.floor((e.clientY - rect.top) / 70);
    const squareX = Math.floor((e.clientX - rect.left) / 70);

    //positions for square centers
    const startY = coordToCanvas(canvasStart.current.y);
    const startX = coordToCanvas(canvasStart.current.x);
    const posY = coordToCanvas(squareY);
    const posX = coordToCanvas(squareX);

    //init canvas style
    const ctx = initCanvas(canvasRef.current);
    //draw circle if drag/click ends on same square as start
    if(canvasStart.current.x === squareX && canvasStart.current.y === squareY)
    {
      drawCircle(ctx, posX, posY);
    }
    else //draw arrow
    {
      drawArrow(ctx, startX, startY, posX, posY);
    }
  };

  //generate board dynamically
  let board_rows = [];
  for(let y=7; y>=0; y--)
  {
    let row_arr = [];
    let coord = ["A","B","C","D","E","F","G","H"];
    for(let x=0; x<8; x++)
    {
      let alphabet = null;
      if(y === 0)
      {
        alphabet = coord[x];
      }
      let number = null;
      if(x === 7)
      {
        number = y+1;
      }

      row_arr.push(<Square key={y+x} x_coord={alphabet} y_coord={number} css={board_array[y][x].cssClass} piececolor={board_array[y][x].color} state={board_array[y][x].piece} endSquare={()=>clickEnd(y,x)} movePiece={()=>ClickPiece(y,x)} mouseDown={startRMB} mouseUp={endRMB}/>);
    }
    board_rows.push(<div key={y} className={'board-row row-'+y+' reverse-'+reverseBoard.current}>{row_arr}</div>);
  }

  //swap clocks on reversed board
  let clock_top = <VerticalMenu endGame={()=>timeout()} move={history.length > 1} active={playTurn === "black" && gameInit && gameOver === null} clock={timerBlack.current} captures={blackCaptures} opponent={whiteCaptures} color='black'/>;
  let clock_bottom = <VerticalMenu endGame={()=>timeout()} move={history.length > 0} active={playTurn === "white" && gameInit && gameOver === null} clock={timerWhite.current} captures={whiteCaptures} opponent={blackCaptures} color='white'/>;
  if(reverseBoard.current)
  {
    let temp_top = clock_top;
    clock_top = clock_bottom;
    clock_bottom = temp_top;
  }

  return(
  <>
  <div className='layout-wrapper'>
    {clock_top}
    <div className='board-wrapper'>
      <div className='board-container' onContextMenu={(e) => e.preventDefault()}>
        <div className={'chess-board reverse-'+reverseBoard.current}>{board_rows}</div>
        <canvas ref={canvasRef} className='canvas-overlay' width='562' height='562'></canvas>
      </div>
      <div className='info-panel'>
        <MoveHistory history={history} selected={historyIndex} browseHistory={browseHistory}/>
        <button className='forfeit-button action-button' onClick={()=>surrender()}>Forfeit</button>
      </div>
      <StartScreen gameInit={gameInit} onSetTimer={setTimer}/>
      <EndScreen gameStatus={gameOver} gameWinner={gameWinner.current} resetBoard={()=>resetBoard()}/>
      <PromotionMenu promotion={promotionData.current} choosePromotion={promotePiece} square={promotionData.current.target}/>
      <ErrorPrompt message={errorPrompt.text} onHide={()=>setErrorPrompt({text: null})}/>
    </div>
    {clock_bottom}
  </div>
  </>
  );
}

//custom hook for chess timers
function useChessClock(clock, isRunning, firstMove) {
  const timeRef = useRef(null);
  const intervalRef = useRef(null);
  const [, forceRender] = useState(0); //forces a render each second

  //set clock each time new game is started
  useEffect(() => {
    if (clock == null) return;

    timeRef.current = clock;
    forceRender(t => t + 1);
  }, [clock, firstMove]);

  useEffect(() => {
    if(!firstMove) return; //start timer only after first move played
    if(timeRef.current === 99999) return; // don't start timer on infinite mode
    if (!isRunning) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }

    //clear timer and start interval to count with .1s precision
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      timeRef.current -= 1;
      forceRender(t => t + 1);
    }, 100);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, firstMove]);

  return timeRef.current;
}

//above and below board
function VerticalMenu({color, captures, opponent, clock, active, move, endGame})
{
  const time = useChessClock(clock, active, move);

  //end game on timeout
  useEffect(() => {
    if(time === 0 && active && move)
    {
      endGame();
    }
  }, [time, endGame, active, move]);

  //piece value calculation
  let lost_self = calcPieceValues(captures);
  let lost_opponent = calcPieceValues(opponent);

  let total = lost_opponent - lost_self;
  if(total > 0)
  {
    total = "(+"+total+")";
  }
  else
  {
    total = null;
  }

  return <div className={'vertical-menu menu-'+color}>
    <div className={'turn-timer timer-'+color}>{formatTime(time)}</div>
    <div className={'capture-pieces'}>{captures?.slice().sort().reverse().join("")+" "+(total ?? "")}</div>
  </div>;
}

//error prompt
function ErrorPrompt({message, onHide})
{
  useEffect(() => {
    if (!message) return; //no message, return

    const timer = setTimeout(() => {
      onHide(); //remove message/error after 3 seconds
    }, 3000);

    return () => clearTimeout(timer); //clear timer
  }, [message, onHide]);

  if (!message) return null; //no message, don't show error
  return <div className="error-prompt">{message}</div>;
}

//promotion menu
function PromotionMenu({promotion, choosePromotion, square})
{
  if(promotion.menu)
  {
    //location of promotion menu
    //square width multiplied by squares index, plus half square to center it, minus half of menus width
    const menu_location = parseInt(square.x) * 70 + 35 - 110;

    return <div style={{left: menu_location}} className='promote-menu'>
      <div onClick={()=>choosePromotion("♜")} className='promote-piece'>♜</div>
      <div onClick={()=>choosePromotion("♞")} className='promote-piece'>♞</div>
      <div onClick={()=>choosePromotion("♝")} className='promote-piece'>♝</div>
      <div onClick={()=>choosePromotion("♛")} className='promote-piece'>♛</div>
    </div>;
  }
  else
  {
    return null;
  }  
}

//start screen popup
function StartScreen({onSetTimer, gameInit})
{
  if(gameInit)
  {
    return null;
  }
  else
  {
    return <div className='end-popup'>
      <h4>Start game</h4>
      <div>
        <form>
          <label>
            <input type="radio" name="pieceColor" value="white" defaultChecked />
            ♔ White
          </label>
          <label>
            <input type="radio" name="pieceColor" value="black" />
            ♚ Black
          </label>
        </form>
      </div>
      <div className='timer-selection'>
        <button className='action-button' onClick={() => onSetTimer(6000)}>10+0</button>
        <button className='action-button' onClick={() => onSetTimer(1800)}>3+0</button>
        <button className='action-button' onClick={() => onSetTimer(600)}>1+0</button>
        <button className='action-button' onClick={() => onSetTimer(null)}>∞</button>
      </div>
    </div>;
  }
  
}

//popup for game end screen
function EndScreen({gameStatus, gameWinner, resetBoard})
{
  if(gameStatus === null)
  {
    return null;
  }
  else
  {
    return <div className='end-popup'>
      <h4>{gameStatus}</h4>
      <div>
        <p>{gameWinner}</p>
        <button className='action-button' onClick={resetBoard}>Play again</button>
      </div>
    </div>;
  }  
}

//right panel move history
function MoveHistory({history, selected, browseHistory})
{
  const bottomRef = useRef(null); //referencing placeholder div at bottom of move list
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]); // runs whenever history updates

  let moveHistory = [];
  for(let i=0; i<history.length; i++)
  {
    let turn_counter = Math.ceil((i+1)/2);
    let turn_number = turn_counter+". ";
    if(history[i].color === "black")
    {
      turn_number = "";
    }

    let selected_move = "";
    if(i === selected)
    {
      selected_move = "move-selected";
    }

    let move = <button className={selected_move+" move-log move-"+history[i].color} key={i} onClick={() => browseHistory(i)}>{turn_number+history[i].notation}</button>;

    moveHistory.push(move);
  }
  //bottomRef is used as market to scroll to bottom after each move
  return(
    <>
      <div className='move-history'>{moveHistory}<div ref={bottomRef} /></div>
      <div className='history-buttons'>
        <button onClick={() => browseHistory(0)}>&lt;&lt;</button>
        <button onClick={() => browseHistory(selected-1)}>&lt;</button>
        <button onClick={() => browseHistory(selected+1)}>&gt;</button>
        <button onClick={() => browseHistory(history.length-1)}>&gt;&gt;</button>
      </div>
    </>
  );
}

//chess board square
function Square({index, x_coord, y_coord, css, piececolor, state, movePiece, endSquare, mouseDown, mouseUp})
{
  let piece = null;
  if(state === null) //empty square
  {
    piece = null;
  }
  else if(state === "●") //highlight
  {
    piece = <span className="highlight">{state}</span>;
  }
  else //piece
  {
    piece = <Piece type={state} colorClass={piececolor+"-piece "+css} key={index} startMove={movePiece}/>
  }
  //return coordinates and piece, coordinates are for x and y axis
  return (
    <div onMouseDown={mouseDown} onMouseUp={mouseUp} onClick={endSquare} className={"square"}>
      <Coordinate alphabet={x_coord} number={null}/>
      <Coordinate alphabet={null} number={y_coord}/>
      {piece}
    </div>
  );
}

//chess piece
function Piece({type, colorClass, startMove})
{
  return <span className={"piece "+colorClass} onClick={startMove}>{type}</span>;
}

function Coordinate({alphabet, number})
{
  let coordinate = null;
  if(alphabet !== null)
  {
    coordinate = <span className="coordinate">{alphabet}</span>;
  }
  if(number !== null)
  {
    coordinate = <span className="coordinate y-axis">{number}</span>;
  }
  return coordinate;
}