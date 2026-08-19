# OmniDesk

Uma plataforma de produtividade acadêmica para organizar estudos, acompanhar o progresso e manter o foco em um só lugar.

O OmniDesk reúne prazos, sessões Pomodoro, flashcards, equipes e estatísticas em uma interface moderna e responsiva. Os dados são salvos localmente no navegador, permitindo que a rotina continue organizada mesmo após fechar a aplicação.

## Funcionalidades

- Dashboard com resumo da rotina, matérias e sessões salvas
- Espaços por matéria com trabalhos, tarefas, timer, cadernos e flashcards
- Visualização das matérias em lista ou grade
- Cadastro, conclusão, filtragem e exclusão de prazos
- Pomodoro 25/5 e cronômetro geral ou vinculado a uma matéria
- Garantia de apenas um relógio em execução, inclusive entre abas
- Cadernos com anotações e salvamento automático
- Criação, blocos e revisão interativa de flashcards
- Visualização de equipes e encontros de estudo
- Estatísticas de foco, tarefas e cartões dominados
- Perfil editável com meta semanal
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
```

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

Atualmente, o OmniDesk é uma aplicação front-end e salva as informações no IndexedDB do navegador. Os dados ficam vinculados ao dispositivo utilizado, mas podem ser transferidos com as funções de exportar e importar backup disponíveis no perfil.

## Autor

Desenvolvido por [Asutsuo](https://github.com/Asutsuo).
