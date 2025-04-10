import F1API from './api.js';

/**
 * Aplicação principal do F1LiveHub
 * Gerencia a aplicação, manipula o DOM e interage com a API
 */
document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const navLinks = document.querySelectorAll('nav a');
    const pages = document.querySelectorAll('.page');
    const driverGrid = document.querySelector('.drivers-grid');
    const teamsGrid = document.querySelector('.teams-grid');
    const racesList = document.querySelector('.races-list');
    const driversTable = document.querySelector('.drivers-table tbody');
    const constructorsTable = document.querySelector('.constructors-table tbody');
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

    // Adicionar seletor de temporada atual
    const seasonControls = document.createElement('div');
    seasonControls.className = 'season-controls';
    
    const currentSeasonSelect = document.createElement('select');
    currentSeasonSelect.id = 'current-season-select';
    currentSeasonSelect.innerHTML = `
        <option value="2024">Temporada 2024</option>
        <option value="2025">Temporada 2025</option>
    `;
    currentSeasonSelect.value = '2025'; // Define 2025 como padrão
    
    seasonControls.appendChild(currentSeasonSelect);
    
    // Adicionar o seletor ao header, após a navegação
    const nav = document.querySelector('header nav');
    nav.appendChild(seasonControls);

    // Menu Mobile
    const menuToggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('overlay');

    const toggleMenu = (e) => {
        if (e && e.target === overlay) {
            // Se o clique foi no overlay, fecha o menu
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        } else {
            // Se o clique foi no botão do menu, alterna o estado
            nav.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
        }
    };

    menuToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Fechar menu ao clicar em um link
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague para o overlay
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    nav.classList.remove('active');
                    overlay.classList.remove('active');
                    document.body.style.overflow = '';
                }, 150); // Pequeno delay para melhor experiência do usuário
            }
        });
    });

    // Fechar menu ao redimensionar a tela para desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && nav.classList.contains('active')) {
            nav.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

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
        navLinks.forEach(link => link.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));
        
        // Adicionar classe active ao link e página selecionados
        e.currentTarget.classList.add('active');
        document.getElementById(targetPage).classList.add('active');
        
        // Carregar dados se necessário
        if (targetPage === 'drivers' && driverGrid.children.length <= 1) {
            loadDrivers();
        } else if (targetPage === 'teams' && teamsGrid.children.length <= 1) {
            loadTeams();
        } else if (targetPage === 'races' && racesList.children.length <= 1) {
            loadRaces();
        } else if (targetPage === 'standings' && driversTable.children.length === 0) {
            loadStandings();
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

    /**
     * Carregar os pilotos da temporada selecionada
     */
    const loadDrivers = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            driverGrid.innerHTML = '<div class="loading">Carregando pilotos...</div>';
            
            const drivers = await F1API.getCurrentDrivers(selectedSeason);
            
            if (drivers.length === 0) {
                driverGrid.innerHTML = '<p>Nenhum piloto encontrado.</p>';
                return;
            }
            
            driverGrid.innerHTML = '';
            
            drivers.forEach(standing => {
                const driver = standing.driver;
                const team = standing.team;
                const driverCard = document.createElement('div');
                driverCard.className = 'driver-card';
                driverCard.innerHTML = `
                    <div class="driver-header">
                        <h3>${driver.name}</h3>
                        <div class="driver-number">${driver.number}</div>
                    </div>
                    <div class="driver-info">
                        <img src="${driver.image}" alt="${driver.name}" style="width: 100px; height: auto; margin-bottom: 10px;">
                        <p><strong>Posição Atual:</strong> ${standing.position}º</p>
                        <p><strong>Equipe:</strong> ${team.name}</p>
                        <p><strong>Pontos:</strong> ${standing.points}</p>
                        <p><strong>Vitórias:</strong> ${standing.wins}</p>
                        <p><strong>Sigla:</strong> ${driver.abbr}</p>
                    </div>
                `;
                driverGrid.appendChild(driverCard);
            });
        } catch (error) {
            showError('Erro ao carregar os pilotos. Por favor, tente novamente.', driverGrid);
        }
    };

    /**
     * Carregar as equipes da temporada selecionada
     */
    const loadTeams = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            teamsGrid.innerHTML = '<div class="loading">Carregando equipes...</div>';
            
            const constructors = await F1API.getCurrentConstructors(selectedSeason);
            
            if (constructors.length === 0) {
                teamsGrid.innerHTML = '<p>Nenhuma equipe encontrada.</p>';
                return;
            }
            
            teamsGrid.innerHTML = '';
            
            constructors.forEach(standing => {
                const team = standing.team;
                const teamCard = document.createElement('div');
                teamCard.className = 'team-card';
                teamCard.innerHTML = `
                    <div class="team-header">
                        <h3>${team.name}</h3>
                    </div>
                    <div class="team-info">
                        <img src="${team.logo}" alt="${team.name}" style="width: 150px; height: auto; margin-bottom: 10px;">
                        <p><strong>Posição Atual:</strong> ${standing.position}º</p>
                        <p><strong>Pontos:</strong> ${standing.points}</p>
                        <p><strong>Vitórias:</strong> ${standing.wins || 0}</p>
                    </div>
                `;
                teamsGrid.appendChild(teamCard);
            });
        } catch (error) {
            showError('Erro ao carregar as equipes. Por favor, tente novamente.', teamsGrid);
        }
    };

    /**
     * Carregar o calendário de corridas da temporada selecionada
     */
    const loadRaces = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            racesList.innerHTML = '<div class="loading">Carregando calendário de corridas...</div>';
            
            const races = await F1API.getCurrentRaces(selectedSeason);
            
            if (races.length === 0) {
                racesList.innerHTML = '<p>Nenhuma corrida encontrada.</p>';
                return;
            }
            
            racesList.innerHTML = '';
            
            races.forEach(race => {
                const raceDate = new Date(race.date);
                const now = new Date();
                const isPast = raceDate < now;
                
                const raceCard = document.createElement('div');
                raceCard.className = `race-card ${isPast ? 'past' : 'upcoming'}`;
                
                raceCard.innerHTML = `
                    <div class="race-round">${race.round || race.id}</div>
                    <div class="race-info">
                        <h3>${race.competition.name}</h3>
                        <p>${race.circuit.name}, ${race.competition.location.city}, ${race.competition.location.country}</p>
                    </div>
                    <div class="race-date">
                        <div class="date">${new Date(race.date).toLocaleDateString('pt-BR')}</div>
                        <div class="time">${race.time || 'Horário não definido'}</div>
                        ${isPast ? '<div class="status past">Concluída</div>' : '<div class="status upcoming">Em breve</div>'}
                    </div>
                `;
                
                if (isPast) {
                    raceCard.innerHTML += `
                        <button class="btn results-btn" data-race-id="${race.id}">Ver resultados</button>
                    `;
                }
                
                racesList.appendChild(raceCard);
            });
            
            // Adicionar evento para botões de resultados
            document.querySelectorAll('.results-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const raceId = e.currentTarget.dataset.raceId;
                    
                    try {
                        e.currentTarget.textContent = 'Carregando...';
                        e.currentTarget.disabled = true;
                        
                        const results = await F1API.getRaceResults(raceId);
                        
                        // Criar modal para exibir os resultados
                        const modal = document.createElement('div');
                        modal.className = 'modal';
                        modal.innerHTML = `
                            <div class="modal-content">
                                <span class="close">&times;</span>
                                <h2>Resultados da Corrida</h2>
                                <table class="results-table">
                                    <thead>
                                        <tr>
                                            <th>Pos</th>
                                            <th>Piloto</th>
                                            <th>Equipe</th>
                                            <th>Pontos</th>
                                            <th>Tempo/Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${results.map(result => `
                                            <tr>
                                                <td>${result.position}</td>
                                                <td>${result.driver.name}</td>
                                                <td>${result.team.name}</td>
                                                <td>${result.points}</td>
                                                <td>${result.time || result.status || 'N/A'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
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
        } catch (error) {
            showError('Erro ao carregar o calendário de corridas. Por favor, tente novamente.', racesList);
        }
    };

    /**
     * Carregar a classificação de pilotos e construtores da temporada selecionada
     */
    const loadStandings = async () => {
        try {
            const selectedSeason = currentSeasonSelect.value;
            // Carregar classificação de pilotos
            document.querySelector('#driver-standings .loading').style.display = 'block';
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
            
            document.querySelector('#driver-standings .loading').style.display = 'none';
            
            // Carregar classificação de construtores
            document.querySelector('#constructor-standings .loading').style.display = 'block';
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
            
            document.querySelector('#constructor-standings .loading').style.display = 'none';
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
     * Realizar busca rápida
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
                searchResults.innerHTML = '<p class="empty-notification">Nenhum resultado encontrado.</p>';
                return;
            }

            searchResults.innerHTML = '';
            
            // Exibir resultados de pilotos
            drivers.forEach(driver => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
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
        } catch (error) {
            historyContent.innerHTML = '<p class="error-message">Erro ao carregar dados da temporada.</p>';
        }
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
                    <i class="notification-icon fas fa-${notification.type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
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
            notificationBadge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
        }
    };

    // Event Listeners para as novas funcionalidades
    themeToggleBtn.addEventListener('click', toggleTheme);
    
    quickSearchInput.addEventListener('input', (e) => {
        performQuickSearch(e.target.value);
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
        
        // Pulsar o botão de tema quando a página carregar para chamar atenção
        setTimeout(() => {
            themeToggleBtn.classList.add('pulse');
            setTimeout(() => {
                themeToggleBtn.classList.remove('pulse');
            }, 1000);
        }, 3000);
    };

    // Função para exibir notificação de carregamento completo
    const showPageLoadedNotification = () => {
        setTimeout(() => {
            notifications.add(
                'Página Carregada',
                'Todos os dados foram carregados com sucesso!',
                'success'
            );
        }, 1500);
    };

    // Função para melhorar o posicionamento das tabelas
    const enhanceTableAppearance = () => {
        // Destacar a linha da tabela quando o usuário passar o mouse
        document.querySelectorAll('.standings-table tbody tr').forEach((row, index) => {
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
    };

    // Atualizar imagens com lazy loading para melhor performance
    const setupLazyLoading = () => {
        if ('loading' in HTMLImageElement.prototype) {
            document.querySelectorAll('img').forEach(img => {
                img.setAttribute('loading', 'lazy');
            });
        }
    };

    // Executar funções de melhoria após o carregamento dos dados
    const enhanceUI = () => {
        setupIntersectionObserver();
        enhanceThemeToggle();
        setupLazyLoading();
        
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
            console.log('Pré-carregando pilotos na página inicial');
            loadDrivers();
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
}); 