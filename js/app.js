import F1API from './api.js';

/**
 * Aplicação principal do F1LiveHub
 * Gerencia a aplicação, manipula o DOM e interage com a API
 */
function initializeApp() {
    // Elementos do DOM
    const navLinks = document.querySelectorAll('#bottom-nav .nav-item');
    const pages = document.querySelectorAll('.page');
    const driverGrid = document.querySelector('.drivers-grid');
    const teamsGrid = document.querySelector('.teams-grid');
    const racesList = document.querySelector('.races-list');
    const driversTable = document.querySelector('#driver-standings table tbody');
    const constructorsTable = document.querySelector('#constructor-standings table tbody');
    const quickAccessLinks = document.querySelectorAll('.quick-access .btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Elementos do DOM para as novas funcionalidades
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const quickSearchInput = document.getElementById('quick-search');
    const searchBtn = document.getElementById('search-btn');
    const searchResults = document.getElementById('search-results');
    const seasonSelect = document.getElementById('season-select');
    const historyContent = document.getElementById('history-content');
    const notificationsList = document.getElementById('notifications-list');
    const notificationBadge = document.querySelector('.notification-badge');

    // Seletor de temporada (já existe no HTML)
    const currentSeasonSelect = document.getElementById('current-season-select');
    if (currentSeasonSelect) {
        currentSeasonSelect.value = '2025'; // Define 2025 como padrão
    }

    // Bottom Navigation - Menu estilo app

    /**
     * Exibe uma mensagem de erro 
     * @param {string} message - Mensagem de erro
     * @param {HTMLElement} container - Container onde exibir a mensagem
     */
    const showError = (message, container) => {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn retry-btn">Tentar novamente</button>
            </div>
        `;
        
        const retryBtn = container.querySelector('.retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                location.reload();
            });
        }
    };

    /**
     * Função para alternar entre as abas
     * @param {Event} e - Evento de clique
     */
    const handleTabClick = (e) => {
        const targetTab = e.currentTarget.dataset.tab;
        
        // Remover classe active de todas as abas
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Adicionar classe active à aba selecionada
        e.currentTarget.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    };

    /**
     * Função para navegar entre as páginas
     * @param {Event} e - Evento de clique
     */
    const handleNavigation = (e) => {
        e.preventDefault();
        const targetPage = e.currentTarget.dataset.page;
        
        // Remover classe active de todos os links e páginas
        navLinks.forEach(link => {
            link.classList.remove('active');
            link.removeAttribute('aria-current');
        });
        pages.forEach(page => page.classList.remove('active'));
        
        // Adicionar classe active ao link e página selecionados
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-current', 'page');
        const targetPageElement = document.getElementById(targetPage);
        if (targetPageElement) {
            targetPageElement.classList.add('active');
        }
        
        // Sempre carregar os dados quando navegar para uma página, independente do dispositivo
        if (targetPage === 'drivers') {
            loadDrivers();
        } else if (targetPage === 'teams') {
            loadTeams();
        } else if (targetPage === 'races') {
            loadRaces();
        } else if (targetPage === 'standings') {
            loadStandings();
        } else if (targetPage === 'news') {
            // Carregar e inicializar embeds do Instagram de forma otimizada
            loadInstagramEmbeds();
            // Inicializar botões de compartilhamento
            initializeShareButtons();
        }
        
        // Se for um dispositivo móvel, verificar novamente após um curto período
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                // Verificar novamente se os dados foram carregados corretamente
                if (targetPage === 'drivers' && !document.querySelector('.drivers-grid .driver-card')) {
                    loadDrivers();
                } else if (targetPage === 'teams' && !document.querySelector('.teams-grid .team-card')) {
                    loadTeams();
                }
            }, 500);
        }
    };

    /**
     * Formatar nacionalidade com bandeira
     * @param {string} nationality - Nacionalidade
     * @returns {string} - HTML formatado com bandeira
     */
    const formatNationality = (nationality) => {
        const countryMap = {
            'British': 'gb',
            'German': 'de',
            'Finnish': 'fi',
            'Dutch': 'nl',
            'Australian': 'au',
            'Spanish': 'es',
            'Mexican': 'mx',
            'Canadian': 'ca',
            'Japanese': 'jp',
            'French': 'fr',
            'Danish': 'dk',
            'Italian': 'it',
            'Chinese': 'cn',
            'Thai': 'th',
            'American': 'us',
            'Brazilian': 'br',
            'Argentine': 'ar',
            'Swiss': 'ch',
            'Austrian': 'at',
            'Monaco': 'mc',
            'Belgian': 'be',
            'Portuguese': 'pt',
            'New Zealander': 'nz',
            'Russian': 'ru',
            'Swedish': 'se',
        };
        
        const countryCode = countryMap[nationality] || 'unknown';
        return `<span class="nationality"><img src="https://flagcdn.com/16x12/${countryCode}.png" alt="${nationality}" title="${nationality}"> ${nationality}</span>`;
    };

    /**
     * Formatar data para exibição
     * @param {string} dateStr - Data no formato ISO
     * @returns {string} - Data formatada
     */
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Armazenar dados originais para filtros
    let allDriversData = [];
    let allTeamsData = [];
    let allRacesData = [];
    let currentRacesView = 'grid'; // 'grid' ou 'list'

    /**
     * Função debounce para otimizar buscas
     * @param {Function} func - Função a ser executada
     * @param {number} wait - Tempo de espera em ms
     * @returns {Function} - Função com debounce aplicado
     */
    const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };

    /**
     * Criar skeleton loaders para feedback visual durante carregamento
     * @param {number} count - Número de skeletons a criar
     * @returns {string} - HTML dos skeletons
     */
    const createSkeletonLoaders = (count = 6) => {
        return Array.from({ length: count }, () => `
            <div class="skeleton-card skeleton" role="status" aria-label="Carregando">
                <div class="skeleton-header skeleton"></div>
                <div class="skeleton-image skeleton"></div>
                <div class="skeleton-line skeleton"></div>
                <div class="skeleton-line short skeleton"></div>
                <div class="skeleton-line medium skeleton"></div>
            </div>
        `).join('');
    };

    /**
     * Exibir estado vazio melhorado
     * @param {HTMLElement} container - Container onde exibir
     * @param {string} icon - Ícone Font Awesome
     * @param {string} title - Título
     * @param {string} message - Mensagem
     */
    const showEmptyState = (container, icon = 'fa-inbox', title = 'Nenhum resultado', message = 'Não encontramos nenhum resultado para sua busca.') => {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas ${icon}" aria-hidden="true"></i>
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    };

    /**
     * Sistema de Notificações
     */
    const notifications = {
        items: [],
        
        add(title, message, type = 'info') {
            const notification = {
                id: Date.now(),
                title,
                message,
                type,
                time: new Date(),
                read: false
            };
            
            this.items.unshift(notification);
            this.updateUI();
            this.updateBadge();
        },
        
        markAsRead(id) {
            const notification = this.items.find(item => item.id === id);
            if (notification) {
                notification.read = true;
                this.updateUI();
                this.updateBadge();
            }
        },
        
        updateUI() {
            if (this.items.length === 0) {
                notificationsList.innerHTML = '<p class="empty-notification">Sem notificações no momento.</p>';
                return;
            }
            
            notificationsList.innerHTML = this.items.map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                    <i class="notification-icon fas fa-${notification.type === 'info' ? 'info-circle' : notification.type === 'error' ? 'exclamation-circle' : notification.type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <div class="notification-time">${notification.time.toLocaleTimeString('pt-BR')}</div>
                    </div>
                </div>
            `).join('');
        },
        
        updateBadge() {
            const unreadCount = this.items.filter(item => !item.read).length;
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        },
        
        clear() {
            this.items = [];
            this.updateUI();
            this.updateBadge();
        }
    };

    /**
     * Ordenar e filtrar pilotos
     */
    const filterAndSortDrivers = () => {
        const sortBy = document.getElementById('driver-sort')?.value || 'position';
        const filterBy = document.getElementById('driver-filter')?.value || 'all';
        
        let filtered = [...allDriversData];
        
        // Aplicar filtro
        if (filterBy !== 'all') {
            filtered = filtered.filter(standing => standing.team.name === filterBy);
        }
        
        // Aplicar ordenação
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'points':
                    return b.points - a.points;
                case 'wins':
                    return (b.wins || 0) - (a.wins || 0);
                case 'name':
                    return a.driver.name.localeCompare(b.driver.name);
                case 'position':
                default:
                    return a.position - b.position;
            }
        });
        
        return filtered;
    };

    /**
     * Renderizar pilotos
     */
    const renderDrivers = (drivers) => {
        driverGrid.innerHTML = '';
        
        if (drivers.length === 0) {
            showEmptyState(driverGrid, 'fa-user-astronaut', 'Nenhum piloto encontrado', 'Não há pilotos que correspondam aos filtros selecionados.');
            return;
        }
        
        drivers.forEach(standing => {
            const driver = standing.driver;
            const team = standing.team;
            const driverCard = document.createElement('div');
            driverCard.className = 'driver-card';
            driverCard.setAttribute('role', 'listitem');
            driverCard.innerHTML = `
                <div class="driver-header">
                    <h3>${driver.name}</h3>
                    <div class="driver-number">${driver.number || '?'}</div>
                </div>
                <div class="driver-info">
                    <img src="${driver.image || ''}" alt="${driver.name}" loading="lazy" style="width: 100px; height: auto; margin-bottom: 10px;" onerror="this.style.display='none'">
                    <p><strong>Posição Atual:</strong> ${standing.position}º</p>
                    <p><strong>Equipe:</strong> ${team.name}</p>
                    <p><strong>Pontos:</strong> ${standing.points}</p>
                    <p><strong>Vitórias:</strong> ${standing.wins || 0}</p>
                    ${driver.abbr ? `<p><strong>Sigla:</strong> ${driver.abbr}</p>` : ''}
                </div>
            `;
            driverGrid.appendChild(driverCard);
        });
    };

    // Flags para evitar carregamentos duplicados
    let isLoadingDrivers = false;
    let isLoadingTeams = false;
    let isLoadingRaces = false;
    let isLoadingStandings = false;

    /**
     * Carregar os pilotos da temporada selecionada
     */
    const loadDrivers = async () => {
        // Evitar carregamentos duplicados
        if (isLoadingDrivers) {
            console.log('Carregamento de pilotos já em andamento, ignorando...');
            return;
        }
        
        isLoadingDrivers = true;
        
        try {
            const selectedSeason = currentSeasonSelect.value;
            driverGrid.innerHTML = createSkeletonLoaders(6);
            
            let retryCount = 0;
            const maxRetries = 3;
            let success = false;
            
            while (!success && retryCount < maxRetries) {
                try {
                    const drivers = await F1API.getCurrentDrivers(selectedSeason);
                    
                    if (drivers.length === 0) {
                        showEmptyState(driverGrid, 'fa-user-astronaut', 'Nenhum piloto encontrado', 'Não há pilotos disponíveis para esta temporada.');
                        return;
                    }
                    
                    // Armazenar dados originais
                    allDriversData = drivers;
                    
                    // Popular filtro de equipes
                    const teamFilter = document.getElementById('driver-filter');
                    if (teamFilter) {
                        const teams = [...new Set(drivers.map(d => d.team.name))].sort();
                        teamFilter.innerHTML = '<option value="all">Todas as equipes</option>' + 
                            teams.map(team => `<option value="${team}">${team}</option>`).join('');
                    }
                    
                    // Renderizar pilotos
                    renderDrivers(filterAndSortDrivers());
                    
                    // Marcar como sucesso para sair do loop
                    success = true;
                    
                    // Notificação de sucesso para dispositivos móveis
                    if (window.innerWidth <= 768) {
                        notifications.add(
                            'Pilotos Carregados',
                            'Os dados dos pilotos foram carregados com sucesso!',
                            'success'
                        );
                    }
                } catch (retryError) {
                    console.error(`Tentativa ${retryCount + 1} falhou: ${retryError.message}`);
                    retryCount++;
                    
                    // Esperar antes de tentar novamente (tempo exponencial)
                    if (retryCount < maxRetries) {
                        const waitTime = 1000 * Math.pow(2, retryCount);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
            }
            
            // Se todas as tentativas falharam, exibir o erro
            if (!success) {
                throw new Error('Erro após várias tentativas');
            }
        } catch (error) {
            console.error('Erro ao carregar pilotos:', error);
            
            // Mensagem específica para erro 429
            const isRateLimit = error.response && error.response.status === 429;
            const errorMessage = isRateLimit 
                ? 'Muitas requisições. Aguarde alguns instantes e tente novamente.'
                : 'Erro ao carregar os pilotos. Por favor, tente novamente.';
            
            showError(errorMessage, driverGrid);
            
            // Notificar o usuário sobre o erro
            notifications.add(
                'Erro ao Carregar Pilotos',
                isRateLimit 
                    ? 'Limite de requisições atingido. Aguarde um momento.'
                    : 'Não foi possível carregar os dados. Tente novamente mais tarde.',
                'error'
            );
        } finally {
            isLoadingDrivers = false;
        }
    };

    /**
     * Ordenar equipes
     */
    const filterAndSortTeams = () => {
        const sortBy = document.getElementById('team-sort')?.value || 'position';
        
        let sorted = [...allTeamsData];
        
        // Aplicar ordenação
        sorted.sort((a, b) => {
            switch (sortBy) {
                case 'points':
                    return b.points - a.points;
                case 'wins':
                    return (b.wins || 0) - (a.wins || 0);
                case 'name':
                    return a.team.name.localeCompare(b.team.name);
                case 'position':
                default:
                    return a.position - b.position;
            }
        });
        
        return sorted;
    };

    /**
     * Renderizar equipes
     */
    const renderTeams = (teams) => {
        teamsGrid.innerHTML = '';
        
        if (teams.length === 0) {
            showEmptyState(teamsGrid, 'fa-car-side', 'Nenhuma equipe encontrada', 'Não há equipes disponíveis para esta temporada.');
            return;
        }
        
        teams.forEach(standing => {
            const team = standing.team;
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.setAttribute('role', 'listitem');
            teamCard.innerHTML = `
                <div class="team-header">
                    <h3>${team.name}</h3>
                </div>
                <div class="team-info">
                    <img src="${team.logo || ''}" alt="${team.name}" loading="lazy" style="width: 150px; height: auto; margin-bottom: 10px;" onerror="this.style.display='none'">
                    <p><strong>Posição Atual:</strong> ${standing.position}º</p>
                    <p><strong>Pontos:</strong> ${standing.points}</p>
                    <p><strong>Vitórias:</strong> ${standing.wins || 0}</p>
                </div>
            `;
            teamsGrid.appendChild(teamCard);
        });
    };

    /**
     * Carregar as equipes da temporada selecionada
     */
    const loadTeams = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            teamsGrid.innerHTML = createSkeletonLoaders(6);
            
            let retryCount = 0;
            const maxRetries = 3;
            let success = false;
            
            while (!success && retryCount < maxRetries) {
                try {
                    const constructors = await F1API.getCurrentConstructors(selectedSeason);
                    
                    if (constructors.length === 0) {
                        showEmptyState(teamsGrid, 'fa-car-side', 'Nenhuma equipe encontrada', 'Não há equipes disponíveis para esta temporada.');
                        return;
                    }
                    
                    // Armazenar dados originais
                    allTeamsData = constructors;
                    
                    // Renderizar equipes
                    renderTeams(filterAndSortTeams());
                    
                    // Marcar como sucesso para sair do loop
                    success = true;
                    
                    // Notificação de sucesso para dispositivos móveis
                    if (window.innerWidth <= 768) {
                        notifications.add(
                            'Equipes Carregadas',
                            'Os dados das equipes foram carregados com sucesso!',
                            'success'
                        );
                    }
                } catch (retryError) {
                    console.error(`Tentativa ${retryCount + 1} falhou: ${retryError.message}`);
                    
                    // Se for erro 429, aguardar mais tempo
                    const isRateLimit = retryError.response && retryError.response.status === 429;
                    
                    retryCount++;
                    
                    // Esperar antes de tentar novamente (tempo exponencial, maior para 429)
                    if (retryCount < maxRetries) {
                        let waitTime;
                        if (isRateLimit) {
                            // Para 429, aguardar mais tempo (60s, 120s, 240s)
                            waitTime = 60000 * Math.pow(2, retryCount - 1);
                        } else {
                            // Para outros erros, tempo exponencial normal
                            waitTime = 1000 * Math.pow(2, retryCount);
                        }
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                }
            }
            
            // Se todas as tentativas falharam, exibir o erro
            if (!success) {
                throw new Error('Erro após várias tentativas');
            }
        } catch (error) {
            console.error('Erro ao carregar equipes:', error);
            
            // Mensagem específica para erro 429
            const isRateLimit = error.response && error.response.status === 429;
            const errorMessage = isRateLimit 
                ? 'Muitas requisições. Aguarde alguns instantes e tente novamente.'
                : 'Erro ao carregar as equipes. Por favor, tente novamente.';
            
            showError(errorMessage, teamsGrid);
            
            // Notificar o usuário sobre o erro
            notifications.add(
                'Erro ao Carregar Equipes',
                isRateLimit 
                    ? 'Limite de requisições atingido. Aguarde um momento.'
                    : 'Não foi possível carregar os dados. Tente novamente mais tarde.',
                'error'
            );
        } finally {
            isLoadingTeams = false;
        }
    };

    /**
     * Filtrar e ordenar corridas
     */
    const filterAndSortRaces = () => {
        const filterBy = document.getElementById('race-filter')?.value || 'all';
        const sortBy = document.getElementById('race-sort')?.value || 'date';
        const searchQuery = document.getElementById('race-search')?.value.toLowerCase() || '';
        
        let filtered = [...allRacesData];
        
        // Aplicar filtro de status
        if (filterBy === 'upcoming') {
            filtered = filtered.filter(gp => !gp.isPast);
        } else if (filterBy === 'past') {
            filtered = filtered.filter(gp => gp.isPast);
        }
        
        // Aplicar busca
        if (searchQuery) {
            filtered = filtered.filter(gp => 
                gp.competition.name.toLowerCase().includes(searchQuery) ||
                gp.circuit.name.toLowerCase().includes(searchQuery) ||
                gp.country.toLowerCase().includes(searchQuery) ||
                gp.city.toLowerCase().includes(searchQuery)
            );
        }
        
        // Aplicar ordenação
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.competition.name.localeCompare(b.competition.name);
                case 'country':
                    return a.country.localeCompare(b.country);
                case 'date':
                default:
                    const dateA = new Date(a.startDate);
                    const dateB = new Date(b.startDate);
                    return dateA - dateB;
            }
        });
        
        return filtered;
    };

    /**
     * Renderizar corridas
     */
    const renderRaces = (races) => {
        const racesListContainer = document.getElementById('races-list-container');
        const racesStats = document.getElementById('races-stats');
        
        if (!racesListContainer) {
            console.error('races-list-container não encontrado!');
            return;
        }
        
        console.log('Renderizando corridas:', races.length);
        racesListContainer.innerHTML = '';
        
        if (races.length === 0) {
            showEmptyState(racesListContainer, 'fa-flag-checkered', 'Nenhuma corrida encontrada', 'Não há corridas que correspondam aos filtros selecionados.');
            if (racesStats) racesStats.innerHTML = '';
            return;
        }
        
        // Calcular estatísticas
        const upcomingCount = races.filter(gp => !gp.isPast).length;
        const pastCount = races.filter(gp => gp.isPast).length;
        
        if (racesStats) {
            racesStats.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon upcoming">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${upcomingCount}</div>
                            <div class="stat-label">Próximas Corridas</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon past">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${pastCount}</div>
                            <div class="stat-label">Corridas Concluídas</div>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon total">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${races.length}</div>
                            <div class="stat-label">Total de GPs</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Determinar classe de visualização
        const viewClass = currentRacesView === 'list' ? 'races-list-view' : 'races-grid-view';
        racesListContainer.className = `races-list ${viewClass}`;
        
        races.forEach((gp, index) => {
            const startDate = new Date(gp.startDate);
            const endDate = new Date(gp.endDate);
            const daysUntil = Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24));
            
            const gpCard = document.createElement('div');
            gpCard.className = `race-card ${gp.isPast ? 'past' : 'upcoming'}`;
            gpCard.dataset.gpIndex = gp.originalIndex;
            gpCard.setAttribute('role', 'listitem');
            
            // Formatar data de forma mais clara
            const dateFormat = startDate.toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'short', 
                year: 'numeric' 
            });
            const endDateFormat = endDate.toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'short' 
            });
            
            // Determinar status mais detalhado
            let statusText = 'Em breve';
            let statusClass = 'upcoming';
            if (gp.isPast) {
                statusText = 'Concluído';
                statusClass = 'past';
            } else if (daysUntil <= 7 && daysUntil > 0) {
                statusText = `Em ${daysUntil} dia${daysUntil > 1 ? 's' : ''}`;
                statusClass = 'soon';
            } else if (daysUntil <= 0) {
                statusText = 'Hoje';
                statusClass = 'today';
            }
            
            gpCard.innerHTML = `
                <div class="race-card-header">
                    <div class="race-round">${gp.round}</div>
                    <div class="race-status-badge ${statusClass}">
                        <i class="fas fa-${statusClass === 'past' ? 'check-circle' : statusClass === 'today' ? 'clock' : 'calendar-alt'}"></i>
                        <span>${statusText}</span>
                    </div>
                </div>
                <div class="race-card-body">
                    <div class="race-main-info">
                        <h3 class="race-name">${gp.competition.name}</h3>
                        <div class="race-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${gp.circuit.name}</span>
                        </div>
                        <div class="race-location-details">
                            <span>${gp.city}, ${gp.country}</span>
                        </div>
                    </div>
                    <div class="race-dates">
                        <div class="race-date-main">
                            <i class="far fa-calendar"></i>
                            <div class="date-content">
                                <div class="date-start">${dateFormat}</div>
                                ${startDate.toDateString() !== endDate.toDateString() ? 
                                    `<div class="date-separator">até</div>
                                     <div class="date-end">${endDateFormat}</div>` : ''
                                }
                            </div>
                        </div>
                        <div class="race-events-count">
                            <i class="fas fa-list"></i>
                            <span>${gp.events.length} evento${gp.events.length > 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>
                <div class="race-card-footer">
                    <button class="btn view-events-btn">
                        <i class="fas fa-eye"></i>
                        <span>Ver Detalhes</span>
                    </button>
                </div>
            `;
            
            racesListContainer.appendChild(gpCard);
        });
        
        console.log(`Cards de corridas renderizados: ${racesListContainer.children.length}`);
    };

    /**
     * Carregar o calendário de corridas da temporada selecionada
     */
    const loadRaces = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            const racesListContainer = document.getElementById('races-list-container');
            if (!racesListContainer) return;
            
            racesListContainer.innerHTML = '<div class="loading">Carregando calendário de corridas...</div>';
            
            const races = await F1API.getCurrentRaces(selectedSeason);
            
            console.log('Corridas carregadas da API:', races.length);
            
            if (races.length === 0) {
                console.log('Nenhuma corrida encontrada');
                showEmptyState(racesListContainer, 'fa-flag-checkered', 'Nenhuma corrida encontrada', 'Não há corridas disponíveis para esta temporada.');
                return;
            }
            
            // Agrupar corridas por Grand Prix (localização/competição)
            const grandPrixEvents = {};
            
            races.forEach(race => {
                const gpKey = race.competition.location.country + '-' + race.competition.id;
                if (!grandPrixEvents[gpKey]) {
                    grandPrixEvents[gpKey] = {
                        competition: race.competition,
                        circuit: race.circuit,
                        country: race.competition.location.country,
                        city: race.competition.location.city,
                        events: []
                    };
                }
                grandPrixEvents[gpKey].events.push(race);
            });
            
            console.log('Grand Prix agrupados:', Object.keys(grandPrixEvents).length);
            
            // Ordenar os GPs por data do primeiro evento
            const sortedGPs = Object.values(grandPrixEvents).sort((a, b) => {
                const dateA = new Date(a.events[0].date);
                const dateB = new Date(b.events[0].date);
                return dateA - dateB;
            });
            
            // Armazenar dados originais
            allRacesData = sortedGPs.map((gp, index) => {
                const now = new Date();
                const latestEvent = gp.events.reduce((latest, event) => {
                    return new Date(event.date) > new Date(latest.date) ? event : latest;
                }, gp.events[0]);
                const isPast = new Date(latestEvent.date) < now;
                const startDate = new Date(gp.events[0].date);
                const endDate = new Date(latestEvent.date);
                
                return {
                    ...gp,
                    isPast,
                    startDate,
                    endDate,
                    round: index + 1,
                    originalIndex: index
                };
            });
            
            console.log('Dados de corridas processados:', allRacesData.length);
            
            // Renderizar corridas
            const filteredRaces = filterAndSortRaces();
            console.log('Corridas filtradas para renderização:', filteredRaces.length);
            renderRaces(filteredRaces);
        } catch (error) {
            console.error('Erro ao carregar corridas:', error);
            const racesListContainer = document.getElementById('races-list-container');
            if (racesListContainer) {
                showError('Erro ao carregar o calendário de corridas. Por favor, tente novamente.', racesListContainer);
            }
            
            notifications.add(
                'Erro ao Carregar Corridas',
                'Não foi possível carregar o calendário. Tente novamente mais tarde.',
                'error'
            );
        }
    };

    /**
     * Carregar a classificação de pilotos e construtores da temporada selecionada
     */
    const loadStandings = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            // Carregar classificação de pilotos
            document.querySelector('#driver-standings .loading-table').style.display = 'flex';
            driversTable.innerHTML = '';
            
            const driverStandings = await F1API.getCurrentDriverStandings(selectedSeason);
            
            if (driverStandings.length > 0) {
                driverStandings.forEach(standing => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="col-position">${standing.position}</td>
                        <td class="col-driver">${standing.driver.name}</td>
                        <td class="col-team hide-on-mobile">${standing.team.name}</td>
                        <td class="col-points">${standing.points}</td>
                        <td class="col-wins hide-on-mobile">${standing.wins}</td>
                    `;
                    
                    driversTable.appendChild(row);
                });
            } else {
                driversTable.innerHTML = '<tr><td colspan="5">Nenhum dado de classificação disponível.</td></tr>';
            }
            
            document.querySelector('#driver-standings .loading-table').style.display = 'none';
            
            // Carregar classificação de construtores
            document.querySelector('#constructor-standings .loading-table').style.display = 'flex';
            constructorsTable.innerHTML = '';
            
            const constructorStandings = await F1API.getCurrentConstructorStandings(selectedSeason);
            
            if (constructorStandings.length > 0) {
                constructorStandings.forEach(standing => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="col-position">${standing.position}</td>
                        <td class="col-team">${standing.team.name}</td>
                        <td class="col-points">${standing.points}</td>
                        <td class="col-wins hide-on-mobile">${standing.wins || 0}</td>
                    `;
                    
                    constructorsTable.appendChild(row);
                });
            } else {
                constructorsTable.innerHTML = '<tr><td colspan="4">Nenhum dado de classificação disponível.</td></tr>';
            }
            
            document.querySelector('#constructor-standings .loading-table').style.display = 'none';
        } catch (error) {
            showError('Erro ao carregar as classificações. Por favor, tente novamente.', document.querySelector('#standings'));
        }
    };

    // Adicionar eventos de navegação
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Adicionar eventos para os links de acesso rápido
    quickAccessLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Adicionar eventos para as abas
    tabButtons.forEach(btn => {
        btn.addEventListener('click', handleTabClick);
    });

    // Eventos para filtros e ordenação de pilotos
    const driverSortSelect = document.getElementById('driver-sort');
    const driverFilterSelect = document.getElementById('driver-filter');
    
    if (driverSortSelect) {
        driverSortSelect.addEventListener('change', () => {
            renderDrivers(filterAndSortDrivers());
        });
    }
    
    if (driverFilterSelect) {
        driverFilterSelect.addEventListener('change', () => {
            renderDrivers(filterAndSortDrivers());
        });
    }

    // Busca de pilotos com debounce
    const driverSearchInput = document.getElementById('driver-search');
    if (driverSearchInput) {
        const debouncedDriverSearch = debounce((query) => {
            if (!query.trim()) {
                renderDrivers(filterAndSortDrivers());
                return;
            }
            
            const filtered = allDriversData.filter(standing => 
                standing.driver.name.toLowerCase().includes(query.toLowerCase()) ||
                standing.team.name.toLowerCase().includes(query.toLowerCase())
            );
            renderDrivers(filtered);
        }, 300);
        
        driverSearchInput.addEventListener('input', (e) => {
            debouncedDriverSearch(e.target.value);
        });
    }

    // Eventos para ordenação de equipes
    const teamSortSelect = document.getElementById('team-sort');
    if (teamSortSelect) {
        teamSortSelect.addEventListener('change', () => {
            renderTeams(filterAndSortTeams());
        });
    }

    // Busca de equipes com debounce
    const teamSearchInput = document.getElementById('team-search');
    if (teamSearchInput) {
        const debouncedTeamSearch = debounce((query) => {
            if (!query.trim()) {
                renderTeams(filterAndSortTeams());
                return;
            }
            
            const filtered = allTeamsData.filter(standing => 
                standing.team.name.toLowerCase().includes(query.toLowerCase())
            );
            renderTeams(filtered);
        }, 300);
        
        teamSearchInput.addEventListener('input', (e) => {
            debouncedTeamSearch(e.target.value);
        });
    }

    // Eventos para filtros e ordenação de corridas
    const raceFilterSelect = document.getElementById('race-filter');
    const raceSortSelect = document.getElementById('race-sort');
    const raceSearchInput = document.getElementById('race-search');
    const viewToggleBtn = document.getElementById('view-toggle');
    
    if (raceFilterSelect) {
        raceFilterSelect.addEventListener('change', () => {
            renderRaces(filterAndSortRaces());
        });
    }
    
    if (raceSortSelect) {
        raceSortSelect.addEventListener('change', () => {
            renderRaces(filterAndSortRaces());
        });
    }
    
    if (raceSearchInput) {
        const debouncedRaceSearch = debounce((query) => {
            renderRaces(filterAndSortRaces());
        }, 300);
        
        raceSearchInput.addEventListener('input', (e) => {
            debouncedRaceSearch(e.target.value);
        });
    }
    
    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', () => {
            currentRacesView = currentRacesView === 'grid' ? 'list' : 'grid';
            const icon = viewToggleBtn.querySelector('i');
            if (currentRacesView === 'list') {
                icon.className = 'fas fa-th-large';
                viewToggleBtn.setAttribute('title', 'Visualização em grid');
            } else {
                icon.className = 'fas fa-th';
                viewToggleBtn.setAttribute('title', 'Visualização em lista');
            }
            renderRaces(filterAndSortRaces());
        });
    }

    // Event delegation para botões de detalhes das corridas
    const racesListContainer = document.getElementById('races-list-container');
    if (racesListContainer) {
        racesListContainer.addEventListener('click', (e) => {
            if (e.target.closest('.view-events-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.view-events-btn');
                const gpCard = btn.closest('.race-card');
                const gpIndex = parseInt(gpCard.dataset.gpIndex);
                const gp = allRacesData.find(g => g.originalIndex === gpIndex);
                if (!gp) return;
                
                // Criar modal com os eventos do GP
                const modal = document.createElement('div');
                modal.className = 'modal';
                
                // Ordenar eventos por data
                const sortedEvents = [...gp.events].sort((a, b) => new Date(a.date) - new Date(b.date));
                
                modal.innerHTML = `
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <h2>${gp.competition.name}</h2>
                        <p><i class="fas fa-map-marker-alt"></i> ${gp.circuit.name}, ${gp.city}, ${gp.country}</p>
                        
                        <h3 class="mt-4"><i class="fas fa-calendar-alt"></i> Eventos</h3>
                        <div class="events-list">
                            ${sortedEvents.map(event => {
                                const eventDate = new Date(event.date);
                                const isPastEvent = eventDate < new Date();
                                
                                // Definir ícone com base no tipo de evento
                                let eventIcon = 'flag-checkered';
                                let eventTypeLabel = 'Sessão';
                                
                                if (event.type) {
                                    const type = event.type.toLowerCase();
                                    if (type.includes('treino') || type.includes('practice')) {
                                        eventIcon = 'stopwatch';
                                        eventTypeLabel = 'Treino Livre';
                                    } else if (type.includes('classificação') || type.includes('qualifying')) {
                                        eventIcon = 'chart-line';
                                        eventTypeLabel = 'Classificação';
                                    } else if (type.includes('sprint')) {
                                        eventIcon = 'tachometer-alt';
                                        eventTypeLabel = 'Sprint';
                                    } else if (type.includes('corrida') || type.includes('race')) {
                                        eventIcon = 'flag-checkered';
                                        eventTypeLabel = 'Corrida';
                                    }
                                }
                                
                                // Formatar data e hora
                                const formattedDate = eventDate.toLocaleDateString('pt-BR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });
                                
                                // Formatar hora se disponível
                                const formattedTime = event.time 
                                    ? new Date(`2023-01-01T${event.time}`).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      }) 
                                    : 'Horário não definido';
                                
                                return `
                                    <div class="event-card ${isPastEvent ? 'past' : 'upcoming'}">
                                        <div class="event-icon">
                                            <i class="fas fa-${eventIcon}"></i>
                                        </div>
                                        <div class="event-details">
                                            <div class="event-type">${event.type || eventTypeLabel}</div>
                                            <h4>${event.name || event.type || 'Evento'}</h4>
                                            <p><i class="far fa-calendar"></i> ${formattedDate}</p>
                                            <p><i class="far fa-clock"></i> ${formattedTime}</p>
                                        </div>
                                        ${isPastEvent && event.id ? `
                                            <button class="btn results-btn" data-race-id="${event.id}">
                                                <i class="fas fa-trophy"></i> Resultados
                                            </button>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
                // Fechar modal
                modal.querySelector('.close').addEventListener('click', () => {
                    document.body.removeChild(modal);
                });
                
                // Fechar com clique fora
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        document.body.removeChild(modal);
                    }
                });
                
                // Adicionar evento para botões de resultados dentro do modal
                modal.querySelectorAll('.results-btn').forEach(resultBtn => {
                    resultBtn.addEventListener('click', async (e) => {
                        const raceId = e.currentTarget.dataset.raceId;
                        
                        // Encontrar o evento correspondente
                        const eventData = sortedEvents.find(ev => ev.id == raceId);
                        if (!eventData) return;
                        
                        try {
                            e.currentTarget.textContent = 'Carregando...';
                            e.currentTarget.disabled = true;
                            
                            const results = await F1API.getRaceResults(raceId);
                            
                            // Criar modal para exibir os resultados
                            const resultsModal = document.createElement('div');
                            resultsModal.className = 'modal results-modal';
                            resultsModal.innerHTML = `
                                <div class="modal-content">
                                    <span class="close">&times;</span>
                                    <h2><i class="fas fa-trophy"></i> Resultados</h2>
                                    <p><i class="fas fa-info-circle"></i> ${eventData.name || eventData.type || 'Evento'} - ${new Date(eventData.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    
                                    <table class="results-table">
                                        <thead>
                                            <tr>
                                                <th class="col-position" width="50">Pos</th>
                                                <th class="col-driver">Piloto</th>
                                                <th class="col-team hide-on-mobile">Equipe</th>
                                                <th class="col-points hide-on-mobile" width="60">Pontos</th>
                                                <th class="col-status">Tempo/Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${results.map((result, index) => {
                                                // Destacar os três primeiros colocados
                                                let positionClass = 'col-position';
                                                if (index === 0) positionClass += ' position-gold';
                                                else if (index === 1) positionClass += ' position-silver';
                                                else if (index === 2) positionClass += ' position-bronze';
                                                
                                                // Verificar se o status indica abandono
                                                const statusClass = (result.status && result.status.toLowerCase().includes('retired')) ? 'col-status retired' : 'col-status';
                                                
                                                return `
                                                    <tr>
                                                        <td class="${positionClass}" data-label="Pos">${result.position}</td>
                                                        <td class="col-driver" data-label="Piloto"><strong>${result.driver.name}</strong></td>
                                                        <td class="col-team hide-on-mobile" data-label="Equipe">${result.team.name}</td>
                                                        <td class="col-points hide-on-mobile" data-label="Pontos">${result.points}</td>
                                                        <td class="${statusClass}" data-label="Tempo/Status" data-status="${result.status || ''}">${result.time || result.status || 'N/A'}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            `;
                            
                            document.body.appendChild(resultsModal);
                            
                            // Melhorar a aparência da tabela de resultados
                            enhanceTableAppearance();
                            
                            // Fechar modal de resultados
                            resultsModal.querySelector('.close').addEventListener('click', () => {
                                document.body.removeChild(resultsModal);
                            });
                            
                            // Fechar com clique fora
                            resultsModal.addEventListener('click', (e) => {
                                if (e.target === resultsModal) {
                                    document.body.removeChild(resultsModal);
                                }
                            });
                            
                            e.currentTarget.textContent = 'Ver resultados';
                            e.currentTarget.disabled = false;
                        } catch (error) {
                            e.currentTarget.textContent = 'Erro';
                            setTimeout(() => {
                                e.currentTarget.textContent = 'Ver resultados';
                                e.currentTarget.disabled = false;
                            }, 2000);
                        }
                    });
                });
            }
        });
    }
    
    // Carregar a página inicial com os dados de pilotos
    loadDrivers();

    /**
     * Alternar entre tema claro e escuro
     */
    const toggleTheme = () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Atualizar ícone do botão
        themeToggleBtn.innerHTML = `<i class="fas fa-${newTheme === 'light' ? 'moon' : 'sun'}"></i>`;
    };


    /**
     * Realizar busca rápida com debounce
     * @param {string} query - Texto da busca
     */
    const performQuickSearch = async (query) => {
        if (!query.trim()) {
            searchResults.innerHTML = '';
            return;
        }

        try {
            searchResults.innerHTML = '<div class="loading">Buscando...</div>';
            
            const [drivers, constructors] = await Promise.all([
                F1API.searchDrivers(query),
                F1API.searchConstructors(query)
            ]);

            if (drivers.length === 0 && constructors.length === 0) {
                showEmptyState(searchResults, 'fa-search', 'Nenhum resultado encontrado', 'Tente buscar por outro termo.');
                return;
            }

            searchResults.innerHTML = '';
            
            // Exibir resultados de pilotos
            drivers.forEach(driver => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.setAttribute('role', 'listitem');
                resultItem.innerHTML = `
                    <div class="search-result-info">
                        <h4>${driver.givenName} ${driver.familyName}</h4>
                        <p>Piloto - ${formatNationality(driver.nationality)}</p>
                    </div>
                `;
                searchResults.appendChild(resultItem);
            });

            // Exibir resultados de equipes
            constructors.forEach(constructor => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.setAttribute('role', 'listitem');
                resultItem.innerHTML = `
                    <div class="search-result-info">
                        <h4>${constructor.name}</h4>
                        <p>Equipe - ${formatNationality(constructor.nationality)}</p>
                    </div>
                `;
                searchResults.appendChild(resultItem);
            });
        } catch (error) {
            searchResults.innerHTML = '<p class="error-message">Erro ao realizar a busca.</p>';
        }
    };

    /**
     * Carregar temporadas disponíveis
     */
    const loadSeasons = async () => {
        try {
            const seasons = await F1API.getSeasons();
            seasonSelect.innerHTML = '<option value="">Selecione uma temporada...</option>';
            
            seasons.reverse().forEach(season => {
                const option = document.createElement('option');
                option.value = season.season;
                option.textContent = `Temporada ${season.season}`;
                seasonSelect.appendChild(option);
            });
        } catch (error) {
            seasonSelect.innerHTML = '<option value="">Erro ao carregar temporadas</option>';
        }
    };

    /**
     * Carregar dados de uma temporada específica
     * @param {string} year - Ano da temporada
     */
    const loadSeasonData = async (year) => {
        try {
            historyContent.innerHTML = '<div class="loading">Carregando dados da temporada...</div>';
            
            const seasonData = await F1API.getSeasonData(year);
            
            historyContent.innerHTML = `
                <div class="season-summary">
                    <h3>Temporada ${year}</h3>
                    <div class="season-stats">
                        <p><strong>Total de Corridas:</strong> ${seasonData.races.length}</p>
                        <p><strong>Pilotos Participantes:</strong> ${seasonData.drivers.length}</p>
                        <p><strong>Equipes Participantes:</strong> ${seasonData.constructors.length}</p>
                    </div>
                    
                    <div class="season-standings">
                        <h4>Classificação Final - Pilotos</h4>
                        <table class="standings-table">
                            <thead>
                                <tr>
                                    <th class="col-position">Pos</th>
                                    <th class="col-driver">Piloto</th>
                                    <th class="col-points">Pontos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${seasonData.driverStandings.slice(0, 10).map(standing => `
                                    <tr>
                                        <td class="col-position">${standing.position}</td>
                                        <td class="col-driver">${standing.Driver.givenName} ${standing.Driver.familyName}</td>
                                        <td class="col-points">${standing.points}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        
                        <h4>Classificação Final - Construtores</h4>
                        <table class="standings-table">
                            <thead>
                                <tr>
                                    <th class="col-position">Pos</th>
                                    <th class="col-team">Equipe</th>
                                    <th class="col-points">Pontos</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${seasonData.constructorStandings.map(standing => `
                                    <tr>
                                        <td class="col-position">${standing.position}</td>
                                        <td class="col-team">${standing.Constructor.name}</td>
                                        <td class="col-points">${standing.points}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Adicionar interatividade às tabelas após carregamento
            setTimeout(() => {
                enhanceTableAppearance();
            }, 300);
        } catch (error) {
            historyContent.innerHTML = '<p class="error-message">Erro ao carregar dados da temporada.</p>';
        }
    };


    // Event Listeners para as novas funcionalidades
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    // Aplicar debounce na busca rápida
    const debouncedQuickSearch = debounce((query) => {
        performQuickSearch(query);
    }, 300);

    quickSearchInput.addEventListener('input', (e) => {
        debouncedQuickSearch(e.target.value);
    });
    
    searchBtn.addEventListener('click', () => {
        performQuickSearch(quickSearchInput.value);
    });
    
    seasonSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            loadSeasonData(e.target.value);
        }
    });
    
    notificationsList.addEventListener('click', (e) => {
        const notificationItem = e.target.closest('.notification-item');
        if (notificationItem) {
            const id = parseInt(notificationItem.dataset.id);
            notifications.markAsRead(id);
        }
    });

    // Adicionar observador de interseção para animar elementos quando entrarem na viewport
    const setupIntersectionObserver = () => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        
        // Observar grids e listas
        document.querySelectorAll('.drivers-grid, .teams-grid, .races-list').forEach(grid => {
            observer.observe(grid);
        });
    };

    // Adicionar efeito de hover para os cards de corrida
    const setupRaceCardEffects = () => {
        document.querySelectorAll('.race-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transition = 'all 0.3s ease';
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transition = 'all 0.3s ease';
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'var(--card-shadow)';
            });
        });
    };

    // Melhoria para o tema alternado
    const enhanceThemeToggle = () => {
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (!themeToggleBtn) return;
        
        // Usar requestIdleCallback quando disponível para melhor performance
        const schedulePulse = (callback) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(callback, { timeout: 2000 });
            } else {
                setTimeout(callback, 2000);
            }
        };
        
        // Pulsar o botão de tema quando a página carregar (reduzido de 3s para 2s)
        schedulePulse(() => {
            themeToggleBtn.classList.add('pulse');
            setTimeout(() => {
                themeToggleBtn.classList.remove('pulse');
            }, 1000);
        });
    };

    // Função para exibir notificação de carregamento completo
    const showPageLoadedNotification = () => {
        // Usar requestIdleCallback para melhor performance
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                notifications.add(
                    'Página Carregada',
                    'Todos os dados foram carregados com sucesso!',
                    'success'
                );
            }, { timeout: 1000 });
        } else {
            setTimeout(() => {
                notifications.add(
                    'Página Carregada',
                    'Todos os dados foram carregados com sucesso!',
                    'success'
                );
            }, 1000);
        }
    };

    // Função para melhorar o posicionamento das tabelas
    const enhanceTableAppearance = () => {
        // Verificar se é display móvel
        const isMobile = window.innerWidth <= 768;
        
        // Destacar a linha da tabela quando o usuário passar o mouse (apenas em desktop)
        if (!isMobile) {
            document.querySelectorAll('.standings-table tbody tr, .results-table tbody tr').forEach((row, index) => {
                row.addEventListener('mouseenter', () => {
                    row.style.backgroundColor = 'rgba(0, 0, 0, 0.03)';
                    
                    // Destacar a posição com cores especiais para os 3 primeiros
                    const posCell = row.querySelector('.col-position');
                    if (posCell) {
                        if (index === 0) {
                            posCell.style.color = 'gold';
                            posCell.style.fontWeight = '800';
                        } else if (index === 1) {
                            posCell.style.color = 'silver';
                            posCell.style.fontWeight = '800';
                        } else if (index === 2) {
                            posCell.style.color = '#cd7f32'; // Bronze
                            posCell.style.fontWeight = '800';
                        }
                    }
                });
                
                row.addEventListener('mouseleave', () => {
                    row.style.backgroundColor = '';
                    
                    // Restaurar estilos
                    const posCell = row.querySelector('.col-position');
                    if (posCell) {
                        posCell.style.color = '';
                        posCell.style.fontWeight = '';
                    }
                });
            });
        }
        
        // Aplicar estilos adicionais às tabelas de resultados
        document.querySelectorAll('.results-table').forEach(table => {
            // Verificar se é uma tabela de resultados aberta recentemente
            if (!table.classList.contains('enhanced')) {
                table.classList.add('enhanced');
                
                // Adicionar tooltip para status longos
                table.querySelectorAll('.col-status').forEach(cell => {
                    if (cell.textContent.length > 15) {
                        cell.setAttribute('title', cell.textContent);
                        cell.style.cursor = 'help';
                    }
                });
                
                // Adicionar destaque para pontos importantes
                table.querySelectorAll('.col-points').forEach(cell => {
                    const points = parseInt(cell.textContent);
                    if (points >= 15) {
                        cell.style.fontWeight = '700';
                    }
                });
            }
        });
        
        // Atualizar quando o tamanho da tela mudar
        window.addEventListener('resize', () => {
            const newIsMobile = window.innerWidth <= 768;
            // Se o estado de mobile/desktop mudar, atualize a aparência
            if (newIsMobile !== isMobile) {
                setTimeout(() => enhanceTableAppearance(), 300);
            }
        }, { passive: true });
    };

    // Atualizar imagens com lazy loading para melhor performance
    const setupLazyLoading = () => {
        if ('loading' in HTMLImageElement.prototype) {
            document.querySelectorAll('img').forEach(img => {
                img.setAttribute('loading', 'lazy');
            });
        }
    };

    /* Função para verificar e corrigir erros no carregamento de dados */
    const checkAndFixDataLoading = () => {
        // Verificar se as grids de pilotos e equipes estão vazias
        const driverGridItems = document.querySelectorAll('.drivers-grid .driver-card');
        const teamsGridItems = document.querySelectorAll('.teams-grid .team-card');
        
        // Se a página de pilotos estiver ativa e não houver cards de pilotos, recarregar
        if (document.getElementById('drivers').classList.contains('active') && driverGridItems.length === 0) {
            console.log('Recarregando dados de pilotos...');
            loadDrivers();
        }
        
        // Se a página de equipes estiver ativa e não houver cards de equipes, recarregar
        if (document.getElementById('teams').classList.contains('active') && teamsGridItems.length === 0) {
            console.log('Recarregando dados de equipes...');
            loadTeams();
        }
    };

    // Executar funções de melhoria após o carregamento dos dados
    const enhanceUI = () => {
        setupIntersectionObserver();
        enhanceThemeToggle();
        setupLazyLoading();
        
        // Verificar e corrigir problemas de carregamento (usar requestIdleCallback quando disponível)
        if ('requestIdleCallback' in window) {
            requestIdleCallback(checkAndFixDataLoading, { timeout: 2000 });
        } else {
            setTimeout(checkAndFixDataLoading, 2000);
        }
        
        // Adicionar verificação também em mudanças de redimensionamento para mobile
        // Usar passive: false pois precisamos verificar o tamanho da tela
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                setTimeout(checkAndFixDataLoading, 500);
            }
        }, { passive: true });
        
        // Executar as melhorias específicas após carregamento do conteúdo
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    setupRaceCardEffects();
                    enhanceTableAppearance();
                }
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Mostrar notificação quando a página estiver totalmente carregada
        window.addEventListener('load', showPageLoadedNotification);
    };

    // Inicialização
    // Carregar tema salvo
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggleBtn.innerHTML = `<i class="fas fa-${savedTheme === 'light' ? 'moon' : 'sun'}"></i>`;

    // Carregar temporadas disponíveis
    loadSeasons();

    // Exemplo de notificação inicial
    notifications.add(
        'Bem-vindo ao F1LiveHub',
        'Acompanhe todas as informações da Fórmula 1 em tempo real!',
        'info'
    );

    // Registrar timestamp de inicialização
    const initTimestamp = Date.now();
    console.log(`Inicialização da aplicação: ${new Date(initTimestamp).toISOString()}`);

    // Carregar apenas os dados da página inicial
    // Verificar qual página está ativa e carregar seus dados
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id;
        console.log(`Página inicial ativa: ${pageId}`);
        if (pageId === 'drivers') {
            loadDrivers();
        } else if (pageId === 'teams') {
            loadTeams();
        } else if (pageId === 'races') {
            loadRaces();
        } else if (pageId === 'standings') {
            loadStandings();
        } else if (pageId === 'home') {
            // Na página inicial, pré-carregamos os pilotos para quando o usuário navegar para essa seção
            // Mas apenas se não estiver já carregando
            if (!isLoadingDrivers) {
                console.log('Pré-carregando pilotos na página inicial');
                requestAnimationFrame(() => loadDrivers());
            }
        }
    }

    // Adicionar as melhorias de UI
    enhanceUI();

    // Inicialização das novas funcionalidades
    document.addEventListener('DOMContentLoaded', () => {
        // Carregar tema salvo
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggleBtn.innerHTML = `<i class="fas fa-${savedTheme === 'light' ? 'moon' : 'sun'}"></i>`;
        
        // Carregar temporadas disponíveis
        loadSeasons();
        
        // Exemplo de notificação inicial
        notifications.add(
            'Bem-vindo ao F1LiveHub',
            'Acompanhe todas as informações da Fórmula 1 em tempo real!',
            'info'
        );
    });

    // Adicionar evento para atualizar dados quando a temporada for alterada
    currentSeasonSelect.addEventListener('change', () => {
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id;
            if (pageId === 'drivers') {
                loadDrivers();
            } else if (pageId === 'teams') {
                loadTeams();
            } else if (pageId === 'races') {
                loadRaces();
            } else if (pageId === 'standings') {
                loadStandings();
            }
        }
        
        // Adicionar notificação de mudança de temporada
        notifications.add(
            'Temporada Alterada',
            `Dados atualizados para a temporada ${currentSeasonSelect.value}`,
            'info'
        );
    });

    // Tela de Loading Inicial - Versão Profissional
    const loadingOverlay = document.getElementById('loading-overlay');
    const skipIntroButton = document.getElementById('skip-intro');
    const progressFill = document.getElementById('progress-fill');
    const loadingStatus = document.getElementById('loading-status');
    
    // Estados de carregamento
    const loadingSteps = [
        { progress: 20, status: 'Inicializando...' },
        { progress: 40, status: 'Carregando dados...' },
        { progress: 60, status: 'Processando informações...' },
        { progress: 80, status: 'Finalizando...' },
        { progress: 100, status: 'Concluído' }
    ];
    
    let currentStep = 0;
    
    // Atualizar progresso
    function updateProgress() {
        if (currentStep < loadingSteps.length) {
            const step = loadingSteps[currentStep];
            progressFill.style.width = step.progress + '%';
            loadingStatus.textContent = step.status;
            currentStep++;
            
            if (currentStep < loadingSteps.length) {
                const delay = currentStep === 1 ? 800 : (currentStep === loadingSteps.length - 1 ? 600 : 400);
                setTimeout(updateProgress, delay);
            } else {
                // Aguardar um pouco antes de esconder
                setTimeout(hideLoadingScreen, 500);
            }
        }
    }
    
    // Esconder a tela de loading
    function hideLoadingScreen() {
        loadingOverlay.classList.add('hidden');
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 600);
    }
    
    // Iniciar animação de progresso após um pequeno delay
    setTimeout(() => {
        updateProgress();
    }, 300);
    
    // Verificar se é dispositivo móvel para ajustar o tempo de exibição
    const isMobileDevice = window.innerWidth <= 768;
    // Timeout de segurança (máximo 4 segundos)
    setTimeout(() => {
        if (!loadingOverlay.classList.contains('hidden')) {
            progressFill.style.width = '100%';
            loadingStatus.textContent = 'Concluído';
            hideLoadingScreen();
        }
    }, isMobileDevice ? 3500 : 4000);
    
    // Botão para pular introdução
    if (skipIntroButton) {
        skipIntroButton.addEventListener('click', () => {
            progressFill.style.width = '100%';
            loadingStatus.textContent = 'Concluído';
            hideLoadingScreen();
        });
    }

    /**
     * Carregar embeds do Instagram de forma otimizada (lazy loading)
     */
    function loadInstagramEmbeds() {
        // Verificar se já existe algum embed do Instagram na página
        const instagramEmbeds = document.querySelectorAll('.instagram-media');
        
        if (instagramEmbeds.length === 0) {
            return; // Não há embeds para carregar
        }

        // Usar Intersection Observer para carregar apenas quando visível (lazy loading)
        const observerOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        };

        const embedObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const embed = entry.target;
                    embedObserver.unobserve(embed);
                    
                    // Carregar script do Instagram apenas quando necessário
                    loadInstagramScript(() => {
                        processInstagramEmbed(embed);
                    });
                }
            });
        }, observerOptions);

        // Observar cada embed
        instagramEmbeds.forEach(embed => {
            embedObserver.observe(embed);
        });
    }

    /**
     * Carregar script do Instagram
     * @param {Function} callback - Callback quando script carregar
     */
    function loadInstagramScript(callback) {
        if (window.instgrm && window.instgrm.Embeds) {
            // Script já carregado
            if (callback) callback();
            return;
        }

        // Verificar se script já está sendo carregado
        if (document.querySelector('script[src*="instagram.com/embed.js"]')) {
            // Aguardar script carregar (usar requestAnimationFrame para melhor performance)
            let checkCount = 0;
            const maxChecks = 50; // 5 segundos máximo (50 * 100ms)
            
            const checkReady = () => {
                if (window.instgrm && window.instgrm.Embeds) {
                    if (callback) callback();
                    return;
                }
                
                checkCount++;
                if (checkCount < maxChecks) {
                    requestAnimationFrame(() => {
                        setTimeout(checkReady, 100);
                    });
                }
            };
            
            checkReady();
            return;
        }

        // Criar e carregar script
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        
        script.onload = () => {
            // Usar requestAnimationFrame para melhor performance e reduzir avisos
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (callback) callback();
                });
            });
        };
        
        script.onerror = () => {
            console.warn('Erro ao carregar script do Instagram');
        };
        
        document.head.appendChild(script);
    }

    /**
     * Processar um embed do Instagram
     * @param {HTMLElement} embed - Elemento do embed
     */
    function processInstagramEmbed(embed) {
        try {
            if (window.instgrm && window.instgrm.Embeds) {
                window.instgrm.Embeds.process();
            }
        } catch (error) {
            console.warn('Erro ao processar embed do Instagram:', error);
        }
    }

    /**
     * Inicializar botões de compartilhamento de notícias
     */
    function initializeShareButtons() {
        const shareButtons = document.querySelectorAll('.share-btn');
        
        shareButtons.forEach(button => {
            // Remover listeners anteriores se existirem
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', async (e) => {
                e.preventDefault();
                const newsItem = newButton.closest('.news-item');
                const newsTitle = newButton.getAttribute('data-news-title') || 'Notícia da F1';
                const currentUrl = window.location.href;
                
                await shareNews(newsTitle, currentUrl, newButton);
            });
        });
    }
    
    // Inicializar botões quando componentes forem carregados
    document.addEventListener('componentsLoaded', () => {
        setTimeout(() => {
            if (document.querySelector('#news')?.classList.contains('active')) {
                initializeShareButtons();
            }
        }, 100);
    });

    /**
     * Compartilhar notícia
     * @param {string} title - Título da notícia
     * @param {string} url - URL para compartilhar
     * @param {HTMLElement} button - Botão que foi clicado
     */
    async function shareNews(title, url, button) {
        const shareData = {
            title: `${title} - F1LiveHub`,
            text: `Confira esta notícia sobre Fórmula 1: ${title}`,
            url: url
        };

        // Tentar usar Web Share API (disponível em dispositivos móveis)
        if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                showShareFeedback(button, 'Compartilhado!');
            } catch (error) {
                // Usuário cancelou ou erro ao compartilhar
                if (error.name !== 'AbortError') {
                    fallbackShare(title, url, button);
                }
            }
        } else {
            // Fallback: copiar link para área de transferência
            fallbackShare(title, url, button);
        }
    }

    /**
     * Fallback para compartilhar (copiar link)
     * @param {string} title - Título da notícia
     * @param {string} url - URL para compartilhar
     * @param {HTMLElement} button - Botão que foi clicado
     */
    async function fallbackShare(title, url, button) {
        try {
            await navigator.clipboard.writeText(`${title} - ${url}`);
            showShareFeedback(button, 'Link copiado!');
        } catch (error) {
            // Fallback adicional: criar input temporário
            const input = document.createElement('input');
            input.value = `${title} - ${url}`;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            input.setSelectionRange(0, 99999);
            
            try {
                document.execCommand('copy');
                document.body.removeChild(input);
                showShareFeedback(button, 'Link copiado!');
            } catch (err) {
                document.body.removeChild(input);
                showShareFeedback(button, 'Erro ao copiar', true);
            }
        }
    }

    /**
     * Mostrar feedback visual ao compartilhar
     * @param {HTMLElement} button - Botão que foi clicado
     * @param {string} message - Mensagem de feedback
     * @param {boolean} isError - Se é um erro
     */
    function showShareFeedback(button, message, isError = false) {
        const originalHTML = button.innerHTML;
        const icon = isError ? 'fa-times-circle' : 'fa-check';
        
        button.innerHTML = `<i class="fas ${icon}"></i>`;
        button.style.background = isError ? 'var(--error-color)' : 'var(--success-color)';
        button.style.borderColor = isError ? 'var(--error-color)' : 'var(--success-color)';
        button.style.color = 'var(--text-light)';
        
        // Criar tooltip temporário
        const tooltip = document.createElement('div');
        tooltip.className = 'share-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: absolute;
            background: ${isError ? 'var(--error-color)' : 'var(--success-color)'};
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.85rem;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        const rect = button.getBoundingClientRect();
        tooltip.style.top = `${rect.top - 40}px`;
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.transform = 'translateX(-50%)';
        
        document.body.appendChild(tooltip);
        
        // Animar tooltip
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
        
        // Restaurar botão após 2 segundos
        setTimeout(() => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(tooltip);
                button.innerHTML = originalHTML;
                button.style.background = '';
                button.style.borderColor = '';
                button.style.color = '';
            }, 300);
        }, 2000);
    }
}

// Aguardar carregamento dos componentes antes de inicializar a aplicação
if (document.readyState === 'loading') {
    document.addEventListener('componentsLoaded', initializeApp);
    document.addEventListener('DOMContentLoaded', () => {
        // Se os componentes já foram carregados antes do DOMContentLoaded
        if (document.querySelector('#bottom-nav')) {
            initializeApp();
        }
    });
} else {
    // Se o DOM já está pronto, aguardar apenas os componentes
    if (document.querySelector('#bottom-nav')) {
        initializeApp();
    } else {
        document.addEventListener('componentsLoaded', initializeApp);
    }
} 