import React from 'react';
import {
  Button,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebBrowser } from 'expo';
import { testGrid } from '../assets/grids/testGrid.js';
import { cellLimit } from '../assets/grids/testGrid.js';
import { Svg } from 'expo';
import { MonoText } from '../components/StyledText';
import uuidv1 from 'uuid/v1';

export default class HomeScreen extends React.Component {

  gridStartX = 10;
  gridStartY = 30;
  gridWidth = 340; //must be multiple of 10
  gridHeight = 500; //must be multiple of 10
  gridRowLength = this.gridWidth/10;
  gridColumnLength = this.gridHeight/10;
  cellSize = 10;
  constructor(props){
    super(props);

    state = {
      curGrid: [],
      rects: [],
      cursorX: undefined,
      cursorY: undefined,
      gameStarted: false,
      remainingCells: undefined,
    };
  }
  

  timer = null;
  logTimer = null;

  static navigationOptions = {
    header: null,
  };

  drawHorizontalGridLines = () => {
    const { Line } = Svg;
    lineArray = [];
    let i = this.gridStartY + this.cellSize;
    while(i < this.gridStartY + this.gridHeight){
      lineArray.push(<Line
        key={i}
        x1={this.gridStartX}
        y1={i}
        x2={this.gridWidth + this.gridStartX}
        y2={i}
        stroke="black"
        strokeWidth="2"
        />
       );
       i+=this.cellSize;
    }
    return lineArray;
  };

  drawVerticalGridLines = () => {
    const { Line } = Svg;
    lineArray = [];
    let i = this.gridStartX + this.cellSize;
    while(i < this.gridStartX + this.gridWidth){
      lineArray.push(<Line
        key={i}
        x1={i}
        y1={this.gridStartY}
        x2={i}
        y2={this.gridHeight + this.gridStartY}
        stroke="black"
        strokeWidth="2"
        />
       );
       i+=this.cellSize;
    }
    return lineArray;
  };

  drawGrid = () => {
    const { Rect } = Svg;
    let x = 0;
    let y = 0;
    this.setState({rects: []});
    let newRects = [];
    while(y < this.gridColumnLength){
      while(x < this.gridRowLength){
        let cell = this.state.curGrid[y][x];
        if (cell != 0) {
         newRects.push(<Rect key={uuidv1()} x={this.gridStartX+x*10} y={this.gridStartY+y*10} width="10" height="10" 
                        stroke="black" strokeWidth="2" fill={cell === 1 ? "darkslategray" : "blue"} />);
        }
        x += 1; 
      }
      x = 0;
      y += 1;
    }
    this.setState({
      rects: newRects
    });
  }

  countNeighbors = (x,y) => {
    let c = 0;
    if (y-1 > 0 && x-1 > 0 && this.state.curGrid[y-1][x-1] === 1) {c+=1;}
    if (y-1 > 0 && this.state.curGrid[y-1][x] === 1) {c+=1;}
    if (y-1 > 0 && x + 1 < this.gridRowLength && this.state.curGrid[y-1][x+1] === 1) {c+=1;}
    if (x + 1 < this.gridRowLength && this.state.curGrid[y][x+1] === 1) {c+=1;}
    if (y + 1 < this.gridColumnLength && x + 1 < this.gridRowLength && this.state.curGrid[y+1][x+1] === 1) {c+=1;}
    if (y + 1 < this.gridColumnLength && this.state.curGrid[y+1][x] === 1) {c+=1;}
    if (y + 1 < this.gridColumnLength && x-1 > 0 && this.state.curGrid[y+1][x-1] === 1) {c+=1;}
    if (x-1 > 0 && this.state.curGrid[y][x-1] === 1) {c+=1;}

    return c;
  }

  updateGrid = () => {
    let x = 0;
    let y = 0;
    let newGrid = [];
    while(y < this.gridColumnLength){
      let row = [];      
      while(x < this.gridRowLength){       
        /*The Rules
        For a space that is 'populated':
            Each cell with one or no neighbors dies, as if by solitude. 
            Each cell with four or more neighbors dies, as if by overpopulation. 
            Each cell with two or three neighbors survives. 
        For a space that is 'empty' or 'unpopulated'
            Each cell with three neighbors becomes populated. */
        let c = this.countNeighbors(x,y);
        if (this.state.curGrid[y][x] === 1) { //populated
          if (c < 2 || c > 3 ) { 
            row.push(0);
          } else {
            row.push(1);
          }
        }
        else { //unpopulated
          if (c  === 3) {
            row.push(1);
          } else {
            row.push(0);
          }
        }
        ////////////
        x += 1; 
      }
      newGrid.push(row);
      x = 0;
      y += 1;
    }
    this.setState({curGrid: newGrid});
    this.drawGrid();
  }

  toggleBlock = () => {
    let grid = this.state.curGrid;
    let slotEmpty = grid[this.state.cursorY][this.state.cursorX] === 0;
    let enemySlot = grid[this.state.cursorY][this.state.cursorX] === 1;
    let add = slotEmpty ? 1 : -1;
    let cellsLeft = this.state.remainingCells;
    if ( (slotEmpty && cellsLeft > 0) || (!enemySlot) ) {
      grid[this.state.cursorY][this.state.cursorX] = (slotEmpty && cellsLeft > 0 )? -1 : 0;
      this.setState({
        curGrid: grid,
        remainingCells: cellsLeft - add,
      });
    }
    this.drawGrid();
  }

  startGame = () => {
    this.setState({
      gameStarted: true
    });
    this.timer = setInterval(this.updateGrid, 500);
  }

  moveCursor = (x,y) => {
    let moveX = (this.state.cursorX + x >= 0 && this.state.cursorX + x <= 34) ? x : 0;
    let moveY = (this.state.cursorY + y >= 0 && this.state.cursorY + y <= 50) ? y : 0;
    this.setState({
      cursorX: this.state.cursorX+moveX,
      cursorY: this.state.cursorY+moveY
    });
  }

  componentWillMount() {
    this.setState({
      curGrid: testGrid,
      cursorX: this.gridRowLength/2,
      cursorY: this.gridColumnLength/2,
      gameStarted: false,
      remainingCells: cellLimit,
    });

  }

  componentDidMount() {
    this.drawGrid();
  }

  componentWillUnmount() {
    this.clearInterval(this.timer);
  }

  render() {
    const { Circle, Rect } = Svg;
    return (
      <View style={{width: 400, height: 700, backgroundColor: 'powderblue'}}>
        <Svg height="80%" width="100%">
              <Rect
                x={this.gridStartX}
                y={this.gridStartY}
                width={this.gridWidth}
                height={this.gridHeight}
                stroke="black"
                strokeWidth="2"
                fill="white"
              />
              {this.drawHorizontalGridLines()}
              {this.drawVerticalGridLines()}
              {this.state.rects}
              {!this.state.gameStarted && 
                (<Rect
                  x={this.gridStartX+(this.state.cursorX*this.cellSize)}
                  y={this.gridStartY+(this.state.cursorY*this.cellSize)}
                  width="10"
                  height="10"
                  stroke="orange"
                  strokeWidth="2"
                  fill="none"
                />)
              }
        </Svg>
        <View style={{width: 365, height: 70, backgroundColor: 'steelblue', justifyContent: 'space-evenly', alignItems: 'center', flexDirection:'row'}}>
          <Button title="Start" color="#841584" disabled={this.state.gameStarted} onPress={this.startGame}/>
          <Button title="UP" color="#841584" disabled={this.state.gameStarted} onPress={()=>this.moveCursor(0,-1)}/>
          <Button title="DOWN" color="#841584" disabled={this.state.gameStarted} onPress={()=>this.moveCursor(0,1)}/>
          <Button title="LEFT" color="#841584" disabled={this.state.gameStarted} onPress={()=>this.moveCursor(-1,0)}/>
          <Button title="RIGHT" color="#841584" disabled={this.state.gameStarted} onPress={()=>this.moveCursor(1,0)}/>
          <Button title="SET" color="#841584" disabled={this.state.gameStarted} onPress={this.toggleBlock}/>
        </View>
        <View style={{width: 365, height: 70, backgroundColor: 'steelblue', justifyContent: 'space-evenly', alignItems: 'center', flexDirection:'row'}}>
          <Text>Remaining Cells: {this.state.remainingCells} </Text>
        </View>
      </View>
    );
  }

  _maybeRenderDevelopmentModeWarning() {
    if (__DEV__) {
      const learnMoreButton = (
        <Text onPress={this._handleLearnMorePress} style={styles.helpLinkText}>
          Learn more
        </Text>
      );

      return (
        <Text style={styles.developmentModeText}>
          Development mode is enabled, your app will be slower but you can use useful development
          tools. {learnMoreButton}
        </Text>
      );
    } else {
      return (
        <Text style={styles.developmentModeText}>
          You are not in development mode, your app will run at full speed.
        </Text>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/guides/development-mode');
  };

  _handleHelpPress = () => {
    WebBrowser.openBrowserAsync(
      'https://docs.expo.io/versions/latest/guides/up-and-running.html#can-t-see-your-changes'
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    flex:1,
    flexDirection:'column',
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
