type Insets = {left:number;right:number;top:number;bottom:number};

/** Size both columns from one measured content rectangle, including every gap. */
export function homeLayout(width:number,height:number,insets:Insets) {
  const pageWidth = Math.max(1,width-insets.left-insets.right-24);
  const availableHeight = Math.max(1,height-Math.max(insets.top,12)-Math.max(insets.bottom,12));
  const landscape = width>height && pageWidth>=540;
  const gap = landscape?16:0;
  const controlsWidth = landscape?Math.min(400,Math.floor((pageWidth-gap)*.5)):Math.min(680,pageWidth);
  const sceneWidth = landscape?pageWidth-gap-controlsWidth:pageWidth;
  const shortLandscape = landscape && availableHeight<600;
  const sceneHeight = landscape?Math.max(250,availableHeight-64):Math.max(320,Math.min(580,availableHeight*.54));
  return {pageWidth,landscape,gap,controlsWidth,sceneWidth,sceneHeight,shortLandscape};
}
