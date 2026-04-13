// CRM Melhorias — fila do dia, etapas do funil, heating +30d, onboarding
(function(){
  'use strict';

  // ── Constantes do funil ──────────────────────────────────────────────────
  var CRM_STEPS={
    linkedin:['msg1','fu11','fu12','fu2','fu20','fu201'],
    qualif:['abertura','credencial','perguntas','convite','horario'],
    reuniao:['acordo','dor','solucao','verificar','preco'],
    proposta:['followup_proposta'],
    fechado:['fechamento'],
    heating:['heating_msg']
  };
  var CRM_STEP_LABELS={
    msg1:'Mensagem 1',fu11:'Follow-up 1.1',fu12:'Follow-up 1.2',
    fu2:'Pediu WhatsApp',fu20:'Follow-up 2.0',fu201:'Follow-up 2.0.1',
    abertura:'Abertura ligação',credencial:'Credencial',perguntas:'3 perguntas',
    convite:'Convite reunião',horario:'Oferta horário',
    acordo:'Acordo inicial',dor:'Aprofundar dor',solucao:'Apresentação',
    verificar:'Verificar reação',preco:'Preço',fechamento:'Fechamento',
    followup_proposta:'Follow-up proposta',heating_msg:'Conteúdo de aquecimento'
  };
  var CRM_STEP_SCRIPTS={
    msg1:'"Oi [nome], tudo bem? Tenho trabalhado com profissionais brasileiros que querem uma vaga remota internacional mas não estão conseguindo a colocação. Não por falta de qualificação técnica, mas por não saberem se posicionar e comunicar o valor deles na hora da entrevista. Faz parte das tuas metas de 2026 trabalhar para uma empresa que pague em dólar?"',
    fu11:'"Oii [nome], você chegou a ver a mensagem acima?"',
    fu12:'"Oi [nome], tudo bem? Passando por aqui por conta da mensagem que te enviei outro dia. Estou entendendo que talvez isso não seja importante para você agora. Tudo bem, retorno aqui mais adiante."',
    fu2:'"Ótimo [nome], me passa seu WhatsApp para que eu possa entrar em contato com você e te apresentar como você pode conseguir uma vaga remota que pague em dólar."',
    fu20:'"[nome]?"',
    fu201:'"Oi [nome], tudo bem? Passando por aqui por conta da mensagem que te enviei outro dia. Tudo bem, retorno aqui mais adiante."',
    abertura:'"Oi [nome], aqui é a Raquel Baumgratz. A gente estava conversando no LinkedIn, você pode falar agora?" → Se não puder: "Que horário fica melhor hoje ou amanhã?" Não deixe a conversa morrer sem reagendar.',
    convite:'"Entendi. Quero marcar contigo uma reunião de no máximo uma hora. É uma reunião de decisão — no final você vai precisar me dar um sim ou um não. As decisões importantes da tua vida você toma sozinha ou compartilha com alguém?"',
    horario:'"Você consegue fazer hoje às 21h ou amanhã às 9h da manhã?"',
    acordo:'"Antes de começar, quero fazer um acordo com você. No final eu vou precisar de um sim ou um não. Estamos combinadas?"',
    preco:'"O investimento para essa mentoria é de R$15.000 — ou em 12 vezes de R$1.300 no cartão." → Pare. Não preencha o silêncio.',
    heating_msg:'Enviar conteúdo relevante — dica de entrevista, post, case de sucesso. Sem pressão de venda.',
    fechamento:'"Parabéns pela decisão. Esse é um passo importante e eu tenho certeza que vamos chegar lá juntas."'
  };
  var CRM_STEP_NEXT={
    msg1:'fu11',fu11:'fu12',fu2:'abertura',fu20:'fu201',
    abertura:'perguntas',perguntas:'convite',convite:'horario',
    acordo:'dor',dor:'solucao',solucao:'verificar',verificar:'preco',preco:'fechamento'
  };
  var CRM_ACOES_FASE={
    linkedin:[
      {id:'msg1',label:'Mensagem 1 enviada',sug:true},
      {id:'fu11',label:'Follow-up 1.1 enviado',sug:false},
      {id:'fu12',label:'Follow-up 1.2 enviado',sug:false},
      {id:'fu2',label:'Pediu WhatsApp',sug:false},
      {id:'respondeu',label:'Respondeu com interesse',sug:false}
    ],
    qualif:[
      {id:'abertura',label:'Ligação feita',sug:true},
      {id:'perguntas',label:'3 perguntas feitas',sug:false},
      {id:'convite',label:'Convite para reunião',sug:false},
      {id:'horario',label:'Horário proposto',sug:false},
      {id:'nao_atendeu',label:'Não atendeu — msg enviada',sug:false}
    ],
    reuniao:[
      {id:'acordo',label:'Acordo sim/não feito',sug:true},
      {id:'dor',label:'Dor aprofundada',sug:false},
      {id:'solucao',label:'Solução apresentada',sug:false},
      {id:'verificar',label:'Reação verificada',sug:false},
      {id:'preco',label:'Preço apresentado',sug:false}
    ],
    proposta:[{id:'followup_proposta',label:'Follow-up enviado',sug:true}],
    fechado:[{id:'fechamento',label:'Fechamento confirmado',sug:true}],
    heating:[{id:'heating_msg',label:'Conteúdo enviado',sug:true}]
  };

  // ── Estado da fila ───────────────────────────────────────────────────────
  var crmFilaIdx=0;
  var crmFilaFeitos=[];
  var crmView='fila';

  // ── Helpers ──────────────────────────────────────────────────────────────
  function crmMIni(n){return(n||'').split(' ').slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase();}
  function crmMToday(){return new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});}
  function crmMCol(id){
    var all=[
      {id:'linkedin',name:'Leads',pb:'#f8f2ee',pc:'#b5623e'},
      {id:'qualif',name:'Call qualif.',pb:'#fdf6ec',pc:'#c97a2a'},
      {id:'reuniao',name:'Reunião',pb:'#f2f8f4',pc:'#4a7c5a'},
      {id:'proposta',name:'Proposta',pb:'#eef4fb',pc:'#185FA5'},
      {id:'fechado',name:'Fechado',pb:'#f0ebe4',pc:'#6b5a4e'},
      {id:'heating',name:'Monthly Heating',pb:'#fdf0e8',pc:'#7a3a22'},
      {id:'arquivado',name:'Arquivado',pb:'#f5f3f0',pc:'#8a7a6e'},
      {id:'negativa',name:'Não contatar',pb:'#fcebeb',pc:'#a32d2d'}
    ];
    return all.find(function(c){return c.id===id;})||all[0];
  }

  // ── Fila do dia ──────────────────────────────────────────────────────────
  function crmGetFila(){
    if(!window.crmLeads)return[];
    var today=new Date().toISOString().slice(0,10);
    return window.crmLeads.filter(function(l){
      if(l.col==='arquivado'||l.col==='negativa')return false;
      if(crmFilaFeitos.includes(l.id))return false;
      if(l.col==='heating')return l.heating_next&&l.heating_next<=today;
      if(!l.proxData&&!l.proxAcao)return true;
      if(!l.proxData)return true;
      return l.proxData<=today;
    }).sort(function(a,b){return(a.proxData||'9999')>(b.proxData||'9999')?1:-1;});
  }

  function crmRenderFilaM(){
    var el=document.getElementById('crm-kanban');
    if(!el)return;
    var fila=crmGetFila();
    var total=fila.length+crmFilaFeitos.length;
    var feitos=crmFilaFeitos.length;

    if(fila.length===0){
      el.innerHTML='<div style="padding:2rem;text-align:center;width:100%;grid-column:1/-1">'
        +'<div style="font-size:32px;margin-bottom:8px">✓</div>'
        +'<div style="font-size:15px;font-weight:500;color:#1c1410;margin-bottom:4px">Tudo feito por hoje!</div>'
        +'<div style="font-size:12px;color:#8a7a6e">Você trabalhou '+feitos+' lead'+(feitos!==1?'s':'')+' hoje.</div>'
        +'</div>';
      return;
    }

    var idx=Math.min(crmFilaIdx,fila.length-1);
    var l=fila[idx];
    var c=crmMCol(l.col);
    var stepLabel=l.funil_step?CRM_STEP_LABELS[l.funil_step]:(l.proxAcao||'Próxima ação');
    var scriptTxt=l.funil_step?CRM_STEP_SCRIPTS[l.funil_step]:'';
    var today=new Date().toISOString().slice(0,10);
    var atrasado=l.proxData&&l.proxData<today;
    var diasAtraso=atrasado?Math.round((new Date(today)-new Date(l.proxData))/(1000*60*60*24)):0;
    var acoes=CRM_ACOES_FASE[l.col]||[];
    var sugAcao=acoes.find(function(a){return a.sug;});

    var pips='';
    for(var pi=0;pi<Math.min(total,20);pi++){
      var pc=pi<feitos?'#4a7c5a':pi===feitos?'#b5623e':'rgba(0,0,0,0.08)';
      pips+='<div style="height:4px;flex:1;border-radius:2px;background:'+pc+'"></div>';
    }

    var stepsOpts='<option value="">Definir etapa...</option>';
    (CRM_STEPS[l.col]||[]).forEach(function(s){
      stepsOpts+='<option value="'+s+'">'+CRM_STEP_LABELS[s]+'</option>';
    });

    var tipoStr='';
    if(l.tipo==='quente')tipoStr='<span style="font-size:10px;font-weight:500;padding:2px 7px;border-radius:20px;background:#FAEEDA;color:#633806;margin-left:6px">Quente</span>';
    else if(l.tipo==='frio')tipoStr='<span style="font-size:10px;font-weight:500;padding:2px 7px;border-radius:20px;background:#E6F1FB;color:#0C447C;margin-left:6px">Frio</span>';

    var html='<div style="grid-column:1/-1;max-width:700px;margin:0 auto;width:100%">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">'
        +'<div>'
          +'<div style="font-size:14px;font-weight:500;color:#1c1410">Fila do dia</div>'
          +'<div style="font-size:12px;color:#8a7a6e">'+feitos+' de '+total+' concluídos · '+fila.length+' restante'+(fila.length!==1?'s':'')+'</div>'
        +'</div>'
        +(fila.length>1?'<button onclick="crmFilaPularM()" style="padding:6px 12px;font-size:12px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.15);background:transparent;color:#8a7a6e;cursor:pointer">Pular por agora</button>':'')
      +'</div>'
      +'<div style="display:flex;gap:3px;margin-bottom:14px">'+pips+'</div>'
      +'<div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:14px;padding:1.25rem">'
        +'<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">'
          +'<div style="width:42px;height:42px;border-radius:50%;background:'+c.pb+';color:'+c.pc+';display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;flex-shrink:0">'+crmMIni(l.name)+'</div>'
          +'<div style="flex:1">'
            +'<div style="font-size:15px;font-weight:500;color:#1c1410">'+l.name+tipoStr+'</div>'
            +'<div style="font-size:12px;color:#8a7a6e;margin-top:2px">'+l.profissao+(l.empresa&&l.empresa!=='—'?' · '+l.empresa:'')+'</div>'
          +'</div>'
          +'<div style="text-align:right">'
            +'<span style="font-size:10px;font-weight:600;padding:3px 10px;border-radius:20px;background:'+c.pb+';color:'+c.pc+'">'+c.name+'</span>'
            +(l.funil_step?'<br><span style="font-size:10px;padding:2px 7px;border-radius:20px;background:rgba(0,0,0,0.05);color:#8a7a6e;margin-top:3px;display:inline-block">'+stepLabel+'</span>':'')
            +(atrasado?'<br><span style="font-size:10px;color:#c0392b;margin-top:2px;display:inline-block">⚠ '+diasAtraso+'d em atraso</span>':'')
            +(l.col==='heating'?'<br><span style="font-size:10px;padding:2px 7px;border-radius:20px;background:#fdf0e8;color:#7a3a22;margin-top:3px;display:inline-block">Monthly Heating</span>':'')
          +'</div>'
        +'</div>';

    if(scriptTxt){
      html+='<div style="border-left:3px solid #b5623e;padding:10px 12px;background:#faf2ee;margin-bottom:12px">'
        +'<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#7a3a22;margin-bottom:5px">Mensagem a enviar — '+stepLabel+'</div>'
        +'<div style="font-size:12px;color:#4a2010;line-height:1.65;font-style:italic">'+scriptTxt+'</div>'
        +'</div>';
    }

    if(!l.funil_step&&l.col!=='fechado'){
      html+='<div style="background:#fdf6ec;border-radius:8px;padding:10px 12px;margin-bottom:12px;font-size:12px;color:#8a5010">⚠ Etapa não definida. Use o seletor abaixo.</div>';
    }

    html+='<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">';
    var btnLbl=sugAcao?'Feito — '+sugAcao.label:'Marcar feito';
    html+='<button id="crm-fila-btn-m" style="padding:8px 18px;font-size:13px;font-weight:500;border-radius:8px;border:none;background:#b5623e;color:#fff;cursor:pointer">'+btnLbl+'</button>';
    html+='<button onclick="crmFilaVerDetalhesM('+l.id+')" style="padding:8px 12px;font-size:12px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.12);background:transparent;color:#1c1410;cursor:pointer">Ver detalhes</button>';
    if(!l.funil_step){
      html+='<select id="crm-fila-step-m" style="padding:6px 10px;font-size:12px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.12);background:#fff;color:#1c1410;cursor:pointer">'+stepsOpts+'</select>';
    }
    html+='</div></div></div>';

    el.innerHTML=html;

    // Bind eventos depois de inserir no DOM
    var btn=document.getElementById('crm-fila-btn-m');
    if(btn){
      var _id=l.id,_aid=sugAcao?sugAcao.id:'',_albl=sugAcao?sugAcao.label:'Ação concluída';
      btn.onclick=function(){crmFilaFeitoM(_id,_aid,_albl);};
    }
    var sel=document.getElementById('crm-fila-step-m');
    if(sel){
      var _id2=l.id;
      sel.onchange=function(){
        if(!this.value)return;
        var lead=window.crmLeads&&window.crmLeads.find(function(x){return x.id===_id2;});
        if(lead){lead.funil_step=this.value;if(typeof crmSave==='function')crmSave();crmRenderFilaM();}
      };
    }
  }

  function crmFilaFeitoM(id,acaoId,acaoLabel){
    if(!window.crmLeads)return;
    var l=window.crmLeads.find(function(x){return x.id===id;});
    if(!l)return;
    if(!l.timeline)l.timeline=[];
    if(acaoLabel)l.timeline.push({t:acaoLabel,d:crmMToday(),c:'#4a7c5a'});
    if(acaoId&&CRM_STEP_NEXT[acaoId])l.funil_step=CRM_STEP_NEXT[acaoId];
    if(l.col==='heating'){
      var nxt=new Date();nxt.setDate(nxt.getDate()+30);
      l.heating_next=nxt.toISOString().slice(0,10);
      l.proxData=l.heating_next;
    } else {
      l.proxAcao='';l.proxData='';
    }
    crmFilaFeitos.push(id);
    crmFilaIdx=0;
    if(typeof crmSave==='function')crmSave();
    crmRenderCRMM();
  }

  window.crmFilaPularM=function(){
    var fila=crmGetFila();
    if(fila.length<=1)return;
    crmFilaIdx=(crmFilaIdx+1)%fila.length;
    crmRenderFilaM();
  };

  window.crmFilaVerDetalhesM=function(id){
    crmView='kanban';
    if(typeof crmPick==='function')crmPick(id);
    renderViewTabsM();
    crmRenderKanbanM();
    setTimeout(function(){
      var sp=document.getElementById('crm-side-panel');
      if(sp)sp.scrollIntoView({behavior:'smooth'});
    },200);
  };

  // ── Kanban melhorado (com etapa e tipo no card) ──────────────────────────
  function crmRenderKanbanM(){
    if(typeof crmRenderKanban==='function'){
      // Chamar o kanban original primeiro
      crmRenderKanban();
      // Depois melhorar os cards com etapa e tipo
      setTimeout(function(){
        if(!window.crmLeads)return;
        var cards=document.querySelectorAll('.crm-card');
        cards.forEach(function(card){
          var onclick=card.getAttribute('onclick')||'';
          var match=onclick.match(/crmPick\((\d+)\)/);
          if(!match)return;
          var id=Number(match[1]);
          var l=window.crmLeads.find(function(x){return x.id===id;});
          if(!l)return;
          // Verificar se já tem badges
          if(card.querySelector('.crm-m-badges'))return;
          var badges='<div class="crm-m-badges" style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px;padding:0 10px 8px">';
          if(l.tipo==='quente')badges+='<span style="font-size:10px;font-weight:500;padding:2px 6px;border-radius:20px;background:#FAEEDA;color:#633806">Quente</span>';
          else if(l.tipo==='frio')badges+='<span style="font-size:10px;font-weight:500;padding:2px 6px;border-radius:20px;background:#E6F1FB;color:#0C447C">Frio</span>';
          if(l.funil_step&&CRM_STEP_LABELS[l.funil_step])badges+='<span style="font-size:10px;padding:2px 6px;border-radius:20px;background:rgba(0,0,0,0.05);color:#8a7a6e;border:0.5px solid rgba(0,0,0,0.07)">'+CRM_STEP_LABELS[l.funil_step]+'</span>';
          badges+='</div>';
          card.insertAdjacentHTML('beforeend',badges);
        });
      },100);
    }
  }

  // ── View tabs ────────────────────────────────────────────────────────────
  function renderViewTabsM(){
    var wrap=document.getElementById('crm-view-tabs-m');
    if(!wrap)return;
    wrap.innerHTML=''
      +'<button class="crm-tab-btn'+(crmView==='fila'?' active':'')+'" onclick="crmSetViewM(\'fila\')">Fila do dia</button>'
      +'<button class="crm-tab-btn'+(crmView==='kanban'?' active':'')+'" onclick="crmSetViewM(\'kanban\')">Kanban</button>';
  }

  window.crmSetViewM=function(v){
    crmView=v;
    if(v==='kanban'&&typeof crmSel!=='undefined')window.crmSel=null;
    renderViewTabsM();
    crmRenderCRMM();
  };

  // ── Onboarding ───────────────────────────────────────────────────────────
  function crmCheckOnboardingM(){
    if(!window.crmLeads)return;
    var sem=window.crmLeads.filter(function(l){
      return l.col!=='arquivado'&&l.col!=='negativa'&&!l.funil_step;
    });
    var banner=document.getElementById('crm-onboarding-m');
    if(!banner)return;
    if(sem.length<=3){banner.style.display='none';return;}
    banner.style.display='block';
    banner.innerHTML='<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
      +'<div style="font-size:13px;color:#7a3a22;flex:1"><b>'+sem.length+' leads sem etapa definida.</b> Defina a etapa de cada um para ativar o script automático na fila do dia.</div>'
      +'<button onclick="crmOnboardingIniciarM()" style="padding:6px 14px;font-size:12px;font-weight:500;border-radius:8px;border:0.5px solid #7a3a22;background:transparent;color:#7a3a22;cursor:pointer;white-space:nowrap">Configurar agora</button>'
      +'<button onclick="document.getElementById(\'crm-onboarding-m\').style.display=\'none\'" style="padding:6px 10px;font-size:12px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.1);background:transparent;color:#8a7a6e;cursor:pointer">Depois</button>'
      +'</div>';
  }

  window.crmOnboardingIniciarM=function(){
    if(!window.crmLeads)return;
    var sem=window.crmLeads.filter(function(l){
      return l.col!=='arquivado'&&l.col!=='negativa'&&!l.funil_step;
    });
    if(!sem.length){var b=document.getElementById('crm-onboarding-m');if(b)b.style.display='none';return;}
    var l=sem[0];
    var c=crmMCol(l.col);
    var steps=CRM_STEPS[l.col]||[];
    var banner=document.getElementById('crm-onboarding-m');
    if(!banner)return;
    var h='<div style="font-size:13px;font-weight:500;color:#1c1410;margin-bottom:4px">'+l.name+'</div>'
      +'<div style="font-size:12px;color:#8a7a6e;margin-bottom:10px">'+l.profissao+' · '+c.name+'</div>'
      +'<div style="font-size:12px;color:#1c1410;margin-bottom:8px">Em qual etapa está este lead?</div>'
      +'<div style="display:flex;flex-wrap:wrap;gap:6px">';
    steps.forEach(function(s){
      h+='<button onclick="crmOnboardingSetM('+l.id+',\''+s+'\')" style="padding:6px 12px;font-size:12px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.12);background:#fff;color:#1c1410;cursor:pointer">'+CRM_STEP_LABELS[s]+'</button>';
    });
    h+='<button onclick="crmOnboardingSetM('+l.id+',\'\')" style="padding:6px 12px;font-size:12px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.08);background:transparent;color:#8a7a6e;cursor:pointer">Pular</button>'
      +'</div>'
      +'<div style="font-size:11px;color:#8a7a6e;margin-top:8px">'+sem.length+' lead'+(sem.length!==1?'s':'')+' restante'+(sem.length!==1?'s':'')+'</div>';
    banner.innerHTML=h;
  };

  window.crmOnboardingSetM=function(id,step){
    if(!window.crmLeads)return;
    var l=window.crmLeads.find(function(x){return x.id===id;});
    if(l)l.funil_step=step||'__skip';
    if(typeof crmSave==='function')crmSave();
    var sem=window.crmLeads.filter(function(l2){return l2.col!=='arquivado'&&l2.col!=='negativa'&&!l2.funil_step;});
    if(sem.length>0)window.crmOnboardingIniciarM();
    else{var b=document.getElementById('crm-onboarding-m');if(b)b.style.display='none';crmRenderCRMM();}
  };

  // ── Render principal ─────────────────────────────────────────────────────
  function crmRenderCRMM(){
    renderViewTabsM();
    if(crmView==='fila') crmRenderFilaM();
    else crmRenderKanbanM();
    crmCheckOnboardingM();
  }

  // ── Patch do crmHeating para +30 dias ────────────────────────────────────
  function patchCrmHeating(){
    var orig=window.crmHeating;
    if(!orig)return;
    window.crmHeating=function(id){
      orig(id);
      // Adicionar heating_next +30 dias ao lead que acabou de ser movido
      if(!window.crmLeads)return;
      var l=window.crmLeads.find(function(x){return x.id===Number(id);});
      if(l&&l.col==='heating'){
        var nxt=new Date();nxt.setDate(nxt.getDate()+30);
        l.heating_next=nxt.toISOString().slice(0,10);
        l.proxData=l.heating_next;
        l.funil_step='heating_msg';
        if(typeof crmSave==='function')crmSave();
      }
    };
  }

  // ── Injeção do HTML ──────────────────────────────────────────────────────
  function injetarUIm(){
    // Adicionar view tabs e banner de onboarding antes do crm-metrics
    var metrics=document.getElementById('crm-metrics');
    if(!metrics||document.getElementById('crm-view-tabs-m'))return;

    // Banner de onboarding
    var banner=document.createElement('div');
    banner.id='crm-onboarding-m';
    banner.style.cssText='display:none;background:#fdf6ec;border:1px solid rgba(201,122,42,0.3);border-radius:10px;padding:12px 16px;margin-bottom:1rem';
    metrics.parentNode.insertBefore(banner,metrics);

    // View tabs
    var vtabs=document.createElement('div');
    vtabs.id='crm-view-tabs-m';
    vtabs.className='crm-tab';
    vtabs.style.cssText='background:rgba(181,98,62,0.08);margin-bottom:0.5rem';
    metrics.parentNode.insertBefore(vtabs,banner);
  }

  // ── Intercept crmRenderAll ───────────────────────────────────────────────
  function patchCrmRenderAll(){
    var orig=window.crmRenderAll;
    if(!orig)return;
    window.crmRenderAll=function(){
      orig();
      // Após render original, aplicar melhorias
      injetarUIm();
      renderViewTabsM();
      if(crmView==='fila'){
        crmRenderFilaM();
      }
      crmCheckOnboardingM();
    };
  }

  // ── Init: aguardar crmRenderAll estar disponível ─────────────────────────
  function init(){
    if(typeof window.crmRenderAll==='function'){
      patchCrmRenderAll();
      patchCrmHeating();
    } else {
      setTimeout(init,300);
    }
  }

  // Aguardar DOM e funções do portal carregarem
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){setTimeout(init,500);});
  } else {
    setTimeout(init,500);
  }

})();

// ============================================================
// PATCH 1: Modal de novo lead → painel lateral
// ============================================================
(function patchOpenForm(){
  function waitFor(fn){
    if(typeof window.crmOpenForm==='function') fn();
    else setTimeout(function(){waitFor(fn);},300);
  }
  waitFor(function(){
    window.crmOpenForm=function(){
      var old=document.getElementById('crm-form-side');
      if(old) old.remove();

      var overlay=document.createElement('div');
      overlay.id='crm-form-overlay';
      overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:1500;backdrop-filter:blur(2px)';
      overlay.onclick=function(e){if(e.target===overlay)closeSideForm();};

      var panel=document.createElement('div');
      panel.id='crm-form-side';
      panel.style.cssText='position:fixed;top:0;right:0;width:480px;max-width:95vw;height:100vh;background:#fff;z-index:1501;overflow-y:auto;box-shadow:-4px 0 24px rgba(0,0,0,0.12);display:flex;flex-direction:column';

      var tipos=['frio','quente'];
      var origens=['LinkedIn','Indicação','Instagram','Evento','Outro'];
      var origenopts=origens.map(function(o){return '<option>'+o+'</option>';}).join('');
      var tipopts=tipos.map(function(t){return '<option>'+t+'</option>';}).join('');

      panel.innerHTML=
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(0,0,0,0.07);position:sticky;top:0;background:#fff;z-index:2">'
          +'<div style="font-size:15px;font-weight:500;color:#1c1410">Novo lead</div>'
          +'<button id="crm-form-close-btn" style="width:32px;height:32px;border-radius:8px;border:0.5px solid rgba(0,0,0,0.12);background:transparent;font-size:20px;cursor:pointer;color:#6b5a4e;display:flex;align-items:center;justify-content:center">&times;</button>'
        +'</div>'
        +'<div style="padding:1.25rem;flex:1">'
          +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
            +'<div style="display:flex;flex-direction:column;gap:4px;grid-column:1/-1"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Nome completo *</label><input class="crm-form-inp" id="cf2-name" placeholder="Ana Silva"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Profissão *</label><input class="crm-form-inp" id="cf2-prof" placeholder="Product Manager"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Empresa</label><input class="crm-form-inp" id="cf2-emp" placeholder="Empresa atual"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">WhatsApp</label><input class="crm-form-inp" id="cf2-wpp" placeholder="(51) 99999-0000"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">E-mail</label><input class="crm-form-inp" id="cf2-email" placeholder="email@exemplo.com"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px;grid-column:1/-1"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">LinkedIn</label><input class="crm-form-inp" id="cf2-li" placeholder="linkedin.com/in/..."></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Tipo</label><select class="crm-form-sel" id="cf2-tipo">'+tipopts+'</select></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Origem</label><select class="crm-form-sel" id="cf2-orig" onchange="crmToggleIndicadoPor(this.value,\'cf2-indicado\')">'+origenopts+'</select></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px;grid-column:1/-1" id="cf2-indicado-row"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Indicado por</label><input class="crm-form-inp" id="cf2-indicado" placeholder="Nome de quem indicou"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Aniversário (DD/MM)</label><input class="crm-form-inp" id="cf2-aniv" placeholder="15/03"></div>'
            +'<div style="display:flex;flex-direction:column;gap:4px;grid-column:1/-1"><label style="font-size:11px;font-weight:500;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em">Notas iniciais</label><textarea class="crm-form-inp" id="cf2-notes" placeholder="Contexto do lead..." style="height:72px;resize:vertical;font-family:inherit;font-size:13px"></textarea></div>'
          +'</div>'
        +'</div>'
        +'<div style="padding:1rem 1.25rem;border-top:1px solid rgba(0,0,0,0.07);display:flex;gap:8px;justify-content:flex-end;position:sticky;bottom:0;background:#fff">'
          +'<button id="crm-form-cancel" class="crm-btn" style="padding:8px 16px">Cancelar</button>'
          +'<button id="crm-form-save" class="crm-btn main" style="padding:8px 16px">Salvar lead</button>'
        +'</div>';

      document.body.appendChild(overlay);
      document.body.appendChild(panel);
      document.body.style.overflow='hidden';

      // Ocultar row indicado inicialmente
      var indRow=document.getElementById('cf2-indicado-row');
      if(indRow) indRow.style.display='none';

      document.getElementById('crm-form-close-btn').onclick=closeSideForm;
      document.getElementById('crm-form-cancel').onclick=closeSideForm;
      document.getElementById('crm-form-save').onclick=saveSideForm;

      // Animar entrada
      panel.style.transform='translateX(100%)';
      panel.style.transition='transform .25s cubic-bezier(.4,0,.2,1)';
      requestAnimationFrame(function(){panel.style.transform='translateX(0)';});
      document.getElementById('cf2-name').focus();
    };

    function closeSideForm(){
      var p=document.getElementById('crm-form-side');
      var o=document.getElementById('crm-form-overlay');
      if(p){p.style.transform='translateX(100%)';setTimeout(function(){p.remove();},250);}
      if(o) o.remove();
      document.body.style.overflow='';
    }

    function saveSideForm(){
      var name=(document.getElementById('cf2-name').value||'').trim();
      var prof=(document.getElementById('cf2-prof').value||'').trim();
      if(!name||!prof){alert('Nome e profissão são obrigatórios.');return;}
      // Copiar valores para os campos do formulário original e chamar crmSaveForm
      var orig=document.getElementById('cf2-orig').value;
      var tipo=document.getElementById('cf2-tipo').value||'frio';
      // Garantir que o form original existe
      var origForm=document.getElementById('crm-form-grid');
      if(!origForm){
        // Form original não está no DOM, criar campos temporários
        origForm=document.createElement('div');
        origForm.id='crm-form-grid';
        origForm.style.display='none';
        document.body.appendChild(origForm);
      }
      origForm.innerHTML=
        '<input id="cf-name" value="'+name.replace(/"/g,'&quot;')+'">'
        +'<input id="cf-prof" value="'+prof.replace(/"/g,'&quot;')+'">'
        +'<input id="cf-emp" value="'+(document.getElementById('cf2-emp').value||'').replace(/"/g,'&quot;')+'">'
        +'<input id="cf-wpp" value="'+(document.getElementById('cf2-wpp').value||'').replace(/"/g,'&quot;')+'">'
        +'<input id="cf-email" value="'+(document.getElementById('cf2-email').value||'').replace(/"/g,'&quot;')+'">'
        +'<input id="cf-li" value="'+(document.getElementById('cf2-li').value||'').replace(/"/g,'&quot;')+'">'
        +'<input id="cf-aniv" value="'+(document.getElementById('cf2-aniv').value||'')+'">'
        +'<select id="cf-orig"><option value="'+orig+'" selected>'+orig+'</option></select>'
        +'<input id="cf-indicado" value="'+(document.getElementById('cf2-indicado')&&orig==='Indicação'?document.getElementById('cf2-indicado').value:'')+'">'
        +'<input id="cf-notes" value="'+(document.getElementById('cf2-notes').value||'').replace(/"/g,'&quot;')+'">';
      // Chamar o save original que tem acesso ao escopo correto
      if(typeof window.crmSaveForm==='function'){
        window.crmSaveForm();
        // Adicionar campo tipo ao lead recém-criado
        setTimeout(function(){
          if(!window.crmLeads)return;
          // Último lead adicionado
          var leads=window.crmLeads;
          if(leads&&leads.length>0){
            var last=leads[leads.length-1];
            if(!last.tipo) last.tipo=tipo;
            if(typeof crmSave==='function') crmSave();
          }
        },100);
        closeSideForm();
      }
    }

    window.crmToggleIndicadoPor=function(val,inputId){
      var rowId=inputId+'-row';
      var row=document.getElementById(rowId);
      if(row) row.style.display=val==='Indicação'?'flex':'none';
    };
  });
})();

// ============================================================
// PATCH 2: Injetar script da próxima mensagem + Registrar Ação
//          no painel lateral do lead (crm-side-body)
// ============================================================
(function patchRenderPanel(){
  function waitFor(fn){
    if(typeof window.crmRenderPanel==='function') fn();
    else setTimeout(function(){waitFor(fn);},300);
  }
  waitFor(function(){
    var orig=window.crmRenderPanel;
    window.crmRenderPanel=function(){
      orig();
      // Aguardar o painel renderizar e injetar melhorias
      setTimeout(function(){window.injetarMelhoriasPainel&&window.injetarMelhoriasPainel();},150);
    };
  });

  window.injetarMelhoriasPainel=function injetarMelhoriasPainel(){
    var body=document.getElementById('crm-side-body');
    if(!body||document.getElementById('crm-panel-melhorias'))return;
    if(!window.crmLeads||window.crmSel==null)return;
    var l=window.crmLeads.find(function(x){return x.id===window.crmSel;});
    if(!l)return;

    var stepLabel=l.funil_step?CRM_STEP_LABELS[l.funil_step]:'';
    var scriptTxt=l.funil_step?CRM_STEP_SCRIPTS[l.funil_step]:'';
    var acoes=CRM_ACOES_FASE[l.col]||[];
    var sugAcao=acoes.find(function(a){return a.sug;});
    var COLS_ALL=[
      {id:'linkedin',name:'Leads'},{id:'qualif',name:'Call qualif.'},
      {id:'reuniao',name:'Reunião'},{id:'proposta',name:'Proposta'},
      {id:'fechado',name:'Fechado'},{id:'heating',name:'Monthly Heating'},
      {id:'arquivado',name:'Arquivado'},{id:'negativa',name:'Não contatar'}
    ];

    var wrap=document.createElement('div');
    wrap.id='crm-panel-melhorias';
    wrap.style.cssText='margin:0 0 4px';

    // ── Tipo + Etapa ──────────────────────────────────────────────────────
    var tipoEtapaBox=document.createElement('div');
    tipoEtapaBox.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px;padding:10px 12px;background:#faf7f4;border-radius:8px';

    // Tipo frio/quente — editável
    var tipoLabel=document.createElement('div');
    tipoLabel.style.cssText='font-size:10px;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px';
    tipoLabel.textContent='Tipo';
    var tipoSel=document.createElement('select');
    tipoSel.style.cssText='padding:4px 8px;font-size:12px;border-radius:6px;border:0.5px solid rgba(0,0,0,0.12);background:#fff;color:#1c1410;cursor:pointer;font-family:inherit';
    tipoSel.innerHTML='<option value="frio"'+(l.tipo==='frio'?' selected':'')+'>Lead frio</option><option value="quente"'+(l.tipo==='quente'?' selected':'')+'>Lead quente</option>';
    tipoSel.onchange=function(){l.tipo=this.value;if(typeof crmSave==='function')crmSave();};
    var tipoWrap=document.createElement('div');
    tipoWrap.appendChild(tipoLabel);
    tipoWrap.appendChild(tipoSel);
    tipoEtapaBox.appendChild(tipoWrap);

    // Etapa do funil — editável
    var etapaLabel=document.createElement('div');
    etapaLabel.style.cssText='font-size:10px;color:#8a7a6e;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px';
    etapaLabel.textContent='Etapa';
    var etapaSel=document.createElement('select');
    etapaSel.style.cssText='padding:4px 8px;font-size:12px;border-radius:6px;border:0.5px solid rgba(0,0,0,0.12);background:#fff;color:#1c1410;cursor:pointer;font-family:inherit';
    var etapaOpts='<option value="">Selecionar...</option>';
    (CRM_STEPS[l.col]||[]).forEach(function(s){
      etapaOpts+='<option value="'+s+'"'+(l.funil_step===s?' selected':'')+'>'+CRM_STEP_LABELS[s]+'</option>';
    });
    etapaSel.innerHTML=etapaOpts;
    etapaSel.onchange=function(){
      if(!this.value)return;
      l.funil_step=this.value;
      if(typeof crmSave==='function')crmSave();
      // Re-renderizar melhorias com nova etapa
      var old2=document.getElementById('crm-panel-melhorias');
      if(old2)old2.remove();
      setTimeout(injetarMelhoriasPainel,50);
    };
    var etapaWrap=document.createElement('div');
    etapaWrap.appendChild(etapaLabel);
    etapaWrap.appendChild(etapaSel);
    tipoEtapaBox.appendChild(etapaWrap);
    wrap.appendChild(tipoEtapaBox);

    // ── Script da próxima mensagem ────────────────────────────────────────
    if(scriptTxt){
      var scriptBox=document.createElement('div');
      scriptBox.style.cssText='border-left:3px solid #b5623e;padding:10px 12px;background:#faf2ee;margin-bottom:10px';
      scriptBox.innerHTML=
        '<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#7a3a22;margin-bottom:5px">Próxima mensagem — '+stepLabel+'</div>'
        +'<div style="font-size:12px;color:#4a2010;line-height:1.65;font-style:italic">'+scriptTxt+'</div>';
      wrap.appendChild(scriptBox);
    }

    // ── Registrar ação ────────────────────────────────────────────────────
    if(acoes.length>0){
      var secLbl=document.createElement('div');
      secLbl.className='crm-sec';
      secLbl.style.marginTop='0';
      secLbl.textContent='Registrar ação';
      wrap.appendChild(secLbl);

      var acaoBox=document.createElement('div');
      acaoBox.style.cssText='background:#faf7f4;border-radius:8px;padding:10px 12px;margin-bottom:8px';
      var grid=document.createElement('div');
      grid.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:6px';

      acoes.forEach(function(a){
        var btn=document.createElement('button');
        btn.style.cssText='padding:7px 10px;font-size:11px;border-radius:8px;text-align:left;cursor:pointer;line-height:1.3;transition:all .15s;'
          +(a.sug
            ?'border:1px solid #b5623e;background:#faf2ee;color:#7a3a22;font-weight:500'
            :'border:0.5px solid rgba(0,0,0,0.12);background:#fff;color:#1c1410');
        btn.innerHTML=a.label+(a.sug?'<span style="display:block;font-size:9px;color:#993C1D;margin-top:2px">sugerido</span>':'');
        btn.onclick=function(){registrarAcaoPanel(l.id,a.id,a.label);};
        grid.appendChild(btn);
      });
      acaoBox.appendChild(grid);
      wrap.appendChild(acaoBox);
    }

    // ── Mover para fase ───────────────────────────────────────────────────
    var moverLbl=document.createElement('div');
    moverLbl.className='crm-sec';
    moverLbl.textContent='Mover para fase';
    wrap.appendChild(moverLbl);

    var moverSel=document.createElement('select');
    moverSel.className='crm-form-sel';
    moverSel.style.cssText='width:100%;margin-bottom:12px;font-size:12px';
    var moverOpts='<option value="">Selecionar fase...</option>';
    COLS_ALL.filter(function(c){return c.id!==l.col;}).forEach(function(c){
      moverOpts+='<option value="'+c.id+'">'+c.name+'</option>';
    });
    moverSel.innerHTML=moverOpts;
    moverSel.onchange=function(){
      if(!this.value)return;
      var newCol=this.value;
      l.col=newCol;
      // Definir etapa padrão para a nova fase
      var stepMap={linkedin:'msg1',qualif:'abertura',reuniao:'acordo',proposta:'followup_proposta',fechado:'fechamento',heating:'heating_msg'};
      if(stepMap[newCol])l.funil_step=stepMap[newCol];
      if(!l.timeline)l.timeline=[];
      var colName=COLS_ALL.find(function(c){return c.id===newCol;});
      l.timeline.push({t:'Movido para '+(colName?colName.name:newCol),d:new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}),c:'#b5623e'});
      if(typeof crmSave==='function')crmSave();
      if(typeof crmRenderAll==='function')crmRenderAll();
      if(typeof crmRenderPanel==='function')crmRenderPanel();
    };
    wrap.appendChild(moverSel);

    // ── Histórico melhorado (com botão × só em manuais) ───────────────────
    var histLbl=document.createElement('div');
    histLbl.className='crm-sec';
    histLbl.textContent='Histórico';
    wrap.appendChild(histLbl);

    var histWrap=document.createElement('div');
    histWrap.id='crm-hist-melhorado';
    histWrap.style.marginBottom='8px';
    renderHistorico(histWrap, l);
    wrap.appendChild(histWrap);

    // Inserir no topo do body, antes de tudo
    var firstChild=body.firstChild;
    body.insertBefore(wrap, firstChild);
  }

  window.renderHistorico=function renderHistorico(container, l){
    container.innerHTML='';
    var hist=l.timeline||[];
    if(hist.length===0){
      container.innerHTML='<div style="font-size:12px;color:#8a7a6e;padding:8px 0">Nenhuma interação registrada.</div>';
      return;
    }
    [...hist].reverse().forEach(function(t,ri){
      var realIdx=hist.length-1-ri;
      var row=document.createElement('div');
      row.style.cssText='display:flex;gap:9px;align-items:flex-start;margin-bottom:7px';
      var dot=document.createElement('div');
      dot.style.cssText='width:8px;height:8px;border-radius:50%;background:'+(t.c||'#8a7a6e')+';flex-shrink:0;margin-top:3px';
      var info=document.createElement('div');
      info.style.flex='1';
      info.innerHTML='<div style="font-size:12px;color:#1c1410">'+t.t+'</div><div style="font-size:11px;color:#8a7a6e;margin-top:1px">'+t.d+'</div>';
      row.appendChild(dot);
      row.appendChild(info);
      // Botão × só para entradas manuais (não automáticas)
      if(!t.auto){
        var del=document.createElement('button');
        del.style.cssText='border:none;background:none;color:#c0392b;cursor:pointer;font-size:16px;opacity:.4;padding:0 4px;line-height:1;flex-shrink:0';
        del.title='Remover';
        del.textContent='×';
        del.onmouseenter=function(){this.style.opacity='1';};
        del.onmouseleave=function(){this.style.opacity='.4';};
        del.onclick=(function(idx){
          return function(){
            l.timeline.splice(idx,1);
            if(typeof crmSave==='function')crmSave();
            var hw=document.getElementById('crm-hist-melhorado');
            if(hw)renderHistorico(hw,l);
          };
        })(realIdx);
        row.appendChild(del);
      }
      container.appendChild(row);
    });
  }

  function registrarAcaoPanel(id,acaoId,acaoLabel){
    if(!window.crmLeads)return;
    var l=window.crmLeads.find(function(x){return x.id===id;});
    if(!l)return;
    if(!l.timeline)l.timeline=[];
    var today=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
    l.timeline.push({t:acaoLabel,d:today,c:'#4a7c5a'});

    // Avançar etapa automaticamente
    if(acaoId&&CRM_STEP_NEXT[acaoId]) l.funil_step=CRM_STEP_NEXT[acaoId];

    // Limpar próxima ação agendada
    l.proxAcao=''; l.proxData='';

    if(typeof crmSave==='function') crmSave();
    if(typeof crmRenderPanel==='function') crmRenderPanel();

    // Toast de confirmação
    var toast=document.createElement('div');
    toast.style.cssText='position:fixed;bottom:20px;right:20px;background:#EAF3DE;border:0.5px solid #97C459;border-radius:8px;padding:10px 16px;font-size:12px;color:#27500A;z-index:3000;opacity:0;transition:opacity .2s';
    toast.textContent='✓ Registrado: '+acaoLabel;
    document.body.appendChild(toast);
    requestAnimationFrame(function(){toast.style.opacity='1';});
    setTimeout(function(){toast.style.opacity='0';setTimeout(function(){toast.remove();},200);},2500);
  }
})();
