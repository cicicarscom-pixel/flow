import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import * as Speech from 'expo-speech';

// Native modul APK'da yoksa (eski/farkli derleme) uygulama acilista cokmesin:
// sesli komut devre disi kalir, geri kalan uygulama calisir.
let ExpoSpeechRecognitionModule = null;
let useSpeechRecognitionEvent = () => {};
try {
  const speechRecognition = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechRecognition.useSpeechRecognitionEvent;
} catch (e) {
  console.warn('[FlowAI voice] expo-speech-recognition native modulu yok', e?.message);
}

function cleanForSpeech(text) {
  if (!text) return '';
  let cleaned = text.replace(/[*_`#]/g, '');
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');
  
  if (cleaned.length > 600) {
    const subset = cleaned.substring(0, 600);
    const lastPunctuation = subset.match(/[.!?](?=\s|$)[^.!?]*$/);
    if (lastPunctuation && lastPunctuation.index) {
      cleaned = subset.substring(0, lastPunctuation.index + 1);
    } else {
      cleaned = subset;
    }
  }
  return cleaned;
}

export function useFlowVoice() {
  const { i18n } = useTranslation();
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [speaking, setSpeaking] = useState(false);

  const startCallbackRef = useRef(null);
  const partialCallbackRef = useRef(null);
  const errorCallbackRef = useRef(null);

  const silenceCallbackRef = useRef(null);
  const traceRef = useRef(null);
  const startedAtRef = useRef(0);
  const tracePackageRef = useRef(null);
  const lastTranscriptRef = useRef('');
  const finalDeliveredRef = useRef(false);

  useSpeechRecognitionEvent('start', () => {
    setListening(true);
    traceRef.current?.('olay: start');
  });
  useSpeechRecognitionEvent('audiostart', () => traceRef.current?.('olay: audiostart'));
  useSpeechRecognitionEvent('speechstart', () => traceRef.current?.('olay: speechstart'));
  useSpeechRecognitionEvent('speechend', () => traceRef.current?.('olay: speechend'));
  useSpeechRecognitionEvent('audioend', () => traceRef.current?.('olay: audioend'));

  useSpeechRecognitionEvent('end', () => {
    setListening(false);
    traceRef.current?.('olay: end');
    if (!finalDeliveredRef.current && lastTranscriptRef.current) {
      finalDeliveredRef.current = true;
      if (startCallbackRef.current) startCallbackRef.current(lastTranscriptRef.current.trim());
    }
  });

  useSpeechRecognitionEvent('result', (event) => {
    traceRef.current?.('olay: result (isFinal: ' + event.isFinal + ') ' + (event.results[0]?.transcript?.substring(0, 25) || ''));
    const result = event.results[0];
    if (!result) return;
    
    lastTranscriptRef.current = result.transcript || '';
    
    if (event.isFinal) {
      finalDeliveredRef.current = true;
      setListening(false);
      if (startCallbackRef.current) {
        startCallbackRef.current(result.transcript.trim());
      }
    } else {
      if (partialCallbackRef.current) {
        partialCallbackRef.current(result.transcript);
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    traceRef.current?.('olay: error (' + event.error + ' - ' + event.message + ')');
    if (event.error === 'no-speech') {
      if (Date.now() - startedAtRef.current < 1500) {
         if (errorCallbackRef.current) errorCallbackRef.current({ code: 'hemen-sessizlik', message: 'paket: ' + (tracePackageRef.current || 'varsayılan') });
      } else {
         if (silenceCallbackRef.current) silenceCallbackRef.current();
      }
      return;
    }
    if (event.error === 'aborted') return;
    if (errorCallbackRef.current) {
      errorCallbackRef.current({ code: event.error, message: event.message });
    }
  });

  const getLocaleForSpeech = () => {
    if (i18n.language === 'en') return 'en-US';
    if (i18n.language === 'de') return 'de-DE';
    return 'tr-TR';
  };

  const start = async ({ onPartial, onFinal, onError, onSilence, onTrace }) => {
    stopSpeaking();
    
    startCallbackRef.current = onFinal;
    partialCallbackRef.current = onPartial;
    errorCallbackRef.current = onError;
    silenceCallbackRef.current = onSilence;
    traceRef.current = onTrace;
    startedAtRef.current = Date.now();
    lastTranscriptRef.current = '';
    finalDeliveredRef.current = false;

    if (!ExpoSpeechRecognitionModule) {
      if (onError) onError({ code: 'unavailable' });
      return;
    }

    try {
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        if (onError) onError({ code: 'permission' });
        return;
      }
      
      let options = {
        lang: getLocaleForSpeech(),
        interimResults: true,
        continuous: false,
        androidIntentOptions: {
          EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2500,
          EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 2500,
          EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 2000,
        },
      };
      
      const list = servicesRef.current;
      if (list && list.length > 0) {
        if (list.includes('com.google.android.googlequicksearchbox')) {
          options.androidRecognitionServicePackage = 'com.google.android.googlequicksearchbox';
        }
      }
      tracePackageRef.current = options.androidRecognitionServicePackage;
      
      if (onTrace) {
        onTrace('servis listesi: ' + JSON.stringify(list));
        onTrace('seçilen paket: ' + (options.androidRecognitionServicePackage || 'varsayılan'));
      }

      await ExpoSpeechRecognitionModule.start(options);
    } catch (e) {
      if (onError) onError({ code: e.code || 'start-failed', message: e.message });
    }
  };

  const stop = () => {
    finalDeliveredRef.current = true;
    ExpoSpeechRecognitionModule?.abort();
    setListening(false);
  };

  const stopSpeaking = () => {
    Speech.stop();
    setSpeaking(false);
  };

  const speak = (text, onDoneCallback) => {
    stopSpeaking();
    const cleaned = cleanForSpeech(text);
    if (!cleaned) {
      if (onDoneCallback) onDoneCallback();
      return;
    }
    
    let doneCalled = false;
    const finish = () => {
      setSpeaking(false);
      if (!doneCalled) {
        doneCalled = true;
        if (onDoneCallback) onDoneCallback();
      }
    };

    setSpeaking(true);
    Speech.speak(cleaned, {
      language: getLocaleForSpeech(),
      onDone: finish,
      onError: finish,
      onStopped: finish,
    });
  };

  const servicesRef = useRef(null);

  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) {
      setSupported(false);
      return () => Speech.stop();
    }
    (async () => {
      try {
        const available = await ExpoSpeechRecognitionModule.isRecognitionAvailable();
        console.warn('[FlowAI voice] isRecognitionAvailable', available);
      } catch (e) {
        console.warn('[FlowAI voice]', e);
      }
      try {
        if (typeof ExpoSpeechRecognitionModule.getSpeechRecognitionServices === 'function') {
          const list = await ExpoSpeechRecognitionModule.getSpeechRecognitionServices();
          servicesRef.current = list;
          console.warn('[FlowAI voice] services', list);
        }
      } catch (e) {
        console.warn('[FlowAI voice] services error', e);
      }
    })();
    return () => {
      ExpoSpeechRecognitionModule.abort();
      Speech.stop();
    };
  }, []);

  return { listening, supported, start, stop, speak, stopSpeaking, speaking };
}
