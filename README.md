# Corretor de Preços Duplicados para Tiny ERP

Este utilitário corrige um bug específico no Tiny ERP onde, ao salvar um produto, a lista de preços pode ser enviada com entradas duplicadas, causando erros ou comportamento inesperado.

O script funciona como um "assistente" no seu navegador. Uma vez ativado, ele intercepta a ação de "Salvar Produto", remove os preços duplicados do envio e, em seguida, envia a versão corrigida para o servidor, garantindo que seus dados sejam salvos corretamente. Tudo isso de forma automática e com notificações visuais.

![Exemplo do Notificador em Ação](https://i.imgur.com/chcFUvJ.png )

---

## Como Instalar (Instalação em 30 segundos)

Para usar, basta adicionar o corretor como um favorito no seu navegador. Siga os passos abaixo:

1.  **Abra a Barra de Favoritos**
    *   Se a sua barra de favoritos não estiver visível, pressione `Ctrl + Shift + B` no Chrome/Edge/Firefox para exibi-la.

2.  **Crie um Novo Favorito**
    *   Clique com o botão direito do mouse em qualquer espaço livre da sua Barra de Favoritos e selecione **"Adicionar página..."** (ou "Adicionar favorito...").

    ![Passo 2: Adicionar Favorito](https://i.imgur.com/PCt2zZ1.png )

3.  **Configure o Favorito**
    *   No campo **Nome**, digite algo fácil de lembrar, como: `✅ Corrigir e Salvar Tiny`.
    *   No campo **URL**, copie e cole **exatamente** o código abaixo:

    ```javascript
    javascript:(()=>{const e={element:null,timer:null,currentDuration:0,colors:{info:"#58a6ff",success:"#2e7d32",error:"#d32f2f",warning:"#ed6c02"},injectCSS:function(){const e=document.createElement("style");e.innerHTML='#tiny-interceptor-notifier{position:fixed;bottom:20px;right:20px;background-color:#202020;color:#fff;border-left:5px solid;padding:16px;border-radius:6px;box-shadow:0 5px 20px rgba(0,0,0,.4);z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;transition:opacity .3s,transform .3s;transform:translateX(120%);opacity:0;max-width:320px}#tiny-interceptor-notifier.show{transform:translateX(0);opacity:1}#tiny-interceptor-notifier .message{margin:0;padding:0}#tiny-interceptor-notifier .message b,#tiny-interceptor-notifier .message strong{color:#58a6ff;font-weight:600}#tiny-interceptor-notifier .progress-bar{position:absolute;bottom:0;left:0;height:4px;background-color:#ddd;width:100%;transition:width .1s linear;border-bottom-left-radius:3px}',document.head.appendChild(e)},createElement:function(){this.element=document.createElement("div"),this.element.id="tiny-interceptor-notifier",this.element.innerHTML='<p class="message"></p><div class="progress-bar"></div>',document.body.appendChild(this.element),this.element.addEventListener("mouseenter",()=>clearTimeout(this.timer)),this.element.addEventListener("mouseleave",()=>this.hide(this.currentDuration))},show:function(e,t="info",o=5e3){this.element||this.createElement(),clearTimeout(this.timer),this.currentDuration=o,this.element.style.borderColor=this.colors[t],this.element.querySelector(".message").innerHTML=e,this.element.querySelector(".progress-bar").style.backgroundColor=this.colors[t],this.element.classList.add("show"),o>0?this.hide(o):this.element.querySelector(".progress-bar").style.width="0%"},hide:function(e=5e3){if(e<=0)return;const t=this.element.querySelector(".progress-bar"),o=Date.now();let n;const s=()=>{const i=Date.now()-o,r=e-i;r<=0?(t.style.width="0%",this.element.classList.remove("show")):(t.style.width=`${r/e*100}%`,n=requestAnimationFrame(s))};cancelAnimationFrame(n),n=requestAnimationFrame(s)},init:function(){this.injectCSS()}};e.init();const t="/services/produtos.server/1/salvarProduto";window._native_fetch||(window._native_fetch=window.fetch),window._native_xhr_open||(window._native_xhr_open=XMLHttpRequest.prototype.open,window._native_xhr_send=XMLHttpRequest.prototype.send,window._native_xhr_set_header=XMLHttpRequest.prototype.setRequestHeader);const o=t=>{if("object"!=typeof t||null===t)return t;const o=new Set,n=[];for(const s in t)if(Object.hasOwnProperty.call(t,s)){const i=t[s],r=i?.idListaPreco;r&&!o.has(r)&&(o.add(r),n.push(i))}const s={};n.forEach((e,t)=>{s[t+1]=e});const i=Object.keys(t).length,r=n.length,c=i-r;return c>0&&e.show(`<b>Correção:</b> Encontrados ${i} preços, sendo ${c} duplicados. ${r} preços foram mantidos.`,"info",6e3),s};async function n(s,i,r,c,a){e.show("<b>Aguarde:</b> Interceptamos a ação de salvar. Corrigindo dados...","info",0);try{const d=new URLSearchParams(c),l=d.get("args");if(!l)throw new Error("Payload 'args' não encontrado.");const u=JSON.parse(l),p=u[1];p.listaPrecos=o(p.listaPrecos),u[1]=p,d.set("args",JSON.stringify(u));const h=d.toString(),w={...r};w["content-type"]="application/x-www-form-urlencoded; charset=UTF-8",w["x-requested-with"]="XMLHttpRequest",e.show("<b>Enviando...</b> A requisição corrigida está sendo enviada ao servidor.","info",0);const m=await window._native_fetch(s,{method:i,headers:w,body:h}),f=await m.text();if(m.ok&&f){e.show("<b>Sucesso!</b> O produto foi salvo corretamente.","success",5e3);if(a){Object.defineProperty(a,"responseText",{value:f,writable:!0}),Object.defineProperty(a,"status",{value:m.status,writable:!0}),Object.defineProperty(a,"readyState",{value:4,writable:!0}),a.dispatchEvent(new Event("load")),a.dispatchEvent(new Event("readystatechange"))}}else throw new Error(`O servidor respondeu com erro (Status: ${m.status}).`)}catch(d){e.show(`<b>Falha Crítica:</b> ${d.message}  A ação original será executada para não travar a página.`,"error",1e4),window._native_xhr_send.call(a,c)}}XMLHttpRequest.prototype.open=function(e,o){this.__isTarget=String(o).includes(t),this.__url=o,this.__method=e,this.__headers={},window._native_xhr_open.apply(this,arguments)},XMLHttpRequest.prototype.setRequestHeader=function(e,t){this.__headers&&Object.assign(this.__headers,{[e.toLowerCase()]:t}),window._native_xhr_set_header.apply(this,arguments)},XMLHttpRequest.prototype.send=function(o){if(this.__isTarget)return void n(this.__url,this.__method,this.__headers,o,this);window._native_xhr_send.apply(this,arguments)},e.show("<b>Corretor de Preços Ativado!</b>  Pronto para interceptar a ação de salvar.","info",6e3)})();
    ```

    ![Passo 3: Configurar o Favorito](https://i.imgur.com/5uR2nIj.png )

4.  **Pronto!** O favorito aparecerá na sua barra.

---

## Como Usar

O uso é extremamente simples:

1.  Acesse a página de edição de um produto no Tiny ERP que apresenta o problema.
2.  **Clique no favorito `✅ Corrigir e Salvar Tiny`** que você acabou de criar.
3.  Uma notificação aparecerá no canto inferior direito da tela, confirmando que o corretor está ativo.
4.  Clique no botão **"Salvar"** do Tiny normalmente.
5.  O script cuidará de todo o processo de correção em segundo plano, e você verá as notificações de status mudando em tempo real.

É isso! Você só precisa clicar no favorito **uma vez por sessão** (ou seja, a cada vez que carregar a página de edição do produto).

---

## Para Desenvolvedores

O código-fonte formatado e comentado está disponível no arquivo `fetch.js`. O código do bookmarklet é uma versão "minificada" deste arquivo para garantir a compatibilidade com todos os navegadores e contornar políticas de segurança (CSP).

Se precisar fazer alterações, edite o arquivo `fetch.js` e, em seguida, use uma ferramenta de minificação de JavaScript para gerar a nova linha de código para o bookmarklet.
