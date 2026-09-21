import {t} from '../../i18n';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {color} from '../tokens';

/** Outside scrolling content so navigation is always within reach. */
export function MenuBackBar({onBack,label=t("menubackbar.back")}:{onBack:()=>void;label?:string}) {
 const insets=useSafeAreaInsets();
 return <View pointerEvents="box-none" style={[s.bar,{paddingTop:insets.top+8,paddingLeft:Math.max(insets.left,16),paddingRight:Math.max(insets.right,16)}]}>
  <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onBack} style={({pressed})=>[s.button,pressed&&{opacity:0.65}]}>
   <View style={s.chevron}/><Text style={s.label}>{label.toUpperCase()}</Text>
  </Pressable>
 </View>;
}
const s=StyleSheet.create({
 bar:{paddingBottom:8,backgroundColor:'rgba(3,17,29,0.96)',borderBottomWidth:1,borderBottomColor:'rgba(65,215,255,0.16)',flexShrink:0},
 button:{alignSelf:'flex-start',minHeight:44,paddingHorizontal:14,flexDirection:'row',alignItems:'center',gap:12,borderRadius:24,borderWidth:1,borderColor:'rgba(65,215,255,0.45)'},
 chevron:{width:10,height:10,borderLeftWidth:2,borderBottomWidth:2,borderColor:color.cyanBright,transform:[{rotate:'45deg'}]},
 label:{color:color.cyanBright,fontSize:12,fontWeight:'800',letterSpacing:1.5},
});
