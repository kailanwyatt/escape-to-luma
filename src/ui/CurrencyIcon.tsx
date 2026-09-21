import {Image,View} from 'react-native';
const SOURCE=require('../../assets/art/shop/currency-icons.png');
/** Native sprite crop keeps alpha and shares one currency-art source across menus. */
export function CurrencyIcon({kind,size=26}:{kind:'energy'|'shard';size?:number}){
 return <View pointerEvents="none" accessible={false} style={{width:size,height:size,overflow:'hidden',flexShrink:0}}><Image source={SOURCE} resizeMode="stretch" style={{position:'absolute',width:size*2,height:size,left:kind==='energy'?0:-size,top:0}}/></View>;
}
