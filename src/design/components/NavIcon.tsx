import {View} from 'react-native';
/** Small line icons built from native views, consistent on iOS and web. */
export function NavIcon({name,color='#7CE8F5'}:{name:string;color?:string}){
 const line={backgroundColor:color,position:'absolute' as const,borderRadius:2};
 return <View accessible={false} style={{width:30,height:30,marginBottom:6}}>
 {name==='journey'?<>{[3,12,21].map((x,i)=><View key={x} style={{position:'absolute',left:x,top:5+(i%2)*4,width:9,height:19,borderWidth:1.5,borderColor:color,transform:[{skewY:i%2?'20deg':'-20deg'}]}}/>)}</>:name==='sparks'?<><View style={{position:'absolute',left:7,top:7,width:16,height:16,borderRadius:8,borderWidth:2,borderColor:color}}/>{[0,90,180,270].map(r=><View key={r} style={{position:'absolute',width:30,height:30,transform:[{rotate:`${r}deg`}]}}><View style={[line,{left:14,top:0,width:2,height:4}]}/></View>)}</>:name==='shop'?<><View style={{position:'absolute',left:5,top:10,width:21,height:17,borderRadius:4,borderWidth:1.5,borderColor:color}}/><View style={{position:'absolute',left:10,top:3,width:11,height:12,borderRadius:6,borderWidth:1.5,borderColor:color}}/></>:<>{[9,16,24].map((h,i)=><View key={h} style={[line,{bottom:3,left:4+i*9,width:5,height:h}]}/>)}</>}
 </View>;
}
