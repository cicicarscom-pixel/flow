import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Eklenen video rozeti (FlowAiHost'tan birebir taşındı).
export default function AttachmentChip({ attachmentMeta, onRemove }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 6, marginHorizontal: 12, marginBottom: 8, alignSelf: 'flex-start' }}>
      <Ionicons name="videocam" size={14} color="#8B949E" />
      <Text style={{ color: '#D7DEE7', fontSize: 12, marginLeft: 4 }}>{attachmentMeta.fileName} ({Math.round(attachmentMeta.durationSec)}s)</Text>
      <TouchableOpacity onPress={onRemove} style={{ marginLeft: 6, padding: 2 }}>
        <Ionicons name="close-circle" size={14} color="#F85149" />
      </TouchableOpacity>
    </View>
  );
}
