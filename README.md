# OmniDesk

Uma plataforma de produtividade acadêmica para organizar estudos, acompanhar o progresso e manter o foco em um só lugar.

O OmniDesk reúne prazos, sessões Pomodoro, flashcards, cadernos e estatísticas em uma interface moderna e responsiva. Os dados são salvos localmente no navegador, permitindo que a rotina continue organizada mesmo após fechar a aplicação.

## Funcionalidades

- Dashboard com resumo da rotina, matérias e sessões salvas
- Atalhos personalizáveis e persistentes na página inicial
- Espaços por matéria com trabalhos, checklists, timer, cadernos e flashcards
- Visualização das matérias em lista ou grade
- Cadastro, conclusão, filtragem e exclusão de trabalhos
- Checklists globais ou por matéria, com seções, progresso e inclusão em massa
- Pomodoro 25/5 e cronômetro geral ou vinculado a uma matéria
- Garantia de apenas um relógio em execução, inclusive entre abas
- Cadernos com organização, exclusão, anotações e salvamento automático
- Criação, blocos e revisão interativa de flashcards
- Visualização de equipes e encontros de estudo
- Estatísticas de foco, checklists, trabalhos e cartões dominados
- Perfil editável com objetivo, meta semanal em horas e imagem processada localmente
- Cinco temas visuais persistentes, incluindo opções claras e escuras
- Ações rápidas para adicionar prazos e flashcards
- Persistência local com IndexedDB organizado por coleções
- Onboarding para configuração do primeiro acesso
- Exportação e restauração de backup em JSON
- Aplicação instalável e disponível offline após o primeiro acesso
- Layout responsivo para desktop, tablet e celular

## Tecnologias

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Lucide React](https://lucide.dev/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- CSS responsivo

## Como executar

### Pré-requisitos

- Node.js 20 ou superior
- npm

### Instalação

```bash
git clone https://github.com/Asutsuo/omnidesk.git
cd omnidesk
npm install
npm run dev
```

Depois, acesse o endereço exibido pelo Vite no terminal — normalmente `http://localhost:5173`.

## Scripts disponíveis

```bash
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # gera a versão de produção
npm run preview  # visualiza o build de produção
npm run lint     # verifica a qualidade do código
npm run deploy   # compila e publica no Cloudflare Workers
```

## Deploy no Cloudflare

O projeto usa os Static Assets do Cloudflare Workers e já inclui a configuração necessária em `wrangler.jsonc`.

Para publicar pelo terminal, autentique o Wrangler e execute:

```bash
npm run deploy
```

Ao conectar o repositório pelo painel do Cloudflare, use:

- Comando de build: `npm run build`
- Comando de implantação: `npx wrangler deploy`
- Caminho raiz: deixe vazio, a menos que o repositório esteja dentro de outra pasta

O fallback de SPA está configurado para que a aplicação continue funcionando ao acessar ou atualizar suas rotas diretamente.

## Estrutura principal

```text
src/
├── components/   # componentes reutilizáveis e navegação
├── pages/        # páginas e ferramentas da plataforma
├── App.tsx       # estado global e composição da aplicação
├── data.ts       # entidades, limites e regras do domínio
├── storage.ts    # IndexedDB, migração e backups
├── timerUtils.ts # cálculos seguros dos relógios
└── index.css     # estilos e variáveis globais
```

## Armazenamento

Atualmente, o OmniDesk é uma aplicação front-end e salva as informações no IndexedDB do navegador. Não há conta remota nem sincronização automática: os dados ficam vinculados ao navegador e dispositivo utilizados, mas podem ser transferidos com as funções de exportar e importar backup disponíveis no perfil.

Limpar os dados do site ou usar uma janela privativa pode apagar o conteúdo local. Exporte backups regularmente para manter uma cópia segura.

## Contribuição

Contribuições são bem-vindas. Abra uma issue para relatar problemas ou sugerir melhorias e, para alterações de código, envie um pull request com uma descrição objetiva do que foi modificado.

## Licença

Distribuído sob a licença MIT. Consulte [LICENSE](LICENSE) para mais informações.

## Autor

Desenvolvido por [Asutsuo](https://github.com/Asutsuo).
