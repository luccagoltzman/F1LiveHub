# F1LiveHub

Um hub interativo para acompanhar a Fórmula 1, desenvolvido com HTML, CSS e JavaScript.

## 📝 Descrição

F1LiveHub é uma aplicação web que consome a API Ergast F1 para exibir informações atualizadas sobre a Fórmula 1, incluindo:

- 👨‍🏎️ **Pilotos** - Lista de pilotos com detalhes e estatísticas
- 🏎️ **Equipes** - Informações sobre todas as equipes da temporada
- 🏁 **Corridas** - Calendário completo da temporada com datas e resultados
- 🏆 **Classificação** - Tabelas de pontuação de pilotos e construtores

## 🚀 Funcionalidades

- Visualização de informações detalhadas sobre pilotos da temporada atual
- Listagem de todas as equipes participantes
- Calendário de corridas com datas e locais
- Resultados de corridas passadas
- Classificação atualizada de pilotos e construtores

## 💻 Tecnologias

- HTML5
- CSS3 (com design responsivo)
- JavaScript (ES6+)
- [Ergast F1 API](http://ergast.com/mrd/) - API gratuita de dados de Fórmula 1
- [Font Awesome](https://fontawesome.com/) - Para ícones
- [FlagCDN](https://flagcdn.com/) - Para bandeiras de países

## 🛠️ Como Usar

1. Clone este repositório:
   ```
   git clone https://github.com/seu-usuario/F1LiveHub.git
   ```

2. Abra o arquivo `index.html` em qualquer navegador web moderno.

3. Navegue pelas diferentes seções para visualizar os dados da temporada atual de F1.

## 📡 API

Este projeto utiliza a [Ergast F1 API](http://ergast.com/mrd/), que fornece um registro histórico dos dados de corridas de Fórmula 1 desde 1950. A API é gratuita e não requer autenticação para uso limitado.

Principais endpoints utilizados:

- `/current/drivers` - Pilotos da temporada atual
- `/current/constructors` - Equipes da temporada atual
- `/current` - Calendário de corridas da temporada atual
- `/current/driverStandings` - Classificação de pilotos
- `/current/constructorStandings` - Classificação de construtores

## 🚧 Melhorias Futuras

- Sistema de busca por piloto ou equipe
- Atualizações automáticas em tempo real
- Detalhamento de cada corrida com volta a volta
- Histórico de temporadas anteriores
- Página de estatísticas e recordes
- Modo escuro

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📬 Contato

Em caso de dúvidas, sugestões ou problemas, sinta-se à vontade para abrir uma issue ou enviar um pull request.

---

Desenvolvido com ❤️ por Seu Nome
