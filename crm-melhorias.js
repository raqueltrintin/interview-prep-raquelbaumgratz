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
    msg1:'"Oi [nome], tudo bem?\n\nTenho acompanhado profissionais brasileiros que são qualificados, entregam resultado, mas ainda assim se sentem mal pagos e sem perspectiva de crescimento real.\n\nFaz parte das tuas metas de 2026 trabalhar para uma empresa que pague em dólar?"',
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
      {id:'msg1',label:'Enviar mensagem 1',sug:true},
      {id:'fu11',label:'Enviar follow-up 1.1',sug:false},
      {id:'fu12',label:'Enviar follow-up 1.2',sug:false},
      {id:'fu2',label:'Pedir WhatsApp',sug:false},
      {id:'fu20',label:'Enviar follow-up 2.0',sug:false},
      {id:'fu201',label:'Enviar follow-up 2.0.1',sug:false},
      {id:'respondeu',label:'Registrar resposta com interesse',sug:false},
      {id:'sem_interesse',label:'Respondeu sem interesse no momento',sug:false},
      {id:'silencio',label:'Silêncio',sug:false},
      {id:'interesse_sem_ingles',label:'Tem interesse mas não sabe inglês',sug:false}
    ],
    qualif:[
      {id:'abertura',label:'Fazer ligação',sug:true},
      {id:'horario',label:'Propor horário para ligação',sug:false},
      {id:'perguntas',label:'Fazer 3 perguntas',sug:false},
      {id:'convite',label:'Convidar para reunião',sug:false},
      {id:'nao_atendeu',label:'Registrar não atendeu — msg enviada',sug:false},
      {id:'segundo_toque',label:'Enviar segundo toque — sem resposta',sug:false},
      {id:'encerrar_heating',label:'Encerrar com porta aberta → Heating',sug:false},
      {id:'mais_info_msg',label:'Pediu mais informações por mensagem',sug:false}
    ],
    reuniao:[
      {id:'acordo',label:'Fazer acordo sim/não',sug:true},
      {id:'dor',label:'Aprofundar dor',sug:false},
      {id:'solucao',label:'Apresentar solução',sug:false},
      {id:'verificar',label:'Verificar reação',sug:false},
      {id:'preco',label:'Apresentar preço',sug:false},
      {id:'nao_compareceu',label:'Não compareceu na reunião',sug:false},
      {id:'silencio_reuniao',label:'Silêncio',sug:false}
    ],
    proposta:[{id:'followup_proposta',label:'Enviar follow-up',sug:true}],
    fechado:[{id:'fechamento',label:'Confirmar fechamento',sug:true}],
    heating:[{id:'heating_msg',label:'Enviar conteúdo de aquecimento',sug:true}]
  };

  // ── Estado da fila ───────────────────────────────────────────────────────
  var crmFilaIdx=0;
  var crmFilaFeitos=[];
  var crmView='kanban';

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

  // ── Funil completo — etapas e scripts ───────────────────────────────────
  var CRM_FUNIL_ETAPAS={
    linkedin:['msg1','fu11','fu12','b_qual','fu2','fu20','fu201','a4','sem_interesse','interesse_sem_ingles'],
    qualif:['abertura','horario','perguntas','convite','horario_reuniao','segundo_toque','nao_atendeu','mais_info_msg'],
    reuniao:['acordo','dor','solucao','verificar','preco','nao_compareceu','silencio_reuniao'],
    proposta:['followup_proposta','objecao_preco','objecao_timing'],
    fechado:['fechamento'],
    heating:['heating_msg']
  };
  var CRM_NEXT_ETAPA={
    msg1:'fu11', fu11:'fu12', fu12:null,
    b_qual:null, fu2:'fu20', fu20:'fu201', fu201:null, a4:null,
    abertura:'perguntas', perguntas:'convite', convite:'horario_reuniao',
    horario_reuniao:null, segundo_toque:null, nao_atendeu:'horario',
    acordo:'dor', dor:'solucao', solucao:'verificar', verificar:'preco', preco:'fechamento'
  };
  var CRM_SCRIPT_ETAPA={
    msg1:'"Oi [nome], tudo bem?\n\nTenho acompanhado profissionais brasileiros que são qualificados, entregam resultado, mas ainda assim se sentem mal pagos e sem perspectiva de crescimento real.\n\nFaz parte das tuas metas de 2026 trabalhar para uma empresa que pague em dólar?"',
    fu11:'"Oii [nome], você chegou a ver a mensagem acima?"',
    fu12:'"Oi [nome], tudo bem? Passando por aqui por conta da mensagem que te enviei outro dia. Estou entendendo que talvez isso não seja importante para você agora. Tudo bem, retorno aqui mais adiante."',
    b_qual:'"Legal. Você já está se candidatando para vagas ou ainda está naquela fase de \\"sei que preciso mas ainda não comecei\\"? Te pergunto porque os profissionais que me procuram costumam estar em um destes dois momentos. Você tá em qual desses?"',
    fu2:'"Ótimo [nome], me passa seu WhatsApp para que eu possa entrar em contato com você."',
    fu20:'"[nome]?"',
    fu201:'"Oi [nome], tudo bem? Passando por aqui por conta da mensagem que te enviei outro dia. Tudo bem, retorno aqui mais adiante."',
    a4:'"Perfeito, [nome]. Quero apenas que você saiba que quando for o momento eu posso te ajudar com isso."',
    abertura:'"Oi [nome], aqui é a Raquel Baumgratz. A gente estava conversando no LinkedIn, você pode falar agora?" → Se não puder: "Que horário fica melhor hoje ou amanhã?"',
    horario:'"Que horário fica melhor hoje ou amanhã para falarmos?"',
    perguntas:'1. O que você quer hoje, profissionalmente?\n2. Você acredita que tem as habilidades para passar em uma entrevista em inglês?\n3. Por que você quer isso? Qual o motivo real?',
    convite:'"Entendi. Quero marcar contigo uma reunião de no máximo uma hora. É uma reunião de decisão — no final você vai precisar me dar um sim ou um não."',
    horario_reuniao:'"Você consegue fazer hoje às 21h ou amanhã às 9h da manhã?"',
    segundo_toque:'"Oii [nome], conseguiu ver minha mensagem?"',
    acordo:'"Antes de começar, quero fazer um acordo com você. No final eu vou precisar de um sim ou um não. Estamos combinadas?"',
    dor:'"Me conta mais sobre o que te trouxe até aqui. O que está acontecendo hoje no teu trabalho ou na tua vida que fez você querer essa mudança?"',
    solucao:'Credencial + apresentação do programa. Escutar o que ela disse na ligação e conectar.',
    verificar:'"O que você achou até aqui?" → "É exatamente o que preciso" = sinal verde. "Interessante" = explorar antes.',
    preco:'"O investimento para essa mentoria é de R$15.000 — ou em 12 vezes de R$1.300 no cartão." → Pare. Não preencha o silêncio.',
    heating_msg:'Enviar conteúdo relevante — dica de entrevista, post, case de sucesso. Sem pressão de venda.',
    followup_proposta:'Fazer follow-up questionando decisão.',
    nao_atendeu:'Não atendeu — enviar mensagem: "Oii [nome]. Estou te ligando para continuarmos a conversa. Como estás?"'
  };

  // ── Ações do dia melhoradas ──────────────────────────────────────────────
  function crmRenderDiariaM(){
    var el=document.getElementById('crm-diaria');
    if(!el||!window.crmLeads)return;
    var today=new Date().toISOString().slice(0,10);
    var todayFmt=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});

    var urgentes=window.crmLeads.filter(function(l){
      if(l.col==='arquivado'||l.col==='negativa')return false;
      if(l.col==='heating') return l.heating_next&&l.heating_next<=today;
      if(!l.proxData&&!l.proxAcao)return false;
      if(!l.proxData)return true;
      return l.proxData<=today;
    }).sort(function(a,b){return(a.proxData||'9999')>(b.proxData||'9999')?1:-1;});

    if(urgentes.length===0){
      el.innerHTML='<div style="font-size:12px;color:#8a7a6e;padding:8px 0">Nenhuma ação pendente para hoje. 🎉</div>';
      return;
    }

    var colMap={linkedin:'Leads',qualif:'Call qualif.',reuniao:'Reunião',proposta:'Proposta',fechado:'Fechado',heating:'Heating'};
    var colColor={linkedin:'#b5623e',qualif:'#c97a2a',reuniao:'#4a7c5a',proposta:'#185FA5',fechado:'#6b5a4e',heating:'#7a3a22'};

    var html='<table style="width:100%;border-collapse:collapse;font-size:12.5px">';
    html+='<thead><tr style="border-bottom:1px solid rgba(0,0,0,0.08)">';
    html+='<th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#8a7a6e">Lead</th>';
    html+='<th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#8a7a6e">Fase</th>';
    html+='<th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:#8a7a6e">Próxima ação</th>';
    html+='<th style="padding:6px 8px"></th>';
    html+='</tr></thead><tbody>';

    urgentes.forEach(function(l){
      var atrasado=l.proxData&&l.proxData<today;
      var dateFmt=l.proxData?l.proxData.split('-').reverse().join('/'):'—';
      var colNm=colMap[l.col]||l.col;
      var colClr=colColor[l.col]||'#8a7a6e';
      var colBg=colClr+'18';

      // Etapa — usar funil_step se existir, senão proxAcao
      var etapaId=l.funil_step||'';
      var etapaLabel=etapaId&&CRM_STEP_LABELS[etapaId]?CRM_STEP_LABELS[etapaId]:(l.proxAcao||'—');
      var script=etapaId&&CRM_SCRIPT_ETAPA[etapaId]?CRM_SCRIPT_ETAPA[etapaId]:'';

      // Próxima ação do funil (a que deve ser executada agora)
      var acoesFase=CRM_ACOES_FASE[l.col]||[];
      var sugAcao=acoesFase.find(function(a){return a.sug;});
      var acaoLabel=etapaLabel;
      var acaoId=etapaId;

      html+='<tr style="border-bottom:1px solid rgba(0,0,0,0.05)" id="diaria-row-'+l.id+'">';
      // Lead
      html+='<td style="padding:8px" onclick="crmDiariaToggle('+l.id+')" style="cursor:pointer">';
      html+='<div style="display:flex;align-items:center;gap:7px;cursor:pointer" onclick="crmDiariaToggle('+l.id+')">';
      html+='<div style="width:28px;height:28px;border-radius:50%;background:'+colBg+';color:'+colClr+';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0">'+crmMIni(l.name)+'</div>';
      html+='<div><div style="font-weight:500;color:#1c1410">'+l.name+'</div>';
      if(l.profissao&&l.profissao!=='—')html+='<div style="font-size:11px;color:#8a7a6e">'+l.profissao+'</div>';
      html+='</div></div></td>';
      // Fase
      html+='<td style="padding:8px"><span style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;background:'+colBg+';color:'+colClr+'">'+colNm+'</span></td>';
      // Ação
      html+='<td style="padding:8px;color:#1c1410">'+acaoLabel;
      if(atrasado)html+=' <span style="font-size:10px;color:#c0392b;font-weight:500">⚠ '+dateFmt+'</span>';
      html+='</td>';
      // Botão feito
      html+='<td style="padding:8px;white-space:nowrap">';
      html+='<button onclick="crmDiariaFeito('+l.id+',\''+acaoId+'\')" style="font-size:11px;padding:5px 12px;border-radius:6px;border:1px solid rgba(74,124,90,0.4);background:rgba(74,124,90,0.07);color:#2a5a38;cursor:pointer;margin-right:4px">✓ Feito</button>';
      html+='</td>';
      html+='</tr>';

      // Script expansível
      if(script){
        html+='<tr id="diaria-script-'+l.id+'" style="display:none"><td colspan="4" style="padding:0 8px 10px">';
        html+='<div style="border-left:3px solid #b5623e;padding:8px 12px;background:#faf2ee;border-radius:0;font-size:12px;color:#4a2010;line-height:1.65;font-style:italic">'+script.replace(/\n/g,'<br>')+'</div>';
        html+='</td></tr>';
      }
    });

    html+='</tbody></table>';
    el.innerHTML=html;
  }

  window.crmDiariaToggle=function(id){
    var row=document.getElementById('diaria-script-'+id);
    if(row)row.style.display=row.style.display==='none'?'table-row':'none';
  };

  window.crmDiariaFeito=function(id,acaoId){
    if(!window.crmLeads)return;
    var l=window.crmLeads.find(function(x){return x.id===id;});
    if(!l)return;
    if(!l.timeline)l.timeline=[];
    var today=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
    var label=acaoId&&CRM_STEP_LABELS[acaoId]?CRM_STEP_LABELS[acaoId]:(l.proxAcao||'Ação concluída');
    l.timeline.push({t:label,d:today,c:'#4a7c5a'});

    // Avançar etapa
    var next=acaoId&&CRM_NEXT_ETAPA[acaoId];
    if(next)l.funil_step=next;

    // Limpar próxima ação
    l.proxAcao='';l.proxData='';

    // Heating automático se etapa for de encerramento
    var heatEtapas=['fu12','fu201','a4','segundo_toque','encerrar_heating'];
    if(heatEtapas.includes(acaoId)){
      if(typeof crmHeating==='function'){crmHeating(id);return;}
    }

    if(typeof crmSave==='function')crmSave();

    // Remover linha da tabela com animação suave
    var row=document.getElementById('diaria-row-'+id);
    var rowScript=document.getElementById('diaria-script-'+id);
    if(row){row.style.opacity='0';row.style.transition='opacity .3s';setTimeout(function(){row.remove();if(rowScript)rowScript.remove();},300);}

    // Toast
    var toast=document.createElement('div');
    toast.style.cssText='position:fixed;bottom:20px;right:20px;background:#EAF3DE;border:0.5px solid #97C459;border-radius:8px;padding:10px 16px;font-size:12px;color:#27500A;z-index:3000;opacity:0;transition:opacity .2s';
    toast.textContent='✓ '+label+' — registrado';
    document.body.appendChild(toast);
    requestAnimationFrame(function(){toast.style.opacity='1';});
    setTimeout(function(){toast.style.opacity='0';setTimeout(function(){toast.remove();},200);},2500);
  };

  // Remover fila do dia — substituir por renderização da diária melhorada
  window.crmRenderFilaM=function(){
    // Fila do dia removida — usar Ações do dia no topo
    var el=document.getElementById('crm-kanban');
    if(!el)return;
    if(typeof crmRenderKanban==='function')crmRenderKanban();
  };

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
// PATCH 2: Injetar melhorias no painel lateral via MutationObserver
// ============================================================
(function patchRenderPanel(){
  // Observar quando o crm-side-body tem conteúdo novo
  function iniciarObserver(){
    var body=document.getElementById('crm-side-body');
    if(!body){setTimeout(iniciarObserver,500);return;}
    var obs=new MutationObserver(function(){
      // Remover melhorias antigas e reinjetar
      var old2=document.getElementById('crm-panel-melhorias');
      if(old2)old2.remove();
      setTimeout(function(){
        if(window.injetarMelhoriasPainel) window.injetarMelhoriasPainel();
      },80);
    });
    obs.observe(body,{childList:true,subtree:false});
  }
  // Também patchear crmRenderPanel como backup
  function waitFor(fn){
    if(typeof window.crmRenderPanel==='function') fn();
    else setTimeout(function(){waitFor(fn);},300);
  }
  waitFor(function(){
    var orig=window.crmRenderPanel;
    window.crmRenderPanel=function(){
      orig();
      setTimeout(function(){
        var old2=document.getElementById('crm-panel-melhorias');
        if(old2)old2.remove();
        if(window.injetarMelhoriasPainel) window.injetarMelhoriasPainel();
      },150);
    };
    iniciarObserver();
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

    // Ação especial: encerrar e mover para Heating
    if(acaoId==='encerrar_heating'){
      if(typeof crmHeating==='function'){crmSave&&crmSave();crmHeating(id);return;}
      l.col='heating';l.funil_step='heating_msg';
      var nxt=new Date();nxt.setDate(nxt.getDate()+30);
      l.heating_next=nxt.toISOString().slice(0,10);
      l.proxData=l.heating_next;
      l.proxAcao='';
      if(typeof crmSave==='function')crmSave();
      if(typeof crmRenderAll==='function')crmRenderAll();
      return;
    }

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
