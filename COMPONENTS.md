# Estrutura de Componentes do F1LiveHub

Este projeto foi organizado em componentes modulares para facilitar a manutenção e o desenvolvimento.

## Estrutura de Pastas

```
F1LiveHub/
├── components/          # Componentes estruturais reutilizáveis
│   ├── header.html      # Cabeçalho da aplicação
│   ├── navigation.html  # Menu de navegação inferior
│   ├── footer.html      # Rodapé
│   └── loading.html     # Tela de carregamento inicial
│
├── pages/               # Páginas/Seções da aplicação
│   ├── home.html        # Página inicial
│   ├── drivers.html     # Página de pilotos
│   ├── teams.html       # Página de equipes
│   ├── races.html       # Página de corridas
│   ├── standings.html   # Página de classificação
│   ├── news.html        # Página de notícias
│   └── history.html     # Página de histórico
│
├── templates/           # Templates reutilizáveis
│   └── lap-by-lap.html  # Template para detalhes volta a volta
│
├── js/
│   ├── components.js    # Sistema de carregamento de componentes
│   ├── api.js           # Integração com API
│   └── app.js           # Lógica principal da aplicação
│
└── index.html           # Arquivo principal (estrutura básica)
```

## Como Funciona

### Sistema de Carregamento

O arquivo `js/components.js` contém a classe `ComponentLoader` que:
- Carrega componentes HTML via `fetch()`
- Armazena componentes em cache para melhor performance
- Insere componentes no DOM na posição correta

### Fluxo de Inicialização

1. **index.html** carrega o script `components.js`
2. `initializeComponents()` carrega todos os componentes:
   - Componentes estruturais (header, navigation, footer, loading)
   - Páginas (home, drivers, teams, etc.)
   - Templates
3. Dispara evento `componentsLoaded` quando concluído
4. `app.js` aguarda o evento e inicializa a aplicação

## Adicionando Novos Componentes

### 1. Criar o arquivo HTML do componente

Exemplo: `components/novo-componente.html`
```html
<div class="novo-componente">
    <h2>Meu Novo Componente</h2>
    <p>Conteúdo do componente...</p>
</div>
```

### 2. Carregar no sistema

No arquivo `js/components.js`, adicione na função `initializeComponents()`:

```javascript
await componentLoader.insertComponent(
    'components/novo-componente.html',
    document.querySelector('#container-desejado')
);
```

## Adicionando Novas Páginas

### 1. Criar o arquivo da página

Exemplo: `pages/nova-pagina.html`
```html
<section id="nova-pagina" class="page">
    <div class="page-header">
        <h2>Título da Página</h2>
    </div>
    <div class="page-content">
        <!-- Conteúdo da página -->
    </div>
</section>
```

### 2. Adicionar ao menu de navegação

Edite `components/navigation.html` e adicione:
```html
<a href="#" class="nav-item" data-page="nova-pagina">
    <div class="nav-icon">
        <i class="fas fa-icon" aria-hidden="true"></i>
    </div>
    <span class="nav-label">Nova Página</span>
</a>
```

### 3. Carregar a página

No arquivo `js/components.js`, adicione na função `initializeComponents()`:

```javascript
{ path: 'pages/nova-pagina.html', target: mainContainer }
```

## Vantagens desta Estrutura

✅ **Organização**: Código separado por responsabilidade  
✅ **Manutenibilidade**: Fácil localizar e editar componentes  
✅ **Reutilização**: Componentes podem ser reutilizados  
✅ **Performance**: Cache de componentes carregados  
✅ **Escalabilidade**: Fácil adicionar novos componentes  
✅ **Colaboração**: Múltiplos desenvolvedores podem trabalhar em paralelo  

## Notas Importantes

- Todos os componentes devem ter IDs únicos
- Componentes são carregados de forma assíncrona
- O cache evita recarregar componentes já carregados
- A ordem de carregamento é importante (estruturais primeiro, depois páginas)

