import React, { Component } from 'react';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import apiUrl from './config/config';
import getHandValue from './samples';
import letterValues from './utils/letter-values.json';
import wordLists from './utils/words.json';

export const Context = React.createContext();

export class Provider extends Component {
  state = {
    hand: [],
    word: [],
    myWords: [],
    myGame: { hand: '', words: [], score: 0 },
    letterValues: letterValues,
    totalScore: 0,
    currentScore: 0,
    wordLists: wordLists.words,
    isStart: false,
    duplicateHand: [],
    prevHand: [],
    isMatch: null,
    isWarning: false,
    saveGame: async () => {
      const { user, myGame } = this.state;
      const apiEndPoint = apiUrl + '/game';
      let body = user
        ? {
            user: user.id,
            game: myGame
          }
        : {
            game: myGame
          };

      try {
        await axios.post(apiEndPoint, body);
      } catch (error) {
        console.log(error.message);
      }
    },
    handleStartGame: () => {
      const { letterValues, duplicateHand, prevHand } = this.state;
      if (!letterValues) return;

      const hand = getHandValue();
      let duplicate = prevHand.length === 0 ? hand : duplicateHand;

      this.setState({
        hand,
        word: [],
        myWords: [],
        isStart: true,
        totalScore: 0,
        currentScore: 0,
        duplicateHand: hand,
        prevHand: duplicate
      });
    },
    onSubmit: async () => {
      const { word, wordLists } = this.state;
      const submittedWord = word.map(letter => letter.letter);
      if (wordLists.includes(submittedWord.join('').toUpperCase())) {
        await this.state.calculateScore();
        this.setState({ isMatch: true });
        this.state.dismissToast(5000);
      } else {
        this.setState({ isMatch: false });
        this.state.dismissToast(5000);
      }
    },
    handleEndGame: async () => {
      const { duplicateHand, myWords, totalScore } = this.state;
      const letterArray = duplicateHand.map(letter => letter.letter);
      let handLetter = letterArray.reduce((a, b) => a + b);
      const myGame = { hand: handLetter, words: myWords, score: totalScore };
      console.log(myGame);
      await this.setState({
        hand: [],
        word: [],
        myWords: [],
        myGame,
        isStart: false,
        prevHand: duplicateHand,
        duplicateHand: []
      });
      this.state.saveGame();
    },
    handleReplayGame: () => {
      const { prevHand } = this.state;
      this.setState({
        hand: prevHand,
        word: [],
        myWords: [],
        totalScore: 0,
        currentScore: 0,
        isStart: true,
        duplicateHand: prevHand
      });
    },
    handleReset: () => {
      const { duplicateHand } = this.state;
      this.setState({
        hand: duplicateHand,
        word: [],
        currentScore: 0
      });
    },
    calculateScore: () => {
      const { word, totalScore, duplicateHand, myWords } = this.state;
      const valueArray = word.map(letter => letter.value);
      let currentScore = valueArray.reduce((a, b) => a + b, 0);
      currentScore = currentScore * valueArray.length;
      currentScore =
        word.length === duplicateHand.length ? currentScore + 50 : currentScore;

      const letterArray = word.map(letter => letter.letter);
      let wordString = letterArray.reduce((a, b) => a + b);
      myWords.push(wordString);
      this.setState({
        totalScore: totalScore + currentScore,
        currentScore,
        word: [],
        myWords
      });
    },
    onDragEnd: async result => {
      const { destination, source } = result;

      if (!destination) return;

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const start = this.state[source.droppableId];
      const finish = this.state[destination.droppableId];

      if (start === finish) {
        const newHands = [...start];
        const draggableItem = newHands[source.index];
        newHands.splice(source.index, 1);
        newHands.splice(destination.index, 0, draggableItem);
        const newState = { ...this.state, [source.droppableId]: newHands };
        this.setState(newState);
      }

      if (start !== finish) {
        const startHands = [...start];
        const draggableItem = startHands[source.index];
        startHands.splice(source.index, 1);

        const finishHands = [...finish];
        finishHands.splice(destination.index, 0, draggableItem);
        const newState = {
          ...this.state,
          [source.droppableId]: startHands,
          [destination.droppableId]: finishHands
        };
        await this.setState(newState);
        const { hand } = this.state;
        if (hand.length < 4) {
          this.setState({ isWarning: true });
          this.state.dismissWarning(5000);
        }
      }
    },
    dismissToast: time => {
      setTimeout(() => {
        this.setState({
          isMatch: null
        });
      }, time);
    },
    dismissWarning: time => {
      setTimeout(() => {
        this.setState({
          isWarning: false
        });
      }, time);
    }
  };

  componentDidMount() {
    try {
      const jwt = localStorage.getItem('token');
      const user = jwtDecode(jwt);
      this.setState({ isLogin: true, user: user });
    } catch (error) {}
  }

  render() {
    return (
      <Context.Provider value={{ state: this.state }}>
        {this.props.children}
      </Context.Provider>
    );
  }
}
