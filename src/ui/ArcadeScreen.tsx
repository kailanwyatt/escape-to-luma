import {LinearGradient} from 'expo-linear-gradient';
import {Image,Pressable,ScrollView,StyleSheet,Text,useWindowDimensions,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {arcadeGames, type ArcadeGame, type ArcadeGameId} from '../arcade/arcadeGames';
import {BrandWordmark, color, fontDisplay, fontUi} from '../design';
import {MenuBackBar} from '../design/components/MenuBackBar';
import {t} from '../i18n';
import type {PersistentGameData} from '../persistence/GameSave';
import {HomeSpark} from './HomeEffects';

const CITY_ART = require('../../assets/art/home/city-gateway.jpg');

type Props = {
  save: PersistentGameData;
  onBack: () => void;
  onSelectGame: (gameId: ArcadeGameId) => void;
  /** The browser embed belongs to the site, so it has no in-game Home route. */
  webArcade?: boolean;
};

function GamepadIcon(){return <View accessible={false} style={s.gamepad}><View style={s.pad}/><View style={s.crossH}/><View style={s.crossV}/><View style={[s.dot,{left:41}]}/><View style={[s.dot,{left:51}]}/></View>;}
function PlayIcon(){return <View accessible={false} style={s.playIcon}><View style={s.playTriangle}/></View>;}

/** The browser version begins inside the same portal scene as the native home screen,
 * but presents Arcade as the only playable destination. */
function WebArcadeLobby({save,onSelectGame}:{save:PersistentGameData;onSelectGame:(gameId:ArcadeGameId)=>void}){
  const insets=useSafeAreaInsets();
  const {width,height}=useWindowDimensions();
  const landscape=width>=760&&width>height;
  const game=arcadeGames(save,{unlockWebArcade:true})[0];
  return <View style={s.webRoot}>
    <Image source={CITY_ART} resizeMode="cover" style={StyleSheet.absoluteFill}/>
    <LinearGradient pointerEvents="none" colors={['rgba(1,15,28,.62)','rgba(1,15,28,.08)','rgba(1,15,28,.7)']} locations={[0,.42,1]} style={StyleSheet.absoluteFill}/>
    <LinearGradient pointerEvents="none" colors={['rgba(0,9,19,.26)','rgba(0,9,19,.9)']} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill}/>
    <ScrollView contentContainerStyle={[s.webScroll,{paddingTop:Math.max(insets.top,12),paddingBottom:Math.max(insets.bottom,16)}]}>
      <View
        style={[s.webPage,landscape&&s.webPageLandscape,{minHeight:landscape?height:780}]}
      >
        <View style={[s.webBody,landscape&&s.webBodyLandscape]}>
          <View style={[s.webBrand,landscape&&s.webBrandLandscape]}>
            <Text style={s.webEyebrow}>{t('homescreen.predict_adapt_overcome')}</Text>
            <BrandWordmark size="hero" showSubtitle/>
            <Text style={s.webModeLabel}>{t('homescreen.arcade')}</Text>
            <Text style={s.webCaption}>{t('arcadescreen.replayable_challenges')}</Text>
          </View>
          <View style={[s.webStage,landscape&&s.webStageLandscape]}>
            <View pointerEvents="none" style={[s.webSpark,landscape&&s.webSparkLandscape]}><HomeSpark reduceMotion={save.settings.reduceMotion}/></View>
            <View pointerEvents="none" style={s.webMechanicReadout}><Text style={s.webMechanicTitle}>LEAD THE OPENING</Text><Text style={s.webMechanicCopy}>DRAG TO AIM · RELEASE TO LAUNCH</Text></View>
          </View>
          <View style={[s.webLaunchArea,landscape&&s.webLaunchAreaLandscape]}>
            <Text style={s.webChoose}>PLAY ENDLESS VOYAGE</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`${t(game.titleKey)}. ${t(game.availabilityKey)}`} onPress={()=>onSelectGame(game.id)} style={({pressed})=>[s.webLaunch,pressed&&s.pressed]}>
              <LinearGradient colors={['#FFE976','#FFC940','#F5A623']} locations={[0,.45,1]} start={{x:0,y:0}} end={{x:1,y:1}} style={s.webLaunchInner}>
                <View pointerEvents="none" style={s.webLaunchSheen}/><View style={s.webLaunchIcon}><PlayIcon/></View><View style={s.webLaunchCopy}><Text style={s.webLaunchTitle}>{t('homescreen.arcade')}</Text><Text style={s.webLaunchSubtitle}>{t(game.titleKey)} · {t('homescreen.endless_challenges')}</Text></View><Text style={s.webChevron}>›</Text>
              </LinearGradient>
            </Pressable>
            <Text style={s.webLaunchNote}>3 HEARTS · ONE HIGH SCORE · NO DOWNLOAD REQUIRED</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  </View>;
}

/** A reusable catalog card: new Arcade entries need no Home-screen changes. */
export function ArcadeGameCard({game,onPress}:{game:ArcadeGame;onPress:()=>void}){
  const title=t(game.titleKey);
  const state=t(game.availabilityKey);
  return <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${state}`} accessibilityState={{disabled:!game.unlocked}} disabled={!game.unlocked} onPress={onPress} style={({pressed})=>[s.card,pressed&&s.pressed,!game.unlocked&&s.locked]}>
    <LinearGradient colors={game.unlocked?['rgba(12,76,109,.94)','rgba(4,27,47,.96)']:['rgba(8,33,51,.9)','rgba(4,21,36,.95)']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.cardInner}>
      <View style={s.iconWell}><GamepadIcon/></View>
      <View style={s.cardCopy}><Text style={s.cardTitle}>{title}</Text><Text style={s.cardDescription}>{t(game.descriptionKey)}</Text><Text style={[s.cardState,!game.unlocked&&s.lockedCopy]}>{state}</Text></View>
      <Text style={s.chevron}>{game.unlocked?'›':'•'}</Text>
    </LinearGradient>
  </Pressable>;
}

export function ArcadeScreen({save,onBack,onSelectGame,webArcade=false}:Props){
  const insets=useSafeAreaInsets();
  if(webArcade)return <WebArcadeLobby save={save} onSelectGame={onSelectGame}/>;
  return <View style={s.root}>
    <LinearGradient colors={['#041727','#062842','#031423','#010b13']} locations={[0,.42,.8,1]} style={StyleSheet.absoluteFill}/>
    <View pointerEvents="none" style={s.orb}/><View pointerEvents="none" style={s.grid}/>
    <MenuBackBar onBack={onBack} label={t("arcadescreen.back_to_home")}/>
    <ScrollView contentContainerStyle={[s.scroll,{paddingBottom:Math.max(insets.bottom,28)}]}>
      <View style={s.column}>
        <BrandWordmark size="header" style={s.brand}/>
        <View style={s.heading}><Text style={s.eyebrow}>{t("arcadescreen.replayable_challenges")}</Text><Text accessibilityRole="header" style={s.title}>{t("homescreen.arcade")}</Text><Text style={s.caption}>{t("arcadescreen.select_a_mode")}</Text></View>
        <View style={s.catalog}><Text style={s.catalogLabel}>{t("arcadescreen.available_modes")}</Text>{arcadeGames(save).map(game=><ArcadeGameCard key={game.id} game={game} onPress={()=>onSelectGame(game.id)}/>)}</View>
      </View>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  webRoot:{...StyleSheet.absoluteFill,backgroundColor:'#031522'},
  webScroll:{flexGrow:1,alignItems:'center'},
  webPage:{width:'100%',maxWidth:620,overflow:'hidden'},
  webPageLandscape:{maxWidth:'100%',paddingHorizontal:26},
  webBody:{width:'100%',flex:1},
  webBodyLandscape:{flexDirection:'row',alignItems:'center',gap:18},
  webBrand:{alignItems:'center',paddingTop:30,paddingHorizontal:18},
  webBrandLandscape:{width:'31%',alignItems:'flex-start',paddingTop:0},
  webEyebrow:{fontSize:9,color:'#8ADBFA',letterSpacing:2,fontWeight:'700',marginBottom:8},
  webModeLabel:{fontFamily:fontDisplay,fontSize:30,letterSpacing:6,color:'#E5FCFF',textShadowColor:'#00C9F6',textShadowRadius:15,textShadowOffset:{width:0,height:0},marginTop:14},
  webCaption:{fontSize:9,color:'#A9F4FA',letterSpacing:2.2,fontWeight:'700',marginTop:5,textTransform:'uppercase'},
  webStage:{height:306,position:'relative',alignItems:'center',justifyContent:'center'},
  webStageLandscape:{flex:1,height:'100%',minHeight:230},
  webSpark:{position:'absolute',top:'42%',left:'50%',width:52,height:52,marginLeft:-26,alignItems:'center',justifyContent:'center',transform:[{scale:1.46}]},
  webSparkLandscape:{top:'42%',transform:[{scale:1.72}]},
  webMechanicReadout:{position:'absolute',bottom:22,left:0,right:0,alignItems:'center',gap:4},
  webMechanicTitle:{fontFamily:fontUi,fontSize:10,fontWeight:'800',letterSpacing:2.3,color:'#A6F4FC'},
  webMechanicCopy:{fontSize:8,fontWeight:'700',letterSpacing:1.55,color:'#74CFE8'},
  webLaunchArea:{paddingHorizontal:46,paddingBottom:24,alignItems:'center'},
  webLaunchAreaLandscape:{width:350,paddingHorizontal:0,paddingBottom:0},
  webChoose:{fontSize:10,letterSpacing:3,color:'#B9EFFB',textAlign:'center',marginBottom:9,fontWeight:'700'},
  webLaunch:{width:'100%',borderRadius:18,borderWidth:2,borderColor:'#FFF0A0',shadowColor:'#FFB321',shadowRadius:20,shadowOpacity:.66,shadowOffset:{width:0,height:0},overflow:'hidden'},
  webLaunchInner:{minHeight:74,borderRadius:16,paddingHorizontal:20,flexDirection:'row',alignItems:'center',gap:13,overflow:'hidden'},
  webLaunchSheen:{position:'absolute',top:0,left:0,right:0,height:'46%',backgroundColor:'rgba(255,255,255,.22)'},
  webLaunchIcon:{width:45,height:42,justifyContent:'center'},
  playIcon:{width:38,height:38,borderRadius:19,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(29,21,4,.18)',borderWidth:1,borderColor:'rgba(29,21,4,.42)'},
  playTriangle:{width:0,height:0,marginLeft:3,borderTopWidth:8,borderBottomWidth:8,borderLeftWidth:13,borderTopColor:'transparent',borderBottomColor:'transparent',borderLeftColor:'#1B1505'},
  webLaunchCopy:{flex:1,minWidth:0},
  webLaunchTitle:{fontSize:27,fontFamily:fontDisplay,letterSpacing:4.2,color:'#181305',lineHeight:29},
  webLaunchSubtitle:{fontSize:8,color:'#4B3303',letterSpacing:1.15,marginTop:3,fontWeight:'700'},
  webChevron:{fontSize:42,lineHeight:45,color:'#1C1504',fontWeight:'300'},
  webLaunchNote:{fontSize:8,color:'#7ED4EA',letterSpacing:1.45,marginTop:10,textAlign:'center'},
  root:{...StyleSheet.absoluteFill,backgroundColor:color.ink},scroll:{paddingHorizontal:18,alignItems:'center'},column:{width:'100%',maxWidth:620},brand:{alignItems:'center',paddingTop:22,paddingBottom:12},heading:{alignItems:'center',paddingVertical:24,gap:7},eyebrow:{fontFamily:fontUi,fontSize:10,fontWeight:'700',letterSpacing:2.7,color:'#78E7F7'},title:{fontFamily:fontDisplay,fontSize:40,letterSpacing:6,color:'#E5FCFF',textShadowColor:'#00C9F6',textShadowRadius:16,textShadowOffset:{width:0,height:0}},caption:{fontSize:11,letterSpacing:1.2,color:'#9BC7D8',textAlign:'center'},catalog:{marginTop:18,gap:12},catalogLabel:{fontFamily:fontUi,fontSize:10,fontWeight:'800',letterSpacing:2.3,color:'#73DDEF',paddingLeft:4},card:{borderRadius:20,borderWidth:1,borderColor:'#36D8EE',shadowColor:'#00C9F6',shadowRadius:16,shadowOpacity:.32,shadowOffset:{width:0,height:0},overflow:'hidden'},cardInner:{minHeight:132,padding:18,flexDirection:'row',alignItems:'center',gap:16,borderRadius:19,borderWidth:1,borderColor:'rgba(185,249,255,.16)'},iconWell:{width:66,height:66,borderRadius:20,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(122,239,252,.7)',backgroundColor:'rgba(4,20,38,.52)'},gamepad:{width:59,height:38},pad:{position:'absolute',left:2,top:7,width:55,height:28,borderRadius:13,borderWidth:2,borderColor:'#A2F8FF',backgroundColor:'rgba(73,224,244,.12)'},crossH:{position:'absolute',left:13,top:20,width:12,height:3,borderRadius:2,backgroundColor:'#A2F8FF'},crossV:{position:'absolute',left:17.5,top:15.5,width:3,height:12,borderRadius:2,backgroundColor:'#A2F8FF'},dot:{position:'absolute',top:19,width:5,height:5,borderRadius:3,backgroundColor:'#A2F8FF'},cardCopy:{flex:1,minWidth:0,gap:5},cardTitle:{fontFamily:fontDisplay,fontSize:23,letterSpacing:2.2,color:'#E7FCFF'},cardDescription:{fontSize:11,color:'#B7D7E6',lineHeight:16},cardState:{fontFamily:fontUi,fontSize:9,fontWeight:'800',letterSpacing:1.4,color:'#70ECF7',marginTop:3},chevron:{fontSize:39,lineHeight:42,color:'#98F5FF'},locked:{borderColor:'#31546B',shadowOpacity:0},lockedCopy:{color:'#7896A5'},pressed:{opacity:.72},orb:{position:'absolute',width:420,height:420,borderRadius:210,top:180,left:'50%',marginLeft:-210,backgroundColor:'rgba(0,174,230,.09)',shadowColor:'#00D8FF',shadowRadius:80,shadowOpacity:.35,shadowOffset:{width:0,height:0}},grid:{position:'absolute',left:0,right:0,bottom:0,height:'58%',borderTopWidth:1,borderColor:'rgba(78,221,250,.12)',transform:[{perspective:420},{rotateX:'58deg'},{scaleX:1.6}]},
});
