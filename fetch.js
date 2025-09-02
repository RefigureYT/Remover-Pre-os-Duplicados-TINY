(() => {
    // =================================================================================
    // MÓDULO DE NOTIFICAÇÃO VISUAL (UI)
    // =================================================================================
    const Notifier = {
        element: null,
        timer: null,
        currentDuration: 0, // Armazena a duração atual para o evento mouseleave

        // Cores para a borda e barra de progresso
        colors: {
            info: '#58a6ff',    // Azul Claro (para o negrito e status de info)
            success: '#2e7d32', // Verde sucesso
            error: '#d32f2f',     // Vermelho erro
            warning: '#ed6c02'  // Laranja aviso
        },

        // Injeta o CSS necessário na página
        injectCSS: function() {
            const style = document.createElement('style');
            style.innerHTML = `
                #tiny-interceptor-notifier {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background-color: #202020; /* Fundo escuro */
                    color: #FFFFFF; /* Letras brancas */
                    border-left: 5px solid;
                    padding: 16px;
                    border-radius: 6px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.4);
                    z-index: 999999;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.5;
                    transition: opacity 0.3s, transform 0.3s;
                    transform: translateX(120%);
                    opacity: 0;
                    max-width: 320px;
                }
                #tiny-interceptor-notifier.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                #tiny-interceptor-notifier .message {
                    margin: 0;
                    padding: 0;
                }
                /* Cor para o texto em negrito */
                #tiny-interceptor-notifier .message b,
                #tiny-interceptor-notifier .message strong {
                    color: #58a6ff; 
                    font-weight: 600;
                }
                #tiny-interceptor-notifier .progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 4px;
                    background-color: #ddd;
                    width: 100%;
                    transition: width 0.1s linear;
                    border-bottom-left-radius: 3px;
                }
            `;
            document.head.appendChild(style);
        },

        // Cria o elemento HTML do pop-up
        createElement: function() {
            this.element = document.createElement('div');
            this.element.id = 'tiny-interceptor-notifier';
            this.element.innerHTML = `
                <p class="message"></p>
                <div class="progress-bar"></div>
            `;
            document.body.appendChild(this.element);

            // Pausa o timer quando o mouse está sobre o pop-up
            this.element.addEventListener('mouseenter', () => {
                clearTimeout(this.timer);
            });
            // Retoma o timer quando o mouse sai
            this.element.addEventListener('mouseleave', () => {
                this.hide(this.currentDuration);
            });
        },

        // Mostra uma notificação
        show: function(message, type = 'info', duration = 5000) {
            if (!this.element) this.createElement();
            
            clearTimeout(this.timer);
            this.currentDuration = duration;
            this.element.style.borderColor = this.colors[type];
            this.element.querySelector('.message').innerHTML = message;
            this.element.querySelector('.progress-bar').style.backgroundColor = this.colors[type];
            this.element.classList.add('show');

            if (duration > 0) {
                this.hide(duration);
            } else {
                // Se a duração for 0, esconde a barra de progresso
                this.element.querySelector('.progress-bar').style.width = '0%';
            }
        },

        // Esconde a notificação com uma barra de progresso
        hide: function(delay = 5000) {
            if (delay <= 0) return;

            const progressBar = this.element.querySelector('.progress-bar');
            const startTime = Date.now();
            let animationFrame;
            
            const updateProgress = () => {
                const elapsedTime = Date.now() - startTime;
                const remainingTime = delay - elapsedTime;
                if (remainingTime <= 0) {
                    progressBar.style.width = '0%';
                    this.element.classList.remove('show');
                } else {
                    const width = (remainingTime / delay) * 100;
                    progressBar.style.width = `${width}%`;
                    animationFrame = requestAnimationFrame(updateProgress);
                }
            };
            // Cancela qualquer animação anterior e inicia uma nova
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(updateProgress);
        },

        init: function() {
            this.injectCSS();
        }
    };

    // Inicializa o módulo de UI
    Notifier.init();

    // =================================================================================
    // LÓGICA PRINCIPAL DO INTERCEPTOR
    // =================================================================================
    const TARGET_URL = "/services/produtos.server/1/salvarProduto";

    // --- Backup das funções nativas para evitar auto-interceptação ---
    if (!window._native_fetch) {
        window._native_fetch = window.fetch;
    }
    if (!window._native_xhr_open) {
        window._native_xhr_open = XMLHttpRequest.prototype.open;
        window._native_xhr_send = XMLHttpRequest.prototype.send;
        window._native_xhr_set_header = XMLHttpRequest.prototype.setRequestHeader;
    }

    /**
     * Analisa um objeto de lista de preços, remove duplicatas e retorna um novo objeto.
     * Também dispara uma notificação com o resumo da operação.
     * @param {object} listaPrecosObj - O objeto original da lista de preços.
     * @returns {object} O novo objeto de lista de preços sem duplicatas.
     */
    const dedupeListaPrecos = (listaPrecosObj) => {
        if (typeof listaPrecosObj !== 'object' || listaPrecosObj === null) {
            return listaPrecosObj;
        }

        const seen = new Set();
        const deduped = [];
        // Itera sobre os valores do objeto de preços para encontrar únicos
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
        const removedCount = originalCount - finalCount;

        // *** NOVA MENSAGEM DETALHADA ***
        if (removedCount > 0) {
            Notifier.show(`<b>Correção:</b> Encontrados ${originalCount} preços, sendo ${removedCount} duplicados. ${finalCount} preços foram mantidos.`, 'info', 6000);
        }

        return newListaPrecos;
    };
    
    /**
     * A função principal que intercepta, corrige e reenvia a requisição.
     */
    async function handleInterceptedRequest(url, method, headers, body, originalXhr) {
        Notifier.show('<b>Aguarde:</b> Interceptamos a ação de salvar. Corrigindo dados...', 'info', 0);
        
        try {
            // 1. Decodifica e analisa o payload original
            const originalBodyParams = new URLSearchParams(body);
            const argsString = originalBodyParams.get('args');
            if (!argsString) {
                throw new Error("Payload 'args' não encontrado.");
            }

            // 2. Corrige os dados
            const argsArray = JSON.parse(argsString);
            const produtoData = argsArray[1];
            produtoData.listaPrecos = dedupeListaPrecos(produtoData.listaPrecos);

            // 3. Remonta o corpo da requisição
            originalBodyParams.set('args', JSON.stringify(argsArray));
            const finalBody = originalBodyParams.toString();

            // 4. Prepara os headers
            const finalHeaders = { ...headers };
            finalHeaders['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            finalHeaders['x-requested-with'] = 'XMLHttpRequest';
            
            Notifier.show('<b>Enviando...</b> A requisição corrigida está sendo enviada ao servidor.', 'info', 0);

            // 5. Envia a requisição corrigida
            const response = await window._native_fetch(url, { method, headers: finalHeaders, body: finalBody });
            const responseText = await response.text();

            // 6. Processa a resposta
            if (response.ok && responseText) {
                Notifier.show('<b>Sucesso!</b> O produto foi salvo corretamente.', 'success', 5000);
                // Devolve a resposta para o fluxo original da página
                if (originalXhr) {
                    Object.defineProperty(originalXhr, 'responseText', { value: responseText, writable: true });
                    Object.defineProperty(originalXhr, 'status', { value: response.status, writable: true });
                    Object.defineProperty(originalXhr, 'readyState', { value: 4, writable: true });
                    originalXhr.dispatchEvent(new Event('load'));
                    originalXhr.dispatchEvent(new Event('readystatechange'));
                }
            } else {
                throw new Error(`O servidor respondeu com erro (Status: ${response.status}).`);
            }
        } catch (error) {
            Notifier.show(`<b>Falha Crítica:</b> ${error.message}  
A ação original será executada para não travar a página.`, 'error', 10000);
            // Como último recurso, envia a requisição original para não travar a interface
            window._native_xhr_send.call(originalXhr, body);
        }
    }

    // --- Monkey-Patching do XMLHttpRequest ---
    XMLHttpRequest.prototype.open = function (method, url) {
        this.__isTarget = String(url).includes(TARGET_URL);
        this.__url = url;
        this.__method = method;
        this.__headers = {};
        return window._native_xhr_open.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function (k, v) {
        if (this.__headers) {
            Object.assign(this.__headers, { [k.toLowerCase()]: v });
        }
        return window._native_xhr_set_header.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function (body) {
        if (this.__isTarget) {
            handleInterceptedRequest(this.__url, this.__method, this.__headers, body, this);
            return;
        }
        return window._native_xhr_send.apply(this, arguments);
    };

    // Mensagem inicial para o usuário
    Notifier.show('<b>Corretor de Preços Ativado!</b>  Pronto para interceptar a ação de salvar.', 'info', 6000);
})();
