import { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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
      <StatusBar backgroundColor={'#000'} />
      <View style={styles.container}>
        <Pressable style={styles.closeIcon} onPress={onClose}>
          <Icon name="close" size={24} color="#fff" />
        </Pressable>

        <View style={styles.tabHeader}>
          {tabs.map(({ name, text }) => (
            <Pressable
              key={name}
              onPress={() => onChange(name)}
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
  closeIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 8,
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
