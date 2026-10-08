const scenarios=[{id:'apagao',icon:'⚡',name:'Apagão',desc:'A rede caiu em três bairros. Hospitais precisam de energia.'},{id:'golpe',icon:'🛡️',name:'Golpe digital',desc:'Uma campanha de phishing atingiu serviços públicos.'},{id:'enchente',icon:'🌊',name:'Enchente',desc:'Água bloqueia uma rota e moradores pedem evacuação.'},{id:'fornecedor',icon:'📦',name:'Fornecedor',desc:'Um item crítico desapareceu antes da entrega.'},{id:'conflito',icon:'🤝',name:'Conflito',desc:'Equipes essenciais pararam de cooperar.'},{id:'financeira',icon:'📉',name:'Crise financeira',desc:'O orçamento emergencial foi reduzido.'}];

const regions=[{id:'norte',name:'NORTE · SAÚDE',x:1,y:1,w:3,h:2},{id:'centro',name:'CENTRO · GOVERNO',x:4,y:2,w:3,h:3},{id:'leste',name:'LESTE · LOGÍSTICA',x:7,y:1,w:2,h:3},{id:'sul',name:'SUL · MORADIAS',x:6,y:5,w:3,h:2},{id:'oeste',name:'OESTE · ENERGIA',x:1,y:5,w:3,h:2}];

const eventDefs=[
{id:'energia',icon:'⚡',region:'oeste',title:'Subestação Norte',text:'Um hospital relata geradores no limite. A falha de energia ameaça o setor de saúde.',chain:'hospital',choices:[['Enviar combustível ao hospital',{energia:-2,recursos:-8,reputação:10,tempo:-4},'Você protegeu a saúde — o hospital ficará mais estável no próximo ciclo.'],['Redistribuir energia entre bairros',{energia:8,reputação:4,tempo:-5},'A rede foi equilibrada, mas o hospital ficou dependente de outra solução.'],['Esperar a concessionária',{energia:-12,reputação:-8,tempo:-2},'A espera aumentou o risco e abriu espaço para um novo incidente.']]},
{id:'digital',icon:'🛡️',region:'centro',title:'Alerta de fraude',text:'Funcionários receberam um link falso de emergência. A tentativa pode atingir serviços públicos.',chain:'security',choices:[['Bloquear link e ativar 2FA',{segurança:12,tempo:-4,recursos:-2},'A rede foi protegida. Agora a investigação pode revelar quem iniciou o ataque.'],['Investigar sem interromper acesso',{segurança:5,reputação:3,tempo:-7},'Você preservou o serviço, mas deixou uma janela de exposição.'],['Ignorar até confirmar',{segurança:-12,reputação:-7,tempo:-2},'A ameaça se espalhou antes da confirmação.']]},
{id:'water',icon:'🌊',region:'sul',title:'Pedido de evacuação',text:'A água subiu e uma família ficou isolada. A mesma rota serve outras casas.',chain:'rescue',choices:[['Enviar equipe de resgate',{recursos:-6,reputação:12,tempo:-6},'A família foi retirada e a região passou a confiar na operação.'],['Mandar moradores aguardarem',{reputação:-2,recursos:2,tempo:-3},'Você ganhou recursos, mas a tensão aumentou.'],['Priorizar o depósito',{recursos:8,reputação:-12,tempo:-2},'O estoque foi protegido enquanto moradores ficaram expostos.']]},
{id:'logistics',icon:'📦',region:'leste',title:'Caminhão atrasado',text:'O estoque crítico dura apenas duas horas. Uma decisão agora altera o abastecimento do centro.',chain:'supply',choices:[['Acionar fornecedor reserva',{recursos:12,tempo:-5,reputação:5},'O fornecedor reserva entrou em rota. O próximo risco será o custo da operação.'],['Esperar 30 minutos',{recursos:-6,tempo:-8,reputação:-2},'A espera consumiu a margem de segurança.'],['Comprar qualquer alternativa',{recursos:4,segurança:-7,tempo:-4},'Você recuperou estoque, mas a qualidade do material ficou sob suspeita.']]},
{id:'people',icon:'🤝',region:'centro',title:'Equipe em impasse',text:'Duas equipes recusam a mesma tarefa. Sem mediação, o bloqueio começa a afetar outros setores.',chain:'people',choices:[['Fazer mediação rápida',{reputação:10,tempo:-4,segurança:3},'As equipes voltaram a cooperar.'],['Escolher um lado',{reputação:-4,tempo:-2,segurança:-3},'Uma equipe venceu, mas a confiança interna caiu.'],['Adiar a decisão',{reputação:-10,tempo:-5,recursos:-4},'O impasse contaminou outras operações.']]},
{id:'finance',icon:'📉',region:'centro',title:'Corte inesperado',text:'O caixa sofreu um novo corte de 10%. Você precisa proteger a capacidade de resposta.',chain:'finance',choices:[['Proteger serviços essenciais',{recursos:-4,reputação:10,tempo:-3},'O essencial foi preservado. O setor financeiro agora exige eficiência.'],['Cortar tudo igualmente',{recursos:4,reputação:-3,tempo:-4},'O corte foi distribuído, mas nenhuma área ficou confortável.'],['Congelar operações',{recursos:10,reputação:-12,tempo:-7},'O caixa respirou, porém a cidade perdeu capacidade de reação.']]},
{id:'hospital',icon:'🏥',region:'norte',title:'Consequência: hospital em alerta',text:'A energia foi estabilizada, mas o hospital pede prioridade para um equipamento crítico. A cidade agora cobra uma decisão rápida.',chain:null,choices:[['Priorizar equipamento médico',{energia:-5,recursos:-8,reputação:12,tempo:-5},'O hospital mantém o atendimento e a região norte se recupera.'],['Compartilhar equipamento',{recursos:-3,reputação:5,tempo:-6},'A solução é menos eficiente, mas reduz a desigualdade entre bairros.'],['Adiar manutenção',{energia:-8,reputação:-10,tempo:-2},'A pressão retorna para a rede hospitalar.']]},
{id:'security',icon:'🔐',region:'centro',title:'Consequência: rastrear a fraude',text:'Os registros apontam uma segunda tentativa de acesso. Você pode fechar a brecha ou correr o risco de perder dados.',chain:null,choices:[['Isolar a conta comprometida',{segurança:10,tempo:-5,reputação:6},'A brecha foi isolada antes de alcançar outro setor.'],['Monitorar silenciosamente',{segurança:4,tempo:-7},'Você ganhou informação, mas manteve o risco aberto.'],['Reabrir o acesso',{segurança:-14,reputação:-8,tempo:-2},'A segunda tentativa teve sucesso parcial.']]},
{id:'rescue',icon:'🚑',region:'sul',title:'Consequência: nova família isolada',text:'O resgate revelou que outra rua está sem comunicação. O primeiro atendimento mudou o fluxo de pessoas.',chain:null,choices:[['Abrir corredor seguro',{recursos:-6,reputação:10,tempo:-6},'O corredor reduziu o risco e acelerou a evacuação.'],['Usar voluntários',{reputação:7,recursos:-2,tempo:-4},'A comunidade assumiu parte da resposta.'],['Fechar a área',{segurança:3,reputação:-8,tempo:-2},'A área ficou protegida, mas a evacuação ficou mais lenta.']]},
{id:'supply',icon:'🚚',region:'leste',title:'Consequência: fornecedor reserva',text:'O caminhão reserva pede uma rota alternativa. Se o trajeto for bloqueado, o centro ficará sem insumos.',chain:null,choices:[['Escoltar pela rota segura',{recursos:8,segurança:4,tempo:-6},'O abastecimento chegou com segurança.'],['Mudar para rota curta',{recursos:5,segurança:-5,tempo:-3},'O material chegou mais cedo, mas com risco maior.'],['Cancelar entrega',{recursos:-10,reputação:-7,tempo:-2},'O centro perdeu a reposição prevista.']]},
{id:'people2',icon:'🧭',region:'oeste',title:'Consequência: equipes reorganizadas',text:'A mediação revelou um grupo disponível no setor de energia. Você pode deslocá-lo para aliviar outro gargalo.',chain:null,choices:[['Reforçar energia',{energia:10,tempo:-5,reputação:4},'A rede ganhou uma equipe extra.'],['Enviar ao sul',{reputação:8,recursos:-3,tempo:-6},'A região sul recebe apoio humano.'],['Manter onde está',{tempo:-2},'A estrutura fica estável, mas sem ganho de capacidade.']]},
{id:'finance2',icon:'💰',region:'centro',title:'Consequência: auditoria emergencial',text:'O corte financeiro deixou contratos vulneráveis. Uma auditoria rápida pode evitar desperdícios.',chain:null,choices:[['Auditar contratos críticos',{recursos:9,tempo:-6,reputação:6},'Você recuperou recursos sem cortar o atendimento.'],['Negociar prazos',{recursos:4,reputação:3,tempo:-5},'O caixa ganhou fôlego e a pressão diminuiu.'],['Suspender contratos',{recursos:12,reputação:-8,tempo:-4},'O caixa melhora, mas serviços começam a sentir a suspensão.']]}
];

const npcSeed=[
{id:'lia',name:'Lia · Resgate',icon:'🧑‍🚒',x:2,y:6,goal:'sul',mood:76},
{id:'caio',name:'Caio · Energia',icon:'🧑‍🔧',x:2,y:7,goal:'oeste',mood:68},
{id:'bia',name:'Bia · Saúde',icon:'👩‍⚕️',x:2,y:2,goal:'norte',mood:82},
{id:'rafa',name:'Rafa · Logística',icon:'🧑‍💼',x:8,y:2,goal:'leste',mood:71}
];

let S={screen:'start',scenario:null,turn:0,xp:0,coins:0,score:0,res:{energia:70,segurança:70,recursos:70,reputação:70,tempo:70},log:[],event:null,pending:null,npcs:[],player:{x:5,y:4},selected:null};

const app=document.querySelector('#app'),badge=document.querySelector('#scoreBadge');
const labels={energia:'Energia',segurança:'Segurança',recursos:'Recursos',reputação:'Reputação',tempo:'Tempo'};

function clamp(v){return Math.max(0,Math.min(100,v))}
function stats(){return '<div class="stats">'+Object.entries(S.res).map(([k,v])=>'<div class="meter"><span class="small">'+labels[k]+'</span><b>'+Math.round(v)+'</b><div class="bar"><div class="fill" style="width:'+v+'%"></div></div></div>').join('')+'</div>'}
function regionAt(x,y){return regions.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h)}
function tileType(x,y){if((x===4||x===5||x===6)&&y>=0&&y<8)return'road';if((x===0||x===9)&&y%2===0)return'water';if(y===3&&(x<4||x>6))return'park';return''}
function regionLabels(){return regions.map(r=>'<span class="regionLabel" style="left:'+((r.x/10)*100+1)+'%;top:'+((r.y/8)*100+5)+'%">'+r.name+'</span>').join('')}
function npcPosition(n){return 'left:'+((n.x+.5)/10*100)+'%;top:'+((n.y+.5)/8*100)+'%'}
function map(){
  let t='';
  for(let y=0;y<8;y++)for(let x=0;x<10;x++){
    const type=tileType(x,y),sel=S.selected&&S.selected.x===x&&S.selected.y===y;
    t+='<button class="tile '+type+(sel?' selected':'')+'" onclick="selectTile('+x+','+y+')" title="Setor '+(regionAt(x,y)?.name||'urbano')+'">'+(x===S.player.x&&y===S.player.y?'<span class="pin">VOCÊ</span>':'')+'</button>';
  }
  const npcs=S.npcs.map(n=>'<div class="npc '+(n.mood<45?'distressed':'')+'" style="'+npcPosition(n)+'" title="'+n.name+' · humor '+n.mood+'">'+n.icon+'</div>').join('');
  return '<div class="mapWrap"><div class="map">'+t+'<span class="zoneLabel">MAPA 10×8 · TURNO '+S.turn+'</span>'+regionLabels()+'<div class="unit" style="'+npcPosition(S.player)+'">●</div>'+npcs+'<button class="incident" style="'+npcPosition({x:S.event?eventRegionX():5,y:S.event?eventRegionY():4})+'" onclick="openEvent()">!</button></div><div class="legend"><span><i class="dot"></i> sua equipe</span><span>🔵 NPC ativo</span><span>🔴 incidente</span><span>clique em um setor para mover</span></div></div>'
}
function eventRegionX(){const r=regions.find(x=>x.id===S.event.region);return r?Math.min(9,r.x+1):5}
function eventRegionY(){const r=regions.find(x=>x.id===S.event.region);return r?Math.min(7,r.y+1):4}

function render(){badge.textContent='XP '+S.xp+' · Moedas '+S.coins;if(S.screen==='start')startScreen();else if(S.screen==='end')endScreen();else playScreen()}
function startScreen(){
  app.innerHTML='<div class="panel start"><span class="tag">SIMULAÇÃO EMERGENTE V3</span><h2>Entre na cidade e assuma o comando</h2><p>Agora a arena tem memória: NPCs mudam de posição e humor, eventos geram consequências futuras e regiões dependem umas das outras.</p><div class="scenarioGrid">'+scenarios.map(s=>'<button class="scenario" onclick="chooseScenario(\''+s.id+'\')"><b>'+s.icon+' '+s.name+'</b><div class="small">'+s.desc+'</div></button>').join('')+'</div><button class="btn primary" onclick="start()">▶ Iniciar mundo vivo</button></div>'
}
function chooseScenario(id){S.scenario=scenarios.find(x=>x.id===id);start()}
function start(){
  S.screen='play';if(!S.scenario)S.scenario=scenarios[Math.floor(Math.random()*scenarios.length)];
  S.turn=1;S.score=0;S.log=[];S.pending=null;S.selected=null;S.player={x:5,y:4};
  S.res={energia:70,segurança:70,recursos:70,reputação:70,tempo:70};
  S.npcs=npcSeed.map(n=>({...n}));S.event=pickEvent();log('🌍 Mundo iniciado: '+S.scenario.name+'.');
  render()
}
function pickEvent(){
  if(S.pending&&S.pending.turn<=S.turn){const e=eventDefs.find(x=>x.id===S.pending.id);S.pending=null;return e}
  const available=eventDefs.filter(e=>!['hospital','security','rescue','supply','people2','finance2'].includes(e.id));
  return available[(S.turn-1)%available.length]
}
function log(msg){S.log.push(msg)}
function applyImpact(impact){
  Object.entries(impact).forEach(([k,v])=>{if(S.res[k]!==undefined)S.res[k]=clamp(S.res[k]+v)})
}
function moveNPCs(){
  S.npcs.forEach(n=>{
    const goal=regions.find(r=>r.id===n.goal);if(!goal)return;
    const tx=goal.x+Math.floor(goal.w/2),ty=goal.y+Math.floor(goal.h/2);
    if(Math.abs(tx-n.x)>Math.abs(ty-n.y))n.x+=Math.sign(tx-n.x);else if(ty!==n.y)n.y+=Math.sign(ty-n.y);
    if(Math.random()<0.3)n.mood=clamp(n.mood+(S.res.reputação>55?2:-3));
    if(n.mood<40)log('⚠️ '+n.name+' está sob pressão em '+(regionAt(n.x,n.y)?.name||'setor urbano')+'.');
  })
}
function maybeChain(e,i){
  if(!e.chain)return;
  const choice=e.choices[i][0];
  const map={hospital:'hospital',security:'security',rescue:'rescue',supply:'supply',people:'people2',finance:'finance2'};
  if(i===0&&map[e.chain]){S.pending={id:map[e.chain],turn:S.turn+2};log('🔗 Consequência agendada: '+eventDefs.find(x=>x.id===map[e.chain]).title+' no turno '+(S.turn+2)+'.')}
  if(i===2)log('🌪️ Sua decisão piorou a pressão em '+e.region+'. Um novo risco pode surgir antes do esperado.');
}
function decide(i){
  const e=S.event;if(!e)return;
  const c=e.choices[i],impact=c[1];applyImpact(impact);
  S.score+=i===0?180:i===1?90:10;S.res.tempo=clamp(S.res.tempo-2);
  log(e.icon+' '+e.title+': '+c[0]+' — '+c[2]);maybeChain(e,i);
  S.turn++;moveNPCs();
  if(S.res.reputação<18||S.res.tempo<8||S.res.recursos<8)return finish('A cidade entrou em colapso operacional.');
  if(S.turn>=10)return finish('Você atravessou o ciclo crítico e estabilizou a cidade.');
  S.event=pickEvent();render()
}
function selectTile(x,y){
  S.selected={x,y};
  if(Math.abs(x-S.player.x)+Math.abs(y-S.player.y)<=2){moveTo(x,y)}
  else{log('🗺️ Setor selecionado: '+(regionAt(x,y)?.name||'zona urbana')+'. Mova-se por etapas para chegar até lá.');render()}
}
function moveTo(x,y){
  const dx=Math.sign(x-S.player.x),dy=Math.sign(y-S.player.y);
  S.player.x+=dx;S.player.y+=dy;S.res.tempo=clamp(S.res.tempo-2);
  const r=regionAt(S.player.x,S.player.y);log('🚙 Equipe avançou para '+(r?.name||'zona urbana')+'. Tempo -2.');
  moveNPCs();S.turn++;
  if(S.turn>=10)finish('A operação terminou com a cidade estabilizada.');else{S.event=pickEvent();render()}
}
function move(){moveTo(Math.min(9,S.player.x+1),S.player.y)}
function scan(){
  S.res.tempo=clamp(S.res.tempo-3);const r=regionAt(S.player.x,S.player.y);
  log('🔎 Varredura em '+(r?.name||'zona urbana')+' revelou rotas e movimentos de NPCs. Tempo -3.');
  if(S.npcs.some(n=>Math.abs(n.x-S.player.x)+Math.abs(n.y-S.player.y)<=2))log('👥 Um NPC está próximo e pode influenciar o próximo evento.');
  render()
}
function openEvent(){document.querySelector('.event')?.scrollIntoView({behavior:'smooth'})}
function npcPanel(){return '<h3>👥 Pessoas em movimento</h3>'+S.npcs.map(n=>'<div class="npcRow"><span>'+n.icon+' <b>'+n.name.split(' · ')[0]+'</b><br><span class="small">'+n.name.split(' · ')[1]+' · '+(regionAt(n.x,n.y)?.name||'urbano')+'</span></span><span class="small">humor '+Math.round(n.mood)+'</span></div>').join('')}
function missions(){return '<h3 style="margin-top:18px">🔗 Consequências</h3>'+(S.pending?'<div class="mission">Próximo encadeamento: <b>'+eventDefs.find(x=>x.id===S.pending.id).title+'</b><br><span class="small">previsto para o turno '+S.pending.turn+'</span></div>':'<div class="small">Nenhuma consequência agendada. Suas escolhas podem criar uma.</div>')}
function playScreen(){
  const e=S.event;
  app.innerHTML='<div class="layout"><section class="panel">'+stats()+map()+'<div class="actions"><button class="btn" onclick="move()">🚙 Avançar equipe</button><button class="btn" onclick="scan()">🔎 Escanear setor</button><button class="btn" onclick="moveNPCs();log(\'👥 A cidade reagiu aos seus movimentos.\');render()">⏱️ Aguardar reação</button></div><div class="worldGrid"><div class="worldCard">'+npcPanel()+'</div><div class="worldCard">'+missions()+'</div></div></section><aside class="panel event"><span class="tag">'+e.region+'</span><h2>'+e.icon+' '+e.title+'</h2><p>'+e.text+'</p><p class="small">Turno '+S.turn+' · A cidade continua se movendo enquanto você decide.</p>'+e.choices.map((x,i)=>'<button class="choice" onclick="decide('+i+')"><b>'+x[0]+'</b><br><span class="small">'+Object.entries(x[1]).map(([k,v])=>labels[k]+': '+(v>0?'+':'')+v).join(' · ')+'</span></button>').join('')+'<h3 style="margin-top:24px">📡 Central de eventos</h3><div class="feed">'+(S.log.length?S.log.slice(-8).reverse().map(x=>'<div>'+x+'</div>').join(''):'<div class="small">Os eventos aparecerão aqui conforme a cidade reage.</div>')+'</div></aside></div>'
}
function finish(msg){S.screen='end';const avg=Object.values(S.res).reduce((a,b)=>a+b,0)/5,win=avg>=55;S.xp+=win?240:80;S.coins+=win?80:20;log('🏁 '+msg);render()}
function endScreen(){
  const avg=Math.round(Object.values(S.res).reduce((a,b)=>a+b,0)/5);
  app.innerHTML='<div class="panel start"><span class="tag">RELATÓRIO FINAL · MUNDO VIVO</span><h2>'+(avg>=55?'Vitória operacional':'Resultado parcial')+'</h2><p>'+S.log.at(-1)+'</p>'+stats()+'<p>Você terminou com média de <b>'+avg+'</b>/100 e <b>'+S.score+'</b> pontos de decisão. NPCs foram deslocados e '+(S.pending?'havia uma consequência pendente.':'as cadeias críticas foram resolvidas.')+'</p><div class="feed">'+S.log.slice(-10).reverse().map(x=>'<div>'+x+'</div>').join('')+'</div><div class="actions" style="justify-content:center"><button class="btn primary" onclick="start()">↻ Nova operação</button><button class="btn" onclick="S.screen=\'start\';S.scenario=null;render()">← Escolher cenário</button></div></div>'
}
render();