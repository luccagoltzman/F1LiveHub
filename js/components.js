/**
 * Sistema de Carregamento de Componentes
 * Carrega componentes HTML e os insere no documento
 */

class ComponentLoader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Carrega um componente HTML
     * @param {string} path - Caminho do arquivo do componente
     * @returns {Promise<string>} - HTML do componente
     */
    async loadComponent(path) {
        // Verificar cache
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Erro ao carregar componente: ${path} - Status: ${response.status}`);
            }
            const html = await response.text();
            
            // Armazenar no cache
            this.cache.set(path, html);
            return html;
        } catch (error) {
            console.error(`Erro ao carregar componente ${path}:`, error);
            return '';
        }
    }

    /**
     * Carrega e insere um componente em um elemento
     * @param {string} path - Caminho do arquivo do componente
     * @param {HTMLElement|string} target - Elemento ou seletor onde inserir o componente
     * @param {string} position - Posição de inserção: 'beforebegin', 'afterbegin', 'beforeend', 'afterend'
     */
    async insertComponent(path, target, position = 'beforeend') {
        const html = await this.loadComponent(path);
        const targetElement = typeof target === 'string' 
            ? document.querySelector(target) 
            : target;

        if (!targetElement) {
            console.error(`Elemento alvo não encontrado: ${target}`);
            return;
        }

        if (position === 'replace') {
            targetElement.innerHTML = html;
        } else {
            targetElement.insertAdjacentHTML(position, html);
        }
    }

    /**
     * Carrega múltiplos componentes
     * @param {Array<{path: string, target: string|HTMLElement, position?: string}>} components
     */
    async loadComponents(components) {
        const promises = components.map(comp => 
            this.insertComponent(comp.path, comp.target, comp.position || 'beforeend')
        );
        await Promise.all(promises);
    }
}

// Instância global do carregador de componentes
const componentLoader = new ComponentLoader();

/**
 * Inicializa e carrega todos os componentes da aplicação
 */
async function initializeComponents() {
    try {
        // Carregar componentes estruturais
        await componentLoader.loadComponents([
            { path: 'components/loading.html', target: 'body', position: 'afterbegin' },
            { path: 'components/header.html', target: 'body', position: 'afterbegin' },
            { path: 'components/navigation.html', target: 'body', position: 'beforeend' },
            { path: 'components/footer.html', target: 'body', position: 'beforeend' }
        ]);

        // Carregar páginas no container principal
        const mainContainer = document.querySelector('main .container');
        if (mainContainer) {
            await componentLoader.loadComponents([
                { path: 'pages/home.html', target: mainContainer },
                { path: 'pages/drivers.html', target: mainContainer },
                { path: 'pages/teams.html', target: mainContainer },
                { path: 'pages/races.html', target: mainContainer },
                { path: 'pages/standings.html', target: mainContainer },
                { path: 'pages/news.html', target: mainContainer },
                { path: 'pages/history.html', target: mainContainer }
            ]);
        }

        // Carregar templates
        await componentLoader.loadComponent('templates/lap-by-lap.html')
            .then(html => {
                if (html) {
                    document.body.insertAdjacentHTML('beforeend', html);
                }
            });

        // Disparar evento quando todos os componentes forem carregados
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
        
    } catch (error) {
        console.error('Erro ao inicializar componentes:', error);
    }
}

// Exportar para uso em outros módulos
export { componentLoader, initializeComponents };

