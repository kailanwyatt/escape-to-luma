import React from 'react';
import {View} from 'react-native';

/** Decorative chapter silhouettes only; no navigation or gameplay behavior. */
export function JourneyMotif({motif,accent}:{motif:string;accent:string}) {
 const ring=(key:number,x:number,y:number,size:number,color=accent)=> <View key={key} style={{position:'absolute',right:x,top:y,width:size,height:size,borderRadius:size/2,borderWidth:2,borderColor:color,opacity:.65}}/>;
 return <View pointerEvents="none" accessible={false} style={{position:'absolute',inset:0,overflow:'hidden'}}>
  {motif==='capture'?<>
   {[0,1,2].map(i=><View key={i} style={{position:'absolute',right:18+i*65,top:16,width:49,height:96,backgroundColor:'#182b3a',borderWidth:2,borderColor:'#526370',transform:[{skewY:'-8deg'}]}}><View style={{height:4,margin:7,backgroundColor:accent}}/><View style={{width:6,height:55,marginLeft:21,backgroundColor:'#798b96'}}/></View>)}
  </>:null}
  {motif==='patrol'?<>
   {[0,1,2].map(i=><View key={i} style={{position:'absolute',right:24+i*62,top:20+(i%2)*23,width:32,height:26,borderRadius:12,backgroundColor:'#233645',borderColor:'#92a6b4',borderWidth:2}}><View style={{marginTop:9,marginHorizontal:4,height:3,backgroundColor:'#ffc275'}}/></View>)}
  </>:null}
  {motif==='pulse'?<>{[0,1,2].map(i=>ring(i,25-i*12,8-i*12,60+i*24,'#c8d0ff'))}</>:null}
  {motif==='ports'?<>{[0,1,2].map(i=>ring(i,12+i*58,25+(i%2)*10,46,i===1?'#a7f1d9':'#687684'))}</>:null}
  {motif==='current'?<>{[0,1,2,3,4].map(i=><View key={i} style={{position:'absolute',right:12+i*35,top:15+i*12,width:65,height:2,backgroundColor:accent,opacity:.18+i*.1,transform:[{rotate:'-25deg'}]}}/>)}</>:null}
  {motif==='void'?<View style={{position:'absolute',right:18,top:4,width:106,height:106,borderRadius:53,backgroundColor:'#080a17',borderWidth:2,borderColor:'#78638f'}}><View style={{position:'absolute',left:8,top:27,width:48,height:48,borderRadius:24,borderWidth:3,borderColor:'#d4ceee'}}/></View>:null}
  {motif==='relay'?<>{[0,1,2].map(i=>ring(i,15+i*55,18+(i%2)*20,48,i===1?'#f4bb6f':'#a4e0c6'))}</>:null}
  {motif==='reunion'?<>{[0,1,2,3,4,5,6].map(i=><View key={i} style={{position:'absolute',right:14+i*29,top:20+(i*19)%65,width:8+i%3*3,height:8+i%3*3,borderRadius:8,backgroundColor:'#dcfff0',boxShadow:'0 0 12px #8eedc8'}}/>)}</>:null}
 </View>;
}
