import {useState} from 'react';
import {Image,View,StyleSheet,type StyleProp,type ViewStyle} from 'react-native';
const ATLAS=require('../../assets/art/shop/workshop-atlas.png');
/** Normalized boundaries from the generated atlas. Crop in UI; share one decoded image. */
export function ShopArt({tile,style}:{tile:number;style?:StyleProp<ViewStyle>}){
 const [box,setBox]=useState({width:0,height:0});
 const row=Math.floor(tile/3),col=tile%3,ys=[0,.307,.62,1],x=col/3,y=ys[row],w=1/3,h=ys[row+1]-y;
 const scale=Math.max(box.width/w,box.height/h);
 return <View pointerEvents="none" accessible={false} style={[{overflow:'hidden',backgroundColor:'#031522'},style]} onLayout={e=>setBox(e.nativeEvent.layout)}>{box.width>0?<Image source={ATLAS} resizeMode="stretch" style={{position:'absolute',width:scale,height:scale,left:(box.width-scale*w)/2-scale*x,top:(box.height-scale*h)/2-scale*y}}/>:null}</View>;
}
