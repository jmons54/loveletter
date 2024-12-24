import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  StatusBar,
} from 'react-native';
import { playSound, stopMusic } from '../utils/sound';
import { cards, CardType, CardValue } from '@shared';
import { Card } from './card';
import { getCardDimensionsFromWindowSize } from '../utils/card';
import { useWindowSize } from '../hook/useWindowSize';
import i18n from '@i18n';
import { CloseModal } from './closeModal';
import { primaryColor } from '../utils/color';

interface ModalEffectProps {
  isVisible: boolean;
  targetedCardValue: CardValue;
  playerName: string;
  playedCards?: CardType[];
  onSelect: (value: CardValue) => void;
}

export function ModalGuard({
  isVisible,
  targetedCardValue,
  playerName,
  playedCards,
  onSelect,
}: ModalEffectProps) {
  const windowSize = useWindowSize();
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);

  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(1)).current;

  const filteredCards = cards
    .filter(({ value }) => value !== 1)
    .map((card) => {
      const count =
        playedCards?.filter((c) => c.value === card.value).length ?? 0;
      const disabled = card.value === 1;
      return { ...card, count, disabled };
    });

  useEffect(() => {
    if (selectedCard) {
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(messageScale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(messageScale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [
    messageOpacity,
    messageScale,
    scaleAnim,
    selectedCard,
    targetedCardValue,
  ]);

  const handleCardSelect = async (card: CardType) => {
    await stopMusic('targeted');
    await playSound('click');
    setSelectedCard(card);
    const isSuccess = card.value === targetedCardValue;
    setResult(isSuccess ? 'success' : 'fail');
    await playSound(isSuccess ? 'success' : 'fail');
  };

  const onClose = () => {
    if (selectedCard) {
      setSelectedCard(null);
      onSelect(selectedCard.value);
    }
  };

  const color = result === 'success' ? '#4CAF50' : '#FFC107';

  const cardDimensions = getCardDimensionsFromWindowSize(windowSize);

  return (
    <Modal visible={isVisible} onRequestClose={onClose}>
      {selectedCard && <CloseModal onPress={onClose} />}
      <StatusBar backgroundColor={'#000000'} barStyle={'light-content'} />
      <View style={styles.container}>
        {selectedCard ? (
          <View style={styles.resultContainer}>
            <Animated.View
              style={[
                getCardDimensionsFromWindowSize(windowSize),
                { transform: [{ scale: scaleAnim }] },
                { borderWidth: 2, borderColor: color, borderRadius: 8 },
              ]}
            >
              <Pressable onPress={onClose}>
                <Card
                  card={selectedCard}
                  flipped
                  style={{
                    elevation: 500,
                  }}
                />
              </Pressable>
            </Animated.View>

            <Animated.Text
              style={[
                styles.resultMessage,
                {
                  color,
                  opacity: messageOpacity,
                  transform: [{ scale: messageScale }],
                },
              ]}
            >
              {result === 'success'
                ? i18n.t('modalGuard.success')
                : i18n.t('modalGuard.fail')}
            </Animated.Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>
              {i18n.t('modalGuard.title', {
                playerName,
              })}
            </Text>
            <View
              style={[
                styles.cardsGrid,
                { width: (cardDimensions.width + 5) * 3 },
              ]}
            >
              {filteredCards.map((card) => (
                <Pressable
                  key={card.value}
                  style={[
                    { transform: [{ scale: 0.8 }] },
                    cardDimensions,
                    card.disabled && styles.disabledCard,
                  ]}
                  onPress={() => !card.disabled && handleCardSelect(card)}
                >
                  <Card card={card} flipped />
                  {!card.disabled && (
                    <View style={styles.cardCount}>
                      <Text style={styles.cardCountText}>
                        {card.quantity - card.count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 8,
  },
  container: {
    backgroundColor: '#000000',
    padding: 20,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMessage: {
    marginTop: 60,
    fontSize: 30,
    textAlign: 'center',
    fontFamily: 'AmaticSCBold',
  },
  title: {
    fontSize: 30,
    color: '#FFF',
    fontFamily: 'AmaticSCBold',
    marginBottom: 30,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  disabledCard: {
    opacity: 0.5,
  },
  cardCount: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 20,
    backgroundColor: primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cardCountText: {
    position: 'absolute',
    top: -1,
    fontSize: 20,
    fontFamily: 'FredokaBold',
  },
});
