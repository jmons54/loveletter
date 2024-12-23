import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CloseModal } from './closeModal';
import { playSound } from '../utils/sound';

interface ModalTabsProps<T extends string> {
  isVisible: boolean;
  tabs: {
    name: T;
    text: string;
  }[];
  value: T;
  onChange: (value: T) => void;
  onClose: () => void;
  children: ReactNode;
}

export function ModalTabs<T extends string>({
  isVisible,
  tabs,
  value,
  onChange,
  onClose,
  children,
}: ModalTabsProps<T>) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CloseModal onPress={onClose} />
        <View style={styles.tabHeader}>
          {tabs.map(({ name, text }) => (
            <Pressable
              key={name}
              onPress={() => {
                playSound('click');
                onChange(name);
              }}
              style={[styles.tabButton, value === name && styles.activeTab]}
            >
              <Text style={styles.tabText}>{text}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.tabContent}>{children}</View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    color: '#fff',
    fontSize: 36,
    fontFamily: 'AmaticSC',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
