import {StyleSheet, View} from 'react-native';

/** Native geometry avoids platform-specific emoji and font glyph rendering. */
export function SettingsIcon() {
  return <View pointerEvents="none" accessible={false} style={styles.icon}>
    {[0,45,90,135,180,225,270,315].map(angle => (
      <View key={angle} style={[StyleSheet.absoluteFill,{transform:[{rotate:`${angle}deg`}]}]}>
        <View style={styles.tooth}/>
      </View>
    ))}
    <View style={styles.rim}/>
    <View style={styles.hub}/>
  </View>;
}
const styles=StyleSheet.create({
  icon:{width:28,height:28},
  tooth:{position:'absolute',left:11,top:1,width:6,height:6,borderRadius:1,backgroundColor:'#7CE8F5'},
  rim:{position:'absolute',left:5,top:5,width:18,height:18,borderRadius:9,borderWidth:2, borderColor:'#7CE8F5',backgroundColor:'#041E30'},
  hub:{position:'absolute',left:10,top:10,width:8,height:8,borderRadius:4,borderWidth:1.5,borderColor:'#D8FAFF'},
});
