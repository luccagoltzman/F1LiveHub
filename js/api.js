/**
 * Módulo de API que encapsula chamadas à API Ergast Formula 1
 * Documentação: http://ergast.com/mrd/
 */
const F1API = (() => {
    // URL base da API
    const BASE_URL = 'https://ergast.com/api/f1';
    
    /**
     * Função para fazer uma chamada à API Ergast
     * @param {string} endpoint - O endpoint a ser chamado
     * @returns {Promise} - Uma promise com os dados da resposta
     */
    const fetchData = async (endpoint) => {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}.json`);
            
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao buscar dados da API:', error);
            throw error;
        }
    };
    
    /**
     * Obter lista de pilotos da temporada atual
     * @returns {Promise} - Promise com a lista de pilotos
     */
    const getCurrentDrivers = async () => {
        const data = await fetchData('/current/drivers');
        return data.MRData.DriverTable.Drivers;
    };
    
    /**
     * Obter lista de equipes da temporada atual
     * @returns {Promise} - Promise com a lista de equipes
     */
    const getCurrentConstructors = async () => {
        const data = await fetchData('/current/constructors');
        return data.MRData.ConstructorTable.Constructors;
    };
    
    /**
     * Obter calendário de corridas da temporada atual
     * @returns {Promise} - Promise com a lista de corridas
     */
    const getCurrentRaces = async () => {
        const data = await fetchData('/current');
        return data.MRData.RaceTable.Races;
    };
    
    /**
     * Obter a classificação de pilotos da temporada atual
     * @returns {Promise} - Promise com a classificação de pilotos
     */
    const getCurrentDriverStandings = async () => {
        const data = await fetchData('/current/driverStandings');
        return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
    };
    
    /**
     * Obter a classificação de construtores da temporada atual
     * @returns {Promise} - Promise com a classificação de construtores
     */
    const getCurrentConstructorStandings = async () => {
        const data = await fetchData('/current/constructorStandings');
        return data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
    };
    
    /**
     * Obter informações completas de um piloto
     * @param {string} driverId - ID do piloto
     * @returns {Promise} - Promise com as informações do piloto
     */
    const getDriverInfo = async (driverId) => {
        const data = await fetchData(`/drivers/${driverId}`);
        return data.MRData.DriverTable.Drivers[0];
    };
    
    /**
     * Obter informações completas de uma equipe
     * @param {string} constructorId - ID da equipe
     * @returns {Promise} - Promise com as informações da equipe
     */
    const getConstructorInfo = async (constructorId) => {
        const data = await fetchData(`/constructors/${constructorId}`);
        return data.MRData.ConstructorTable.Constructors[0];
    };
    
    /**
     * Obter todos os pilotos de uma equipe na temporada atual
     * @param {string} constructorId - ID da equipe
     * @returns {Promise} - Promise com a lista de pilotos da equipe
     */
    const getConstructorDrivers = async (constructorId) => {
        const data = await fetchData(`/current/constructors/${constructorId}/drivers`);
        return data.MRData.DriverTable.Drivers;
    };
    
    /**
     * Obter resultados de uma corrida específica
     * @param {number} round - Número da etapa
     * @returns {Promise} - Promise com os resultados da corrida
     */
    const getRaceResults = async (round) => {
        const data = await fetchData(`/current/${round}/results`);
        return data.MRData.RaceTable.Races[0];
    };
    
    // Retornando os métodos públicos
    return {
        getCurrentDrivers,
        getCurrentConstructors,
        getCurrentRaces,
        getCurrentDriverStandings,
        getCurrentConstructorStandings,
        getDriverInfo,
        getConstructorInfo,
        getConstructorDrivers,
        getRaceResults
    };
})(); 