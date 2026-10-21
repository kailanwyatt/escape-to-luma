/** Portal landmarks measured in the original artwork, before any cover cropping. */
const artwork = {
  portrait:{width:1024,height:1536,portalX:512,portalY:724,portalWidth:256},
  wide:{width:1672,height:941,portalX:447,portalY:550,portalWidth:240},
} as const;

export function homeArtworkLayout(width:number,height:number,wide:boolean,preferredX:number) {
  const art=artwork[wide?'wide':'portrait'];
  const scale=Math.max(width/art.width,height/art.height);
  const imageWidth=art.width*scale,imageHeight=art.height*scale;
  const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
  // Keep the image edge to edge while bringing its portal into the scenic column.
  const left=clamp(preferredX-art.portalX*scale,width-imageWidth,0);
  const top=clamp(height*.56-art.portalY*scale,height-imageHeight,0);
  const portal={x:left+art.portalX*scale,y:top+art.portalY*scale};
  // Place Spark on the foreground approach, aiming up the portal's center line.
  const launchDistance=Math.min(art.portalWidth*scale*.55,Math.max(52,height-portal.y-66));
  const spark={x:portal.x,y:portal.y+launchDistance};
  return {
    image:{left,top,width:imageWidth,height:imageHeight},
    portal,
    spark,
    launchDistance,
    launchAngle:Math.atan2(portal.y-spark.y,portal.x-spark.x)*180/Math.PI+90,
    sparkScale:clamp(art.portalWidth*scale*.32/47,.72,1.35),
  };
}
