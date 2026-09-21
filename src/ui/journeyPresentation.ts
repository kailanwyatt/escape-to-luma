import type {RuntimeAssetId} from '../graphics/assetRegistry';
/** Replaceable artwork slots. Null means intentional lightweight menu illustration. */
export const JOURNEY_PRESENTATION:Record<string,{image:RuntimeAssetId|null;accent:string;sky:readonly [string,string,string];motif:string}>={
 containment:{image:'world1.crackEscape',accent:'#68E3F2',sky:['#071827','#164458','#04101c'],motif:'lab'},
 city:{image:'home.cityGateway',accent:'#F3BD76',sky:['#102538','#7e6271','#efb16a'],motif:'city'},
 sky:{image:null,accent:'#9ACEEB',sky:['#10263c','#427c9e','#b9dde8'],motif:'cloud'},
 atmosphere:{image:null,accent:'#7DAAF4',sky:['#050d1a','#102c56','#4685c4'],motif:'earth'},
 orbit:{image:null,accent:'#839CF4',sky:['#040b18','#182640','#050d1b'],motif:'orbit'},
 moon:{image:null,accent:'#CAD4DB',sky:['#030b17','#172337','#455360'],motif:'moon'},
 asteroid:{image:null,accent:'#B99B7D',sky:['#060c18','#263244','#0a1423'],motif:'rocks'},
 nebula:{image:'world.nebulaBackdrop',accent:'#C8A2FB',sky:['#100d24','#482469','#171a36'],motif:'nebula'},
 network:{image:'world.networkBackdrop',accent:'#EDCF84',sky:['#071726','#665039','#0d1e2a'],motif:'network'},
 homeward:{image:'world.homewardBackdrop',accent:'#9FE8C7',sky:['#061629','#174455','#8dceca'],motif:'signal'},
};
