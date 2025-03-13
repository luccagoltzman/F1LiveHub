import axios from 'https://cdn.jsdelivr.net/npm/axios@1.6.7/+esm';

/**
 * Módulo de API que encapsula chamadas à API da Fórmula 1
 * Usando API-FORMULA-1 da RapidAPI com Axios
 */
const F1API = (() => {
    // Configurações da API
    const API_KEY = '7fc653acb1msh0b8c41b18cbd262p1f1eaejsnabce07a133b9';
    const BASE_URL = 'https://api-formula-1.p.rapidapi.com';
    
    // Configuração base do Axios
    const apiConfig = {
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'api-formula-1.p.rapidapi.com'
        }
    };

    /**
     * Função para fazer uma chamada à API
     * @param {string} endpoint - O endpoint a ser chamado
     * @param {Object} params - Parâmetros da requisição (opcional)
     * @returns {Promise} - Uma promise com os dados da resposta
     */
    const fetchData = async (endpoint, params = {}) => {
        try {
            const options = {
                method: 'GET',
                url: `${BASE_URL}${endpoint}`,
                params,
                ...apiConfig
            };

            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            throw error;
        }
    };
    
    /**
     * Obter lista de pilotos da temporada
     * @param {string} season - Ano da temporada (opcional, padrão 2025)
     * @returns {Promise} - Promise com a lista de pilotos
     */
    const getCurrentDrivers = async (season = '2025') => {
        const data = await fetchData('/rankings/drivers', { season });
        return data.response;
    };
    
    /**
     * Obter lista de equipes da temporada
     * @param {string} season - Ano da temporada (opcional, padrão 2025)
     * @returns {Promise} - Promise com a lista de equipes
     */
    const getCurrentConstructors = async (season = '2025') => {
        const data = await fetchData('/rankings/teams', { season });
        return data.response;
    };
    
    /**
     * Obter calendário de corridas da temporada
     * @param {string} season - Ano da temporada (opcional, padrão 2025)
     * @returns {Promise} - Promise com a lista de corridas
     */
    const getCurrentRaces = async (season = '2025') => {
        const data = await fetchData('/races', { season });
        return data.response;
    };
    
    /**
     * Obter a classificação de pilotos da temporada
     * @param {string} season - Ano da temporada (opcional, padrão 2025)
     * @returns {Promise} - Promise com a classificação de pilotos
     */
    const getCurrentDriverStandings = async (season = '2025') => {
        const data = await fetchData('/rankings/drivers', { season });
        return data.response;
    };
    
    /**
     * Obter a classificação de construtores da temporada
     * @param {string} season - Ano da temporada (opcional, padrão 2025)
     * @returns {Promise} - Promise com a classificação de construtores
     */
    const getCurrentConstructorStandings = async (season = '2025') => {
        const data = await fetchData('/rankings/teams', { season });
        return data.response;
    };
    
    /**
     * Obter informações completas de um piloto
     * @param {string} driverId - ID do piloto
     * @returns {Promise} - Promise com as informações do piloto
     */
    const getDriverInfo = async (driverId) => {
        const data = await fetchData(`/drivers/${driverId}`);
        return data.response;
    };
    
    /**
     * Obter informações completas de uma equipe
     * @param {string} teamId - ID da equipe
     * @returns {Promise} - Promise com as informações da equipe
     */
    const getConstructorInfo = async (teamId) => {
        const data = await fetchData(`/teams/${teamId}`);
        return data.response;
    };
    
    /**
     * Obter resultados de uma corrida específica
     * @param {number} raceId - ID da corrida
     * @returns {Promise} - Promise com os resultados da corrida
     */
    const getRaceResults = async (raceId) => {
        const data = await fetchData('/rankings/races', { race: raceId });
        return data.response;
    };

    /**
     * Obter temporadas disponíveis
     * @returns {Promise} - Promise com a lista de temporadas
     */
    const getSeasons = async () => {
        const data = await fetchData('/seasons');
        return data.response;
    };

    /**
     * Obter grid de largada de uma corrida
     * @param {number} raceId - ID da corrida
     * @returns {Promise} - Promise com o grid de largada
     */
    const getStartingGrid = async (raceId) => {
        const data = await fetchData('/rankings/startinggrid', { race: raceId });
        return data.response;
    };

    /**
     * Obter volta a volta de uma corrida
     * @param {number} raceId - ID da corrida
     * @returns {Promise} - Promise com os dados de volta a volta
     */
    const getLapTimes = async (raceId) => {
        const data = await fetchData('/rankings/fastest', { race: raceId });
        return data.response;
    };

    /**
     * Pesquisar pilotos por nome
     * @param {string} query - Texto da busca
     * @returns {Promise} - Promise com os resultados da busca
     */
    const searchDrivers = async (query) => {
        const data = await fetchData('/drivers');
        const drivers = data.response;
        return drivers.filter(driver => 
            driver.name.toLowerCase().includes(query.toLowerCase()) ||
            driver.nationality.toLowerCase().includes(query.toLowerCase())
        );
    };

    /**
     * Pesquisar equipes por nome
     * @param {string} query - Texto da busca
     * @returns {Promise} - Promise com os resultados da busca
     */
    const searchConstructors = async (query) => {
        const data = await fetchData('/teams');
        const teams = data.response;
        return teams.filter(team => 
            team.name.toLowerCase().includes(query.toLowerCase()) ||
            team.nationality.toLowerCase().includes(query.toLowerCase())
        );
    };

    /**
     * Obter dados de uma temporada específica
     * @param {number} year - Ano da temporada
     * @returns {Promise} - Promise com os dados da temporada
     */
    const getSeasonData = async (year) => {
        const [races, drivers, teams] = await Promise.all([
            fetchData('/races', { season: year }),
            fetchData('/rankings/drivers', { season: year }),
            fetchData('/rankings/teams', { season: year })
        ]);
        
        return {
            races: races.response,
            drivers: drivers.response,
            constructors: teams.response
        };
    };
    
    return {
        getCurrentDrivers,
        getCurrentConstructors,
        getCurrentRaces,
        getCurrentDriverStandings,
        getCurrentConstructorStandings,
        getDriverInfo,
        getConstructorInfo,
        getRaceResults,
        getSeasons,
        getLapTimes,
        getStartingGrid,
        searchDrivers,
        searchConstructors,
        getSeasonData,
        getCurrentYear: () => new Date().getFullYear()
    };
})();

export default F1API; 