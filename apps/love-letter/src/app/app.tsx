import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { globalStyles } from '../utils/globalStyles';
import { GameView } from '../game/gameView';
import backgroundImage from '../../assets/backgrounds/1.png';
import { GameEntity, GameService } from '@offline';
import { ModalParameters } from '../parameters/modalParameters';
import Icon from 'react-native-vector-icons/Ionicons';
import { playSound, stopAllMusic } from '../utils/sound';
import { useInit } from '../hook/useInit';
import { avatars } from '../utils/avatar';

export function App() {
  const [showModalParameters, setShowModalParameters] = useState(true);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [game, setGame] = useState<GameEntity | null>(null);
  const [gameId, setGameId] = useState(0);

  const { user, gameParameters, setGameParameters } = useInit(game);

  useEffect(() => {
    setIsGamePaused(showModalParameters);
  }, [showModalParameters]);

  const startNewGame = async () => {
    if (!user || !gameParameters) return;
    await stopAllMusic();
    const newGame = GameService.initGame(
      [user],
      gameParameters?.numberOfPlayers
    );
    const copyAvatars = [...avatars];
    newGame.players
      .filter((player) => player.isBot)
      .forEach((player) => {
        player.avatar = copyAvatars.splice(
          Math.floor(Math.random() * copyAvatars.length),
          1
        )[0];
      });
    setGameId(gameId + 1);
    setGame(newGame);
    setShowModalParameters(false);
  };

  return (
    <View style={[globalStyles.app]}>
      <ImageBackground
        source={backgroundImage}
        style={styles.background}
        resizeMode="cover"
      >
        {user && gameParameters && (
          <>
            <ModalParameters
              user={user}
              isVisible={showModalParameters}
              onClose={() => setShowModalParameters(false)}
              startNewGame={startNewGame}
              gameParameters={gameParameters}
              onGameParametersChange={setGameParameters}
            />

            {game && (
              <GameView
                key={gameId}
                user={user}
                game={game}
                setGame={setGame}
                isGamePaused={isGamePaused}
              />
            )}
            {!showModalParameters && (
              <TouchableOpacity
                style={styles.floatingButton}
                onPress={() => {
                  playSound('click');
                  setShowModalParameters(true);
                }}
              >
                <Icon name="settings" size={30} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1,
  },
});
