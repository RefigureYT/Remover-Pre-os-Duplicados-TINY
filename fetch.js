(() => {
    // --- CONFIGURAÇÃO ---
    const TARGET_URL = "/services/produtos.server/1/salvarProduto";

    // --- BACKUP DAS FUNÇÕES NATIVAS ---
    if (!window._native_fetch) window._native_fetch = window.fetch;
    if (!window._native_xhr_open) {
        window._native_xhr_open = XMLHttpRequest.prototype.open;
        window._native_xhr_send = XMLHttpRequest.prototype.send;
        window._native_xhr_set_header = XMLHttpRequest.prototype.setRequestHeader;
    }

    // --- LÓGICA DE DEDUPLICAÇÃO (Focada e precisa) ---
    const dedupeListaPrecos = (listaPrecosObj) => {
        if (typeof listaPrecosObj !== 'object' || listaPrecosObj === null) {
            return listaPrecosObj;
        }

        const seen = new Set();
        const deduped = [];
        // Itera sobre os valores do objeto de preços
        for (const key in listaPrecosObj) {
            if (Object.hasOwnProperty.call(listaPrecosObj, key)) {
                const item = listaPrecosObj[key];
                const id = item?.idListaPreco;
                if (id && !seen.has(id)) {
                    seen.add(id);
                    deduped.push(item);
                }
            }
        }

        // Reconstrói o objeto com chaves numéricas sequenciais (1, 2, 3...)
        const newListaPrecos = {};
        deduped.forEach((item, index) => {
            newListaPrecos[index + 1] = item;
        });
        
        const originalCount = Object.keys(listaPrecosObj).length;
        const finalCount = deduped.length;

        if (originalCount > finalCount) {
             console.log(`%c[DEDUPLICAÇÃO] Sucesso! Removidos ${originalCount - finalCount} preços duplicados. (Antes: ${originalCount}, Depois: ${finalCount})`, "color:#2e7d32;font-weight:bold;");
        }

        return newListaPrecos;
    };
    
    // --- FUNÇÃO PRINCIPAL DE INTERCEPTAÇÃO E CORREÇÃO ---
    async function handleInterceptedRequest(url, method, headers, body, originalXhr) {
        console.log("%c[INTERCEPTADO]", "color: #d32f2f; font-weight: bold;", `Requisição para ${url}`);
        
        try {
            // 1. Decodifica o corpo da requisição (string) para um objeto
            const originalBodyParams = new URLSearchParams(body);
            const argsString = originalBodyParams.get('args');
            
            if (!argsString) {
                throw new Error("Campo 'args' não encontrado no corpo da requisição.");
            }

            // 2. Faz o parse do JSON dentro do campo 'args'
            const argsArray = JSON.parse(argsString);
            const produtoData = argsArray[1]; // O objeto principal do produto está no segundo elemento

            // 3. Corrige a lista de preços
            produtoData.listaPrecos = dedupeListaPrecos(produtoData.listaPrecos);

            // 4. Remonta o campo 'args' e o corpo final da requisição
            originalBodyParams.set('args', JSON.stringify(argsArray));
            const finalBody = originalBodyParams.toString();

            // 5. Prepara os headers para a nova requisição
            const finalHeaders = { ...headers };
            // Garante que os headers essenciais estejam presentes
            finalHeaders['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            finalHeaders['x-requested-with'] = 'XMLHttpRequest';
            finalHeaders['x-custom-request-for'] = 'XAJAX';
            
            console.log("%cEnviando requisição corrigida...", "color: #1976d2; font-weight: bold;");

            // 6. Envia a requisição corrigida usando o fetch nativo
            const response = await window._native_fetch(url, {
                method: method,
                headers: finalHeaders,
                body: finalBody
            });

            const responseText = await response.text();

            // 7. Devolve a resposta para o fluxo original da página
            if (response.ok && responseText) {
                console.log("%c[SUCESSO] Resposta recebida. Devolvendo para o fluxo da página.", "color: #2e7d32; font-weight: bold;");
                
                if (originalXhr) {
                    Object.defineProperty(originalXhr, 'responseText', { value: responseText, writable: true });
                    Object.defineProperty(originalXhr, 'status', { value: response.status, writable: true });
                    Object.defineProperty(originalXhr, 'readyState', { value: 4, writable: true });
                    originalXhr.dispatchEvent(new Event('load'));
                    originalXhr.dispatchEvent(new Event('readystatechange'));
                }
            } else {
                throw new Error(`A requisição corrigida falhou ou retornou uma resposta vazia. Status: ${response.status}`);
            }
        } catch (error) {
            console.error("%c[FALHA CRÍTICA]", "color: #d32f2f; font-weight: bold;", error);
            console.log("Para evitar que a página quebre, a requisição original será enviada.");
            // Como último recurso, envia a requisição original para não travar a interface
            window._native_xhr_send.call(originalXhr, body);
        }
    }

    // --- MONKEY-PATCHING (Sobrescrevendo XHR) ---
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__isTarget = String(url).includes(TARGET_URL);
        this.__url = url;
        this.__method = method;
        this.__headers = {};
        return window._native_xhr_open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
        if (this.__headers) this.__headers[k.toLowerCase()] = v;
        return window._native_xhr_set_header.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (this.__isTarget) {
            handleInterceptedRequest(this.__url, this.__method, this.__headers, body, this);
            return;
        }
        return window._native_xhr_send.apply(this, arguments);
    };

    console.log("%c[OK] Interceptor Cirúrgico v6 ativado. Pronto para corrigir e salvar.", "color: #4CAF50; font-weight: bold; font-size: 14px;");
})();
