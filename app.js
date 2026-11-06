const places={office:'办公室',east:'东门快递站',west:'西门快递站',dorm:'宿舍',classroom:'教学楼',c1:'一食堂',c2:'二食堂',c3:'三食堂',c4:'四食堂'};
const ids=Object.keys(places);
// 固定、对称的校园步行分钟表；不调用定位或真实地图。
const minutes=[[0,5,9,13,4,3,8,11,7],[5,0,12,10,7,6,4,9,11],[9,12,0,6,8,7,10,5,3],[13,10,6,0,11,10,7,2,8],[4,7,8,11,0,3,7,9,5],[3,6,7,10,3,0,5,8,4],[8,4,10,7,7,5,0,5,8],[11,9,5,2,9,8,5,0,6],[7,11,3,8,5,4,8,6,0]];
const halls={c1:{hours:[[660,810],[990,1140]],queue:8},c2:{hours:[[660,810],[1020,1170]],queue:12},c3:{hours:[[630,840],[990,1200]],queue:5},c4:{hours:[[660,780],[1020,1150]],queue:3}};
const dishes=[
['d1','清蒸鲈鱼套餐','c1',16,'light','🐟','清爽鲜嫩 · 少油','二楼 03 窗口'],['d2','冬瓜肉丸汤饭','c1',12,'light','🍲','清淡暖胃 · 汤饭','一楼 06 窗口'],['d3','香辣炸鸡饭','c1',15,'rich','🍗','香酥微辣 · 解馋','一楼 02 窗口'],
['d4','白灼鸡腿时蔬饭','c2',14,'light','🥗','清爽 · 蔬菜丰富','一楼 08 窗口'],['d5','铁板黑椒牛肉饭','c2',18,'rich','🥩','浓郁黑椒 · 偏咸','二楼 01 窗口'],['d6','番茄鸡蛋面','c2',10,'light','🍜','酸甜清淡 · 热汤','一楼 05 窗口'],
['d7','菌菇蒸鸡套餐','c3',15,'light','🍱','鲜香少油 · 饱腹','一楼 03 窗口'],['d8','糖醋里脊饭','c3',14,'rich','🍛','酸甜浓郁 · 酥脆','一楼 07 窗口'],['d9','玉米排骨汤饭','c3',13,'light','🍲','清甜热汤 · 不辣','二楼 02 窗口'],
['d10','麻辣香锅套餐','c4',19,'rich','🌶️','麻辣鲜香 · 偏油','一楼 01 窗口'],['d11','青菜豆腐煲','c4',11,'light','🥬','清淡素食 · 软嫩','一楼 04 窗口'],['d12','脆皮鸡排饭','c4',13,'rich','🍗','外酥里嫩 · 酱香','二楼 06 窗口']
].map(([id,name,hall,price,mood,emoji,tags,window])=>({id,name,hall,price,mood,emoji,tags,window}));
const windowKey=d=>d.hall+'|'+d.window;
const warnings=[
 {id:'d2',tag:'口味提醒',title:'清淡党也要注意：汤底可能偏咸',text:'汤底对我来说偏咸，建议先尝再拌饭。',time:'2026-11-05 12:18',tip:'在意盐味的话，点餐时询问能否少盐。'},
 {id:'d5',tag:'口味提醒',title:'黑椒酱浓，想吃清淡可绕开',text:'酱汁比较浓，吃到后面觉得有点腻。',time:'2026-11-05 18:10',tip:'适合想吃重口味的时候，不代表所有人都不喜欢。'},
 {id:'d4',tag:'排队提醒',title:'高峰现切出餐，赶时间慎选',text:'12:10 到窗口，等了约 20 分钟才取到餐。',time:'2026-11-05 12:35',tip:'这是一次历史反馈，当前排队情况需现场确认。'},
 {id:'d7',tag:'售罄提醒',title:'晚去可能选不到配菜',text:'19:25 来的时候，可选的配菜已经不多了。',time:'2026-11-05 19:30',tip:'营业中不等于菜品齐全，建议提早到店。'}
];
const walk=(a,b)=>minutes[ids.indexOf(a)][ids.indexOf(b)];
const clock=t=>`${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
const perms=a=>a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[v,...p])):[[]];
const distance=path=>path.slice(1).reduce((s,n,i)=>s+walk(path[i],n),0);
const queueAt=(hall,t)=>halls[hall].queue+(Math.abs(t-720)<=35||Math.abs(t-1080)<=35?9:0);
function recommend(o){
 const stops=o.stops.filter(x=>x!==o.start&&x!==o.end);const baseline=Math.min(...perms(stops).map(p=>distance([o.start,...p,o.end])));
 return dishes.filter(d=>!(o.blocked||[]).includes(windowKey(d))&&d.price<=o.budget&&(o.mood==='all'||o.mood===d.mood)).map(d=>{
  const orders=o.first?perms(stops).map(p=>[d.hall,...p]):perms([d.hall,...stops]);
  const routes=orders.map(order=>{let t=o.time,prev=o.start,arrival=0,q=0,closing=0;const events=[{id:o.start,time:t}];
   for(const id of [...order,o.end]){t+=walk(prev,id);if(id===d.hall){arrival=t;const interval=halls[id].hours.find(([a,b])=>t>=a&&t<b);if(!interval)return null;closing=interval[1];q=queueAt(id,t);if(t+q>=closing)return null;events.push({id,time:t,meal:true});t+=q+20;}else{events.push({id,time:t});if(id!==o.end)t+=5;}prev=id;}
   const extra=distance([o.start,...order,o.end])-baseline;return{events,arrival,q,closing,extra,total:t-o.time,score:extra+q};
  }).filter(Boolean).sort((a,b)=>a.score-b.score||a.total-b.total);
  return routes.length?{...d,...routes[0]}:null;
 }).filter(Boolean).sort((a,b)=>a.score-b.score||a.price-b.price);
}
if(typeof module!=='undefined')module.exports={recommend,walk,queueAt,dishes,windowKey};
if(typeof document!=='undefined'){
const $=s=>document.querySelector(s);let mood='light',current=[],selected=null,detailId=null;let memory={};
try{memory=JSON.parse(localStorage.getItem('shunlu-data')||'{}')||{};}catch{}if(!Array.isArray(memory.saved))memory.saved=[];if(!memory.reviews||typeof memory.reviews!=='object')memory.reviews={};
if(!Array.isArray(memory.blocked))memory.blocked=[];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer;function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2300);}
function persist(){try{localStorage.setItem('shunlu-data',JSON.stringify(memory));return true;}catch{toast('浏览器无法保存数据，本次操作仅在当前页面有效');return false;}}
for(const selector of ['#start','#end'])$(selector).innerHTML=Object.entries(places).filter(([id])=>!id.startsWith('c')||id==='classroom').map(([id,n])=>`<option value="${id}">${n}</option>`).join('');$('#start').value='office';$('#end').value='dorm';
document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{mood=b.dataset.mood;document.querySelectorAll('[data-mood]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});run();});
function opts(){const [h,m]=$('#time').value.split(':').map(Number);return{mood,blocked:memory.blocked,budget:+$('#budget').value,time:h*60+m,start:$('#start').value,end:$('#end').value,first:$('#first').checked,stops:[$('#parcelA').checked?'east':null,$('#parcelB').checked?'west':null].filter(Boolean)};}
function run(){const o=opts();if(!Number.isFinite(o.time))return;const all=recommend(o);const chosen=[];for(const [label,sort] of [['综合推荐',(a,b)=>a.score-b.score],['少走路',(a,b)=>a.extra-b.extra||a.q-b.q],['少排队',(a,b)=>a.q-b.q||a.extra-b.extra]]){const d=all.filter(d=>!chosen.some(c=>c.id===d.id)).sort(sort)[0];if(d)chosen.push({...d,label});}current=chosen;selected=current[0]?.id;$('#count').textContent=`${all.length} 道符合偏好`;$('#notice').textContent=(Math.abs(o.time-720)<=45||Math.abs(o.time-1080)<=45?'◷ 临近用餐高峰，先吃饭是个好主意。':'◷ 早点安排，把时间留给好好吃饭。')+' 排队为模拟估计，已排除预计无法在收餐前点餐的窗口。';renderCards();renderRoute();renderWarnings();renderMenu();}
function renderCards(){$('#cards').innerHTML=current.length?current.map(d=>`<article class="card ${selected===d.id?'selected':''}"><div class="dish-art" style="--dish-bg:${d.mood==='light'?'#edf1dc':'#f5e8d8'}">${d.emoji}<small>菜品示意</small></div><div><div class="card-top"><span class="tag">${d.label}</span><button class="save ${memory.saved.includes(d.id)?'saved':''}" data-save="${d.id}" aria-label="${memory.saved.includes(d.id)?'取消收藏':'收藏'}${d.name}" aria-pressed="${memory.saved.includes(d.id)}">${memory.saved.includes(d.id)?'★':'☆'}</button></div><span class="price">¥${d.price}</span><button class="dish-title" data-detail="${d.id}">${d.name} ↗</button><div class="location">${places[d.hall]} · ${d.window}</div><div class="metrics"><span>多走 <b>${d.extra} 分钟</b></span><span>排队约 <b>${d.q} 分钟</b></span><span><b>${clock(d.arrival)}</b> 到达</span></div></div><div class="card-bottom"><div class="reason">${warnings.some(w=>w.id===d.id)?'⚑ 有窗口提醒，请查看下方避雷区<br>':''}${d.tags} · ${clock(d.closing)} 收餐<br>${d.closing-d.arrival<45?'⚠ 临近收餐，菜品可能不全':'✦ 符合今天的胃口，也照顾接下来的行程'}</div><button class="route-button" data-route="${d.id}">看路线 →</button></div></article>`).join(''):'<div class="empty">🥣<h3>这个时间，还没找到合适的一顿</h3>试试提高预算、切换口味、调整时间，或在下方恢复被避开的窗口。<br>演示食堂提供午餐和晚餐，其他时段可能未营业。</div>';}
function renderRoute(){const d=current.find(x=>x.id===selected);$('#route').innerHTML=d?`<div class="route-summary">全程约 ${d.total} 分钟 · 含用餐 20 分钟、每站取件 5 分钟及模拟排队 · 比不吃饭的最短办事路线多走 ${d.extra} 分钟</div><div class="timeline">${d.events.map(e=>`<div class="stop ${e.meal?'meal':''}"><span class="dot"></span><b>${places[e.id]}</b><span>${clock(e.time)}</span><small>${e.meal?'先享用这一顿 · '+d.name:e.id==='east'||e.id==='west'?'取件约 5 分钟':'到达'}</small></div>`).join('')}</div>`:'<p class="route-summary">有了合适的菜品，这里就会出现你的行程。</p>';}
$('#cards').onclick=e=>{const save=e.target.closest('[data-save]'),route=e.target.closest('[data-route]'),detail=e.target.closest('[data-detail]');if(save){const id=save.dataset.save;memory.saved=memory.saved.includes(id)?memory.saved.filter(x=>x!==id):[...memory.saved,id];persist();renderCards();renderMenu();}if(route){selected=route.dataset.route;renderCards();renderRoute();$('.route-panel').scrollIntoView({behavior:'smooth',block:'nearest'});}if(detail)openDetail(detail.dataset.detail);};
function openDetail(id){detailId=id;const d=dishes.find(x=>x.id===id);const reviews=Array.isArray(memory.reviews[id])?memory.reviews[id]:[];$('#detail-body').innerHTML=`<div style="font-size:58px">${d.emoji}</div><div class="section-kicker">DISH NOTES / 口味比星级更重要</div><h2>${d.name} · ¥${d.price}</h2><p>${places[d.hall]} ${d.window}<br>${d.tags}<br>营业：${halls[d.hall].hours.map(([a,b])=>clock(a)+'–'+clock(b)).join(' / ')}</p>${warnings.filter(w=>w.id===id).map(w=>`<div class="review risk-review"><b>⚑ ${w.tag} · 演示反馈</b><br>${w.text}<small>${w.time} · ${w.tip}</small></div>`).join('')}<button type="button" class="avoid-button" data-block="${d.id}">${memory.blocked.includes(windowKey(d))?'恢复推荐这个窗口':'避开这个窗口'}</button><h3>同学怎么说</h3><div class="review">${d.mood==='light'?'味道比较清爽，适合今天不想吃太油的时候。口味偏淡，重口味同学可能觉得不够味。':'很适合想解馋的一天，酱汁味道比较浓。想吃清淡的话建议换一道。'}<small>示例同学 · 演示点评 · 2026-11-05 18:20</small></div>${reviews.map(r=>`<div class="review">${esc(r.text)}<small>我的本地点评 · ${esc(r.time)}</small></div>`).join('')}`;if(!$('#detail').open)$('#detail').showModal();}
$('.close').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}};
$('#review-form').onsubmit=e=>{e.preventDefault();const text=$('#review-text').value.trim();if(!text){toast('先写一点口味感受吧');return;}if(!Array.isArray(memory.reviews[detailId]))memory.reviews[detailId]=[];memory.reviews[detailId].unshift({text,time:new Date().toLocaleString('zh-CN')});const saved=persist();$('#review-text').value='';openDetail(detailId);if(saved)toast('点评已保存在当前浏览器');};

function toggleBlock(id){const d=dishes.find(x=>x.id===id);if(!d)return;const key=windowKey(d);memory.blocked=memory.blocked.includes(key)?memory.blocked.filter(x=>x!==key):[...memory.blocked,key];const saved=persist();run();if(saved)toast(memory.blocked.includes(key)?'已避开该窗口，推荐已更新':'已恢复该窗口的推荐');}
function renderWarnings(){
 $('#avoid-count').textContent=`已避开 ${memory.blocked.length} 个窗口`;
 $('#warnings').innerHTML=warnings.map(w=>{const d=dishes.find(x=>x.id===w.id);const blocked=memory.blocked.includes(windowKey(d));return `<article class="warning-card"><div class="warning-top"><span class="risk-tag">${w.tag}</span><small>演示反馈 · 非实时</small></div><h3>${w.title}</h3><p class="warning-location">${places[d.hall]} · ${d.window} · ${d.name}</p><blockquote>“${w.text}”<small>示例同学 · ${w.time}</small></blockquote><p class="warning-tip">${w.tip}</p><div class="warning-actions"><button data-warning-detail="${d.id}">看菜品点评 ↗</button><button class="avoid-button ${blocked?'blocked':''}" data-block="${d.id}" aria-pressed="${blocked}">${blocked?'已避开 · 点击恢复':'避开这个窗口'}</button></div></article>`;}).join('');
 const extra=memory.blocked.map(key=>dishes.find(d=>windowKey(d)===key)).filter(d=>d&&!warnings.some(w=>w.id===d.id));
 $('#blocked-others').innerHTML=extra.map(d=>`<button class="avoid-button blocked" data-block="${d.id}">${places[d.hall]} ${d.window} · 点击恢复</button>`).join('');
}
$('#avoid-panel').onclick=e=>{const b=e.target.closest('[data-block]'),d=e.target.closest('[data-warning-detail]');if(b)toggleBlock(b.dataset.block);if(d)openDetail(d.dataset.warningDetail);};
$('#detail-body').onclick=e=>{const b=e.target.closest('[data-block]');if(b){toggleBlock(b.dataset.block);openDetail(detailId);}};


function renderMenu(){
 const term=$('#menu-search').value.trim().toLowerCase(),hall=$('#menu-hall').value,filter=$('#menu-mood').value,onlySaved=$('#menu-saved').checked;
 const list=dishes.filter(d=>(hall==='all'||d.hall===hall)&&(filter==='all'||d.mood===filter)&&(!onlySaved||memory.saved.includes(d.id))&&[d.name,d.tags,d.window,places[d.hall]].join(' ').toLowerCase().includes(term));
 $('#menu-count').textContent=`${list.length} / ${dishes.length} 道菜`;
 $('#menu-grid').innerHTML=list.length?list.map(d=>{const saved=memory.saved.includes(d.id),blocked=memory.blocked.includes(windowKey(d));return `<article class="menu-card"><div class="menu-art" style="background:${d.mood==='light'?'#edf1dc':'#f5e8d8'}"><span>${d.emoji}</span><small>菜品示意</small><button class="save ${saved?'saved':''}" data-menu-save="${d.id}" aria-label="${saved?'取消收藏':'收藏'}${d.name}" aria-pressed="${saved}">${saved?'★':'☆'}</button></div><div class="menu-content"><div class="menu-name"><button class="dish-title" data-menu-detail="${d.id}">${d.name}</button><strong>¥${d.price}</strong></div><p class="location">${places[d.hall]} · ${d.window}</p><p class="menu-taste">${d.tags}</p><p class="menu-hours">营业 ${halls[d.hall].hours.map(([a,b])=>clock(a)+'–'+clock(b)).join(' / ')}</p><div class="menu-state">${blocked?'<span class="risk-tag">已避开 · 不参与推荐</span>':warnings.some(w=>w.id===d.id)?'<span class="risk-tag">⚑ 有窗口提醒，点开了解</span>':'<span class="tag">'+(d.mood==='light'?'清淡舒服':'解馋过瘾')+'</span>'}</div><button class="menu-detail" data-menu-detail="${d.id}">查看点评与窗口详情 ↗</button></div></article>`;}).join(''):'<div class="empty menu-empty">没有找到符合条件的菜品。<br>试试其他关键词、食堂或口味；收藏后可在这里集中查看。</div>';
}
$('#menu-grid').onclick=e=>{const detail=e.target.closest('[data-menu-detail]'),save=e.target.closest('[data-menu-save]');if(detail)openDetail(detail.dataset.menuDetail);if(save){const id=save.dataset.menuSave;memory.saved=memory.saved.includes(id)?memory.saved.filter(x=>x!==id):[...memory.saved,id];persist();renderMenu();renderCards();}};
$('#menu-search').oninput=renderMenu;['#menu-hall','#menu-mood','#menu-saved'].forEach(s=>$(s).onchange=renderMenu);

$('#plan').onsubmit=e=>{e.preventDefault();run();};['#budget','#time','#start','#end','#parcelA','#parcelB','#first'].forEach(s=>$(s).onchange=run);run();
}
