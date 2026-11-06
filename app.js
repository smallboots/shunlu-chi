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
const walk=(a,b)=>minutes[ids.indexOf(a)][ids.indexOf(b)];
const clock=t=>`${String(Math.floor(t/60)%24).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
const perms=a=>a.length?a.flatMap((v,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[v,...p])):[[]];
const distance=path=>path.slice(1).reduce((s,n,i)=>s+walk(path[i],n),0);
const queueAt=(hall,t)=>halls[hall].queue+(Math.abs(t-720)<=35||Math.abs(t-1080)<=35?9:0);
function recommend(o){
 const stops=o.stops.filter(x=>x!==o.start&&x!==o.end);const baseline=Math.min(...perms(stops).map(p=>distance([o.start,...p,o.end])));
 return dishes.filter(d=>d.price<=o.budget&&(o.mood==='all'||o.mood===d.mood)).map(d=>{
  const orders=o.first?perms(stops).map(p=>[d.hall,...p]):perms([d.hall,...stops]);
  const routes=orders.map(order=>{let t=o.time,prev=o.start,arrival=0,q=0,closing=0;const events=[{id:o.start,time:t}];
   for(const id of [...order,o.end]){t+=walk(prev,id);if(id===d.hall){arrival=t;const interval=halls[id].hours.find(([a,b])=>t>=a&&t<b);if(!interval)return null;closing=interval[1];q=queueAt(id,t);if(t+q>=closing)return null;events.push({id,time:t,meal:true});t+=q+20;}else{events.push({id,time:t});if(id!==o.end)t+=5;}prev=id;}
   const extra=distance([o.start,...order,o.end])-baseline;return{events,arrival,q,closing,extra,total:t-o.time,score:extra+q};
  }).filter(Boolean).sort((a,b)=>a.score-b.score||a.total-b.total);
  return routes.length?{...d,...routes[0]}:null;
 }).filter(Boolean).sort((a,b)=>a.score-b.score||a.price-b.price);
}
if(typeof module!=='undefined')module.exports={recommend,walk,queueAt,dishes};
if(typeof document!=='undefined'){
const $=s=>document.querySelector(s);let mood='light',current=[],selected=null,detailId=null;let memory={};
try{memory=JSON.parse(localStorage.getItem('shunlu-data')||'{}')||{};}catch{}if(!Array.isArray(memory.saved))memory.saved=[];if(!memory.reviews||typeof memory.reviews!=='object')memory.reviews={};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let toastTimer;function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2300);}
function persist(){try{localStorage.setItem('shunlu-data',JSON.stringify(memory));return true;}catch{toast('浏览器无法保存数据，本次操作仅在当前页面有效');return false;}}
for(const selector of ['#start','#end'])$(selector).innerHTML=Object.entries(places).filter(([id])=>!id.startsWith('c')||id==='classroom').map(([id,n])=>`<option value="${id}">${n}</option>`).join('');$('#start').value='office';$('#end').value='dorm';
document.querySelectorAll('[data-mood]').forEach(b=>b.onclick=()=>{mood=b.dataset.mood;document.querySelectorAll('[data-mood]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});run();});
function opts(){const [h,m]=$('#time').value.split(':').map(Number);return{mood,budget:+$('#budget').value,time:h*60+m,start:$('#start').value,end:$('#end').value,first:$('#first').checked,stops:[$('#parcelA').checked?'east':null,$('#parcelB').checked?'west':null].filter(Boolean)};}
function run(){const o=opts();if(!Number.isFinite(o.time))return;const all=recommend(o);const chosen=[];for(const [label,sort] of [['综合推荐',(a,b)=>a.score-b.score],['少走路',(a,b)=>a.extra-b.extra||a.q-b.q],['少排队',(a,b)=>a.q-b.q||a.extra-b.extra]]){const d=all.filter(d=>!chosen.some(c=>c.id===d.id)).sort(sort)[0];if(d)chosen.push({...d,label});}current=chosen;selected=current[0]?.id;$('#count').textContent=`${all.length} 道符合偏好`;$('#notice').textContent=(Math.abs(o.time-720)<=45||Math.abs(o.time-1080)<=45?'◷ 临近用餐高峰，先吃饭是个好主意。':'◷ 早点安排，把时间留给好好吃饭。')+' 排队为模拟估计，已排除预计无法在收餐前点餐的窗口。';renderCards();renderRoute();}
function renderCards(){$('#cards').innerHTML=current.length?current.map(d=>`<article class="card ${selected===d.id?'selected':''}"><div class="dish-art" style="--dish-bg:${d.mood==='light'?'#edf1dc':'#f5e8d8'}">${d.emoji}<small>菜品示意</small></div><div><div class="card-top"><span class="tag">${d.label}</span><button class="save ${memory.saved.includes(d.id)?'saved':''}" data-save="${d.id}" aria-label="${memory.saved.includes(d.id)?'取消收藏':'收藏'}${d.name}" aria-pressed="${memory.saved.includes(d.id)}">${memory.saved.includes(d.id)?'★':'☆'}</button></div><span class="price">¥${d.price}</span><button class="dish-title" data-detail="${d.id}">${d.name} ↗</button><div class="location">${places[d.hall]} · ${d.window}</div><div class="metrics"><span>多走 <b>${d.extra} 分钟</b></span><span>排队约 <b>${d.q} 分钟</b></span><span><b>${clock(d.arrival)}</b> 到达</span></div></div><div class="card-bottom"><div class="reason">${d.tags} · ${clock(d.closing)} 收餐<br>${d.closing-d.arrival<45?'⚠ 临近收餐，菜品可能不全':'✦ 符合今天的胃口，也照顾接下来的行程'}</div><button class="route-button" data-route="${d.id}">看路线 →</button></div></article>`).join(''):'<div class="empty">🥣<h3>这个时间，还没找到合适的一顿</h3>试试提高预算、切换口味或调整出发时间。<br>演示食堂提供午餐和晚餐，其他时段可能未营业。</div>';}
function renderRoute(){const d=current.find(x=>x.id===selected);$('#route').innerHTML=d?`<div class="route-summary">全程约 ${d.total} 分钟 · 含用餐 20 分钟、每站取件 5 分钟及模拟排队 · 比不吃饭的最短办事路线多走 ${d.extra} 分钟</div><div class="timeline">${d.events.map(e=>`<div class="stop ${e.meal?'meal':''}"><span class="dot"></span><b>${places[e.id]}</b><span>${clock(e.time)}</span><small>${e.meal?'先享用这一顿 · '+d.name:e.id==='east'||e.id==='west'?'取件约 5 分钟':'到达'}</small></div>`).join('')}</div>`:'<p class="route-summary">有了合适的菜品，这里就会出现你的行程。</p>';}
$('#cards').onclick=e=>{const save=e.target.closest('[data-save]'),route=e.target.closest('[data-route]'),detail=e.target.closest('[data-detail]');if(save){const id=save.dataset.save;memory.saved=memory.saved.includes(id)?memory.saved.filter(x=>x!==id):[...memory.saved,id];persist();renderCards();}if(route){selected=route.dataset.route;renderCards();renderRoute();$('.route-panel').scrollIntoView({behavior:'smooth',block:'nearest'});}if(detail)openDetail(detail.dataset.detail);};
function openDetail(id){detailId=id;const d=dishes.find(x=>x.id===id);const reviews=Array.isArray(memory.reviews[id])?memory.reviews[id]:[];$('#detail-body').innerHTML=`<div style="font-size:58px">${d.emoji}</div><div class="section-kicker">DISH NOTES / 口味比星级更重要</div><h2>${d.name} · ¥${d.price}</h2><p>${places[d.hall]} ${d.window}<br>${d.tags}<br>营业：${halls[d.hall].hours.map(([a,b])=>clock(a)+'–'+clock(b)).join(' / ')}</p><h3>同学怎么说</h3><div class="review">${d.mood==='light'?'味道比较清爽，适合今天不想吃太油的时候。口味偏淡，重口味同学可能觉得不够味。':'很适合想解馋的一天，酱汁味道比较浓。想吃清淡的话建议换一道。'}<small>示例同学 · 演示点评 · 2026-11-05 18:20</small></div>${reviews.map(r=>`<div class="review">${esc(r.text)}<small>我的本地点评 · ${esc(r.time)}</small></div>`).join('')}`;if(!$('#detail').open)$('#detail').showModal();}
$('.close').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail')){const r=$('#detail').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#detail').close();}};
$('#review-form').onsubmit=e=>{e.preventDefault();const text=$('#review-text').value.trim();if(!text){toast('先写一点口味感受吧');return;}if(!Array.isArray(memory.reviews[detailId]))memory.reviews[detailId]=[];memory.reviews[detailId].unshift({text,time:new Date().toLocaleString('zh-CN')});const saved=persist();$('#review-text').value='';openDetail(detailId);if(saved)toast('点评已保存在当前浏览器');};
$('#plan').onsubmit=e=>{e.preventDefault();run();};['#budget','#time','#start','#end','#parcelA','#parcelB','#first'].forEach(s=>$(s).onchange=run);run();
}
