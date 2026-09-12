from pathlib import Path

p=Path('imagetrend-a15-native-test.user.js')
s=p.read_text()
s=s.replace('0.2.4.17','0.2.4.18')

old="""  let target=null;
  document.addEventListener('focusin',e=>{const n=e.target;if(n instanceof HTMLInputElement&&n.closest('#form-composer,.grid-flyout-active')){const pair=timePair(n);if(pair){target={id:n.id,url:location.href,node:n,pair};status.textContent='Timestamp target selected';}}});
"""
new="""  let target=null;
  function rememberTimeTarget(node){
    if(!(node instanceof HTMLInputElement)||!node.closest('#form-composer,.grid-flyout-active'))return false;
    const pair=timePair(node);if(!pair)return false;
    target={id:node.id,url:location.href,node,pair};status.textContent='Timestamp target selected';return true;
  }
  // Safari/iPad can move focus away from the input when ImageTrend opens its native date picker.
  // Capture the intended target before that happens, and recover from the native picker if needed.
  for(const type of ['pointerdown','touchstart','click','focusin'])document.addEventListener(type,e=>rememberTimeTarget(e.target),true);
  function recoverTimeTarget(){
    if(target?.node?.isConnected&&target.url===location.href&&target.pair?.date?.isConnected&&target.pair?.time?.isConnected)return target;
    const picker=document.getElementById('date-picker'),ko=window.ko,vm=picker&&ko?.contextFor?.(picker)?.$data;
    const focused=ko?.unwrap?.(vm?.focusedElement);
    if(focused){const node=document.getElementById(focused);if(rememberTimeTarget(node))return target;}
    if(rememberTimeTarget(document.activeElement))return target;
    return null;
  }
"""
if old not in s:
    raise SystemExit('timestamp target capture block not found')
s=s.replace(old,new,1)

old2="""      if(busy)return;busy=true;const t=target;
      try{
        if(!t||!t.node.isConnected||t.url!==location.href)throw Error('Focus the destination date/time field first.');
"""
new2="""      if(busy)return;busy=true;const t=recoverTimeTarget();
      try{
        if(!t||!t.node.isConnected||t.url!==location.href)throw Error('Tap the destination date/time field once, then press '+label+'.');
"""
if old2 not in s:
    raise SystemExit('timestamp shortcut target block not found')
s=s.replace(old2,new2,1)
p.write_text(s)

r=Path('README.md')
t=r.read_text().replace('Gremlin Logic 0.2.4.17','Gremlin Logic 0.2.4.18').replace('RELEASE-0.2.4.17.md','RELEASE-0.2.4.18.md')
r.write_text(t)

Path('RELEASE-0.2.4.18.md').write_text('''# Gremlin Logic A15 0.2.4.18\n\n## iPad Safari timestamp target recovery\n\n- Timestamp shortcuts no longer depend on focusin alone.\n- A15 remembers the last tapped/clicked/focused ImageTrend date-time pair before Safari moves focus into the native picker.\n- If that cached target is lost, A15 attempts recovery from ImageTrend's native date-picker view model and then document.activeElement.\n- Writes still require a live date/time pair on the same chart.\n- Addresses repeated Focus the destination date/time field first failures on iPad Safari.\n''')
