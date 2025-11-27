/*
TODO:
- refactor code
  > edit Object classes to object parameters also
  > create general function to group up move filtering inside clickStart and clickEnd
  > edit variable names to be more logical
- test every piece logic/check/pin
- browse move history
- implement win/draw conditions: insufficient material, fifty-move rule, threefold repetition

- improve UI
- add option to promote pawn to other pieces than queen
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
class PieceObject {
  constructor(piece, color = null, className = "", hasMoved = false) {
    this.piece = piece;
    this.color = color;
    this.cssClass = className;
    this.hasMoved = hasMoved;
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
    constructor(attacker, squares_to_block = [], pin = null, illegal = null) {
    this.attacker = attacker;
    this.squares_to_block = squares_to_block;
    this.pinned = pin;
    this.illegal = illegal; //coordinate for illegal square behind the king if attacked by queen/rook/bishop
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
    if(!isOccupied(board_array[y_coord][x_coord+1].piece) && !isOccupied(board_array[y_coord][x_coord+2].piece)) //squares between king and rook empty, king side castle
    {
      if(board_array[y_coord][x_coord+3].hasMoved === false) //rook hasn't moved
      {
        //tempArr.push(new MoveObject(piece_obj, x_coord+2, y_coord, null, "castle_king"));
        const move_obj = {piece: piece_obj, x: x_coord+2, y: y_coord, special: "castle_king"};
        tempArr.push(new MoveObject(move_obj));
      }
    }
    if(!isOccupied(board_array[y_coord][x_coord-1].piece) && !isOccupied(board_array[y_coord][x_coord-2].piece) && !isOccupied(board_array[y_coord][x_coord-2].piece)) //squares between king and rook empty, queen side castle
    {
      if(board_array[y_coord][x_coord-4].hasMoved === false) //rook hasn't moved
      {
        //tempArr.push(new MoveObject(piece_obj, x_coord-2, y_coord, null, "castle_queen"));
        const move_obj = {piece: piece_obj, x: x_coord-2, y: y_coord, special: "castle_king"};
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

  let forward = 1;
  if(color === "black")
  {
    forward = -forward
  }
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
      //tempArr.push(new MoveObject(piece_obj, x_coord, coordY, null, promote));
      let move_obj = {piece: piece_obj, x: x_coord, y: coordY, special: promote};
      tempArr.push(new MoveObject(move_obj));
      
      //two forward from starting row
      if(board_array[y_coord][x_coord].hasMoved === false)
      {
        coordY = y_coord+forward*2;
        if(!isOccupied(board_array[coordY][x_coord].piece))
        {
          //tempArr.push(new MoveObject(piece_obj, x_coord, coordY));
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
      let yStartLast  = history[history.length-1].start_y;
      let yEndLast  = history[history.length-1].end_y;
      let xEndLast  = history[history.length-1].end_x;

      //if pawn moved next to this pawn from starting position
      if(pieceLast === "♟" && yEndLast === y_coord  && yStartLast === checkStartY)
      {
        if(xEndLast === x_coord+1 || xEndLast === x_coord-1)
        {
          //tempArr.push(new MoveObject(piece_obj, xEndLast, coordY, null, "en_passant"));
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
          const attack_obj = new CheckObject({y: y_coord, x: x_coord});
          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, null, null, attack_obj));
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
            const attack_obj = new CheckObject({y: y_coord, x: x_coord});
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
        //tempArr.push(new MoveObject(piece_obj, coordX, coordY));
        let move_obj = {piece: piece_obj, x: coordX, y: coordY};
        tempArr.push(new MoveObject(move_obj));
      }
      else
      {
        if(turn !== target_color) //capture if opposite color
        {
          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, true));
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true};
          tempArr.push(new MoveObject(move_obj));
        }
        else
        {
          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, false)); //own piece, save for king move check
          let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: false};
          tempArr.push(new MoveObject(move_obj));
        }

        if(target_piece === "♚" && turn !== target_color)
        {
          const attack_obj = new CheckObject({y: y_coord, x: x_coord});
          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, null, null, attack_obj));
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
          //tempArr.push(new MoveObject(piece_obj, coordX, coordY));
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
            //tempArr.push(new MoveObject(piece_obj, coordX, coordY, true));
            let move_obj = {piece: piece_obj, x: coordX, y: coordY, capture: true};
            tempArr.push(new MoveObject(move_obj));
          }
          blocked_piece_count++;
        }
        else
        {
          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, false)); //own piece, save for king move check
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
          const pin_obj = new CheckObject({y: y_coord, x: x_coord}, squares_checked, pinned_piece);

          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, true, null, null, pin_obj));
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

          const attack_obj = new CheckObject({y: y_coord, x: x_coord}, squares_checked, null, illegal_obj);

          //tempArr.push(new MoveObject(piece_obj, coordX, coordY, null, null, attack_obj));
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
  let possible_moves = 0;
  for(let i=0; i<legalMoves.length; i++)
  {
    let coordY = legalMoves[i].y;
    let coordX = legalMoves[i].x;
    let capture = legalMoves[i].capture;

    if(capture === null) //show possible moves
    {
      copy[coordY][coordX] = new PieceObject("●");
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
                //filteredMoves.push(new MoveObject(piece_obj, target_x, target_y, true));
                let move_obj = {piece: piece_obj, x: target_x, y: target_y, capture: true};
                filteredMoves.push(new MoveObject(move_obj));
              }
              else
              {
                //filteredMoves.push(new MoveObject(piece_obj, target_x, target_y));
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
function isGameOver(gameData)
{
  //check if opponent has legal moves
  let turn_now = getAllMoves(gameData, false, opposite(gameData.turn));
  let move_performed = getAllMoves(gameData, false, gameData.turn);
  let game_over = null;

  const board_data = gameData.board_data;

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
    let filtered_pins = filterPins(turn_now, move_performed, board_data);
    
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

//returns chess square such as A4 from given coordinates
function coordToSquare(coordY, coordX)
{
  const files = ["A","B","C","D","E","F","G","H"];
  return files[coordX]+(coordY+1);
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

//chess board
function ChessBoard() 
{
  const [board_array, setBoardArray] = useState(Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => (new PieceObject(null)))));

  const [playSound] = useSound(piece_audio); //piece moving sound effect
  const [playError] = useSound(in_check); //piece moving sound effect
  
  const [playTurn, setPlayTurn] = useState("white"); //white/black turn
  const [history, setHistory] = useState([]); //move history, WIP

  let legalMoves = useRef([]);
  let selectedCoordY = useRef(null);
  let selectedCoordX = useRef(null);
  let selectedType = useRef(null);

  let gameData = {board_data: board_array, turn: playTurn, history: history};

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
      legalMoves.current = getLegalMoves(index_y, index_x, piece, false, gameData, gameData.turn);

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

  function clickEnd(endY, endX)
  {
    const startY = selectedCoordY.current;
    const startX = selectedCoordX.current;
    const piece = selectedType.current;

    if(!(endY === startY && endX === startX)) //ignore clicks on same square as selected piece
    {
      const copy = board_array.map(row => row.map(cell => ({ ...cell })));

      const moveIndex = legalMoves.current.findIndex(e => e.y === endY && e.x === endX);
      if(moveIndex !== -1) //legal move
      {
        copy[endY][endX] = new PieceObject(piece, playTurn, null, true);//move piece
        copy[startY][startX] = new PieceObject(null); //clear original position
        
        //special move cases
        switch(legalMoves.current[moveIndex].special) 
        {
          case "castle_king":
            copy[endY][5] = new PieceObject("♜", playTurn, null, true);//move rook to other side of king
            copy[endY][7] = new PieceObject(null); //clear rook original position
            break;
          case "castle_queen":
            copy[endY][3] = new PieceObject("♜", playTurn, null, true);//move rook to other side of king
            copy[endY][0] = new PieceObject(null); //clear rook original position
            break;
          case "en_passant":
            copy[startY][endX] = new PieceObject(null); //clear pawn being captured
            break;
          case "promotion":
            copy[endY][endX] = new PieceObject("♛", playTurn, null, true);//turn pawn into queen
            break;
          default:
            break;
        }

        //checks stalemate/checkmate
        gameData = {board_data: copy, turn: playTurn, history: history};
        const game_over = isGameOver(gameData);
        switch (game_over) 
        {
          case "CHECKMATE":
            alert("checkmate");
            break;
          case "STALEMATE":
            alert("stalemate");
            break;
          default:
            break;
        }

        setHistory(history => [...history,{start_y: startY, start_x: startX, end_y: endY, end_x: endX, piece: piece, color: playTurn, move: coordToSquare(endY, endX)}]);
        setPlayTurn(opposite(playTurn));
        playSound();
      }
      //remove highlights, happens also on illegal move attempt to cancel selection
      for(let i=0; i<legalMoves.current.length; i++)
      {
        let coordY = legalMoves.current[i].y;
        let coordX = legalMoves.current[i].x;

        //reset selected piece and captured piece classes
        copy[coordY][coordX].cssClass = "";
        copy[startY][startX].cssClass = "";
        if(copy[coordY][coordX].piece === "●")
        {
          copy[coordY][coordX] = new PieceObject(null);
        }
      }
      legalMoves.current = [];
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
    setHistory([]);
    setPlayTurn("white");
  }

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

      row_arr.push(<Square key={y+x} x_coord={alphabet} y_coord={number} css={board_array[y][x].cssClass} piececolor={board_array[y][x].color} state={board_array[y][x].piece} endSquare={()=>clickEnd(y,x)} movePiece={()=>ClickPiece(y,x)}/>);
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
function Square({index, x_coord, y_coord, css, piececolor, state, movePiece, endSquare})
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
    <div onClick={endSquare} className={"square"}>
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