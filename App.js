import React, {useEffect, useRef, useState} from 'react';
import BackgroundTimer from 'react-native-background-timer';
import PushNotification, {Importance} from 'react-native-push-notification';

import {
  Button,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import axios from 'axios';

const App = () => {
  useEffect(() => {
    PushNotification.cancelAllLocalNotifications();
    PushNotification.createChannel(
      {
        channelId: 'pinner_channel', // (required)
        channelName: 'Pinner Channel', // (required)
        playSound: false, // (optional) default: true
        soundName: 'default', // (optional) See `soundName` parameter of `localNotification` function
        importance: Importance.HIGH, // (optional) default: Importance.HIGH. Int value of the Android notification importance
        vibrate: true, // (optional) default: true. Creates the default vibration pattern if true.
      },
      created => console.log(`createChannel returned '${created}'`), // (optional) callback returns whether the channel was created, false means it already existed.
    );
  }, []);

  const isDarkMode = useColorScheme() === 'dark';
  const [state, setState] = useState({
    pinging: false,
    infoMessage: '',
    timeout: null,
    counter: undefined,
    countdownFrom: 5,
    counterInterval: null,
  });

  const _onPressStartPinging = () => {
    PushNotification.localNotification({
      title: 'Pinging...',
      message: 'Started pinging',
      id: '1',
      ongoing: true,
      channelId: 'pinner_channel',
      shortcutId: 'ping_notification',
    });
    console.log(state);
    if (state.timeout) {
      BackgroundTimer.clearTimeout(state.timeout);
      BackgroundTimer.clearInterval(state.counterInterval);
    }
    if (!state.pinging) {
      _ping();
    }

    setState(prevState => {
      return {
        ...prevState,
        pinging: !prevState.pinging,
        infoMessage: '',
        timeout: null,
        counterInterval: null,
        counter: null,
        connectionEstablished: undefined,
      };
    });
  };

  const _ping = () => {
    console.log('ping started');
    axios
      .get('https://www.google.com')
      .then(res => {
        console.log('success');
        setState(prevState => {
          const newInfoMessage =
            res.status === 200
              ? 'Connection established. Keeping connection alive...'
              : 'Connection down. Trying to establish the connection';
          return {
            ...prevState,
            infoMessage: newInfoMessage,
            connectionEstablished: res.status === 200,
          };
        });
        setTimeoutForPing();
      })
      .catch(err => {
        setState(prevState => {
          return {
            ...prevState,
            infoMessage: err.message,
            connectionEstablished: false,
          };
        });
        setTimeoutForPing();
      });
  };

  useEffect(() => {
    if (state.infoMessage !== '') {
      PushNotification.localNotification({
        title: 'Pinging...',
        message: state.infoMessage,
        ongoing: true,
        id: '1',
        channelId: 'pinner_channel',
        shortcutId: 'ping_notification',
      });
    }
  }, [state.infoMessage]);

  useEffect(() => {
    return () => {
      console.log('çıkıyoruuuuz!');
      PushNotification.cancelAllLocalNotifications();
    };
  }, []);

  const setTimeoutForPing = () => {
    const _timeout = BackgroundTimer.setTimeout(
      _ping,
      1000 * state.countdownFrom,
    );
    setState(prevState => {
      return {
        ...prevState,
        timeout: _timeout,
        counter: state.countdownFrom,
      };
    });
    startCountdown();
  };

  useEffect(() => {
    if (state.counter === 0) {
      BackgroundTimer.clearInterval(state.counterInterval);
    }
  }, [state.counter]);

  const startCountdown = () => {
    let _counterInterval = BackgroundTimer.setInterval(decreaseCounter, 1000);
    console.log('Counter interval: ' + _counterInterval);
    setState(prevState => {
      return {
        ...prevState,
        counterInterval: _counterInterval,
      };
    });
  };
  const decreaseCounter = () => {
    setState(prevState => {
      console.log(prevState.counter - 1);
      return {
        ...prevState,
        counter: prevState.counter - 1,
      };
    });
  };
  return (
    <SafeAreaView style={styles.pageStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Text>{state.infoMessage}</Text>
      {state.counterInterval && (
        <Text>{'Will try after ' + state.counter + ' secs'}</Text>
      )}
      <View style={styles.buttonContainer}>
        <Button
          title={state.pinging ? 'Pinging' : 'Start pinging'}
          style={styles.pingButton}
          onPress={_onPressStartPinging}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pingButton: {
    width: '30%',
  },
  buttonContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  pageStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
});

export default App;
