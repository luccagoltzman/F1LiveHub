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
     * Carregar os pilotos da temporada atual
     */
    const loadDrivers = async () => {
        try {
            driverGrid.innerHTML = '<div class="loading">Carregando pilotos...</div>';
            
            const drivers = await F1API.getCurrentDrivers();
            
            if (drivers.length === 0) {
                driverGrid.innerHTML = '<p>Nenhum piloto encontrado.</p>';
                return;
            }
            
            driverGrid.innerHTML = '';
            
            drivers.forEach(driver => {
                const driverCard = document.createElement('div');
                driverCard.className = 'driver-card';
                driverCard.innerHTML = `
                    <div class="driver-header">
                        <h3>${driver.givenName} ${driver.familyName}</h3>
                        <div class="driver-number">${driver.permanentNumber || '?'}</div>
                    </div>
                    <div class="driver-info">
                        <p><strong>Data de Nascimento:</strong> ${formatDate(driver.dateOfBirth)}</p>
                        <p><strong>Nacionalidade:</strong> ${formatNationality(driver.nationality)}</p>
                        <p><strong>Código:</strong> ${driver.code || 'N/A'}</p>
                        <p><a href="${driver.url}" target="_blank" class="btn">Mais Informações</a></p>
                    </div>
                `;
                driverGrid.appendChild(driverCard);
            });
        } catch (error) {
            showError('Erro ao carregar os pilotos. Por favor, tente novamente.', driverGrid);
        }
    };

    /**
     * Carregar as equipes da temporada atual
     */
    const loadTeams = async () => {
        try {
            teamsGrid.innerHTML = '<div class="loading">Carregando equipes...</div>';
            
            const constructors = await F1API.getCurrentConstructors();
            
            if (constructors.length === 0) {
                teamsGrid.innerHTML = '<p>Nenhuma equipe encontrada.</p>';
                return;
            }
            
            teamsGrid.innerHTML = '';
            
            constructors.forEach(constructor => {
                const teamCard = document.createElement('div');
                teamCard.className = 'team-card';
                teamCard.innerHTML = `
                    <div class="team-header">
                        <h3>${constructor.name}</h3>
                    </div>
                    <div class="team-info">
                        <p><strong>Nacionalidade:</strong> ${formatNationality(constructor.nationality)}</p>
                        <p><a href="${constructor.url}" target="_blank" class="btn">Mais Informações</a></p>
                    </div>
                `;
                teamsGrid.appendChild(teamCard);
            });
        } catch (error) {
            showError('Erro ao carregar as equipes. Por favor, tente novamente.', teamsGrid);
        }
    };

    /**
     * Carregar o calendário de corridas
     */
    const loadRaces = async () => {
        try {
            racesList.innerHTML = '<div class="loading">Carregando calendário de corridas...</div>';
            
            const races = await F1API.getCurrentRaces();
            
            if (races.length === 0) {
                racesList.innerHTML = '<p>Nenhuma corrida encontrada.</p>';
                return;
            }
            
            racesList.innerHTML = '';
            
            races.forEach(race => {
                const raceDate = new Date(`${race.date}T${race.time || '00:00:00Z'}`);
                const now = new Date();
                const isPast = raceDate < now;
                
                const raceCard = document.createElement('div');
                raceCard.className = `race-card ${isPast ? 'past' : 'upcoming'}`;
                
                raceCard.innerHTML = `
                    <div class="race-round">${race.round}</div>
                    <div class="race-info">
                        <h3>${race.raceName}</h3>
                        <p>${race.Circuit.circuitName}, ${race.Circuit.Location.locality}, ${race.Circuit.Location.country}</p>
                    </div>
                    <div class="race-date">
                        <div class="date">${formatDate(race.date)}</div>
                        <div class="time">${race.time ? new Date(`2023-01-01T${race.time}`).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : 'Horário não definido'}</div>
                        ${isPast ? '<div class="status past">Concluída</div>' : '<div class="status upcoming">Em breve</div>'}
                    </div>
                `;
                
                if (isPast) {
                    raceCard.innerHTML += `
                        <button class="btn results-btn" data-round="${race.round}">Ver resultados</button>
                    `;
                }
                
                racesList.appendChild(raceCard);
            });
            
            // Adicionar evento para botões de resultados
            document.querySelectorAll('.results-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const round = e.currentTarget.dataset.round;
                    
                    try {
                        e.currentTarget.textContent = 'Carregando...';
                        e.currentTarget.disabled = true;
                        
                        const results = await F1API.getRaceResults(round);
                        
                        // Criar modal para exibir os resultados
                        const modal = document.createElement('div');
                        modal.className = 'modal';
                        modal.innerHTML = `
                            <div class="modal-content">
                                <span class="close">&times;</span>
                                <h2>${results.raceName} - Resultados</h2>
                                <table class="results-table">
                                    <thead>
                                        <tr>
                                            <th>Pos</th>
                                            <th>Piloto</th>
                                            <th>Equipe</th>
                                            <th>Pontos</th>
                                            <th>Tempo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${results.Results.map(result => `
                                            <tr>
                                                <td>${result.position}</td>
                                                <td>${result.Driver.givenName} ${result.Driver.familyName}</td>
                                                <td>${result.Constructor.name}</td>
                                                <td>${result.points}</td>
                                                <td>${result.Time ? result.Time.time : (result.status || 'N/A')}</td>
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
     * Carregar a classificação de pilotos e construtores
     */
    const loadStandings = async () => {
        try {
            // Carregar classificação de pilotos
            document.querySelector('#driver-standings .loading').style.display = 'block';
            driversTable.innerHTML = '';
            
            const driverStandings = await F1API.getCurrentDriverStandings();
            
            if (driverStandings.length > 0) {
                driverStandings.forEach(standing => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${standing.position}</td>
                        <td>${standing.Driver.givenName} ${standing.Driver.familyName}</td>
                        <td>${formatNationality(standing.Driver.nationality)}</td>
                        <td>${standing.Constructors.length > 0 ? standing.Constructors[0].name : 'N/A'}</td>
                        <td class="points">${standing.points}</td>
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
            
            const constructorStandings = await F1API.getCurrentConstructorStandings();
            
            if (constructorStandings.length > 0) {
                constructorStandings.forEach(standing => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${standing.position}</td>
                        <td>${standing.Constructor.name}</td>
                        <td>${formatNationality(standing.Constructor.nationality)}</td>
                        <td class="points">${standing.points}</td>
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
}); 